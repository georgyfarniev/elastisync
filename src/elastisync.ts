import { ElasticInterface } from './elastic'
import { DocInsert, DocUpdate, ElastisyncOptions, EventTypes } from './types'

/**
 * Binds source data collection to elasticsearch index
 * @param options
 */
export function elastisync(options: ElastisyncOptions) {
  const dest = new ElasticInterface(options.elasticsearch)

  const { source } = options

  // Apply hook to data
  const applyHook = async (event: EventTypes, data: DocInsert | DocUpdate | string) => {
    const fn = options?.hooks?.[event] as any
    if (fn && typeof fn === 'function') return fn(data)
    return data
  }

  source.on(EventTypes.Insert, async (data) => {
    const ret = await applyHook(EventTypes.Insert, data);
    if (ret !== null) dest.insert(data)
  })

  source.on(EventTypes.Update, async (data) => {
    const ret = await applyHook(EventTypes.Update, data);
    if (ret !== null) dest.update(data)
  })

  source.on(EventTypes.Remove, async ({ id }) => {
    const ret = await applyHook(EventTypes.Remove, id);
    if (ret !== null) dest.remove(id)
  })
}
