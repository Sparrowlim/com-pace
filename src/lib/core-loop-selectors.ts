import type { Task } from '../types/task'
import type { QueuedBlock } from '../store/slices/block-queue-slice'

/**
 * One Task 불변식(CLAUDE §2) 덕분에 "활성 과제"는 항상 최대 1개다 — 별도 currentTaskId를
 * 스토어에 두는 대신, 아직 안 쪼갰거나 쪼갰지만 큐에 조각이 남은 과제를 매번 도출한다.
 */
export function selectActiveTask(tasks: Task[], queuedBlocks: QueuedBlock[]): Task | undefined {
  return tasks.find(
    (task) => !task.splitDone || queuedBlocks.some((block) => block.taskId === task.id),
  )
}

export function selectNextQueuedBlock(
  queuedBlocks: QueuedBlock[],
  taskId: string,
): QueuedBlock | undefined {
  return queuedBlocks.find((block) => block.taskId === taskId)
}
