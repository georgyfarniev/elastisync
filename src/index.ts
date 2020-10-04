import { MongoClient } from 'mongodb'
import { EventEmitter } from 'events'
import { MongoWatcher, EventTypes } from './mongo'
import { ElasticInterface } from './elastic'
import { ClientOptions } from '@elastic/elasticsearch'

type UpsertDocument = any

/**
 * Hooks facts:
 *  - they are functions used to shape data before passing it down to elasticsearch index
 *  - if hook returns null, nothing will be executed for elasticsearch index
 *  - can be async
 */

// upsert hook must return either shaped data object or null
export type UpsertHook = (document: UpsertDocument) => Promise<any|null>

// remove hook may return undefinded and therefore will proceed, or null to prevent operation
export type RemoveHook = (id: string) => Promise<void|null> | void| null

interface ElastisyncOptions {
  source: EventEmitter

  elasticsearch: {
    clientOptions: ClientOptions
    index: string
  }

  hooks?: {
    upsert?: UpsertHook
    remove?: RemoveHook
  }
}

/**
 * Binds source data collection to elasticsearch index
 * @param options
 */
function elastisync(options: ElastisyncOptions) {
  const dest = new ElasticInterface(options.elasticsearch)

  const { source } = options

  source.on(EventTypes.Upsert, async (data) => {
    const upsertHook = options?.hooks?.upsert
    if (upsertHook && typeof upsertHook === 'function') {
      const ret = await upsertHook(data);
      if (ret !== null) dest.insert(ret)
    } else {
       dest.insert(data)
     }
  })

  source.on(EventTypes.Remove, async ({ id }) => {
    const removeHook = options?.hooks?.remove
    if (removeHook && typeof removeHook === 'function' && await removeHook(id) === null)
      return

    dest.remove(id)
  })
}

async function connectMongodb() {
  const client = await MongoClient.connect('mongodb://localhost:27021/elastisync', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const db = client.db('elastisync');

  const watcher = new MongoWatcher({
    db,
    collection: 'test'
  })

  watcher.on('insert', console.dir)
  watcher.on('replace', console.dir)

  elastisync({
    source: watcher,
    elasticsearch: {
      index: 'test',
      clientOptions: {
        node: 'http://localhost:9200'
      }
    }
  });

  console.log('db connected')
  return db
}

async function main() {
  const db = await connectMongodb();

  console.log('done');
}

if (require.main === module) {
  main()
}
