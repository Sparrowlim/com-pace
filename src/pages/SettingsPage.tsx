import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { OptionRow } from '../components/OptionRow'
import { NorthStarBadge } from '../components/NorthStarBadge'
import { getNorthStar } from '../lib/north-star-storage'
import { hasNorthStar } from '../lib/north-star-selectors'
import { isNotificationOptIn, setNotificationOptIn } from '../lib/notification-pref'
import type { NorthStar } from '../types/north-star'
import { ROUTES } from '../routes/paths'
import styles from './SettingsPage.module.css'

function NorthStarSummary({ northStar }: { northStar: NorthStar }) {
  if (!hasNorthStar(northStar)) {
    return <p className={styles.summary}>아직 없어요 — 원할 때 하나 남겨봐도 좋아요</p>
  }
  return <NorthStarBadge northStar={northStar} />
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const northStar = getNorthStar()
  const [notificationOptIn, setLocalNotificationOptIn] = useState(isNotificationOptIn())

  const handleSelectNotification = (value: boolean) => {
    setNotificationOptIn(value)
    setLocalNotificationOptIn(value)
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <h2 className={styles.heading}>양가 목표</h2>
        <NorthStarSummary northStar={northStar} />
        {/* DESIGN-TOKENS §5-3 — 테라코타 CTA는 즉시성의 순간 전용. 북극성 수정은 타이머 시작과
            같은 무게가 아니므로 보조 버튼으로(가벼운 좌표, CLAUDE §5). */}
        <Button variant="secondary" onClick={() => navigate(ROUTES.northStar)}>
          양가 목표 수정
        </Button>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>알림</h2>
        <div className={styles.notificationOptions}>
          <OptionRow
            label="꺼둘게요"
            selected={!notificationOptIn}
            onSelect={() => handleSelectNotification(false)}
          />
          <OptionRow
            label="켜볼게요"
            selected={notificationOptIn}
            onSelect={() => handleSelectNotification(true)}
          />
        </div>
        <p className={styles.notificationGuard}>켜도 재촉하거나 확인하러 오라고 하지 않아요</p>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => navigate(ROUTES.dashboard)}>
          뒤로
        </Button>
      </div>
    </div>
  )
}
