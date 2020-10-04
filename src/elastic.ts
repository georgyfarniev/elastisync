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

  public async insert(document: any) {
    return this.client.index({
      index: this.index,
      id: document.id,
      body: document
    })
  }
}
