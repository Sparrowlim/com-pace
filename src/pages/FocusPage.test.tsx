import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import FocusPage from './FocusPage'
import { DISCHARGE_END_MESSAGE } from '../hooks/useFocusTimer'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'
import { todayDateString } from '../lib/time'
import { dischargeBlockPointer } from '../lib/discharge-block-pointer'
import * as sessionAlarm from '../lib/session-alarm'

function renderFocusPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.focus, element: <FocusPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.retro, element: <div>RETRO_STUB</div> },
    ],
    { initialEntries: [ROUTES.focus] },
  )
  render(<RouterProvider router={router} />)
}

async function seedActiveBlockWithPrediction() {
  const task = await useAppStore.getState().addTask('청소')
  const block = await useAppStore.getState().startBlock(task.id, '책상 정리하기')
  await useAppStore.getState().setPrediction(block.id, true)
  return { task, block }
}

// PH-12 5-C 테스트 공용 — 900초 시점으로 점프해 한 번 tick한다(SPEC §6/P13, 900번 tick 불필요).
function jumpToElapsed(now: Date) {
  vi.setSystemTime(new Date(now.getTime() + 900_000))
  act(() => {
    useAppStore.getState().tick()
  })
}

async function seedElapsedFocusBlock() {
  const now = new Date('2026-07-07T10:00:00.000Z')
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
  const { block } = await seedActiveBlockWithPrediction()
  renderFocusPage()
  jumpToElapsed(now)
  return { block }
}

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    elapsedSeconds: 0,
    pausedAt: null,
    pausedMs: 0,
    predictions: [],
    energyCells: [],
    lastResolvedBlock: null,
    capturedThought: null,
    dischargeMode: false,
    dischargeEndMessage: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('FocusPage — no active block', () => {
  test('redirects to the dashboard', async () => {
    renderFocusPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('FocusPage — countdown', () => {
  test('renders 15:00 at the start, in a focus-mode wrapper', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()

    expect(await screen.findByText('15:00')).toBeInTheDocument()
    expect(document.querySelector('[data-mode="focus"]')).toBeInTheDocument()
  })

  test('updates the displayed countdown when the store ticks', async () => {
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    expect(screen.getByText('15:00')).toBeInTheDocument()

    vi.setSystemTime(new Date(now.getTime() + 1_000))
    act(() => {
      useAppStore.getState().tick()
    })

    expect(screen.getByText('14:59')).toBeInTheDocument()
  })

  test('ticks automatically via a real interval while mounted', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()

    await new Promise((resolve) => setTimeout(resolve, 1100))

    expect(useAppStore.getState().elapsedSeconds).toBeGreaterThanOrEqual(1)
  })
})

// PH-12 — 15분 자연 경과는 더 이상 시스템이 완료로 추정하지 않는다(SPEC §6 신설 행). 에너지는
// 즉시 점등되지만 완료/이어가기 라벨은 5-C 시트에서 사용자가 고른다.
describe('FocusPage — 5-C 조각 마무리 선택 (SPEC §6, 15분 자연 경과)', () => {
  test('at 900 seconds: lights energy immediately but shows the 5-C wrap-up sheet instead of auto-completing', async () => {
    const { block } = await seedElapsedFocusBlock()

    expect(await screen.findByRole('button', { name: '이 조각 끝났어요' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '아직 남았어요' })).toBeInTheDocument()
    expect(screen.queryByText('RETRO_STUB')).not.toBeInTheDocument()
    // ensureEnergyLit's IndexedDB write is fire-and-forget from the effect, so give it a real
    // beat to land before asserting — the button's own appearance doesn't gate on it.
    await waitFor(() => {
      expect(useAppStore.getState().energyCells.some((cell) => cell.blockId === block.id)).toBe(
        true,
      )
    })
    expect(useAppStore.getState().activeBlock).not.toBeNull()
    expect(useAppStore.getState().lastResolvedBlock).toBeNull()
  })

  test('choosing "이 조각 끝났어요" completes the block and goes to retro with a single energy light', async () => {
    const { block } = await seedElapsedFocusBlock()
    vi.useRealTimers()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '이 조각 끝났어요' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'done' })
    expect(state.predictions.find((p) => p.blockId === block.id)?.actual).toBe(true)
    expect(state.energyCells.filter((cell) => cell.blockId === block.id)).toHaveLength(1)
  })

  test('choosing "아직 남았어요" marks the block incomplete and goes to retro with a single energy light', async () => {
    const { block } = await seedElapsedFocusBlock()
    vi.useRealTimers()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '아직 남았어요' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'incomplete' })
    expect(state.predictions.find((p) => p.blockId === block.id)?.actual).toBe(false)
    expect(state.energyCells.filter((cell) => cell.blockId === block.id)).toHaveLength(1)
  })
})

