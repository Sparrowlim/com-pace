import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useFocusTimer, formatRemaining } from '../hooks/useFocusTimer'
import { ROUTES } from '../routes/paths'
import styles from './FocusPage.module.css'

export default function FocusPage() {
  const navigate = useNavigate()
  const { activeBlock, elapsedSeconds, finish, isFinishing } = useFocusTimer(() =>
    navigate(ROUTES.retro),
  )

  if (!activeBlock && !isFinishing) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  if (!activeBlock) {
    // complete()/markIncomplete() already cleared activeBlock but finish() hasn't navigated to
    // /retro yet (still awaiting resolvePrediction/lightEnergyCell) — render nothing rather than
    // redirect to the dashboard for that instant, or crash on activeBlock.verbLabel below.
    return null
  }

  return (
    <div className={styles.page} data-mode="focus">
      <p className={styles.label}>{activeBlock.verbLabel}</p>
      <p className={styles.timer}>{formatRemaining(elapsedSeconds)}</p>
      <Button variant="secondary" onClick={() => finish(false)}>
        오늘은 여기까지
      </Button>
    </div>
  )
}
