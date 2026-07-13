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

  it('renders a visible caption stating the count when filledCount > 0 (디자인 QA 발견사항 — 라벨 없는 고립된 사각형 방지)', () => {
    const { getByText } = render(<EnergyBar filledCount={3} />)
    expect(getByText('오늘 3칸')).toBeVisible()
  })

  it('renders no caption when filledCount is 0 (침묵 규칙 — 부재는 무표시)', () => {
    const { queryByText } = render(<EnergyBar filledCount={0} />)
    expect(queryByText(/오늘 0칸/)).not.toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(<EnergyBar filledCount={3} justFilledIndex={2} />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })
})
