import { formatNorthStarSummary } from '../../lib/north-star-selectors'
import type { NorthStar } from '../../types/north-star'
import styles from './NorthStarBadge.module.css'

// SPEC §9 "의무·열망 두 좌표 나란히, 순위 없음(D-19) — 대시보드 두 칩과 정합". 이전엔
// "열망: X · 의무: Y"를 한 줄로 합쳐 데이터 레코드처럼 보였다 — 각자 독립된 칩으로 나란히
// 놓아 "충돌 없이 공존"을 형식 자체로 드러낸다. 어느 쪽도 먼저 오지 않게 등장한 순서(입력
// 순서)만 따르고 크기·색으로 우열을 두지 않는다.
// PH-04.4 1-5 — 정적 텍스트만, onClick prop이 타입에 존재하지 않는다(코드 리뷰가 실수로
// 탭 핸들러를 추가하는 걸 타입 레벨에서 차단 — "관리 대상화" 원천 차단).
type Props = {
  northStar: NorthStar
}

export function NorthStarBadge({ northStar }: Props) {
  const { aspiration, obligation } = northStar
  return (
    <div
      className={styles.northStarBadge}
      role="group"
      aria-label={formatNorthStarSummary(northStar)}
    >
      {aspiration.trim() && <span className={styles.chip}>열망: {aspiration}</span>}
      {obligation.trim() && <span className={styles.chip}>의무: {obligation}</span>}
    </div>
  )
}
