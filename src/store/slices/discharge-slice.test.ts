import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createDischargeSlice, type DischargeSlice } from './discharge-slice'

function createStore() {
  return create<DischargeSlice>()(createDischargeSlice)
}

describe('dischargeSlice', () => {
  test('starts with dischargeMode off and no end message', () => {
    const store = createStore()

    expect(store.getState().dischargeMode).toBe(false)
    expect(store.getState().dischargeEndMessage).toBeNull()
  })

  test('enterDischarge turns dischargeMode on', () => {
    const store = createStore()

    store.getState().enterDischarge()

    expect(store.getState().dischargeMode).toBe(true)
  })

  test('exitDischarge turns dischargeMode back off', () => {
    const store = createStore()
    store.getState().enterDischarge()

    store.getState().exitDischarge()

    expect(store.getState().dischargeMode).toBe(false)
  })

  test('setDischargeEndMessage stores and clears the one-line ending copy', () => {
    const store = createStore()

    store.getState().setDischargeEndMessage('오늘 15분, 켠 것만으로 충분해요')
    expect(store.getState().dischargeEndMessage).toBe('오늘 15분, 켠 것만으로 충분해요')

    store.getState().setDischargeEndMessage(null)
    expect(store.getState().dischargeEndMessage).toBeNull()
  })
})
