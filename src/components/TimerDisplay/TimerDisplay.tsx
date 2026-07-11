import styles from './TimerDisplay.module.css'

// PH-04.4 1-2 — 진행률·퍼센트·링 props 자체가 타입에 없다(시계-감시 루프 유발 금지,
// CLAUDE §1·§6). 큰 숫자(분 단위)+지금 하는 동사 라벨만.
type Props = {
  label: string
  remainingLabel: string
  variant: 'running' | 'paused' | 'discharge'
}

export function TimerDisplay({ label, remainingLabel, variant }: Props) {
  return (
    <div className={styles.display} data-variant={variant}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{remainingLabel}</p>
    </div>
  )
}
