import { beforeEach, describe, expect, test } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useSessionRecovery } from './useSessionRecovery'
import { useAppStore } from '../store'
import { idbStorage } from '../storage/idb-storage'
import { activeSessionPointer } from '../lib/active-session-pointer'
import { dischargeBlockPointer } from '../lib/discharge-block-pointer'
import { DISCHARGE_END_MESSAGE } from './useFocusTimer'
import { ROUTES } from '../routes/paths'
import type { Block } from '../types/block'

function RecoveryProbe() {
  useSessionRecovery()
  return <div>PROBE</div>
}

// ROUTES.dashboard is '/' — mounting the probe at a distinct path (rather than '/' itself) is
// required so a recovery-driven navigate(ROUTES.dashboard) is observable as a real route change
// instead of colliding with the probe's own route.
const BOOT_PATH = '/__boot'

function renderProbe() {
  const router = createMemoryRouter(
    [
      { path: BOOT_PATH, element: <RecoveryProbe /> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
      { path: ROUTES.retro, element: <div>RETRO_STUB</div> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
    ],
    { initialEntries: [BOOT_PATH] },
  )
  render(<RouterProvider router={router} />)
}

let blockCounter = 0

async function seedOrphanedBlock(overrides: Partial<Block>): Promise<Block> {
  blockCounter += 1
  const block: Block = {
    id: `orphan-${blockCounter}`,
    taskId: 'task-1',
    verbLabel: '책상 정리하기',
    status: 'in_progress',
    startedAt: '2026-07-07T10:00:00.000Z',
    endedAt: null,
    ...overrides,
  }
  await idbStorage.create('blocks', block)
  activeSessionPointer.set(block.id)
  return block
}

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    elapsedSeconds: 0,
    predictions: [],
    energyCells: [],
    lastResolvedBlock: null,
    capturedThought: null,
    dischargeMode: false,
    dischargeEndMessage: null,
  })
})

describe('useSessionRecovery — no pointer', () => {
  test('is a no-op when there is no active-session pointer', async () => {
    renderProbe()

    expect(await screen.findByText('PROBE')).toBeInTheDocument()
    expect(useAppStore.getState().activeBlock).toBeNull()
  })
})

describe('useSessionRecovery — continue (same day, under 900s)', () => {
  test('rehydrates activeBlock/elapsedSeconds from the stored block and returns to /focus', async () => {
    const startedAt = new Date(Date.now() - 60_000).toISOString() // 60s ago, still "today"
    const block = await seedOrphanedBlock({ startedAt })

    renderProbe()

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock?.id).toBe(block.id)
    expect(state.elapsedSeconds).toBeGreaterThanOrEqual(0)
    expect(state.elapsedSeconds).toBeLessThan(900)
  })
})

describe('useSessionRecovery — finish (same day, at/over 900s)', () => {
  test('completes the block, lights energy, sets retro context, and navigates to /retro', async () => {
    // 20분 전 — 로컬 자정 근처 실행이 아닌 한 항상 "같은 로컬 날짜"이면서 900초를 넘긴다.
    // UTC 자정으로 고정하면 KST(UTC+9)에서 로컬 날짜가 갈라질 수 있어(code review 발견) 피한다.
    const startedAt = new Date(Date.now() - 20 * 60_000).toISOString()
    const block = await seedOrphanedBlock({ startedAt })

    renderProbe()

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'done' })
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
    expect(activeSessionPointer.get()).toBeNull()
  })

  test('resolves a prediction that was set before the interruption (fetched from storage, not memory)', async () => {
    const startedAt = new Date(Date.now() - 20 * 60_000).toISOString()
    const block = await seedOrphanedBlock({ startedAt })
    await useAppStore.getState().setPrediction(block.id, true)
    // 부팅 직후를 흉내내려면 인메모리 predictions는 비워둬야 한다 — 이 값이 항상 빈 배열인
    // 실제 재기동 상황에서도 예측이 정상 해소되는지가 이 테스트의 핵심이다.
    useAppStore.setState({ predictions: [] })

    renderProbe()

    await screen.findByText('RETRO_STUB')
    const persisted = await idbStorage.findById<{ blockId: string; actual: boolean | null }>(
      'predictions',
      block.id,
    )
    expect(persisted?.actual).toBe(true)
  })
})

