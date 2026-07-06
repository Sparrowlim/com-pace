import { afterEach, describe, expect, test, vi } from 'vitest'
import { persistStorage } from './persist'

describe('persistStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('resolves false when the Storage API is unavailable', async () => {
    vi.stubGlobal('navigator', {})

    await expect(persistStorage()).resolves.toBe(false)
  })

  test('resolves the browser result when navigator.storage.persist is available', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('navigator', { storage: { persist } })

    await expect(persistStorage()).resolves.toBe(true)
    expect(persist).toHaveBeenCalledOnce()
  })
})
