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

// PH-05.1 — "만만한 1개 자기선택"(SPEC §3, D-05)의 선택지 목록. 쪼갠 순서 그대로 반환하며
// 재정렬하지 않는다(우선순위 판단 재도입 금지, D-05 근거).
export function selectQueuedBlocksForTask(
  queuedBlocks: QueuedBlock[],
  taskId: string,
): QueuedBlock[] {
  return queuedBlocks.filter((block) => block.taskId === taskId)
}