describe('FocusPage — 완료 알람(session-alarm)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('fires the completion alarm exactly once, even while the 5-C sheet waits across several ticks', async () => {
    const notifySpy = vi.spyOn(sessionAlarm, 'notifySessionComplete')
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    jumpToElapsed(now)
    await screen.findByRole('button', { name: '이 조각 끝났어요' })

    // 사용자가 5-C 시트에서 고르기 전까지 몇 초 더 지나도(매초 tick) 중복 발화하면 안 된다.
    for (let i = 0; i < 3; i += 1) {
      vi.setSystemTime(new Date(now.getTime() + 900_000 + (i + 1) * 1000))
      act(() => {
        useAppStore.getState().tick()
      })
    }

    expect(notifySpy).toHaveBeenCalledTimes(1)
  })

  test('fires the completion alarm once for discharge blocks too', async () => {
    const notifySpy = vi.spyOn(sessionAlarm, 'notifySessionComplete')
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    useAppStore.setState({ dischargeMode: true })
    const task = await useAppStore.getState().addTask('청소')
    const block = await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    dischargeBlockPointer.set(block.id)
    await useAppStore.getState().lightEnergyCell(block.id, todayDateString())
    renderFocusPage()
    jumpToElapsed(now)

    await screen.findByText('DASHBOARD_STUB')
    expect(notifySpy).toHaveBeenCalledTimes(1)
  })
})

describe('FocusPage — 5-C 가드레일 (방전 우회·제스처 잠금·무처벌 카피)', () => {
  test('discharge blocks bypass 5-C entirely and auto-complete at 900 seconds as before', async () => {
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    useAppStore.setState({ dischargeMode: true })
    const task = await useAppStore.getState().addTask('청소')
    const block = await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    dischargeBlockPointer.set(block.id)
    // 방전 대시보드가 시작 시점에 이미 점등했던 그 칸을 흉내낸다 — 900초 자동 종료가 이를 다시
    // 점등하면 안 된다(정확히 1회 점등 불변식, useSessionRecovery.test.tsx 선례와 동일 패턴).
    await useAppStore.getState().lightEnergyCell(block.id, todayDateString())
    renderFocusPage()
    jumpToElapsed(now)

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이 조각 끝났어요' })).not.toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.energyCells.filter((cell) => cell.blockId === block.id)).toHaveLength(1)
    expect(state.dischargeMode).toBe(false)
    expect(state.dischargeEndMessage).toBe(DISCHARGE_END_MESSAGE)
    expect(state.lastResolvedBlock).toBeNull()
  })

  test('during the 5-C wrap-up window, taps and long-presses are ignored (no capture modal, no pause)', async () => {
    await seedElapsedFocusBlock()
    vi.useRealTimers()
    const user = userEvent.setup()
    await screen.findByRole('button', { name: '이 조각 끝났어요' })

    await user.click(screen.getByText('책상 정리하기'))

    expect(screen.queryByRole('dialog', { name: '딴생각 포착' })).not.toBeInTheDocument()
    expect(screen.queryByText('잠시 멈췄어요')).not.toBeInTheDocument()
    expect(useAppStore.getState().activeBlock?.status).not.toBe('paused')
  })

  test('no danger/error/warning/fail styling classes render during the 5-C wrap-up window', async () => {
    await seedElapsedFocusBlock()

    await screen.findByRole('button', { name: '이 조각 끝났어요' })

    expect(document.body.innerHTML).not.toMatch(/class="[^"]*\b(danger|error|warning|fail)\b/i)
  })

  // code review 발견(#6 수정 부작용) — 세션 복구는 정지 구간이 Storage에 없어 벽시계 경과만으로
  // elapsedSeconds를 계산한다. 일시정지된 채로 15분을 넘긴 블록이 복구되면 PauseOverlay와
  // WrapUpOverlay(둘 다 BottomSheet)가 동시에 뜨는 걸 막아야 한다.
  test('a block recovered while still paused past 900s shows only the pause overlay, not a stacked wrap-up sheet', async () => {
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    const { block } = await seedActiveBlockWithPrediction()
    // useSessionRecovery.ts가 정지된 블록을 그대로 복구하는 상황을 직접 구성한다 — pausedAt은
    // Block/Storage 스키마에 없어 재기동 후 항상 null(실제 pause()를 거치면 그 순간의 실시각이
    // 잡혀 이 시나리오와 달라진다), elapsedSeconds만 벽시계 경과로 미리 계산돼 들어온다.
    act(() => {
      useAppStore.setState({ activeBlock: { ...block, status: 'paused' }, elapsedSeconds: 900 })
    })
    renderFocusPage()

    expect(await screen.findByText('잠시 멈췄어요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이 조각 끝났어요' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '아직 남았어요' })).not.toBeInTheDocument()

    // 재개하면(pausedAt이 없어 정지 구간 차감이 없고, 실제로 15분+ 지난 시각 기준) 다음
    // tick에서 5-C가 정상적으로, 단독으로 뜬다 — 정지가 5-C를 영구히 막는 죽은 끝이 아님을
    // 함께 확인한다.
    vi.setSystemTime(new Date(now.getTime() + 20 * 60_000))
    await act(async () => {
      await useAppStore.getState().resume()
    })
    act(() => {
      useAppStore.getState().tick()
    })

    expect(await screen.findByRole('button', { name: '이 조각 끝났어요' })).toBeInTheDocument()
    expect(screen.queryByText('잠시 멈췄어요')).not.toBeInTheDocument()
  })
})

