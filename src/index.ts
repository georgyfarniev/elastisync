import { MongoClient } from 'mongodb'
import { elastisync } from './elastisync';
import { MongoWatcher } from './mongo'

/**
 * TODO:
 * - single elasticsearch connection for multiple indexes binding
 * - errors handling
 * - examples
 * - better event processing (resume token, etc)
 * - graceful termination
 * - exports
 * - fields removing on update support
 * - other sources (implement them as plugins)
 */

async function connectMongodb() {
  const client = await MongoClient.connect('mongodb://localhost:27021/elastisync', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const db = client.db('elastisync');

  console.log('db connected')
  return db
}

async function main() {
  const db = await connectMongodb();

  const watcher = new MongoWatcher({
    db,
    collection: 'test'
  })

  watcher.on('insert', console.dir)
  watcher.on('replace', console.dir)
  watcher.on('update', console.dir)

  elastisync({
    source: watcher,
    elasticsearch: {
      index: 'test',
      clientOptions: {
        node: 'http://localhost:9200'
      }
    },
    hooks: {
      insert(doc) {
        return {
          ...doc,
          newField: 8888
        }
      }
    }
  });
}

if (require.main === module) {
  main()
}
