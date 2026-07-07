import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runAxe } from '../../test/axe'
import { Button } from './Button'

const css = readFileSync('src/components/Button/Button.module.css', 'utf-8')

describe('Button', () => {
  it('renders the primary variant', () => {
    render(<Button variant="primary">시작하기</Button>)
    expect(screen.getByRole('button', { name: '시작하기' })).toBeInTheDocument()
  })

  it('renders the secondary variant', () => {
    render(<Button variant="secondary">나중에</Button>)
    expect(screen.getByRole('button', { name: '나중에' })).toBeInTheDocument()
  })

  it('has no axe violations for either variant', async () => {
    // vitest-axe@0.1.0's toHaveNoViolations() targets the pre-v3 `Vi` namespace and doesn't
    // type-check against vitest@4 — assert on the raw AxeResults instead (same runtime check).
    const { container, rerender } = render(<Button variant="primary">시작하기</Button>)
    expect((await runAxe(container)).violations).toHaveLength(0)

    rerender(<Button variant="secondary">나중에</Button>)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('declares a touch target of at least 44×44 CSS px (README §0-1②, source-level — real layout is Playwright/PH-05 scope)', () => {
    expect(css).toMatch(/min-height:\s*44px/)
    expect(css).toMatch(/min-width:\s*44px/)
  })

  it('keeps the terracotta action background to the primary variant only (DESIGN-TOKENS §5-3)', () => {
    expect(css).toMatch(/\.primary\s*\{[^}]*background-color:\s*var\(--action\)/)
    expect(css).not.toMatch(/\.secondary\s*\{[^}]*background-color:\s*var\(--action\)/)
  })
})
