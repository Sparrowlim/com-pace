import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { setNotificationOptIn } from './notification-pref'
import {
  notifySessionComplete,
  requestNotificationPermission,
  unlockAlarmAudio,
} from './session-alarm'

class FakeGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
  connect = vi.fn()
}

class FakeOscillatorNode {
  type = ''
  frequency = { value: 0 }
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class FakeAudioContext {
  state: 'running' | 'suspended' = 'running'
  currentTime = 0
  destination = {}
  createGain = vi.fn(() => new FakeGainNode())
  createOscillator = vi.fn(() => new FakeOscillatorNode())
  resume = vi.fn(async () => {
    this.state = 'running'
  })
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
}

function setNotificationGlobal(value: unknown) {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    writable: true,
    value,
  })
}

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: FakeAudioContext,
  })
  setVisibility('visible')
})

afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(window, 'AudioContext')
  Reflect.deleteProperty(window, 'Notification')
})

describe('notifySessionComplete — opt-out', () => {
  test('does nothing when the user has not opted in', () => {
    setNotificationOptIn(false)
    const NotificationMock = vi.fn()
    setNotificationGlobal(NotificationMock)

    notifySessionComplete()

    expect(NotificationMock).not.toHaveBeenCalled()
  })
})

describe('notifySessionComplete — tab visible', () => {
  test('plays a chime instead of showing a system notification', () => {
    setNotificationOptIn(true)
    setVisibility('visible')
    const NotificationMock = vi.fn()
    setNotificationGlobal(NotificationMock)
    unlockAlarmAudio()

    notifySessionComplete()

    expect(NotificationMock).not.toHaveBeenCalled()
  })
})

describe('notifySessionComplete — tab hidden', () => {
  test('shows a system notification when permission is granted', () => {
    setNotificationOptIn(true)
    setVisibility('hidden')
    const NotificationMock = vi.fn() as unknown as typeof Notification & { permission: string }
    NotificationMock.permission = 'granted'
    setNotificationGlobal(NotificationMock)

    notifySessionComplete()

    expect(NotificationMock).toHaveBeenCalledTimes(1)
    expect(NotificationMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ silent: false }),
    )
  })

  test('does nothing when permission was never granted', () => {
    setNotificationOptIn(true)
    setVisibility('hidden')
    const NotificationMock = vi.fn() as unknown as typeof Notification & { permission: string }
    NotificationMock.permission = 'default'
    setNotificationGlobal(NotificationMock)

    notifySessionComplete()

    expect(NotificationMock).not.toHaveBeenCalled()
  })

  test('does nothing when the Notification API is unsupported', () => {
    setNotificationOptIn(true)
    setVisibility('hidden')
    Reflect.deleteProperty(window, 'Notification')

    expect(() => notifySessionComplete()).not.toThrow()
  })
})

describe('requestNotificationPermission', () => {
  test('resolves false when the browser has no Notification API', async () => {
    Reflect.deleteProperty(window, 'Notification')

    await expect(requestNotificationPermission()).resolves.toBe(false)
  })

  test('resolves true without prompting when already granted', async () => {
    const requestPermission = vi.fn()
    setNotificationGlobal({ permission: 'granted', requestPermission })

    await expect(requestNotificationPermission()).resolves.toBe(true)
    expect(requestPermission).not.toHaveBeenCalled()
  })

  test('resolves false without prompting when already denied', async () => {
    const requestPermission = vi.fn()
    setNotificationGlobal({ permission: 'denied', requestPermission })

    await expect(requestNotificationPermission()).resolves.toBe(false)
    expect(requestPermission).not.toHaveBeenCalled()
  })

  test('prompts and reflects the result when permission is undecided', async () => {
    const requestPermission = vi.fn(async () => 'granted')
    setNotificationGlobal({ permission: 'default', requestPermission })

    await expect(requestNotificationPermission()).resolves.toBe(true)
    expect(requestPermission).toHaveBeenCalledTimes(1)
  })
})
