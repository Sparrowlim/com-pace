import { beforeEach, describe, expect, test } from 'vitest'
import { isOnboardingComplete, markOnboardingComplete } from './onboarding-status'

beforeEach(() => {
  localStorage.clear()
})

describe('onboarding-status', () => {
  test('defaults to incomplete when no flag has been set', () => {
    expect(isOnboardingComplete()).toBe(false)
  })

  test('reports complete after marking it', () => {
    markOnboardingComplete()

    expect(isOnboardingComplete()).toBe(true)
  })

  test('is idempotent across repeated calls', () => {
    markOnboardingComplete()
    markOnboardingComplete()

    expect(isOnboardingComplete()).toBe(true)
  })
})