describe('FocusPage — dev-only skip button (흐름 확인용, 프로덕션 미노출)', () => {
  test('completes the block immediately without waiting for 900 seconds', async () => {
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '스킵(DEV)' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'done' })
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
  })
})

describe('FocusPage — pause (SPEC §6 5-B, long-press only)', () => {
  test('shows the pause overlay when the active block is paused', async () => {
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    void block

    expect(await screen.findByText('잠시 멈췄어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재개' })).toBeInTheDocument()
  })

  test('resume returns to the running countdown', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '재개' }))

    expect(screen.queryByText('잠시 멈췄어요')).not.toBeInTheDocument()
    expect(useAppStore.getState().activeBlock?.status).toBe('in_progress')
  })

  test('quitting from the pause overlay ends the block as incomplete and goes to retro', async () => {
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '그만하기' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'incomplete' })
    // PH-12 — energy lighting moved off finishNormalPath onto ensureEnergyLit; the early-quit
    // path must still light exactly once, not zero times or twice.
    expect(state.energyCells.filter((cell) => cell.blockId === block.id)).toHaveLength(1)
  })

  test('there is no direct quit button on the running countdown screen', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    await screen.findByText('15:00')

    expect(screen.queryByRole('button', { name: '오늘은 여기까지' })).not.toBeInTheDocument()
  })
})

describe('FocusPage — distraction capture (SPEC §6 5-A, single-slot)', () => {
  test('tapping the countdown opens the capture modal without pausing the timer', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()

    await user.click(screen.getByText('책상 정리하기'))

    expect(await screen.findByRole('dialog', { name: '딴생각 포착' })).toBeInTheDocument()
    expect(useAppStore.getState().activeBlock?.status).toBe('in_progress')
  })

  test('"나중에 보기" with text saves it as the captured thought and closes the modal', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('책상 정리하기'))

    await user.type(
      await screen.findByLabelText('잠깐 스친 생각, 적어두고 다시 집중하세요'),
      '빨래도 해야지',
    )
    await user.click(screen.getByRole('button', { name: '나중에 보기' }))

    expect(useAppStore.getState().capturedThought).toBe('빨래도 해야지')
    expect(screen.queryByRole('dialog', { name: '딴생각 포착' })).not.toBeInTheDocument()
  })

  test('"나중에 보기" with empty text closes without saving anything', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('책상 정리하기'))

    await user.click(await screen.findByRole('button', { name: '나중에 보기' }))

    expect(useAppStore.getState().capturedThought).toBeNull()
  })
})

describe('FocusPage — give up via pause', () => {
  test('ends the block as incomplete without a prediction and goes to retro', async () => {
    const task = await useAppStore.getState().addTask('청소')
    const block = await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '그만하기' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'incomplete' })
    expect(state.predictions.find((p) => p.blockId === block.id)).toBeUndefined()
    expect(state.energyCells.filter((cell) => cell.blockId === block.id)).toHaveLength(1)
  })
})

describe('FocusPage — energy cell date', () => {
  test('lights the energy cell under today’s date', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '그만하기' }))

    await screen.findByText('RETRO_STUB')
    const cell = useAppStore.getState().energyCells[0]
    expect(cell?.date).toBe(todayDateString())
  })
})

// PH-08 code review CRITICAL regression — a stale ambient `dischargeMode` flag (left on by
// back-button/away-navigation before any block was ever started under discharge) must never
// misclassify a later, unrelated normal block as discharge. The finish branch must key off the
// block-scoped dischargeBlockPointer, not the session-wide flag, so this normal block still
// lights energy, resolves its prediction, and reaches the real retro screen.
describe('FocusPage — stale dischargeMode does not leak into an unrelated normal block', () => {
  test('completes as a normal block: energy lights, prediction resolves, retro is visited (not the dashboard)', async () => {
    useAppStore.setState({ dischargeMode: true })
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    // 방전 화면을 거치지 않고 이 블록을 시작했으므로 dischargeBlockPointer는 비어 있다 — 시각
    // 모드도 이 표식으로 결정되므로 stale dischargeMode에도 불구하고 focus여야 한다.
    expect(document.querySelector('[data-mode="focus"]')).toBeInTheDocument()
    expect(document.querySelector('[data-mode="discharge"]')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await act(async () => {
      await useAppStore.getState().pause()
    })

    await user.click(await screen.findByRole('button', { name: '그만하기' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'incomplete' })
    expect(state.predictions.find((p) => p.blockId === block.id)?.actual).toBe(false)
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
    expect(state.dischargeEndMessage).toBeNull()
  })
})
