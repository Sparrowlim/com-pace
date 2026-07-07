import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runAxe } from '../../test/axe'
import { TaskCard } from './TaskCard'

const tsx = readFileSync('src/components/TaskCard/TaskCard.tsx', 'utf-8')
const css = readFileSync('src/components/TaskCard/TaskCard.module.css', 'utf-8')

describe('TaskCard', () => {
  it('renders the title and body content', () => {
    render(<TaskCard title="15분, 책상 정리">{'딱 한 서랍만'}</TaskCard>)
    expect(screen.getByRole('heading', { name: '15분, 책상 정리' })).toBeInTheDocument()
    expect(screen.getByText('딱 한 서랍만')).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(<TaskCard title="15분, 책상 정리" />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('uses elevation.card and radius.2xl (DESIGN-TOKENS §2-8)', () => {
    expect(css).toMatch(/box-shadow:\s*var\(--elevation-card\)/)
    expect(css).toMatch(/border-radius:\s*var\(--radius-2xl\)/)
  })

  it('is mode-agnostic — no discharge/mode branching of its own (DESIGN-TOKENS §4-2: overlay is ambient via [data-mode], not a component prop)', () => {
    expect(tsx).not.toMatch(/discharge/i)
    expect(tsx).not.toMatch(/variant/i)
    expect(css).not.toMatch(/\[data-mode="[^"]+"\]\s*\{/)
  })
})
