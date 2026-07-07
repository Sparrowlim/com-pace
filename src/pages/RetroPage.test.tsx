import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import RetroPage from './RetroPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'
import type { Block } from '../types/block'

function renderRetroPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.retro, element: <RetroPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.predict, element: <div>PREDICT_STUB</div> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
    ],
    { initialEntries: [ROUTES.retro] },
  )
  render(<RouterProvider router={router} />)
}

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'block-1',
    taskId: 'task-1',
    verbLabel: '책상 정리하기',
    status: 'done',
    startedAt: '2026-07-07T00:00:00.000Z',
    endedAt: '2026-07-07T00:15:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    predictions: [],
    energyCells: [{ id: 'e1', date: '2026-07-07', blockId: 'block-1', litAt: '' }],
    lastResolvedBlock: null,
    activeBlock: null,
    capturedThought: null,
  })
})

describe('RetroPage — no resolved block', () => {
  test('redirects to the dashboard', async () => {
    renderRetroPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('RetroPage — completed + prediction hit', () => {
  test('shows the bonus card and a single next-block button', async () => {
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'done' }),
      predictions: [{ blockId: 'block-1', guess: true, actual: true }],
    })
    renderRetroPage()

    expect(await screen.findByText('예측이 딱 맞았어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '바로 다음 블록' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이어서 15분 더' })).not.toBeInTheDocument()
  })

  test('navigates to predict when another block is queued', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      tasks: [{ id: 'task-1', title: '청소', createdAt: '', splitDone: true }],
      queuedBlocks: [{ id: 'q1', taskId: 'task-1', verbLabel: '이메일 확인하기' }],
      lastResolvedBlock: makeBlock({ status: 'done' }),
      predictions: [{ blockId: 'block-1', guess: true, actual: true }],
    })
    renderRetroPage()

    await user.click(await screen.findByRole('button', { name: '바로 다음 블록' }))

    expect(await screen.findByText('PREDICT_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().lastResolvedBlock).toBeNull()
  })

  test('navigates to the dashboard when the queue is empty', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'done' }),
      predictions: [{ blockId: 'block-1', guess: true, actual: true }],
    })
    renderRetroPage()

    await user.click(await screen.findByRole('button', { name: '바로 다음 블록' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('RetroPage — completed + prediction miss', () => {
  test('renders identically to a hit, minus the bonus card', async () => {
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'done' }),
      predictions: [{ blockId: 'block-1', guess: false, actual: true }],
    })
    renderRetroPage()

    await screen.findByText('15분, 오늘도 해냈어요.')
    expect(screen.queryByText('예측이 딱 맞았어요.')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[class*="bonusCard"]')).toHaveLength(0)
  })
})

describe('RetroPage — incomplete + prediction hit', () => {
  test('shows a warm, blame-free headline and both continue/stop actions', async () => {
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'incomplete' }),
      predictions: [{ blockId: 'block-1', guess: false, actual: false }],
    })
    renderRetroPage()

    const headline = await screen.findByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')
    expect(headline).toBeInTheDocument()
    for (const banned of ['실패', '미완료', '못 했']) {
      expect(document.body.textContent).not.toContain(banned)
    }
    expect(screen.getByRole('button', { name: '이어서 15분 더' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '오늘은 여기까지' })).toBeInTheDocument()
  })

  test('"이어서 15분 더" restarts the same fragment and goes to focus', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      tasks: [{ id: 'task-1', title: '청소', createdAt: '', splitDone: true }],
      lastResolvedBlock: makeBlock({ status: 'incomplete', taskId: 'task-1' }),
      predictions: [{ blockId: 'block-1', guess: false, actual: false }],
    })
    renderRetroPage()

    await user.click(await screen.findByRole('button', { name: '이어서 15분 더' }))

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().activeBlock).toMatchObject({
      taskId: 'task-1',
      verbLabel: '책상 정리하기',
    })
  })

  test('"오늘은 여기까지" goes to the dashboard without restarting', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'incomplete' }),
      predictions: [{ blockId: 'block-1', guess: false, actual: false }],
    })
    renderRetroPage()

    await user.click(await screen.findByRole('button', { name: '오늘은 여기까지' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().activeBlock).toBeNull()
  })
})

