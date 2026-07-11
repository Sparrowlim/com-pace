import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runAxe } from '../../test/axe'
import { BonusCard } from './BonusCard'

describe('BonusCard', () => {
  it('renders nothing when the prediction missed (PH-04.4 1-4 — no grey card, no placeholder)', () => {
    const { container } = render(<BonusCard hit={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the celebration text when the prediction hit', () => {
    render(<BonusCard hit={true} />)
    expect(screen.getByText('예측이 딱 맞았어요.')).toBeInTheDocument()
  })

  it('has no axe violations when rendered', async () => {
    const { container } = render(<BonusCard hit={true} />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })
})
