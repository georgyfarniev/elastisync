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
  Insert = 'insert',
  Replace = 'replace',
  Update = 'update',
  Delete = 'delete',
}

export class MongoWatcher extends EventEmitter {
  constructor(private readonly opts: MongoWatcherOptions) {
    super()

    // this.opts.db.wa

    const cs = this.opts.db.collection(this.opts.collection).watch(this.opts.pipeline)
    cs.on('change', this.handleChange)
  }

  private handleChange = (event: ChangeEvent) => {
    switch(event.operationType) {
      case 'insert': return this.handleInsert(event);
      case 'update': return this.handleUpdate(event);
      case 'replace': return this.handleReplace(event);
      case 'delete': return this.handleDelete(event);
      default: return this.handleIgnoredEvent(event);

    }

  }

  private handleInsert = (event: ChangeEventCR) => {
    const { _id, ...rest } = event.fullDocument

    this.emit(EventTypes.Insert, {
      id: _id.toString(),
      ...rest
    })

  }

  private handleReplace = (event: ChangeEventCR) => {
    // const id = (event.documentKey._id as any).toString()
    const { _id, ...rest } = event.fullDocument

    this.emit(EventTypes.Replace, {
      id: _id.toString(),
      ...rest
    })
  }

  private handleUpdate = (event: ChangeEventUpdate) => {
    const id = (event.documentKey._id as any).toString()

    const { removedFields, updatedFields } = event.updateDescription

    this.emit(EventTypes.Update, {
      id,
      removed: removedFields,
      updated: updatedFields
    })
  }

  private handleDelete = (event: ChangeEventDelete) => {
    const id = (event.documentKey._id as any).toString()
    this.emit(EventTypes.Delete, { id })
  }

  private handleIgnoredEvent = (event: ChangeEvent) => {
    console.log(`event of type ${event.operationType} has been received but ignored so far...`);
  }
}