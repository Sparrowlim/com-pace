import { EnergyCell } from '../EnergyCell'
import styles from './EnergyBar.module.css'

type Props = {
  /** 0에서 자람 — 미리 그린 빈 칸을 렌더하지 않는다(SPEC §8, anti-token: color.energy.empty) */
  filledCount: number
  /** 방금 채워진 칸의 인덱스(순간 강조). 타이밍은 호출자(PH-05 타이머) 책임 — 여기선 정적 표시만. */
  justFilledIndex?: number
}

export function EnergyBar({ filledCount, justFilledIndex }: Props) {
  // 칸은 항상 끝에 추가되고 재정렬·삭제되지 않는다(append-only) — 인덱스 key가 안전하다.
  const cells = Array.from({ length: filledCount }, (_, index) => (
    <EnergyCell key={index} filled justFilled={index === justFilledIndex} />
  ))

  return (
    <div className={styles.bar} role="group" aria-label={`오늘 ${filledCount}칸`}>
      {cells}
    </div>
  )
}
