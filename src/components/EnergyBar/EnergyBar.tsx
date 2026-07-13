import { useId } from 'react'
import { EnergyCell } from '../EnergyCell'
import styles from './EnergyBar.module.css'

type Props = {
  /** 0에서 자람 — 미리 그린 빈 칸을 렌더하지 않는다(SPEC §8, anti-token: color.energy.empty) */
  filledCount: number
  /** 방금 채워진 칸의 인덱스(순간 강조). 타이밍은 호출자(PH-05 타이머) 책임 — 여기선 정적 표시만. */
  justFilledIndex?: number
}

// 디자인 QA 발견사항 — 칸만 렌더하면 대시보드/회고에서 라벨 없는 정사각형 하나가 허허벌판에
// 떠 "증거"가 아니라 깨진 요소처럼 보인다. 접근성 라벨("오늘 N칸")은 이미 있었으나 시각적으로는
// 숨겨져 있었다 — 같은 문구를 보이는 캡션으로 승격한다(색상·필채움 로직은 불변, 배치만 보강).
// 0칸일 때는 렌더하지 않는다(침묵 규칙 — 부재는 무표시, "오늘 0칸"이라는 문구 자체가 소거 대상).
export function EnergyBar({ filledCount, justFilledIndex }: Props) {
  const labelId = useId()
  // 칸은 항상 끝에 추가되고 재정렬·삭제되지 않는다(append-only) — 인덱스 key가 안전하다.
  const cells = Array.from({ length: filledCount }, (_, index) => (
    <EnergyCell key={index} filled justFilled={index === justFilledIndex} />
  ))

  return (
    <div className={styles.wrap}>
      {filledCount > 0 && (
        <p id={labelId} className={styles.caption}>
          오늘 {filledCount}칸
        </p>
      )}
      <div
        className={styles.bar}
        role="group"
        aria-labelledby={filledCount > 0 ? labelId : undefined}
        aria-label={filledCount > 0 ? undefined : `오늘 ${filledCount}칸`}
      >
        {cells}
      </div>
    </div>
  )
}
