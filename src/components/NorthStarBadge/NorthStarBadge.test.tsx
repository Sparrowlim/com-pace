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
