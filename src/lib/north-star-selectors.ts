import type { NorthStar } from '../types/north-star'

// SPEC §9 — 빈 문자열과 "아직 모르겠어요"는 표시상 동일하게 수렴한다(설계 결정 2). 둘 다
// trim 후 비어 있을 때만 북극성 없음으로 취급한다.
export function hasNorthStar(northStar: NorthStar): boolean {
  return northStar.aspiration.trim() !== '' || northStar.obligation.trim() !== ''
}

// 대시보드 배지·설정 요약이 공유하는 표시 문구 — 두 곳이 각자 조립하면 카피 포맷이 갈라질
// 수 있어 한 곳에만 둔다.
export function formatNorthStarSummary({ aspiration, obligation }: NorthStar): string {
  return [aspiration && `열망: ${aspiration}`, obligation && `의무: ${obligation}`]
    .filter(Boolean)
    .join(' · ')
}
