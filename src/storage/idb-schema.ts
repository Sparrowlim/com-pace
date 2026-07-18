import type { DBSchema } from 'idb'
import type { Task } from '../types/task'
import type { Block } from '../types/block'
import type { Prediction } from '../types/prediction'
import type { EnergyCell } from '../types/energy-cell'
import type { Session } from '../types/session'
import type { QueuedBlock } from '../types/queued-block'

export const DB_NAME = 'com-pace'
export const DB_VERSION = 3

export interface ComPaceDB extends DBSchema {
  tasks: {
    key: string
    value: Task
    indexes: { date: string }
  }
  blocks: {
    key: string
    value: Block
    indexes: { taskId: string; date: string }
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
  queuedBlocks: {
    key: string
    value: QueuedBlock
    indexes: { taskId: string; date: string }
  }
}

export type AnyEntity = Task | Block | Prediction | EnergyCell | Session | QueuedBlock
