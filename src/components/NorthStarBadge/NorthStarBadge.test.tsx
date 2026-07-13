import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { runAxe } from '../../test/axe'
import { NorthStarBadge } from './NorthStarBadge'

describe('NorthStarBadge', () => {
  it('renders the formatted north star summary', () => {
    render(<NorthStarBadge northStar={{ aspiration: '건강해지기', obligation: '' }} />)
    expect(screen.getByText('열망: 건강해지기')).toBeInTheDocument()
  })

  it('renders aspiration and obligation as two independent chips (SPEC §9 — 나란히, 순위 없음)', () => {
    render(
      <NorthStarBadge
        northStar={{ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' }}
      />,
    )
    const aspirationChip = screen.getByText('열망: 작가가 되고 싶어요')
    const obligationChip = screen.getByText('의무: 보고서 마감')

    expect(aspirationChip).toBeInTheDocument()
    expect(obligationChip).toBeInTheDocument()
    expect(aspirationChip).not.toBe(obligationChip)
  })

  it('exposes a single group accessible name for the pair', () => {
    render(
      <NorthStarBadge
        northStar={{ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' }}
      />,
    )
    expect(
      screen.getByRole('group', { name: '열망: 작가가 되고 싶어요 · 의무: 보고서 마감' }),
    ).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <NorthStarBadge northStar={{ aspiration: '건강해지기', obligation: '자격증 따기' }} />,
    )
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('does not accept an onClick prop (PH-04.4 1-5 — 관리 대상화 원천 차단, 타입 레벨)', () => {
    type NorthStarBadgeProps = Parameters<typeof NorthStarBadge>[0]
    type HasOnClick = 'onClick' extends keyof NorthStarBadgeProps ? true : false
    const hasOnClick: HasOnClick = false
    expect(hasOnClick).toBe(false)
  })

  it('does not react to click events at runtime (no handler exists to attach)', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<NorthStarBadge northStar={{ aspiration: '건강해지기', obligation: '' }} />)

    await user.click(screen.getByText('열망: 건강해지기'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
