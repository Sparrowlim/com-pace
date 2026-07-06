import { create } from 'zustand'
import { createTaskSlice, type TaskSlice } from './slices/task-slice'
import { createTimerSlice, type TimerSlice } from './slices/timer-slice'
import { createEnergySlice, type EnergySlice } from './slices/energy-slice'
import { createPredictionSlice, type PredictionSlice } from './slices/prediction-slice'
import { createSessionSlice, type SessionSlice } from './slices/session-slice'

export type AppState = TaskSlice & TimerSlice & EnergySlice & PredictionSlice & SessionSlice

export const useAppStore = create<AppState>()((...a) => ({
  ...createTaskSlice(...a),
  ...createTimerSlice(...a),
  ...createEnergySlice(...a),
  ...createPredictionSlice(...a),
  ...createSessionSlice(...a),
}))
