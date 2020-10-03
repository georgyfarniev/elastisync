/**
 * Elasticsearch internal interface for convenience of operations
 */

import { Client, ClientOptions } from '@elastic/elasticsearch'

interface Options {
  clientOptions: ClientOptions
  index: string
}

export class ElasticInterface {
  private readonly client: Client
  private readonly index: string

  constructor({ clientOptions, index }: Options) {
    this.client = new Client(clientOptions)
    this.index = index
  }

  public async remove(id: string) {
    return this.client.delete({ id, index: this.index })
  }

  public async update(id: string, fields: any) {
    return this.client.update({
      index: this.index,
      id,
      // refresh: wait ? 'wait_for' : 'false',
      body: {
        doc: fields,
        doc_as_upsert: true
      },
    })
  }

  public async insert(document: any) {
    await this.client.index({
      index: this.index,
      // refresh: wait ? 'wait_for' : 'false',
      id: document.id,
      body: document
    })
  }
}
