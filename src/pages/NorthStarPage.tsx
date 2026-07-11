import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { TextInput } from '../components/TextInput'
import { getNorthStar, saveNorthStar } from '../lib/north-star-storage'
import { ROUTES } from '../routes/paths'
import styles from './NorthStarPage.module.css'

// SPEC §9 — 정적 방향 좌표 + 재접속(재촉 아니라 재접속). 빈 북극성은 유도(압박)가 아니라
// 허용(초대) 톤으로만 — "모르겠어요" 전용 상태 없이 그냥 비워두고 건너뛰면 된다(설계 결정 2).
export default function NorthStarPage() {
  const navigate = useNavigate()
  const initial = getNorthStar()
  const [aspiration, setAspiration] = useState(initial.aspiration)
  const [obligation, setObligation] = useState(initial.obligation)

  const handleSave = () => {
    saveNorthStar({ aspiration, obligation })
    navigate(ROUTES.dashboard)
  }

  const handleSkip = () => {
    navigate(ROUTES.dashboard)
  }

  return (
    <div className={styles.page}>
      <p className={styles.copy}>
        원한다면 방향을 하나 남겨봐도 좋아요. 둘 다 몰라도, 하나만 있어도 괜찮아요.
      </p>
      <div className={styles.fields}>
        <TextInput value={aspiration} onChange={setAspiration} label="열망 — 원하는 방향" />
        <TextInput value={obligation} onChange={setObligation} label="의무 — 해내야 하는 방향" />
      </div>
      <div className={styles.actions}>
        <Button variant="primary" onClick={handleSave}>
          남길게요
        </Button>
        <Button variant="secondary" onClick={handleSkip}>
          건너뛸게요
        </Button>
      </div>
    </div>
  )
}
