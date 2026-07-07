import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runAxe } from '../../test/axe'
import { BottomSheet } from './BottomSheet'

const css = readFileSync('src/components/BottomSheet/BottomSheet.module.css', 'utf-8')

describe('BottomSheet', () => {
  it('renders children when open', () => {
    render(
      <BottomSheet isOpen={true}>
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(screen.getByText('그만하기')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <BottomSheet isOpen={false}>
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('has no axe violations when open', async () => {
    const { container } = render(
      <BottomSheet isOpen={true}>
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('uses elevation.sheet (DESIGN-TOKENS §2-8, the dedicated sheet shadow token)', () => {
    expect(css).toMatch(/box-shadow:\s*var\(--elevation-sheet\)/)
  })
})
