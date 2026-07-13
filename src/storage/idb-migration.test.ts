import { describe, expect, test } from 'vitest'
import { DB_NAME } from './idb-schema'
import type { Task } from '../types/task'
import type { Block } from '../types/block'

// Simulates a real device that already has a v1 database (pre-date-field) on disk, then
// verifies the v2 migration backfills `date` from the existing timestamp instead of leaving
// pre-migration records invisible to the new date index (idb-storage.ts's upgrade callback).
function seedV1Database(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('tasks', { keyPath: 'id' })
      db.createObjectStore('blocks', { keyPath: 'id' }).createIndex('taskId', 'taskId')
    }
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(['tasks', 'blocks'], 'readwrite')
      tx.objectStore('tasks').add({
        id: 'v1-task-1',
        title: '마이그레이션 전 과제',
        createdAt: '2026-01-05T09:00:00.000Z',
        splitDone: false,
      })
      tx.objectStore('blocks').add({
        id: 'v1-block-1',
        taskId: 'v1-task-1',
        verbLabel: '펼치기',
        status: 'done',
        startedAt: '2026-01-05T09:10:00.000Z',
        endedAt: '2026-01-05T09:25:00.000Z',
      })
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    }
    request.onerror = () => reject(request.error)
  })
}

describe('idbStorage — v1 to v2 migration backfill', () => {
  test('backfills date on pre-existing tasks/blocks from their timestamp, and the date index sees them', async () => {
    await seedV1Database()

    // Importing after seeding still resolves to the same underlying fake-indexeddb database —
    // the first idbStorage call triggers getDB(), which opens at the current DB_VERSION and
    // runs the real oldVersion===1 migration path, including the backfill.
    const { idbStorage } = await import('./idb-storage')

    const task = await idbStorage.findById<Task>('tasks', 'v1-task-1')
    const block = await idbStorage.findById<Block>('blocks', 'v1-block-1')

    expect(task?.date).toBe('2026-01-05')
    expect(block?.date).toBe('2026-01-05')

    const tasksOnDate = await idbStorage.findByDate<Task>('tasks', '2026-01-05')
    const blocksOnDate = await idbStorage.findByDate<Block>('blocks', '2026-01-05')

    expect(tasksOnDate).toEqual(expect.arrayContaining([task]))
    expect(blocksOnDate).toEqual(expect.arrayContaining([block]))
  })
})
