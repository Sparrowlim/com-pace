import { formatNorthStarSummary } from '../../lib/north-star-selectors'
import type { NorthStar } from '../../types/north-star'
import styles from './NorthStarBadge.module.css'

// SPEC §9 · PH-04.4 1-5 — 정적 텍스트만, onClick prop이 타입에 존재하지 않는다(코드 리뷰가
// 실수로 탭 핸들러를 추가하는 걸 타입 레벨에서 차단 — "관리 대상화" 원천 차단).
type Props = {
  northStar: NorthStar
}

export function NorthStarBadge({ northStar }: Props) {
  return <p className={styles.northStarBadge}>{formatNorthStarSummary(northStar)}</p>
}
