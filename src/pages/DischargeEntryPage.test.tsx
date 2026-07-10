import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import DischargeEntryPage from './DischargeEntryPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'

function renderDischargeEntryPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.dischargeEntry, element: <DischargeEntryPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
      { path: ROUTES.dischargeDashboard, element: <div>DISCHARGE_DASHBOARD_STUB</div> },
    ],
    { initialEntries: [ROUTES.dischargeEntry] },
  )
  render(<RouterProvider router={router} />)
}

async function seedTaskWithQueuedBlock() {
  const task = await useAppStore.getState().addTask('청소')
  useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
  await useAppStore.getState().markTaskSplitDone(task.id)
  return task
}

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    dischargeMode: false,
  })
})

describe('DischargeEntryPage — no runnable fragment', () => {
  test('redirects to the dashboard', async () => {
    renderDischargeEntryPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('DischargeEntryPage — a block is already in progress', () => {
  test('redirects to focus instead (One Task invariant)', async () => {
    const task = await seedTaskWithQueuedBlock()
    await useAppStore.getState().startBlock(task.id, '책상 정리하기')

    renderDischargeEntryPage()

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
  })
})

describe('DischargeEntryPage — a runnable fragment exists', () => {
  test('renders the two closed choices with no stigma copy', async () => {
    await seedTaskWithQueuedBlock()
    renderDischargeEntryPage()

    expect(await screen.findByRole('button', { name: '딱 하나만 할래요' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '평소 모드로 볼게요' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/고장|실패/)
  })

  test('"딱 하나만 할래요" turns on discharge mode and goes to the discharge dashboard', async () => {
    await seedTaskWithQueuedBlock()
    renderDischargeEntryPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '딱 하나만 할래요' }))

    expect(await screen.findByText('DISCHARGE_DASHBOARD_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().dischargeMode).toBe(true)
  })

  test('"평소 모드로 볼게요" leaves discharge mode off and returns to the dashboard', async () => {
    await seedTaskWithQueuedBlock()
    renderDischargeEntryPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '평소 모드로 볼게요' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().dischargeMode).toBe(false)
  })
})
