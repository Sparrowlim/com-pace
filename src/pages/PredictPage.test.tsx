import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import PredictPage from './PredictPage'
import { useAppStore } from '../store'
import { isFocusGestureHintShown } from '../lib/focus-gesture-hint'
import { ROUTES } from '../routes/paths'

function renderPredictPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.predict, element: <PredictPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
    ],
    { initialEntries: [ROUTES.predict] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    predictions: [],
    sessions: [],
  })
})

describe('PredictPage — no next block', () => {
  test('redirects to the dashboard', async () => {
    renderPredictPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('PredictPage — a block is already in progress', () => {
  test('redirects to focus instead of letting a second block start (One Task invariant)', async () => {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기', '이메일 확인하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    await useAppStore.getState().startBlock(task.id, '책상 정리하기')

    renderPredictPage()

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
  })
})

describe('PredictPage — a queued block is next', () => {
  async function seedTaskWithQueuedBlock() {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    return task
  }

  test('shows the next block label and two prediction options', async () => {
    await seedTaskWithQueuedBlock()
    renderPredictPage()

    expect(await screen.findByText(/책상 정리하기/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '끝날 것 같아요' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '더 걸릴 것 같아요' })).toBeInTheDocument()
  })

  test('choosing "끝날 것 같아요" starts the block, records guess=true, and navigates to focus', async () => {
    const user = userEvent.setup()
    const task = await seedTaskWithQueuedBlock()
    renderPredictPage()

    await user.click(await screen.findByRole('button', { name: '끝날 것 같아요' }))

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
    const { queuedBlocks, activeBlock, predictions, sessions } = useAppStore.getState()
    expect(queuedBlocks).toHaveLength(0)
    expect(activeBlock).toMatchObject({ taskId: task.id, verbLabel: '책상 정리하기' })
    expect(predictions).toEqual([{ blockId: activeBlock!.id, guess: true, actual: null }])
    // 내부 지표(SPEC §10) — 정상 진입은 dischargeMode: false로 세션을 남긴다.
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({ dischargeMode: false })
  })

  test('choosing "더 걸릴 것 같아요" records guess=false', async () => {
    const user = userEvent.setup()
    await seedTaskWithQueuedBlock()
    renderPredictPage()

    await user.click(await screen.findByRole('button', { name: '더 걸릴 것 같아요' }))

    await screen.findByText('FOCUS_STUB')
    const { predictions } = useAppStore.getState()
    expect(predictions[0]?.guess).toBe(false)
  })
})

// P0-B — 집중 화면 제스처(톡=포착/길게=일시정지)는 §6로 FocusPage에 힌트를 둘 수 없어, 첫 집중
// 세션 바로 앞 화면인 Predict에서 최초 1회만 알려준다. 회고는 블록 종료 후에야 떠서 '첫 블록'엔
// 안내가 없던 갭을 메운다.
describe('PredictPage — first-block gesture hint (P0-B)', () => {
  async function seedTaskWithQueuedBlock() {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    return task
  }

  test('teaches tap=capture / long-press=pause before the first focus session, then marks it seen', async () => {
    localStorage.removeItem('compace:focusGestureHintShown')
    await seedTaskWithQueuedBlock()
    renderPredictPage()

    expect(await screen.findByText(/톡 누르면 딴생각을 적어두고 길게 누르면/)).toBeInTheDocument()
    expect(isFocusGestureHintShown()).toBe(true)
  })

  test('does not repeat the hint once it has been seen', async () => {
    localStorage.setItem('compace:focusGestureHintShown', 'true')
    await seedTaskWithQueuedBlock()
    renderPredictPage()

    await screen.findByRole('button', { name: '끝날 것 같아요' })
    expect(screen.queryByText(/톡 누르면 딴생각을 적어두고/)).not.toBeInTheDocument()
  })

  test('does not burn the one-time flag when redirecting away without showing predict', async () => {
    localStorage.removeItem('compace:focusGestureHintShown')
    // 실행할 조각이 없으면 대시보드로 리다이렉트 — 힌트를 못 보여줬으니 플래그를 소모하면 안 된다.
    renderPredictPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    expect(isFocusGestureHintShown()).toBe(false)
  })
})
