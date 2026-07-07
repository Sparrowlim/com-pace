import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../../lib/contrast'
import { runAxe } from '../../test/axe'
import { EnergyCell } from './EnergyCell'

const css = readFileSync('src/components/EnergyCell/EnergyCell.module.css', 'utf-8')

describe('EnergyCell', () => {
  it('renders filled and unfilled without axe violations', async () => {
    const { container, rerender } = render(<EnergyCell filled={false} />)
    expect((await runAxe(container)).violations).toHaveLength(0)

    rerender(<EnergyCell filled />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('is decorative (aria-hidden) — meaning lives on EnergyBar, not the cell', () => {
    const { container } = render(<EnergyCell filled />)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  it('has exactly one fill-color declaration, shared by every state (DESIGN-TOKENS §5-1 single-fill guarantee)', () => {
    const fillDeclarations = css.match(/background-color:\s*var\(--evidence-fill\)/g) ?? []
    expect(fillDeclarations).toHaveLength(1)
  })

  it('uses duration.cell + easing.quiet for the light-up transition, replaced by 0s under reduced motion (README §0-1③)', () => {
    expect(css).toMatch(/transition:\s*box-shadow\s+var\(--duration-cell\)\s+var\(--easing-quiet\)/)
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce\)\s*\{\s*\.cell\s*\{\s*transition-duration:\s*0s;/,
    )
  })

  it('records (does not gate on) the known evidence.fill non-text contrast gap — DESIGN-TOKENS §10-4, unresolved pending brand approval', () => {
    // evidence.fill is the product's single most symbolic color (CLAUDE.md §0/§3) — this phase
    // does not retune it unilaterally. This test pins the currently-known ratios so any future
    // accidental change to evidence.fill/surface.* is caught, without blocking Runnable State on
    // an unresolved design decision that isn't ours to make here.
    expect(contrastRatio('#e79b62', '#f6f1e6')).toBeCloseTo(2.01, 1) // vs surface.base — below §0-1② 3:1
    expect(contrastRatio('#e79b62', '#e7decf')).toBeCloseTo(1.7, 1) // vs surface.page — below §0-1② 3:1
  })
})
