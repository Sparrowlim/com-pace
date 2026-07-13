import { describe, expect, test } from 'vitest'
import {
  selectActiveTask,
  selectNextQueuedBlock,
  selectQueuedBlocksForTask,
} from './core-loop-selectors'
import type { Task } from '../types/task'
import type { QueuedBlock } from '../store/slices/block-queue-slice'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: '청소',
    date: '2026-07-07',
    createdAt: '2026-07-07T00:00:00.000Z',
    splitDone: false,
    ...overrides,
  }
}

describe('selectActiveTask', () => {
  test('returns undefined when there are no tasks', () => {
    expect(selectActiveTask([], [])).toBeUndefined()
  })

  test('returns an unsplit task even with no queued blocks', () => {
    const task = makeTask({ splitDone: false })
    expect(selectActiveTask([task], [])).toEqual(task)
  })

  test('returns a split task that still has queued blocks', () => {
    const task = makeTask({ splitDone: true })
    const queued: QueuedBlock[] = [{ id: 'q1', taskId: task.id, verbLabel: '확인하기' }]
    expect(selectActiveTask([task], queued)).toEqual(task)
  })

  test('skips a split task whose queue is empty (exhausted)', () => {
    const task = makeTask({ splitDone: true })
    expect(selectActiveTask([task], [])).toBeUndefined()
  })

  test('picks the first matching task in insertion order when several exist', () => {
    const exhausted = makeTask({ id: 'task-old', splitDone: true })
    const active = makeTask({ id: 'task-new', splitDone: false })
    expect(selectActiveTask([exhausted, active], [])).toEqual(active)
  })
})

describe('selectNextQueuedBlock', () => {
  test('returns undefined when nothing is queued for the task', () => {
    expect(selectNextQueuedBlock([], 'task-1')).toBeUndefined()
  })

  test('returns the first queued block for the given task', () => {
    const queued: QueuedBlock[] = [
      { id: 'q1', taskId: 'task-1', verbLabel: '확인하기' },
      { id: 'q2', taskId: 'task-1', verbLabel: '정리하기' },
    ]
    expect(selectNextQueuedBlock(queued, 'task-1')).toEqual(queued[0])
  })

  test('ignores blocks queued for other tasks', () => {
    const queued: QueuedBlock[] = [{ id: 'q1', taskId: 'task-2', verbLabel: '확인하기' }]
    expect(selectNextQueuedBlock(queued, 'task-1')).toBeUndefined()
  })
})

describe('selectQueuedBlocksForTask (PH-05.1 — 자기선택 옵션 목록)', () => {
  test('returns an empty array when nothing is queued for the task', () => {
    expect(selectQueuedBlocksForTask([], 'task-1')).toEqual([])
  })

  test('returns the single queued block for the task', () => {
    const queued: QueuedBlock[] = [{ id: 'q1', taskId: 'task-1', verbLabel: '확인하기' }]
    expect(selectQueuedBlocksForTask(queued, 'task-1')).toEqual(queued)
  })

  test('returns all queued blocks for the task in queued order (no reordering)', () => {
    const queued: QueuedBlock[] = [
      { id: 'q1', taskId: 'task-1', verbLabel: '확인하기' },
      { id: 'q2', taskId: 'task-1', verbLabel: '정리하기' },
      { id: 'q3', taskId: 'task-1', verbLabel: '제출하기' },
    ]
    expect(selectQueuedBlocksForTask(queued, 'task-1')).toEqual(queued)
  })

  test('does not include blocks queued for a different task', () => {
    const queued: QueuedBlock[] = [
      { id: 'q1', taskId: 'task-1', verbLabel: '확인하기' },
      { id: 'q2', taskId: 'task-2', verbLabel: '다른 과제' },
    ]
    expect(selectQueuedBlocksForTask(queued, 'task-1')).toEqual([queued[0]])
  })
})
