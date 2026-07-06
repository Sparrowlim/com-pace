import type { StateCreator } from 'zustand'
import type { Session } from '../../types/session'
import { idbStorage } from '../../storage/idb-storage'
import { generateId } from '../../lib/id'
import { nowIso } from '../../lib/time'

export interface SessionSlice {
  sessions: Session[]
  loadSessionsForDate: (date: string) => Promise<void>
  startSession: (date: string, dischargeMode: boolean) => Promise<Session>
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set) => ({
  sessions: [],

  loadSessionsForDate: async (date) => {
    const sessions = await idbStorage.findByDate<Session>('sessions', date)
    set({ sessions })
  },

  startSession: async (date, dischargeMode) => {
    const session: Session = {
      id: generateId(),
      date,
      startedTimerAt: nowIso(),
      dischargeMode,
    }
    await idbStorage.create('sessions', session)
    set((state) => ({ sessions: [...state.sessions, session] }))
    return session
  },
})
