import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createEnergySlice, type EnergySlice } from './energy-slice'
import { idbStorage } from '../../storage/idb-storage'
import type { EnergyCell } from '../../types/energy-cell'

function createStore() {
  return create<EnergySlice>()(createEnergySlice)
}

describe('energySlice.lightEnergyCell', () => {
  test('persists a cell and appends it to state', async () => {
    const store = createStore()

    const cell = await store.getState().lightEnergyCell('block-1', '2026-07-06')

    expect(store.getState().energyCells).toEqual([cell])
    const persisted = await idbStorage.findById<EnergyCell>('energyCells', cell.id)
    expect(persisted).toEqual(cell)
  })
})

describe('energySlice.loadEnergyCellsForDate', () => {
  test('hydrates state from storage for the given date, replacing prior state', async () => {
    const store = createStore()
    await store.getState().lightEnergyCell('block-stale', '2026-01-01')

    const cellA: EnergyCell = {
      id: 'cell-load-a',
      date: '2099-02-02',
      blockId: 'block-a',
      litAt: '2099-02-02T09:00:00Z',
    }
    const cellB: EnergyCell = {
      id: 'cell-load-b',
      date: '2099-02-02',
      blockId: 'block-b',
      litAt: '2099-02-02T09:10:00Z',
    }
    const otherDate: EnergyCell = {
      id: 'cell-load-c',
      date: '2099-02-03',
      blockId: 'block-c',
      litAt: '2099-02-03T09:00:00Z',
    }
    await idbStorage.create('energyCells', cellA)
    await idbStorage.create('energyCells', cellB)
    await idbStorage.create('energyCells', otherDate)

    await store.getState().loadEnergyCellsForDate('2099-02-02')

    expect(store.getState().energyCells).toEqual(expect.arrayContaining([cellA, cellB]))
    expect(store.getState().energyCells).toHaveLength(2)
  })
})
