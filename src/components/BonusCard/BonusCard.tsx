import styles from './BonusCard.module.css'

// SCREEN-FLOW §3-2 · PH-04.4 1-4 — 적중일 때만 렌더, 빗나감은 이 카드 자체가 없다(hit=false →
// null, 빈 카드·회색 placeholder 없음. 관객 없는 공간이라는 신호 자체를 남기지 않는다).
type Props = {
  hit: boolean
}

export function BonusCard({ hit }: Props) {
  if (!hit) return null
  return (
    <div className={styles.bonusCard}>
      <p className={styles.bonusText}>예측이 딱 맞았어요.</p>
    </div>
  )
}
