import type { DBSchema } from 'idb'
import type { Task } from '../types/task'
import type { Block } from '../types/block'
import type { Prediction } from '../types/prediction'
import type { EnergyCell } from '../types/energy-cell'
import type { Session } from '../types/session'

export const DB_NAME = 'com-pace'
export const DB_VERSION = 1

export interface ComPaceDB extends DBSchema {
  tasks: {
    key: string
    value: Task
  }
  blocks: {
    key: string
    value: Block
    indexes: { taskId: string }
  }
  predictions: {
    key: string
    value: Prediction
  }
  energyCells: {
    key: string
    value: EnergyCell
    indexes: { date: string }
  }
  sessions: {
    key: string
    value: Session
    indexes: { date: string }
  }
}

export type AnyEntity = Task | Block | Prediction | EnergyCell | Session
