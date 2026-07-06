import type { StateCreator } from 'zustand'
import type { EnergyCell } from '../../types/energy-cell'
import { idbStorage } from '../../storage/idb-storage'
import { generateId } from '../../lib/id'
import { nowIso } from '../../lib/time'

export interface EnergySlice {
  energyCells: EnergyCell[]
  loadEnergyCellsForDate: (date: string) => Promise<void>
  lightEnergyCell: (blockId: string, date: string) => Promise<EnergyCell>
}

export const createEnergySlice: StateCreator<EnergySlice, [], [], EnergySlice> = (set) => ({
  energyCells: [],

  loadEnergyCellsForDate: async (date) => {
    const energyCells = await idbStorage.findByDate<EnergyCell>('energyCells', date)
    set({ energyCells })
  },

  lightEnergyCell: async (blockId, date) => {
    const cell: EnergyCell = {
      id: generateId(),
      date,
      blockId,
      litAt: nowIso(),
    }
    await idbStorage.create('energyCells', cell)
    set((state) => ({ energyCells: [...state.energyCells, cell] }))
    return cell
  },
})
