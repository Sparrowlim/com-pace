import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAppStore } from '../store'
import { resolveNextRoute } from '../lib/core-loop-selectors'
import { ROUTES } from '../routes/paths'
import styles from './RestPage.module.css'

// PH-05.2 D2 — 진입 가드 없음. 도달 시점(방금 블록 종료 직후)엔 activeBlock이 이미 없고,
// "다음 블록"은 RetroPage와 동일한 resolveNextRoute로 자연히 대시보드로 향하므로 직접 URL
// 진입도 안전하다.
export default function RestPage() {
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const navigate = useNavigate()

  const handleNext = () => navigate(resolveNextRoute(tasks, queuedBlocks))

  return (
    <div className={styles.page}>
      <p className={styles.copy}>여기서 잠깐 숨 돌리고 가도 좋아요.</p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={handleNext}>
          다음 블록
        </Button>
        <Button variant="secondary" onClick={() => navigate(ROUTES.dashboard)}>
          오늘은 그만
        </Button>
      </div>
    </div>
  )
}
