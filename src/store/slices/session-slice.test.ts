import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createSessionSlice, type SessionSlice } from './session-slice'
import { idbStorage } from '../../storage/idb-storage'
import type { Session } from '../../types/session'

function createStore() {
  return create<SessionSlice>()(createSessionSlice)
}

describe('sessionSlice.startSession', () => {
  test('persists the session and appends it to state', async () => {
    const store = createStore()

    const session = await store.getState().startSession('2026-07-06', false)

    expect(store.getState().sessions).toEqual([session])
    expect(session.dischargeMode).toBe(false)
    const persisted = await idbStorage.findById<Session>('sessions', session.id)
    expect(persisted).toEqual(session)
  })
})

describe('sessionSlice.loadSessionsForDate', () => {
  test('hydrates state from storage for the given date, replacing prior state', async () => {
    const store = createStore()
    await store.getState().startSession('2026-01-01', false)

    const sessionA: Session = {
      id: 'session-load-a',
      date: '2099-03-03',
      startedTimerAt: '2099-03-03T09:00:00Z',
      dischargeMode: false,
    }
    const otherDate: Session = {
      id: 'session-load-b',
      date: '2099-03-04',
      startedTimerAt: '2099-03-04T09:00:00Z',
      dischargeMode: true,
    }
    await idbStorage.create('sessions', sessionA)
    await idbStorage.create('sessions', otherDate)

    await store.getState().loadSessionsForDate('2099-03-03')

    expect(store.getState().sessions).toEqual([sessionA])
  })
})
