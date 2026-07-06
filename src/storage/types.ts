export type StoreName = 'tasks' | 'blocks' | 'predictions' | 'energyCells' | 'sessions'

export interface Storage {
  create<T>(store: StoreName, entity: T): Promise<T>
  update<T>(store: StoreName, id: string, patch: Partial<T>): Promise<T>
  findByDate<T>(store: StoreName, date: string): Promise<T[]>
  findById<T>(store: StoreName, id: string): Promise<T | null>
}
