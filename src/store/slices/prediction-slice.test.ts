import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createPredictionSlice, type PredictionSlice } from './prediction-slice'
import { idbStorage } from '../../storage/idb-storage'
import type { Prediction } from '../../types/prediction'

function createStore() {
  return create<PredictionSlice>()(createPredictionSlice)
}

describe('predictionSlice.setPrediction', () => {
  test('persists a prediction with actual: null and appends it to state', async () => {
    const store = createStore()

    const prediction = await store.getState().setPrediction('block-1', true)

    expect(prediction).toEqual({ blockId: 'block-1', guess: true, actual: null })
    expect(store.getState().predictions).toEqual([prediction])
    const persisted = await idbStorage.findById<Prediction>('predictions', 'block-1')
    expect(persisted).toEqual(prediction)
  })
})

describe('predictionSlice.resolvePrediction', () => {
  test('sets actual in storage and state without touching other predictions', async () => {
    const store = createStore()
    const first = await store.getState().setPrediction('block-2', true)
    const second = await store.getState().setPrediction('block-3', false)

    const resolved = await store.getState().resolvePrediction('block-3', false)

    expect(resolved).toEqual({ ...second, actual: false })
    expect(store.getState().predictions).toEqual([first, { ...second, actual: false }])
    const persisted = await idbStorage.findById<Prediction>('predictions', 'block-3')
    expect(persisted?.actual).toBe(false)
  })

  test('propagates the storage error for a blockId that was never set', async () => {
    const store = createStore()

    await expect(store.getState().resolvePrediction('block-missing', true)).rejects.toThrow(
      'not found',
    )
  })
})
