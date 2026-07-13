import type { StateCreator } from 'zustand'
import type { Block } from '../../types/block'
import { idbStorage } from '../../storage/idb-storage'
import { generateId } from '../../lib/id'
import { nowIso, todayDateString } from '../../lib/time'
import { computeElapsedSeconds } from '../../lib/session-timer'
import { activeSessionPointer } from '../../lib/active-session-pointer'

export interface TimerSlice {
  activeBlock: Block | null
  elapsedSeconds: number
  pausedAt: string | null
  pausedMs: number
  startBlock: (taskId: string, verbLabel: string) => Promise<Block>
  pause: () => Promise<void>
  resume: () => Promise<void>
  complete: () => Promise<void>
  markIncomplete: () => Promise<void>
  tick: () => void
}

function requireActiveBlock(activeBlock: Block | null): Block {
  if (activeBlock === null) {
    throw new Error('No active block')
  }
  return activeBlock
}

function clearedTimerState() {
  return { activeBlock: null, elapsedSeconds: 0, pausedAt: null, pausedMs: 0 } as const
}

async function endBlock(blockId: string, status: 'done' | 'incomplete'): Promise<void> {
  await idbStorage.update<Block>('blocks', blockId, { status, endedAt: nowIso() })
  activeSessionPointer.clear()
}

// 명시적 일시정지(SPEC §6 5-B) 재개 시 정지 구간을 pausedMs에 누적한다 — pausedAt은 스토어
// 인메모리 부기일 뿐 Block/Storage 스키마에는 없다(착수 전 설계 결정 2, PH-06).
function accumulatePause(pausedAt: string | null, pausedMs: number): number {
  const extra = pausedAt ? Date.now() - new Date(pausedAt).getTime() : 0
  return pausedMs + extra
}

export const createTimerSlice: StateCreator<TimerSlice, [], [], TimerSlice> = (set, get) => ({
  activeBlock: null,
  elapsedSeconds: 0,
  pausedAt: null,
  pausedMs: 0,

  startBlock: async (taskId, verbLabel) => {
    const block: Block = {
      id: generateId(),
      taskId,
      verbLabel,
      status: 'in_progress',
      date: todayDateString(),
      startedAt: nowIso(),
      endedAt: null,
    }
    await idbStorage.create('blocks', block)
    activeSessionPointer.set(block.id)
    set({ activeBlock: block, elapsedSeconds: 0, pausedAt: null, pausedMs: 0 })
    return block
  },

  pause: async () => {
    const active = requireActiveBlock(get().activeBlock)
    const updated = await idbStorage.update<Block>('blocks', active.id, { status: 'paused' })
    set({ activeBlock: updated, pausedAt: nowIso() })
  },

  resume: async () => {
    const active = requireActiveBlock(get().activeBlock)
    const { pausedAt, pausedMs } = get()
    const updated = await idbStorage.update<Block>('blocks', active.id, { status: 'in_progress' })
    set({ activeBlock: updated, pausedAt: null, pausedMs: accumulatePause(pausedAt, pausedMs) })
  },

  complete: async () => {
    const active = requireActiveBlock(get().activeBlock)
    await endBlock(active.id, 'done')
    set(clearedTimerState())
  },

  markIncomplete: async () => {
    const active = requireActiveBlock(get().activeBlock)
    await endBlock(active.id, 'incomplete')
    set(clearedTimerState())
  },

  // 타임스탬프 기반 재계산(SPEC §6/P13) — 인터벌이 백그라운드에서 스로틀돼도 포그라운드 복귀 후
  // 다음 호출이 즉시 정확한 값으로 점프한다(증가식이었다면 누락된 초를 영영 못 따라잡았을 것).
  tick: () => {
    const { activeBlock, pausedMs } = get()
    if (activeBlock?.status !== 'in_progress') {
      return
    }
    set({ elapsedSeconds: computeElapsedSeconds(activeBlock.startedAt, pausedMs, Date.now()) })
  },
})
