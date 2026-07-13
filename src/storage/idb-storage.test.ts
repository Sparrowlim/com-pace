import { describe, expect, test } from 'vitest'
import { idbStorage } from './idb-storage'
import type { Task } from '../types/task'
import type { Block } from '../types/block'
import type { Prediction } from '../types/prediction'
import type { EnergyCell } from '../types/energy-cell'
import type { Session } from '../types/session'

describe('idbStorage — create/findById round trip', () => {
  test('stores and retrieves a Task', async () => {
    const task: Task = {
      id: 'task-1',
      title: '설거지',
      date: '2026-07-06',
      createdAt: '2026-07-06T09:00:00Z',
      splitDone: false,
    }

    await idbStorage.create('tasks', task)
    const found = await idbStorage.findById<Task>('tasks', 'task-1')

    expect(found).toEqual(task)
  })

  test('stores and retrieves a Block', async () => {
    const block: Block = {
      id: 'block-1',
      taskId: 'task-1',
      verbLabel: '펼치기',
      status: 'in_progress',
      date: '2026-07-06',
      startedAt: '2026-07-06T09:00:00Z',
      endedAt: null,
    }

    await idbStorage.create('blocks', block)
    const found = await idbStorage.findById<Block>('blocks', 'block-1')

    expect(found).toEqual(block)
  })

  test('stores and retrieves a Prediction', async () => {
    const prediction: Prediction = { blockId: 'block-1', guess: true, actual: null }

    await idbStorage.create('predictions', prediction)
    const found = await idbStorage.findById<Prediction>('predictions', 'block-1')

    expect(found).toEqual(prediction)
  })
})

describe('idbStorage — create/findById round trip (cont.)', () => {
  test('stores and retrieves an EnergyCell', async () => {
    const energyCell: EnergyCell = {
      id: 'cell-1',
      date: '2026-07-06',
      blockId: 'block-1',
      litAt: '2026-07-06T09:15:00Z',
    }

    await idbStorage.create('energyCells', energyCell)
    const found = await idbStorage.findById<EnergyCell>('energyCells', 'cell-1')

    expect(found).toEqual(energyCell)
  })

  test('stores and retrieves a Session', async () => {
    const session: Session = {
      id: 'session-1',
      date: '2026-07-06',
      startedTimerAt: '2026-07-06T09:00:00Z',
      dischargeMode: false,
    }

    await idbStorage.create('sessions', session)
    const found = await idbStorage.findById<Session>('sessions', 'session-1')

    expect(found).toEqual(session)
  })
})

describe('idbStorage.findById', () => {
  test('returns null for a missing id', async () => {
    const found = await idbStorage.findById('tasks', 'task-does-not-exist')

    expect(found).toBeNull()
  })
})

describe('idbStorage.update', () => {
  test('merges a partial patch while preserving the rest of the record', async () => {
    const task: Task = {
      id: 'task-update-1',
      title: '빨래 개기',
      date: '2026-07-06',
      createdAt: '2026-07-06T09:00:00Z',
      splitDone: false,
    }
    await idbStorage.create('tasks', task)

    const updated = await idbStorage.update<Task>('tasks', 'task-update-1', { splitDone: true })

    expect(updated).toEqual({ ...task, splitDone: true })
    expect(updated.title).toBe(task.title)
  })

  test('does not mutate the original entity object passed to create', async () => {
    const task: Task = {
      id: 'task-update-2',
      title: '분리수거',
      date: '2026-07-06',
      createdAt: '2026-07-06T09:00:00Z',
      splitDone: false,
    }
    const originalSnapshot = { ...task }
    await idbStorage.create('tasks', task)

    await idbStorage.update<Task>('tasks', 'task-update-2', { splitDone: true })

    expect(task).toEqual(originalSnapshot)
  })

  test('does not mutate the patch object', async () => {
    const task: Task = {
      id: 'task-update-3',
      title: '이메일 확인',
      date: '2026-07-06',
      createdAt: '2026-07-06T09:00:00Z',
      splitDone: false,
    }
    await idbStorage.create('tasks', task)
    const patch: Partial<Task> = { splitDone: true }

    await idbStorage.update<Task>('tasks', 'task-update-3', patch)

    expect(patch).toEqual({ splitDone: true })
  })

  test('throws when the target record does not exist', async () => {
    await expect(
      idbStorage.update<Task>('tasks', 'task-does-not-exist', { splitDone: true }),
    ).rejects.toThrow()
  })
})

