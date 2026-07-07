import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runAxe } from '../../test/axe'
import { EnergyBar } from './EnergyBar'

describe('EnergyBar', () => {
  it('renders exactly filledCount cells — no preview/allocated empty slots (SPEC §8, anti-token color.energy.empty)', () => {
    const { container } = render(<EnergyBar filledCount={3} />)
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-filled="false"]')).toHaveLength(0)
  })

  it('renders nothing when filledCount is 0 (0에서 자람, 고정 할당칸 없음)', () => {
    const { container } = render(<EnergyBar filledCount={0} />)
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(0)
  })

  it('marks exactly the cell at justFilledIndex, and none other', () => {
    const { container } = render(<EnergyBar filledCount={4} justFilledIndex={2} />)
    expect(container.querySelectorAll('[data-just-filled="true"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(4)
  })

  it('exposes a single accessible group label reflecting the count, cells themselves stay decorative', () => {
    const { getByRole } = render(<EnergyBar filledCount={5} />)
    expect(getByRole('group', { name: '오늘 5칸' })).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(<EnergyBar filledCount={3} justFilledIndex={2} />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })
})