describe('useSessionRecovery — isRecovering', () => {
  test('starts true when a pointer exists, so the caller can defer rendering until it resolves', async () => {
    const startedAt = new Date(Date.now() - 60_000).toISOString()
    await seedOrphanedBlock({ startedAt })

    function IsRecoveringProbe() {
      const isRecovering = useSessionRecovery()
      return <div>{isRecovering ? 'RECOVERING' : 'READY'}</div>
    }
    const router = createMemoryRouter(
      [
        { path: '/', element: <IsRecoveringProbe /> },
        { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
      ],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByText('RECOVERING')).toBeInTheDocument()
    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
  })

  test('starts false when there is no pointer, so normal boots never render-block', () => {
    function IsRecoveringProbe() {
      const isRecovering = useSessionRecovery()
      return <div>{isRecovering ? 'RECOVERING' : 'READY'}</div>
    }
    const router = createMemoryRouter([{ path: '/', element: <IsRecoveringProbe /> }], {
      initialEntries: ['/'],
    })
    render(<RouterProvider router={router} />)

    expect(screen.getByText('READY')).toBeInTheDocument()
  })
})

describe('useSessionRecovery — carryover (different calendar day)', () => {
  test('silently marks the block incomplete: no retro, no energy, no navigation', async () => {
    const block = await seedOrphanedBlock({ startedAt: '2020-01-01T00:00:00.000Z' })

    renderProbe()

    await screen.findByText('PROBE')
    await waitFor(() => expect(activeSessionPointer.get()).toBeNull())
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toBeNull()
    expect(state.energyCells).toHaveLength(0)
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted?.status).toBe('incomplete')
  })
})

describe('useSessionRecovery — stale/already-resolved pointer', () => {
  test('clears the pointer without touching the store when the block is already done', async () => {
    await seedOrphanedBlock({ status: 'done', endedAt: new Date().toISOString() })

    renderProbe()

    await screen.findByText('PROBE')
    await waitFor(() => expect(activeSessionPointer.get()).toBeNull())
    expect(useAppStore.getState().activeBlock).toBeNull()
  })

  test('also clears a leftover discharge pointer so it can never tag a future, unrelated block', async () => {
    await seedOrphanedBlock({ status: 'done', endedAt: new Date().toISOString() })
    dischargeBlockPointer.set('some-other-stale-block-id')

    renderProbe()

    await screen.findByText('PROBE')
    await waitFor(() => expect(dischargeBlockPointer.get()).toBeNull())
  })
})

// PH-08 code review CRITICAL fix — a discharge block recovered on reboot (at/over 900s) must be
// finished as discharge: no second energy light (already lit at discharge-dashboard start, before
// the reload), no prediction resolution attempt, and straight to the dashboard rather than retro.
describe('useSessionRecovery — discharge (same day, at/over 900s, recovered after reload)', () => {
  test('finishes as discharge: no double energy light, no retro, dischargeMode/captured-thought cleared', async () => {
    const startedAt = new Date(Date.now() - 20 * 60_000).toISOString()
    const block = await seedOrphanedBlock({ startedAt })
    dischargeBlockPointer.set(block.id)
    // 방전 대시보드가 시작 시점에 이미 점등했던 그 칸을 흉내낸다 — 재기동 복구가 이를 다시
    // 점등하면 안 된다(정확히 1회 점등 불변식).
    await useAppStore.getState().lightEnergyCell(block.id, '2026-07-07')
    useAppStore.setState({ dischargeMode: true, capturedThought: '아까 스친 생각' })

    renderProbe()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.energyCells.filter((cell) => cell.blockId === block.id)).toHaveLength(1)
    expect(state.dischargeMode).toBe(false)
    expect(state.capturedThought).toBeNull()
    expect(state.dischargeEndMessage).toBe(DISCHARGE_END_MESSAGE)
    expect(dischargeBlockPointer.get()).toBeNull()
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted?.status).toBe('done')
  })
})
