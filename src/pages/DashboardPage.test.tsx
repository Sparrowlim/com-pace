import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'
import { todayDateString } from '../lib/time'
import { markOnboardingComplete } from '../lib/onboarding-status'
import { saveNorthStar } from '../lib/north-star-storage'
import { runAxe } from '../test/axe'

function renderDashboard() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.onboarding, element: <div>ONBOARDING_STUB</div> },
      { path: ROUTES.split, element: <div>SPLIT_STUB</div> },
      { path: ROUTES.predict, element: <div>PREDICT_STUB</div> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
      { path: ROUTES.dischargeEntry, element: <div>DISCHARGE_ENTRY_STUB</div> },
      { path: ROUTES.settings, element: <div>SETTINGS_STUB</div> },
      { path: ROUTES.northStar, element: <div>NORTH_STAR_STUB</div> },
    ],
    { initialEntries: [ROUTES.dashboard] },
  )
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
  markOnboardingComplete()
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    energyCells: [],
    dischargeMode: false,
    dischargeEndMessage: null,
  })
})

describe('DashboardPage — onboarding gate', () => {
  test('redirects to onboarding when onboarding has not been completed', async () => {
    localStorage.clear()
    renderDashboard()

    expect(await screen.findByText('ONBOARDING_STUB')).toBeInTheDocument()
  })
})

