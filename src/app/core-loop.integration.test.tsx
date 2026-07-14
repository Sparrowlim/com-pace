import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routeObjects } from './router'
import { ROUTES } from '../routes/paths'
import { useAppStore } from '../store'
import { markOnboardingComplete } from '../lib/onboarding-status'

beforeEach(() => {
  localStorage.clear()
  markOnboardingComplete()
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
    timeSenseFeedback: null,
    dischargeMode: false,
    dischargeEndMessage: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

// SPEC §6/P13 — 900번 tick()을 동기 호출하는 대신 시스템 시계를 900초 앞으로 옮기고 1회만
// tick()한다(타임스탬프 기반 재계산이므로 이걸로 충분 — PH-06).
function advance15MinutesAndTick() {
  const current = new Date()
  vi.setSystemTime(new Date(current.getTime() + 900_000))
  act(() => {
    useAppStore.getState().tick()
  })
}

// PH-05 수용 기준 — 실제 라우트 트리(스텁 없이)로 대시보드→쪼개기 없이(픽스처 시드)→예측→집중→회고를
// 두 블록에 걸쳐 왕복하고, 큐 소진 후 대시보드의 "과제 소진" 대체 상태로 되돌아오는지 검증한다.
describe('core loop integration (real routes, fixture-seeded task)', () => {
  test('runs the full loop across two blocks back to an exhausted dashboard', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기', '이메일 확인하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)

    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.dashboard] })
    render(<RouterProvider router={router} />)

    // 대시보드: 큐가 2개라 자기선택 UI(PH-05.1, SPEC §3 · D-05) — 첫 조각을 골라 시작
    await user.click(await screen.findByRole('button', { name: '책상 정리하기' }))

    // 예측: 완료 예측
    await user.click(await screen.findByRole('button', { name: '끝날 것 같아요' }))

    // 집중: 15분 경과를 직접 구동(체감 대기 없이) → PH-12 5-C: 완료 여부는 사용자가 고른다
    await screen.findByText('15:00')
    advance15MinutesAndTick()
    await user.click(await screen.findByRole('button', { name: '이 조각 끝났어요' }))

    // 회고: 완료 + 적중 → 보너스, 다음 블록으로
    await screen.findByText('예측이 딱 맞았어요.')
    await user.click(await screen.findByRole('button', { name: '바로 다음 블록' }))

    // 예측(두 번째 블록): 이번엔 빗나가게
    await user.click(await screen.findByRole('button', { name: '더 걸릴 것 같아요' }))
    await screen.findByText('15:00')
    advance15MinutesAndTick()
    await user.click(await screen.findByRole('button', { name: '이 조각 끝났어요' }))

    // 회고: 완료 + 빗나감 → 보너스 없음, 완료 화면과 동일한 문구
    await screen.findByText('15분, 오늘도 해냈어요.')
    expect(screen.queryByText('예측이 딱 맞았어요.')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: '바로 다음 블록' }))

    // 큐 소진 → 대시보드가 "과제 소진" 대체 상태(인라인 새 과제 입력)로 착지
    expect(await screen.findByRole('textbox')).toBeInTheDocument()
    expect(useAppStore.getState().queuedBlocks).toHaveLength(0)
    expect(useAppStore.getState().energyCells).toHaveLength(2)
  })
})

// PH-06.1 수용 기준 C — 예측→집중(미완료 종료)→회고→"오늘은 여기까지"→대시보드에서 그 조각이
// 큐에 남아 다시 선택 가능한지 실제 라우트 트리(스텁 없이)로 검증한다.
describe('core loop integration — PH-06.1 session-scoped carryover (real routes)', () => {
  test('abandoned fragment is selectable again after stop-for-today', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)

    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.dashboard] })
    render(<RouterProvider router={router} />)

    await user.click(await screen.findByRole('button', { name: '이 블록 시작하기' }))
    await user.click(await screen.findByRole('button', { name: '끝날 것 같아요' }))
    await screen.findByText('15:00')

    // 도중 중단(SPEC §6 5-B): 일시정지 → 그만하기 → 미완료 회고
    await act(async () => {
      await useAppStore.getState().pause()
    })
    await user.click(await screen.findByRole('button', { name: '그만하기' }))
    await screen.findByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')

    await user.click(await screen.findByRole('button', { name: '오늘은 여기까지' }))

    // 대시보드: 조각이 큐 후미에 남아 단일 조각 자동 노출(TaskCta)로 다시 선택 가능
    expect(await screen.findByRole('button', { name: '이 블록 시작하기' })).toBeInTheDocument()
    const { queuedBlocks } = useAppStore.getState()
    expect(queuedBlocks).toHaveLength(1)
    expect(queuedBlocks[0]).toMatchObject({ taskId: task.id, verbLabel: '책상 정리하기' })
  })
})

// PH-08 수용 기준 — 대시보드 저마찰 링크→방전 진입→방전 대시보드→집중→종료를 실제 라우트
// 트리(스텁 없이)로 왕복하며, /predict·/retro를 전혀 거치지 않고, 시작 즉시 에너지가 점등되고,
// 큐가 소비되지 않는지 검증한다.
describe('core loop integration — PH-08 discharge mode (real routes)', () => {
  test('runs discharge start-to-end without ever visiting predict or retro, preserving the queue', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)

    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.dashboard] })
    render(<RouterProvider router={router} />)

    await user.click(await screen.findByRole('button', { name: '오늘은 가볍게 갈까요' }))
    expect(await screen.findByRole('button', { name: '딱 하나만 할래요' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '딱 하나만 할래요' }))

    expect(await screen.findByRole('button', { name: '타이머만 켜면 승리' })).toBeInTheDocument()
    // 같은 파일의 다른 테스트가 이미 만든 에너지 칸이 fake-indexeddb에 남아 있을 수 있어(테스트 간
    // 미초기화, 의도적) 절대 개수 대신 이 테스트가 만든 증분만 비교한다. DashboardPage의 비동기
    // loadEnergyCellsForDate가 여기까지 오는 동안 이미 정착했으므로 여기서 기준선을 잡는다.
    const baselineEnergyCount = useAppStore.getState().energyCells.length
    await user.click(screen.getByRole('button', { name: '타이머만 켜면 승리' }))

    // 예측 미경유 — 곧장 집중(방전 표면). 에너지는 시작 즉시 이 블록 몫으로 정확히 1칸만 는다.
    await screen.findByText('15:00')
    expect(document.querySelector('[data-mode="discharge"]')).toBeInTheDocument()
    const blockAtStart = useAppStore.getState().activeBlock
    expect(useAppStore.getState().energyCells.length).toBe(baselineEnergyCount + 1)
    expect(
      useAppStore.getState().energyCells.some((cell) => cell.blockId === blockAtStart?.id),
    ).toBe(true)
    expect(useAppStore.getState().queuedBlocks).toHaveLength(1)

    advance15MinutesAndTick()

    // 회고 미경유 — 곧장 대시보드 + 한 줄 + dischargeMode 해제. 종료 시 재점등 없음(칸 수 불변).
    expect(await screen.findByText('오늘 15분, 켠 것만으로 충분해요')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.dischargeMode).toBe(false)
    expect(state.energyCells.length).toBe(baselineEnergyCount + 1)
    expect(state.queuedBlocks).toHaveLength(1)
    expect(state.queuedBlocks[0]).toMatchObject({ taskId: task.id, verbLabel: '책상 정리하기' })
  })
})
