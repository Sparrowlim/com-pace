import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { runAxe } from '../../test/axe'
import { BottomSheet } from './BottomSheet'

const css = readFileSync('src/components/BottomSheet/BottomSheet.module.css', 'utf-8')

describe('BottomSheet', () => {
  it('renders children when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(screen.getByText('그만하기')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={() => {}} label="딴생각 포착">
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('has no axe violations when open', async () => {
    const { container } = render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <button type="button">그만하기</button>
      </BottomSheet>,
    )
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('uses elevation.sheet (DESIGN-TOKENS §2-8, the dedicated sheet shadow token)', () => {
    expect(css).toMatch(/box-shadow:\s*var\(--elevation-sheet\)/)
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <BottomSheet isOpen={true} onClose={onClose} label="딴생각 포착">
        <button type="button">그만하기</button>
      </BottomSheet>,
    )

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the sheet on open', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <button type="button">재개</button>
      </BottomSheet>,
    )

    expect(screen.getByRole('button', { name: '재개' })).toHaveFocus()
  })

  it('traps Tab focus within the sheet', async () => {
    const user = userEvent.setup()
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <button type="button">재개</button>
        <button type="button">그만하기</button>
      </BottomSheet>,
    )

    const first = screen.getByRole('button', { name: '재개' })
    const last = screen.getByRole('button', { name: '그만하기' })
    expect(first).toHaveFocus()

    await user.tab()
    expect(last).toHaveFocus()

    await user.tab()
    expect(first).toHaveFocus()
  })

  it('renders as an accessible dialog', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('uses duration.fast + easing.quiet for the entrance transition', () => {
    expect(css).toMatch(
      /transition:\s*\n?\s*transform var\(--duration-fast\) var\(--easing-quiet\)/,
    )
  })

  it('collapses the entrance transition to 0s under reduced motion', () => {
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{\s*\.sheet\s*\{\s*transition-duration:\s*0s;/,
    )
  })
})
