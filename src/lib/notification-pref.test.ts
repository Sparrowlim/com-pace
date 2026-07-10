import { beforeEach, describe, expect, test } from 'vitest'
import { isNotificationOptIn, setNotificationOptIn } from './notification-pref'

beforeEach(() => {
  localStorage.clear()
})

describe('notification-pref', () => {
  test('defaults to false when nothing has been set', () => {
    expect(isNotificationOptIn()).toBe(false)
  })

  test('reports true after opting in', () => {
    setNotificationOptIn(true)

    expect(isNotificationOptIn()).toBe(true)
  })

  test('reports false after opting back out', () => {
    setNotificationOptIn(true)
    setNotificationOptIn(false)

    expect(isNotificationOptIn()).toBe(false)
  })

  test('is idempotent across repeated calls', () => {
    setNotificationOptIn(true)
    setNotificationOptIn(true)

    expect(isNotificationOptIn()).toBe(true)
  })
})
