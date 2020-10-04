import { Db, ChangeEvent, ChangeEventCR, ChangeEventUpdate, ChangeEventDelete } from 'mongodb'
import { ElastisyncSourceBase, EventTypes } from './types';

/**
 * MongoDB watcher that takes advantage on mongodb changestream feature
 */

interface MongoWatcherOptions {
  db: Db
  collection: string
  pipeline?: any[]
}

export class MongoWatcher extends ElastisyncSourceBase {
  constructor(private readonly opts: MongoWatcherOptions) {
    super()

    const cs = this.opts.db.collection(this.opts.collection).watch(this.opts.pipeline);

    cs.on('change', this.handleChange)
  }

  private handleChange = (event: ChangeEvent) => {
    switch(event.operationType) {
      case 'insert':;
      case 'replace':
        return this.handleInsert(event);
      case 'update':
        return this.handleUpdate(event);
      case 'delete':
        return this.handleDelete(event);
      default:
        return this.handleIgnoredEvent(event);
    }
  }

  private handleInsert = (event: ChangeEventCR) => {
    this.emitDocumentEvent(EventTypes.Insert, event.fullDocument)
  }

  private handleUpdate = (event: ChangeEventUpdate) => {
    this.emitDocumentEvent(EventTypes.Update, {
      updated: event.updateDescription.updatedFields,
      removed: event.updateDescription.removedFields,
    })
  }

  private handleDelete = (event: ChangeEventDelete) => {
    const id = (event.documentKey._id as any).toString()
    this.emit(EventTypes.Remove, { id })
  }

  private handleIgnoredEvent = (event: ChangeEvent) => {
    console.log(`event of type ${event.operationType} has been received but ignored so far...`);
  }

  private emitDocumentEvent = (event: EventTypes, { _id, ...rest }: any) => {
    this.emit(event, { id: _id.toString(), ...rest })
  }
}