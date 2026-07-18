import { openDB, type IDBPDatabase, type IDBPTransaction, type StoreNames } from 'idb'
import { DB_NAME, DB_VERSION, type AnyEntity, type ComPaceDB } from './idb-schema'
import type { Storage, StoreName } from './types'
import type { Task } from '../types/task'
import type { Block } from '../types/block'

let dbPromise: Promise<IDBPDatabase<ComPaceDB>> | undefined

type UpgradeTransaction = IDBPTransaction<ComPaceDB, StoreNames<ComPaceDB>[], 'versionchange'>

// v1 records predate the `date` field, so the new index can't see them until they're
// backfilled — without this, findByDate/findByDateRange('tasks'|'blocks', …) would silently
// skip every task/block created before this migration ran.
async function backfillTaskDates(transaction: UpgradeTransaction): Promise<void> {
  let cursor = await transaction.objectStore('tasks').openCursor()
  while (cursor) {
    const task = cursor.value
    if ((task as Partial<Task>).date === undefined) {
      await cursor.update({ ...task, date: task.createdAt.slice(0, 10) })
    }
    cursor = await cursor.continue()
  }
}

async function backfillBlockDates(transaction: UpgradeTransaction): Promise<void> {
  let cursor = await transaction.objectStore('blocks').openCursor()
  while (cursor) {
    const block = cursor.value
    if ((block as Partial<Block>).date === undefined) {
      await cursor.update({ ...block, date: block.startedAt.slice(0, 10) })
    }
    cursor = await cursor.continue()
  }
}

function getDB(): Promise<IDBPDatabase<ComPaceDB>> {
  dbPromise ??= openDB<ComPaceDB>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        db.createObjectStore('tasks', { keyPath: 'id' })
        db.createObjectStore('blocks', { keyPath: 'id' }).createIndex('taskId', 'taskId')
        db.createObjectStore('predictions', { keyPath: 'blockId' })
        db.createObjectStore('energyCells', { keyPath: 'id' }).createIndex('date', 'date')
        db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('date', 'date')
      }
      // v2: 내부 지표 로깅(SPEC §10)이 날짜 범위로 tasks/blocks를 훑어야 해서 date 인덱스를 추가한다.
      if (oldVersion < 2) {
        transaction.objectStore('tasks').createIndex('date', 'date')
        transaction.objectStore('blocks').createIndex('date', 'date')
        await backfillTaskDates(transaction)
        await backfillBlockDates(transaction)
      }
      // v3 — 베타 적합도 감사 CRITICAL 수정: queuedBlocks(쪼갰지만 아직 시작 안 한 조각)를 새
      // 스토어로 영속화한다. 기존 스토어는 건드리지 않으므로 백필이 필요 없다.
      if (oldVersion < 3) {
        db.createObjectStore('queuedBlocks', { keyPath: 'id' }).createIndex('taskId', 'taskId')
        transaction.objectStore('queuedBlocks').createIndex('date', 'date')
      }
    },
  })
  return dbPromise
}

type DateIndexedStore = Exclude<StoreName, 'predictions'>

// Keep in sync with the `date` indexes declared in idb-schema.ts's ComPaceDB/getDB() —
// every store except `predictions` (keyed by blockId, no date of its own) has one.
function assertDateIndexed(store: StoreName): asserts store is DateIndexedStore {
  if (store === 'predictions') {
    throw new Error(`${store}: no date index`)
  }
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
    assertDateIndexed(store)
    const db = await getDB()
    const results = await db.getAllFromIndex(store, 'date', date)
    return results as unknown as T[]
  },

  async findByDateRange<T>(store: StoreName, startDate: string, endDate: string): Promise<T[]> {
    assertDateIndexed(store)
    const db = await getDB()
    const range = IDBKeyRange.bound(startDate, endDate)
    const results = await db.getAllFromIndex(store, 'date', range)
    return results as unknown as T[]
  },

  async findById<T>(store: StoreName, id: string): Promise<T | null> {
    const db = await getDB()
    const result = await db.get(store, id)
    return result === undefined ? null : (result as unknown as T)
  },

  async delete(store: StoreName, id: string): Promise<void> {
    const db = await getDB()
    await db.delete(store, id)
  },
}