describe('RetroPage — incomplete + prediction miss', () => {
  test('renders identically to a hit, minus the bonus card', async () => {
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'incomplete' }),
      predictions: [{ blockId: 'block-1', guess: true, actual: false }],
    })
    renderRetroPage()

    await screen.findByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')
    expect(document.querySelectorAll('[class*="bonusCard"]')).toHaveLength(0)
  })
})

describe('RetroPage — captured thought (SPEC §6 5-A one-time card)', () => {
  test('shows the card when a thought was captured during the block', async () => {
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'done' }),
      capturedThought: '빨래도 널어야지',
    })
    renderRetroPage()

    expect(await screen.findByText('아까 스친 생각: “빨래도 널어야지”')).toBeInTheDocument()
  })

  test('renders nothing when no thought was captured', async () => {
    useAppStore.setState({ lastResolvedBlock: makeBlock({ status: 'done' }) })
    renderRetroPage()

    await screen.findByText('15분, 오늘도 해냈어요.')
    expect(screen.queryByRole('button', { name: '버리기' })).not.toBeInTheDocument()
  })

  test('"버리기" clears the captured thought without queuing anything', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'done' }),
      capturedThought: '빨래도 널어야지',
    })
    renderRetroPage()

    await user.click(await screen.findByRole('button', { name: '버리기' }))

    expect(useAppStore.getState().capturedThought).toBeNull()
    expect(useAppStore.getState().queuedBlocks).toHaveLength(0)
  })

  test('"새 조각화" queues the thought as a new block for the same task and clears it', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'done', taskId: 'task-1' }),
      capturedThought: '빨래도 널어야지',
    })
    renderRetroPage()

    await user.click(await screen.findByRole('button', { name: '새 조각화' }))

    const state = useAppStore.getState()
    expect(state.capturedThought).toBeNull()
    expect(state.queuedBlocks).toEqual([
      expect.objectContaining({ taskId: 'task-1', verbLabel: '빨래도 널어야지' }),
    ])
  })

  test('leaving the screen unprocessed silently clears the captured thought', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      tasks: [{ id: 'task-1', title: '청소', createdAt: '', splitDone: true }],
      queuedBlocks: [{ id: 'q1', taskId: 'task-1', verbLabel: '이메일 확인하기' }],
      lastResolvedBlock: makeBlock({ status: 'done', taskId: 'task-1' }),
      predictions: [{ blockId: 'block-1', guess: true, actual: true }],
      capturedThought: '빨래도 널어야지',
    })
    renderRetroPage()
    await screen.findByText('아까 스친 생각: “빨래도 널어야지”')

    await user.click(screen.getByRole('button', { name: '바로 다음 블록' }))

    await screen.findByText('PREDICT_STUB')
    expect(useAppStore.getState().capturedThought).toBeNull()
  })
})

describe('RetroPage — guardrails', () => {
  test('never renders danger/error/warning/fail styling classes', async () => {
    useAppStore.setState({
      lastResolvedBlock: makeBlock({ status: 'incomplete' }),
      predictions: [],
    })
    renderRetroPage()
    await screen.findByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')

    const html = document.body.innerHTML
    expect(html).not.toMatch(/class="[^"]*\b(danger|error|warning|fail)\b/i)
  })

  test('energy bar shows the same fill regardless of completed/incomplete', async () => {
    useAppStore.setState({ lastResolvedBlock: makeBlock({ status: 'incomplete' }) })
    renderRetroPage()

    expect(await screen.findByRole('group', { name: '오늘 1칸' })).toBeInTheDocument()
  })
})
