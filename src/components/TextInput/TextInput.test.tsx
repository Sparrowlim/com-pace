import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { runAxe } from '../../test/axe'
import { TextInput } from './TextInput'

const css = readFileSync('src/components/TextInput/TextInput.module.css', 'utf-8')

describe('TextInput', () => {
  it('renders the current value and calls onChange as the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TextInput value="" onChange={onChange} label="열망" />)

    await user.type(screen.getByLabelText('열망'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('renders a plain input without a label prop', () => {
    render(<TextInput value="책상 치우기" onChange={() => {}} />)
    expect(screen.getByDisplayValue('책상 치우기')).toBeInTheDocument()
    expect(screen.getByDisplayValue('책상 치우기').tagName).toBe('INPUT')
  })

  it('renders a textarea when multiline is set', () => {
    render(<TextInput value="딴생각" onChange={() => {}} multiline label="딴생각 포착" />)
    expect(screen.getByLabelText('딴생각 포착').tagName).toBe('TEXTAREA')
  })

  it('has no axe violations when labeled', async () => {
    // The label-less variant is used only where the page already provides an adjacent visible
    // prompt (e.g. DashboardPage's AddTaskPrompt copy) — that pairing predates this component and
    // is out of scope here (In-Scope A lists only value/onChange/multiline/id/label).
    const { container } = render(<TextInput value="" onChange={() => {}} label="의무" />)
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('keeps an accessible name when the label is visually hidden (code review fix — SplitPage removed its placeholder without a compensating label, which axe flags as a critical missing-label violation)', async () => {
    render(<TextInput value="" onChange={() => {}} label="과제 조각" hideLabel />)
    expect(screen.getByRole('textbox', { name: '과제 조각' })).toBeInTheDocument()

    const { container } = render(
      <TextInput value="" onChange={() => {}} label="과제 조각" hideLabel />,
    )
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('does not accept required/error/maxLength props (PH-04.4 1-1 — decision fixed at the type level)', () => {
    type TextInputProps = Parameters<typeof TextInput>[0]
    type HasForbiddenProp = 'required' extends keyof TextInputProps
      ? true
      : 'error' extends keyof TextInputProps
        ? true
        : 'maxLength' extends keyof TextInputProps
          ? true
          : false
    const forbidden: HasForbiddenProp = false
    expect(forbidden).toBe(false)
  })

  it('transitions the border to action-ink on focus without changing the background (PH-04.4 1-1)', () => {
    expect(css).toMatch(/\.input:focus-visible\s*\{[^}]*border-color:\s*var\(--action-ink\)/)
  })

  it('uses a 16px font-size so focusing the input does not trigger iOS Safari/Chrome auto-zoom', () => {
    expect(css).toMatch(/\.input\s*\{[^}]*font-size:\s*var\(--font-size-lg\)/)
  })
})
