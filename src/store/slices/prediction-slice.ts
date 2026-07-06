import type { StateCreator } from 'zustand'
import type { Prediction } from '../../types/prediction'
import { idbStorage } from '../../storage/idb-storage'

export interface PredictionSlice {
  predictions: Prediction[]
  setPrediction: (blockId: string, guess: boolean) => Promise<Prediction>
  resolvePrediction: (blockId: string, actual: boolean) => Promise<Prediction>
}

export const createPredictionSlice: StateCreator<PredictionSlice, [], [], PredictionSlice> = (
  set,
) => ({
  predictions: [],

  setPrediction: async (blockId, guess) => {
    const prediction: Prediction = { blockId, guess, actual: null }
    await idbStorage.create('predictions', prediction)
    set((state) => ({ predictions: [...state.predictions, prediction] }))
    return prediction
  },

  resolvePrediction: async (blockId, actual) => {
    const updated = await idbStorage.update<Prediction>('predictions', blockId, { actual })
    set((state) => ({
      predictions: state.predictions.map((prediction) =>
        prediction.blockId === blockId ? updated : prediction,
      ),
    }))
    return updated
  },
})