describe('DashboardPage — no active task', () => {
  test('renders an inline add-task prompt', async () => {
    renderDashboard()

    expect(await screen.findByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  test('the add-task input has an accessible name (Phase 1, B4 — no label was passed before)', async () => {
    renderDashboard()

    expect(await screen.findByRole('textbox', { name: '오늘 할 일' })).toBeInTheDocument()
  })

  test('has no axe violations', async () => {
    const { container } = renderDashboard()
    await screen.findByRole('textbox')

    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  test('adding a task navigates to split', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.type(screen.getByRole('textbox'), '청소')
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(await screen.findByText('SPLIT_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().tasks).toHaveLength(1)
  })
})

describe('DashboardPage — unsplit active task', () => {
  test('shows the task card with a split CTA', async () => {
    const user = userEvent.setup()
    await useAppStore.getState().addTask('청소')
    renderDashboard()

    expect(await screen.findByText('청소')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '쪼개러 가기' }))

    expect(await screen.findByText('SPLIT_STUB')).toBeInTheDocument()
  })

  test('renders exactly one task card (One Task invariant)', async () => {
    await useAppStore.getState().addTask('청소')
    renderDashboard()
    await screen.findByText('청소')

    expect(document.querySelectorAll('[data-task-card]')).toHaveLength(1)
  })
})

describe('DashboardPage — split task with a queued block', () => {
  test('shows the next block label and a start CTA to predict', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    renderDashboard()

    expect(await screen.findByText(/책상 정리하기/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '이 블록 시작하기' }))

    expect(await screen.findByText('PREDICT_STUB')).toBeInTheDocument()
  })

  test('renders no self-selection options when only one fragment is queued (regression)', async () => {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    renderDashboard()
    await screen.findByText(/책상 정리하기/)

    expect(screen.queryAllByRole('button', { pressed: false })).toHaveLength(0)
    expect(document.querySelectorAll('[data-task-card]')).toHaveLength(1)
  })
})

describe('DashboardPage — self-selection (PH-05.1, SPEC §3 · D-05)', () => {
  test('lists every queued fragment in split order when 2+ are queued, with no auto CTA', async () => {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기', '이메일 확인하기', '설거지하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    renderDashboard()

    expect(await screen.findByRole('button', { name: '책상 정리하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이메일 확인하기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '설거지하기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이 블록 시작하기' })).not.toBeInTheDocument()
  })

  test('preserves the One Task invariant while the selection UI is shown', async () => {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기', '이메일 확인하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    renderDashboard()
    await screen.findByRole('button', { name: '책상 정리하기' })

    expect(document.querySelectorAll('[data-task-card]')).toHaveLength(1)
  })

  test('tapping any option promotes it to the front of the queue and navigates to predict', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기', '이메일 확인하기', '설거지하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    renderDashboard()

    await user.click(await screen.findByRole('button', { name: '이메일 확인하기' }))

    expect(await screen.findByText('PREDICT_STUB')).toBeInTheDocument()
    const { queuedBlocks } = useAppStore.getState()
    expect(queuedBlocks[0]).toMatchObject({ taskId: task.id, verbLabel: '이메일 확인하기' })
  })
})

describe('DashboardPage — timer in progress', () => {
  test('shows a return-to-focus card instead of a start CTA, regardless of queue state', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    await useAppStore.getState().startBlock(task.id, '이메일 확인하기')
    renderDashboard()

    expect(screen.queryByRole('button', { name: '이 블록 시작하기' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: '돌아가기' }))

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
  })
})

describe('DashboardPage — energy bar', () => {
  test('reflects the number of energy cells lit today, loaded from storage on mount', async () => {
    await useAppStore.getState().lightEnergyCell('block-1', todayDateString())
    await useAppStore.getState().lightEnergyCell('block-2', todayDateString())
    useAppStore.setState({ energyCells: [] })

    renderDashboard()

    expect(await screen.findByRole('group', { name: '오늘 2칸' })).toBeInTheDocument()
  })
})

describe('DashboardPage — discharge link (PH-08 §5)', () => {
  test('is hidden when there is no active task (zero state)', async () => {
    renderDashboard()
    await screen.findByRole('textbox')

    expect(screen.queryByRole('button', { name: '오늘은 가볍게 갈까요' })).not.toBeInTheDocument()
  })

  test('is hidden while the task is not split yet (no runnable fragment)', async () => {
    await useAppStore.getState().addTask('청소')
    renderDashboard()
    await screen.findByText('청소')

    expect(screen.queryByRole('button', { name: '오늘은 가볍게 갈까요' })).not.toBeInTheDocument()
  })

  test('is hidden while a timer is already in progress', async () => {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    renderDashboard()
    await screen.findByText('타이머가 진행 중이에요')

    expect(screen.queryByRole('button', { name: '오늘은 가볍게 갈까요' })).not.toBeInTheDocument()
  })

  test('is shown and navigates to the discharge entry when a runnable fragment exists', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    renderDashboard()
    await screen.findByText(/책상 정리하기/)

    await user.click(await screen.findByRole('button', { name: '오늘은 가볍게 갈까요' }))

    expect(await screen.findByText('DISCHARGE_ENTRY_STUB')).toBeInTheDocument()
  })
})

describe('DashboardPage — north star (PH-09 §9)', () => {
  test('shows the invite link and zero badge DOM when no north star is saved', async () => {
    renderDashboard()
    await screen.findByRole('textbox')

    expect(screen.getByRole('button', { name: '북극성 더하기(선택)' })).toBeInTheDocument()
    expect(screen.queryByText(/열망:|의무:/)).not.toBeInTheDocument()
  })

  test('navigates to the north star page when the invite link is clicked', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByRole('textbox')

    await user.click(screen.getByRole('button', { name: '북극성 더하기(선택)' }))

    expect(await screen.findByText('NORTH_STAR_STUB')).toBeInTheDocument()
  })

  test.each([
    ['aspiration only', '작가가 되고 싶어요', ''],
    ['obligation only', '', '보고서 마감'],
    ['both', '작가가 되고 싶어요', '보고서 마감'],
  ])(
    'shows a static badge and no invite link when %s is set',
    async (_label, aspiration, obligation) => {
      saveNorthStar({ aspiration, obligation })
      renderDashboard()
      await screen.findByRole('textbox')

      expect(screen.queryByRole('button', { name: '북극성 더하기(선택)' })).not.toBeInTheDocument()
      expect(screen.getByRole('group', { name: /열망:|의무:/ })).toBeInTheDocument()
    },
  )

  test('renders no progress or percentage markup on the badge (SPEC §9 — 진행 측정기 아님)', async () => {
    saveNorthStar({ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' })
    renderDashboard()
    const badge = await screen.findByRole('group', { name: /열망:|의무:/ })

    expect(badge.textContent ?? '').not.toMatch(/%/)
    expect(badge.textContent ?? '').not.toMatch(/퍼센트|도달률|진행률/)
    expect(document.querySelector('progress, [role="progressbar"]')).not.toBeInTheDocument()
  })
})

describe('DashboardPage — settings entry point (PH-09)', () => {
  test('always exposes a settings link and navigates to settings', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await screen.findByRole('textbox')

    await user.click(screen.getByRole('button', { name: '설정' }))

    expect(await screen.findByText('SETTINGS_STUB')).toBeInTheDocument()
  })

  test('is visible even while a timer is in progress', async () => {
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    renderDashboard()
    await screen.findByText('타이머가 진행 중이에요')

    expect(screen.getByRole('button', { name: '설정' })).toBeInTheDocument()
  })
})

describe('DashboardPage — discharge end message (PH-08 §5, retro skipped)', () => {
  test('renders the one-line ending copy when present and clears it on unmount', async () => {
    useAppStore.setState({ dischargeEndMessage: '오늘 15분, 켠 것만으로 충분해요' })
    const { unmount } = render(
      <RouterProvider
        router={createMemoryRouter([{ path: ROUTES.dashboard, element: <DashboardPage /> }], {
          initialEntries: [ROUTES.dashboard],
        })}
      />,
    )

    expect(await screen.findByText('오늘 15분, 켠 것만으로 충분해요')).toBeInTheDocument()

    unmount()

    expect(useAppStore.getState().dischargeEndMessage).toBeNull()
  })
})
