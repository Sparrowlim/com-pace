import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import PredictPage from './PredictPage'
import { useAppStore } from '../store'
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
