import { beforeEach, describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useTaskQueueRecovery } from './useTaskQueueRecovery'
import { useAppStore } from '../store'
import { idbStorage } from '../storage/idb-storage'
import { todayDateString } from '../lib/time'
import type { Task } from '../types/task'
import type { QueuedBlock } from '../types/queued-block'

function RecoveryProbe() {
  const isHydrating = useTaskQueueRecovery()
  return <div>{isHydrating ? 'HYDRATING' : 'READY'}</div>
}

beforeEach(() => {
  useAppStore.setState({ tasks: [], queuedBlocks: [] })
})

describe('useTaskQueueRecovery — no persisted records', () => {
  test('resolves to READY with empty tasks/queuedBlocks', async () => {
    render(<RecoveryProbe />)

    expect(await screen.findByText('READY')).toBeInTheDocument()
    expect(useAppStore.getState().tasks).toEqual([])
    expect(useAppStore.getState().queuedBlocks).toEqual([])
  })
})

describe('useTaskQueueRecovery — persisted task + queued blocks for today', () => {
  test('rehydrates tasks and queuedBlocks from IndexedDB', async () => {
    const today = todayDateString()
    const task: Task = {
      id: 'task-1',
      title: '집안일',
      date: today,
      createdAt: new Date().toISOString(),
      splitDone: true,
    }
    const queued: QueuedBlock = {
      id: 'q1',
      taskId: 'task-1',
      verbLabel: '책상 정리하기',
      date: today,
    }
    await idbStorage.create('tasks', task)
    await idbStorage.create('queuedBlocks', queued)

    render(<RecoveryProbe />)

    expect(await screen.findByText('READY')).toBeInTheDocument()
    expect(useAppStore.getState().tasks).toEqual([task])
    expect(useAppStore.getState().queuedBlocks).toEqual([queued])
  })
})

describe('useTaskQueueRecovery — isHydrating', () => {
  test('starts true so the caller can defer rendering until hydration resolves', async () => {
    render(<RecoveryProbe />)

    expect(screen.getByText('HYDRATING')).toBeInTheDocument()
    expect(await screen.findByText('READY')).toBeInTheDocument()
  })
})
