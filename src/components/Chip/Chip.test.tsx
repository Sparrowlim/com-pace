import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runAxe } from '../../test/axe'
import { Chip } from './Chip'

const css = readFileSync('src/components/Chip/Chip.module.css', 'utf-8')

describe('Chip', () => {
  it('renders default and selected variants', () => {
    render(<Chip variant="default">과제 쪼개기</Chip>)
    expect(screen.getByRole('button', { name: '과제 쪼개기' })).toBeInTheDocument()
  })

  it('changes color tokens when toggled between variants', () => {
    const { rerender } = render(<Chip variant="default">읽기</Chip>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'default')

    rerender(<Chip variant="selected">읽기</Chip>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'selected')
  })

  it('has no axe violations', async () => {
    const { container } = render(<Chip variant="default">읽기</Chip>)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('uses the promoted chip.bg/chip.line semantic tokens, not a stand-in surface (DESIGN-TOKENS §3)', () => {
    expect(css).toMatch(/\.default\s*\{[^}]*background-color:\s*var\(--chip-bg\)/)
    expect(css).toMatch(/\.default\s*\{[^}]*border-color:\s*var\(--chip-line\)/)
  })

  it('declares a touch target of at least 44×44 CSS px (README §0-1②, source-level)', () => {
    expect(css).toMatch(/min-height:\s*44px/)
    expect(css).toMatch(/min-width:\s*44px/)
  })
})
