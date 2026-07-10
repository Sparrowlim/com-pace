import { create } from 'zustand'
import { createTaskSlice, type TaskSlice } from './slices/task-slice'
import { createTimerSlice, type TimerSlice } from './slices/timer-slice'
import { createEnergySlice, type EnergySlice } from './slices/energy-slice'
import { createPredictionSlice, type PredictionSlice } from './slices/prediction-slice'
import { createSessionSlice, type SessionSlice } from './slices/session-slice'
import { createBlockQueueSlice, type BlockQueueSlice } from './slices/block-queue-slice'
import { createRetroContextSlice, type RetroContextSlice } from './slices/retro-context-slice'
import { createDischargeSlice, type DischargeSlice } from './slices/discharge-slice'

export type AppState = TaskSlice &
  TimerSlice &
  EnergySlice &
  PredictionSlice &
  SessionSlice &
  BlockQueueSlice &
  RetroContextSlice &
  DischargeSlice

export const useAppStore = create<AppState>()((...a) => ({
  ...createTaskSlice(...a),
  ...createTimerSlice(...a),
  ...createEnergySlice(...a),
  ...createPredictionSlice(...a),
  ...createSessionSlice(...a),
  ...createBlockQueueSlice(...a),
  ...createRetroContextSlice(...a),
  ...createDischargeSlice(...a),
}))
