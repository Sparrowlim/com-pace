import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useSessionRecovery } from '../hooks/useSessionRecovery'

export default function AppShell() {
  const isRecovering = useSessionRecovery()
  // 복구할 세션이 있는 드문 경우에만 잠깐 렌더를 미룬다(활성 블록이 없는 보통의 부팅 경로는
  // isRecovering이 처음부터 false라 지연이 없다) — 그렇지 않으면 URL이 /focus였던 새로고침이
  // "활성 블록 없음 → 대시보드" 가드를 먼저 커밋한 뒤 복구가 다시 되돌리는 깜빡임이 생긴다.
  if (isRecovering) return null

  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  )
}
