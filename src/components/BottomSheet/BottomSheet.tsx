import type { ReactNode } from 'react'
import styles from './BottomSheet.module.css'

type Props = {
  isOpen: boolean
  children: ReactNode
}

// 정적 렌더만(PH-04 Positive Non-Goals) — 포커스 트랩·ESC 닫기·열림/닫힘 애니메이션은 PH-06 몫.
export function BottomSheet({ isOpen, children }: Props) {
  if (!isOpen) return null

  return <div className={styles.sheet}>{children}</div>
}
