import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useSessionRecovery } from '../hooks/useSessionRecovery'
import { unlockAlarmAudio } from '../lib/session-alarm'

// 완료 차임(session-alarm.ts)은 15분 뒤 setInterval tick 안에서 재생되는데, 그 시점은 사용자
// 제스처가 아니라 브라우저 자동재생 정책에 막힐 수 있다. 앱을 쓰는 동안의 첫 탭/클릭에서
// AudioContext를 미리 unlock해두면 그 시점엔 이미 준비돼 있다 — 1회만 필요해 리스너는 스스로
// 해제한다.
function useUnlockAlarmAudioOnFirstInteraction() {
  useEffect(() => {
    const unlock = () => {
      unlockAlarmAudio()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])
}

export default function AppShell() {
  const isRecovering = useSessionRecovery()
  useUnlockAlarmAudioOnFirstInteraction()
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
