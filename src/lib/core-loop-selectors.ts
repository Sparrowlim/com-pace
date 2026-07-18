import type { Task } from '../types/task'
import type { QueuedBlock } from '../types/queued-block'
import { ROUTES } from '../routes/paths'

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

// PH-05.2 — RetroPage("바로 다음 블록")·RestPage("다음 블록")가 공유하는 다음 블록 분기(SCREEN-FLOW
// §3-4 NEXT). 남은 블록이 있으면 예측 경유, 없으면 과제 소진 → 대시보드(zero).
export function resolveNextRoute(tasks: Task[], queuedBlocks: QueuedBlock[]): string {
  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined
  return next ? ROUTES.predict : ROUTES.dashboard
}
