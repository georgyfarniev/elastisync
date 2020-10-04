/**
 * Elasticsearch internal interface for convenience of operations
 */

import { Client } from '@elastic/elasticsearch'
import { DocInsert, DocUpdate, ElasticInterfaceOptions } from './types'

export class ElasticInterface {
  private readonly client: Client
  private readonly index: string

  constructor({ clientOptions, index }: ElasticInterfaceOptions) {
    this.client = new Client(clientOptions)
    this.index = index
  }

  public async remove(id: string) {
    return this.client.delete({ id, index: this.index })
  }

  public async insert({ id, ...body }: DocInsert) {
    return this.client.index({
      index: this.index,
      id,
      body
    })
  }

  // XXX: implement deletion of removed fields
  public async update(params: DocUpdate) {
    const { id, updated, removed } = params;
    return this.client.update({
      index: this.index,
      id,
      body: {
        doc: updated,
        doc_as_upsert: true
      },
    })
  }
}
