import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { runAxe } from '../../test/axe'
import { TimerDisplay } from './TimerDisplay'

const css = readFileSync('src/components/TimerDisplay/TimerDisplay.module.css', 'utf-8')

describe('TimerDisplay', () => {
  it('renders the verb label and the remaining time for the running variant', () => {
    render(<TimerDisplay label="책상 치우기" remainingLabel="14:32" variant="running" />)
    expect(screen.getByText('책상 치우기')).toBeInTheDocument()
    expect(screen.getByText('14:32')).toBeInTheDocument()
  })

  it('renders the paused variant with the same markup shape', () => {
    render(<TimerDisplay label="책상 치우기" remainingLabel="10:00" variant="paused" />)
    expect(screen.getByText('10:00')).toBeInTheDocument()
  })

  it('renders the discharge variant — copy differs by prop, not by internal branching', () => {
    render(<TimerDisplay label="가볍게 시작하기" remainingLabel="15:00" variant="discharge" />)
    expect(screen.getByText('가볍게 시작하기')).toBeInTheDocument()
  })

  it('has no axe violations across all three variants', async () => {
    const { container, rerender } = render(
      <TimerDisplay label="책상 치우기" remainingLabel="14:32" variant="running" />,
    )
    expect((await runAxe(container)).violations).toHaveLength(0)

    rerender(<TimerDisplay label="책상 치우기" remainingLabel="10:00" variant="paused" />)
    expect((await runAxe(container)).violations).toHaveLength(0)

    rerender(<TimerDisplay label="가볍게 시작하기" remainingLabel="15:00" variant="discharge" />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('never renders progress/percent/ring DOM (CLAUDE §1·§6 — 시계-감시 루프 금지, 1-2 기각한 대안)', () => {
    const { container } = render(
      <TimerDisplay label="책상 치우기" remainingLabel="14:32" variant="running" />,
    )
    expect(container.querySelector('svg')).not.toBeInTheDocument()
    expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/%/)
  })

  it('does not accept progress/percent/ring props (PH-04.4 1-2 — decision fixed at the type level)', () => {
    type TimerDisplayProps = Parameters<typeof TimerDisplay>[0]
    type HasForbiddenProp = 'progress' extends keyof TimerDisplayProps
      ? true
      : 'percent' extends keyof TimerDisplayProps
        ? true
        : false
    const forbidden: HasForbiddenProp = false
    expect(forbidden).toBe(false)
  })

  it('keeps size and font identical across variants — only color may change (PH-04.4 1-2 DO NOT CHANGE)', () => {
    expect(css).toMatch(/\.value\s*\{[^}]*font-size:\s*var\(--font-size-timer\)/)
    const variantBlocks = css.match(/\[data-variant='[^']+'\][^{]*\{[^}]*\}/g) ?? []
    for (const block of variantBlocks) {
      expect(block).not.toMatch(/font-size/)
    }
  })
})
