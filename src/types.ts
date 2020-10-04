import { EventEmitter } from 'events'
import { ClientOptions } from '@elastic/elasticsearch'

/**
 * Base class for data sources
 */
export class ElastisyncSourceBase extends EventEmitter {
}

export interface DocBase {
  id: string
}

export interface DocInsert extends DocBase {
  [key: string]: any
}

export interface DocUpdate extends DocBase {
  updated?: any
  removed?: string[]
}

export const enum EventTypes {
  Insert = 'insert',
  Update = 'update',
  Remove = 'remove',
}

/**
 * Hooks facts:
 *  - they are functions used to shape data before passing it down to elasticsearch index
 *  - if hook returns null, nothing will be executed for elasticsearch index
 *  - can be async
 */

// upsert hook must return either shaped data object or null
export type InsertHook = (doc: DocInsert) => Promise<DocInsert|null> | DocInsert | null

// Update hook returns update description with fields shaped or filtered
export type UpdateHook = (doc: DocUpdate) => Promise<DocUpdate|null> | DocUpdate | null

// remove hook may return id and therefore will proceed, or null to prevent operation
export type RemoveHook = (id: string) => Promise<string|null> | string | null

export interface ElastisyncOptions {
  source: ElastisyncSourceBase

  elasticsearch: {
    clientOptions: ClientOptions
    index: string
  }

  hooks?: {
    insert?: InsertHook
    remove?: RemoveHook
    update?: UpdateHook
  }
}

export interface ElasticInterfaceOptions {
  clientOptions: ClientOptions
  index: string
}
