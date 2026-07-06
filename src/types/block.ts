export type BlockStatus = 'in_progress' | 'paused' | 'done' | 'incomplete'

export interface Block {
  id: string
  taskId: string
  verbLabel: string
  status: BlockStatus
  startedAt: string
  endedAt: string | null
}
