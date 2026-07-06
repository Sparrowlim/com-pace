import { openDB, type IDBPDatabase } from 'idb'
import { DB_NAME, DB_VERSION, type AnyEntity, type ComPaceDB } from './idb-schema'
import type { Storage, StoreName } from './types'

let dbPromise: Promise<IDBPDatabase<ComPaceDB>> | undefined

function getDB(): Promise<IDBPDatabase<ComPaceDB>> {
  dbPromise ??= openDB<ComPaceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('tasks', { keyPath: 'id' })
      db.createObjectStore('blocks', { keyPath: 'id' }).createIndex('taskId', 'taskId')
      db.createObjectStore('predictions', { keyPath: 'blockId' })
      db.createObjectStore('energyCells', { keyPath: 'id' }).createIndex('date', 'date')
      db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('date', 'date')
    },
  })
  return dbPromise
}

// Storage is intentionally a thin, store-agnostic contract (TECH-SPEC §3), so the
// generic <T> boundary needs a controlled cast to/from the schema's per-store union.
export const idbStorage: Storage = {
  async create<T>(store: StoreName, entity: T): Promise<T> {
    const db = await getDB()
    await db.add(store, entity as unknown as AnyEntity)
    return entity
  },

  async update<T>(store: StoreName, id: string, patch: Partial<T>): Promise<T> {
    const db = await getDB()
    const existing = await db.get(store, id)
    if (existing === undefined) {
      throw new Error(`${store}: record "${id}" not found`)
    }
    const updated = { ...existing, ...patch }
    await db.put(store, updated)
    return updated as unknown as T
  },

  async findByDate<T>(store: StoreName, date: string): Promise<T[]> {
    // Keep in sync with the `date` indexes declared in idb-schema.ts's ComPaceDB/getDB().
    if (store !== 'energyCells' && store !== 'sessions') {
      throw new Error(`${store}: no date index`)
    }
    const db = await getDB()
    const results = await db.getAllFromIndex(store, 'date', date)
    return results as unknown as T[]
  },

  async findById<T>(store: StoreName, id: string): Promise<T | null> {
    const db = await getDB()
    const result = await db.get(store, id)
    return result === undefined ? null : (result as unknown as T)
  },
}
