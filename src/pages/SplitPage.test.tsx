import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import SplitPage from './SplitPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'
import { runAxe } from '../test/axe'

function renderSplitPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.split, element: <SplitPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
    ],
    { initialEntries: [ROUTES.split] },
  )
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  useAppStore.setState({ tasks: [], queuedBlocks: [] })
})

describe('SplitPage', () => {
  test('redirects to the dashboard when there is no active task', async () => {
    renderSplitPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })

  test('renders the active task title', async () => {
    await useAppStore.getState().addTask('청소')
    renderSplitPage()

    expect(await screen.findByText('청소')).toBeInTheDocument()
  })

  test('explains the fragment-plus-verb-chip mechanism (Phase 1, B1 — no copy existed before)', async () => {
    await useAppStore.getState().addTask('청소')
    renderSplitPage()

    expect(
      await screen.findByText(
        '조각을 적고, 어떤 동작인지 칩을 하나 골라 붙이면 15분 조각이 만들어져요',
      ),
    ).toBeInTheDocument()
  })

  test('adds a draft block combining the fragment text and a verb chip', async () => {
    const user = userEvent.setup()
    await useAppStore.getState().addTask('청소')
    renderSplitPage()

    await user.type(await screen.findByRole('textbox', { name: '과제 조각' }), '책상')
    await user.click(screen.getByRole('button', { name: '정리하기' }))

    expect(await screen.findByText('책상 정리하기')).toBeInTheDocument()
  })

  test('clears the fragment input after adding a draft', async () => {
    const user = userEvent.setup()
    await useAppStore.getState().addTask('청소')
    renderSplitPage()

    const input = await screen.findByRole('textbox', { name: '과제 조각' })
    await user.type(input, '책상')
    await user.click(screen.getByRole('button', { name: '정리하기' }))

    expect(input).toHaveValue('')
  })

  test('removes a draft block', async () => {
    const user = userEvent.setup()
    await useAppStore.getState().addTask('청소')
    renderSplitPage()

    await user.type(await screen.findByRole('textbox', { name: '과제 조각' }), '책상')
    await user.click(screen.getByRole('button', { name: '정리하기' }))
    await user.click(await screen.findByRole('button', { name: '책상 정리하기 삭제' }))

    expect(screen.queryByText('책상 정리하기')).not.toBeInTheDocument()
  })

  test('disables the finish button while there are no drafts', async () => {
    await useAppStore.getState().addTask('청소')
    renderSplitPage()

    expect(await screen.findByRole('button', { name: '완료' })).toBeDisabled()
  })

  test('finishing queues the drafted blocks, marks the task split, and navigates home', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    renderSplitPage()

    await user.type(await screen.findByRole('textbox', { name: '과제 조각' }), '책상')
    await user.click(screen.getByRole('button', { name: '정리하기' }))
    await user.click(screen.getByRole('button', { name: '완료' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    const { queuedBlocks, tasks } = useAppStore.getState()
    expect(queuedBlocks).toEqual([
      { id: expect.any(String), taskId: task.id, verbLabel: '책상 정리하기' },
    ])
    expect(tasks.find((t) => t.id === task.id)?.splitDone).toBe(true)
  })

  test('has no axe violations (code review — the fragment TextInput lost its accessible name when the visible placeholder was removed; regression-locked here)', async () => {
    await useAppStore.getState().addTask('청소')
    const { container } = renderSplitPage()
    await screen.findByText('청소')

    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  test('renders one main task card (One Task invariant)', async () => {
    await useAppStore.getState().addTask('청소')
    renderSplitPage()
    await screen.findByText('청소')

    expect(document.querySelectorAll('[data-task-card]')).toHaveLength(1)
  })

  test('redirects to focus when a block is already in progress (One Task invariant, e.g. via back-navigation)', async () => {
    const task = await useAppStore.getState().addTask('청소')
    await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    renderSplitPage()

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
  })
})
