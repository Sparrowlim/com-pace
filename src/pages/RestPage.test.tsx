import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import RestPage from './RestPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'

function renderRestPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.rest, element: <RestPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.predict, element: <div>PREDICT_STUB</div> },
    ],
    { initialEntries: [ROUTES.rest] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  useAppStore.setState({ tasks: [], queuedBlocks: [] })
})

describe('RestPage — SCREEN-FLOW 6-A', () => {
  test('renders both closed choices with no guardrail-violating copy', async () => {
    renderRestPage()

    expect(await screen.findByRole('button', { name: '다음 블록' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '오늘은 그만' })).toBeInTheDocument()
    expect(document.body.innerHTML).not.toMatch(/class="[^"]*\b(danger|error|warning|fail)\b/i)
  })

  test('"다음 블록" goes to predict when a fragment is queued', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      tasks: [{ id: 'task-1', title: '청소', createdAt: '', splitDone: true }],
      queuedBlocks: [{ id: 'q1', taskId: 'task-1', verbLabel: '이메일 확인하기' }],
    })
    renderRestPage()

    await user.click(await screen.findByRole('button', { name: '다음 블록' }))

    expect(await screen.findByText('PREDICT_STUB')).toBeInTheDocument()
  })

  test('"다음 블록" goes to the dashboard when the queue is empty (과제 소진)', async () => {
    const user = userEvent.setup()
    renderRestPage()

    await user.click(await screen.findByRole('button', { name: '다음 블록' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })

  test('"오늘은 그만" goes straight to the dashboard', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      tasks: [{ id: 'task-1', title: '청소', createdAt: '', splitDone: true }],
      queuedBlocks: [{ id: 'q1', taskId: 'task-1', verbLabel: '이메일 확인하기' }],
    })
    renderRestPage()

    await user.click(await screen.findByRole('button', { name: '오늘은 그만' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})
