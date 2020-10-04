import { EventEmitter } from 'events';
import { Db, ChangeEvent, ChangeEventCR, ChangeEventUpdate, ChangeEventDelete } from 'mongodb'

/**
 * MongoDB watcher that takes advantage on mongodb changestream feature
 */

interface MongoWatcherOptions {
  db: Db
  collection: string
  pipeline?: any[]
}

export const enum EventTypes {
  Upsert = 'upsert',
  Remove = 'remove',
}

export class MongoWatcher extends EventEmitter {
  constructor(private readonly opts: MongoWatcherOptions) {
    super()

    const cs = this.opts.db.collection(this.opts.collection).watch(
      this.opts.pipeline,
      // Currently we are using fullDocument for simplicity as POC
      { fullDocument: 'updateLookup' }
    );

    cs.on('change', this.handleChange)
  }

  private handleChange = (event: ChangeEvent) => {
    switch(event.operationType) {
      case 'insert':;
      case 'update':
      case 'replace':
        return this.handleUpsert(event);
      case 'delete':
        return this.handleDelete(event);
      default:
        return this.handleIgnoredEvent(event);
    }
  }

  private handleUpsert = (event: ChangeEventUpdate | ChangeEventCR) => {
    this.emitDocumentEvent(EventTypes.Upsert, event.fullDocument)
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