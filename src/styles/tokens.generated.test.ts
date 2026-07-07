/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/tokens.generated.css', 'utf-8')

function extractBlock(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  return match?.[1] ?? ''
}

describe('tokens.generated.css guardrails', () => {
  it('does not redefine --action or --evidence-fill inside [data-mode="focus"] (DESIGN-TOKENS §4-1)', () => {
    const block = extractBlock('\\[data-mode="focus"\\]')
    expect(block).not.toMatch(/--action:/)
    expect(block).not.toMatch(/--evidence-fill:/)
  })

  it('does not redefine --action or --evidence-fill inside [data-mode="discharge"] (DESIGN-TOKENS §4-2)', () => {
    const block = extractBlock('\\[data-mode="discharge"\\]')
    expect(block).not.toMatch(/--action:/)
    expect(block).not.toMatch(/--evidence-fill:/)
  })

  it('never exposes raw color.* primitive variables (semantic-only consumption, DESIGN-TOKENS §1)', () => {
    expect(css).not.toMatch(/--color-/)
  })

  it('defines no punitive-color tokens (danger/error/warning/fail — DESIGN-TOKENS §6 anti-token)', () => {
    expect(css).not.toMatch(/--(danger|error|warning|fail)/)
  })

  it('declares --evidence-fill exactly once (single-fill guarantee, DESIGN-TOKENS §5-1)', () => {
    const occurrences = css.match(/--evidence-fill:/g) ?? []
    expect(occurrences).toHaveLength(1)
  })
})
