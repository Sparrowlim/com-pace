export type BlockStatus = 'in_progress' | 'paused' | 'done' | 'incomplete'

export interface Block {
  id: string
  taskId: string
  verbLabel: string
  status: BlockStatus
  date: string
  startedAt: string
  endedAt: string | null
}