describe('idbStorage.update (cont.)', () => {
  test('round-trips on the predictions store, which is keyed by blockId (no id field)', async () => {
    const prediction: Prediction = { blockId: 'block-update-1', guess: true, actual: null }
    await idbStorage.create('predictions', prediction)

    const updated = await idbStorage.update<Prediction>('predictions', 'block-update-1', {
      actual: false,
    })

    expect(updated).toEqual({ ...prediction, actual: false })
  })
})

describe('idbStorage.findByDate', () => {
  test('returns records for the given date and excludes other dates', async () => {
    const cellA: EnergyCell = {
      id: 'cell-date-a1',
      date: '2099-01-01',
      blockId: 'block-a1',
      litAt: '2099-01-01T09:00:00Z',
    }
    const cellB: EnergyCell = {
      id: 'cell-date-a2',
      date: '2099-01-01',
      blockId: 'block-a2',
      litAt: '2099-01-01T10:00:00Z',
    }
    const cellOtherDate: EnergyCell = {
      id: 'cell-date-b1',
      date: '2099-01-02',
      blockId: 'block-b1',
      litAt: '2099-01-02T09:00:00Z',
    }

    await idbStorage.create('energyCells', cellA)
    await idbStorage.create('energyCells', cellB)
    await idbStorage.create('energyCells', cellOtherDate)

    const results = await idbStorage.findByDate<EnergyCell>('energyCells', '2099-01-01')

    expect(results).toEqual(expect.arrayContaining([cellA, cellB]))
    expect(results).not.toEqual(expect.arrayContaining([cellOtherDate]))
  })
})

describe('idbStorage.findByDate (cont.)', () => {
  test('returns records for the blocks store, indexed by date', async () => {
    const blockA: Block = {
      id: 'block-date-a1',
      taskId: 'task-a1',
      verbLabel: '펼치기',
      status: 'done',
      date: '2099-02-01',
      startedAt: '2099-02-01T09:00:00Z',
      endedAt: '2099-02-01T09:15:00Z',
    }
    const blockOtherDate: Block = {
      id: 'block-date-b1',
      taskId: 'task-b1',
      verbLabel: '펼치기',
      status: 'done',
      date: '2099-02-02',
      startedAt: '2099-02-02T09:00:00Z',
      endedAt: '2099-02-02T09:15:00Z',
    }

    await idbStorage.create('blocks', blockA)
    await idbStorage.create('blocks', blockOtherDate)

    const results = await idbStorage.findByDate<Block>('blocks', '2099-02-01')

    expect(results).toEqual(expect.arrayContaining([blockA]))
    expect(results).not.toEqual(expect.arrayContaining([blockOtherDate]))
  })

  test('throws for the predictions store, which is keyed by blockId with no date of its own', async () => {
    await expect(idbStorage.findByDate('predictions', '2099-01-01')).rejects.toThrow()
  })
})

describe('idbStorage.findByDateRange', () => {
  test('returns records whose date falls within the inclusive bound, across stores', async () => {
    const taskA: Task = {
      id: 'task-range-a1',
      title: '범위 안 A',
      date: '2099-03-01',
      createdAt: '2099-03-01T09:00:00Z',
      splitDone: false,
    }
    const taskB: Task = {
      id: 'task-range-a2',
      title: '범위 안 B',
      date: '2099-03-03',
      createdAt: '2099-03-03T09:00:00Z',
      splitDone: false,
    }
    const taskOutside: Task = {
      id: 'task-range-b1',
      title: '범위 밖',
      date: '2099-03-10',
      createdAt: '2099-03-10T09:00:00Z',
      splitDone: false,
    }

    await idbStorage.create('tasks', taskA)
    await idbStorage.create('tasks', taskB)
    await idbStorage.create('tasks', taskOutside)

    const results = await idbStorage.findByDateRange<Task>('tasks', '2099-03-01', '2099-03-05')

    expect(results).toEqual(expect.arrayContaining([taskA, taskB]))
    expect(results).not.toEqual(expect.arrayContaining([taskOutside]))
  })

  test('throws for the predictions store, which has no date index', async () => {
    await expect(
      idbStorage.findByDateRange('predictions', '2099-01-01', '2099-01-31'),
    ).rejects.toThrow()
  })
})
