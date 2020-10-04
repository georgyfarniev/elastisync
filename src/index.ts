import { MongoClient } from 'mongodb'
import { EventEmitter } from 'events'
import { MongoWatcher, EventTypes } from './mongo'
import { ElasticInterface } from './elastic'
import { ClientOptions } from '@elastic/elasticsearch'

interface ElastisyncOptions {
  source: EventEmitter

  elasticsearch: {
    clientOptions: ClientOptions
    index: string
  }
}

function elastisync(options: ElastisyncOptions) {
  const dest = new ElasticInterface(options.elasticsearch)

  const { source } = options

  source.on(EventTypes.Upsert, (data) => {
    dest.insert(data)
  })

  source.on(EventTypes.Delete, ({ id }) => {
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
