import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { runAxe } from '../../test/axe'
import { OptionRow } from './OptionRow'

const css = readFileSync('src/components/OptionRow/OptionRow.module.css', 'utf-8')

describe('OptionRow', () => {
  it('renders the label and reflects selection via aria-pressed', () => {
    render(<OptionRow label="의무" selected={false} />)
    expect(screen.getByRole('button', { name: '의무' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<OptionRow label="열망" selected={false} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: '열망' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('has no axe violations for either selection state', async () => {
    const { container, rerender } = render(<OptionRow label="의무" selected={false} />)
    expect((await runAxe(container)).violations).toHaveLength(0)

    rerender(<OptionRow label="의무" selected={true} />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('declares a touch target of at least 44×44 CSS px (README §0-1②, source-level)', () => {
    expect(css).toMatch(/min-height:\s*44px/)
  })
})
