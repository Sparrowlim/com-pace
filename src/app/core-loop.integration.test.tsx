import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routeObjects } from './router'
import { ROUTES } from '../routes/paths'
import { useAppStore } from '../store'

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

    // 대시보드: 첫 블록 시작
    await user.click(await screen.findByRole('button', { name: '이 블록 시작하기' }))

    // 예측: 완료 예측
    await user.click(await screen.findByRole('button', { name: '끝날 것 같아요' }))

    // 집중: 15분 경과를 직접 구동(체감 대기 없이)
    await screen.findByText('15:00')
    advance15MinutesAndTick()

    // 회고: 완료 + 적중 → 보너스, 다음 블록으로
    await screen.findByText('예측이 딱 맞았어요.')
    await user.click(await screen.findByRole('button', { name: '바로 다음 블록' }))

    // 예측(두 번째 블록): 이번엔 빗나가게
    await user.click(await screen.findByRole('button', { name: '더 걸릴 것 같아요' }))
    await screen.findByText('15:00')
    advance15MinutesAndTick()

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
