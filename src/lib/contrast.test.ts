import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('returns 21:1 for pure black on pure white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('returns 1:1 for identical colors', () => {
    expect(contrastRatio('#e79155', '#e79155')).toBeCloseTo(1, 5)
  })

  it('is symmetric regardless of argument order', () => {
    expect(contrastRatio('#3f382f', '#e79155')).toBeCloseTo(contrastRatio('#e79155', '#3f382f'), 10)
  })

  it('matches the recorded CTA text-on-action ratio (DESIGN-TOKENS §10-3)', () => {
    expect(contrastRatio('#3f382f', '#e79155')).toBeCloseTo(4.72, 1)
  })
})
