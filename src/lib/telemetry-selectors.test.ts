import { describe, expect, test } from 'vitest'
import { idbStorage } from '../storage/idb-storage'
import { computeDailyTelemetry } from './telemetry-selectors'
import type { Task } from '../types/task'
import type { Block } from '../types/block'
import type { Prediction } from '../types/prediction'
import type { Session } from '../types/session'

// Internal metrics only (SPEC §10) — every fixture below uses its own date range so the
// shared fake-indexeddb instance across this file's tests never collides.

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'task',
    title: '과제',
    date: '2100-01-01',
    createdAt: '',
    splitDone: false,
    ...overrides,
  }
}

function makeBlock(overrides: Partial<Block>): Block {
  return {
    id: 'block',
    taskId: 'task',
    verbLabel: '펼치기',
    status: 'done',
    date: '2100-01-01',
    startedAt: '',
    endedAt: null,
    ...overrides,
  }
}

describe('computeDailyTelemetry — start success rate', () => {
  test('counts a task as started only when a block for it started the same day', async () => {
    await idbStorage.create('tasks', makeTask({ id: 't-start-1', date: '2100-02-01' }))
    await idbStorage.create('tasks', makeTask({ id: 't-start-2', date: '2100-02-01' }))
    await idbStorage.create(
      'blocks',
      makeBlock({ id: 'b-start-1', taskId: 't-start-1', date: '2100-02-01' }),
    )

    const [day] = await computeDailyTelemetry('2100-02-01', '2100-02-01')

    expect(day!.tasksCreated).toBe(2)
    expect(day!.blocksStarted).toBe(1)
    expect(day!.startSuccessRate).toBe(0.5)
  })

  test('returns 0 (not NaN) when no tasks were created that day', async () => {
    const [day] = await computeDailyTelemetry('2100-02-05', '2100-02-05')

    expect(day!.tasksCreated).toBe(0)
    expect(day!.startSuccessRate).toBe(0)
  })
})

describe('computeDailyTelemetry — prediction hit rate series', () => {
  test('computes hit rate per day from resolved predictions joined through blocks', async () => {
    const hitBlock = makeBlock({ id: 'b-pred-hit', taskId: 't-pred', date: '2100-03-01' })
    const missBlock = makeBlock({ id: 'b-pred-miss', taskId: 't-pred', date: '2100-03-01' })
    const unresolvedBlock = makeBlock({
      id: 'b-pred-unresolved',
      taskId: 't-pred',
      date: '2100-03-01',
    })
    await idbStorage.create('blocks', hitBlock)
    await idbStorage.create('blocks', missBlock)
    await idbStorage.create('blocks', unresolvedBlock)
    const hit: Prediction = { blockId: 'b-pred-hit', guess: true, actual: true }
    const miss: Prediction = { blockId: 'b-pred-miss', guess: true, actual: false }
    const unresolved: Prediction = { blockId: 'b-pred-unresolved', guess: false, actual: null }
    await idbStorage.create('predictions', hit)
    await idbStorage.create('predictions', miss)
    await idbStorage.create('predictions', unresolved)

    const [day] = await computeDailyTelemetry('2100-03-01', '2100-03-01')

    expect(day!.predictionsResolved).toBe(2)
    expect(day!.predictionsHit).toBe(1)
    expect(day!.predictionHitRate).toBe(0.5)
  })

  test('returns one entry per calendar date across a multi-day range, in order', async () => {
    const series = await computeDailyTelemetry('2100-04-01', '2100-04-03')

    expect(series.map((day) => day.date)).toEqual(['2100-04-01', '2100-04-02', '2100-04-03'])
  })
})

describe('computeDailyTelemetry — discharge entry frequency', () => {
  test('computes discharge session ratio from Session.dischargeMode', async () => {
    const normal: Session = {
      id: 's-normal',
      date: '2100-05-01',
      startedTimerAt: '',
      dischargeMode: false,
    }
    const discharge: Session = {
      id: 's-discharge',
      date: '2100-05-01',
      startedTimerAt: '',
      dischargeMode: true,
    }
    await idbStorage.create('sessions', normal)
    await idbStorage.create('sessions', discharge)

    const [day] = await computeDailyTelemetry('2100-05-01', '2100-05-01')

    expect(day!.sessionsStarted).toBe(2)
    expect(day!.dischargeSessions).toBe(1)
    expect(day!.dischargeEntryRate).toBe(0.5)
  })

  test('returns 0 (not NaN) when no sessions started that day', async () => {
    const [day] = await computeDailyTelemetry('2100-05-10', '2100-05-10')

    expect(day!.sessionsStarted).toBe(0)
    expect(day!.dischargeEntryRate).toBe(0)
  })
})
