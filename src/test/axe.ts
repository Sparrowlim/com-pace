import { axe } from 'vitest-axe'

/**
 * jsdom has no real canvas/rendering, so axe-core's `color-contrast` rule can't measure
 * anything (throws "HTMLCanvasElement.prototype.getContext not implemented" internally and
 * silently skips instead of asserting) — it would only add noise here. Real contrast is
 * verified via the WCAG relative-luminance figures recorded in DESIGN-TOKENS.md/PH-04, and
 * will be re-checked with `@axe-core/playwright` in a real browser once PH-05 assembles screens.
 */
export function runAxe(container: Element) {
  return axe(container, { rules: { 'color-contrast': { enabled: false } } })
}
