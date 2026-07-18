import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store'
import { idbStorage } from '../storage/idb-storage'
import { todayDateString } from '../lib/time'
import type { Task } from '../types/task'
import type { QueuedBlock } from '../types/queued-block'

/**
 * 앱 부팅 1회 — 베타 적합도 감사 CRITICAL 수정(2026-07-18). useSessionRecovery는 활성 타이머
 * 세션 하나만 복구할 뿐, 아직 시작 안 한 tasks/queuedBlocks는 대상이 아니었다(둘 다 Zustand가
 * 재시작되며 빈 배열로 리셋됨) — 그 결과 새로고침 한 번에 쪼갠 조각들이 영구히 사라지고
 * DashboardPage가 AddTaskPrompt(zero)로 조용히 대체해 데이터 손실이 티가 안 났다. 오늘 날짜
 * 기준으로 두 스토어를 findByDate로 하이드레이션한다(task-slice/idb-storage가 이미 쓰는 날짜
 * 인덱스 패턴 미러).
 */
export function useTaskQueueRecovery(): boolean {
  const ranRef = useRef(false)
  const [isHydrating, setIsHydrating] = useState(true)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    void hydrateTaskQueue().finally(() => setIsHydrating(false))
  }, [])

  return isHydrating
}

async function hydrateTaskQueue(): Promise<void> {
  const today = todayDateString()
  const [tasks, queuedBlocks] = await Promise.all([
    idbStorage.findByDate<Task>('tasks', today),
    idbStorage.findByDate<QueuedBlock>('queuedBlocks', today),
  ])
  useAppStore.setState({ tasks, queuedBlocks })
}
