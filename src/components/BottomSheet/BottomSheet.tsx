import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import styles from './BottomSheet.module.css'

type Props = {
  isOpen: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

function isTransitionInstant(sheet: HTMLElement): boolean {
  return window
    .getComputedStyle(sheet)
    .transitionDuration.split(',')
    .every((duration) => parseFloat(duration) === 0)
}

// 버그 픽스(2026-07-18) — .sheet가 transform으로 슬라이드-인 중일 때 텍스트 입력에 focus()가
// 걸리면 iOS Safari에서 뷰포트 확대 상태가 고착되는 WebKit 버그가 있다("딴생각 포착"처럼 세션 중
// 반복 재오픈되는 시트에서 재현). 진입 트랜지션이 끝난 뒤로 첫 포커스를 미룬다.
// prefers-reduced-motion(transition-duration: 0s)에서는 스펙상 transitionend가 아예 발생하지
// 않으므로 그 경우엔 즉시 포커스로 폴백한다. 리스너 해제용 cleanup을 반환한다.
function scheduleFirstFocus(sheet: HTMLElement | null, focusFirst: () => void): () => void {
  if (!sheet) return () => {}
  if (isTransitionInstant(sheet)) {
    focusFirst()
    return () => {}
  }

  function handleTransitionEnd(event: TransitionEvent) {
    if (event.target !== sheet || event.propertyName !== 'transform') return
    focusFirst()
  }

  sheet.addEventListener('transitionend', handleTransitionEnd)
  return () => sheet.removeEventListener('transitionend', handleTransitionEnd)
}

// 열림 시 포커스 이동 + Tab 순환(포커스 트랩) + ESC 닫기 + 진입 트랜지션(PH-06, PH-04 이관분).
// 닫힘은 즉시 언마운트로 유지한다 — 담백함(D-12)을 위해 퇴장 애니메이션은 의도적으로 안 만든다.
export function BottomSheet({ isOpen, onClose, label, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const [isEntered, setIsEntered] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    const raf = requestAnimationFrame(() => setIsEntered(true))
    const cancelFocusSchedule = scheduleFirstFocus(sheetRef.current, () =>
      getFocusable(sheetRef.current)[0]?.focus(),
    )

    return () => {
      cancelAnimationFrame(raf)
      cancelFocusSchedule()
      setIsEntered(false)
      previouslyFocusedRef.current?.focus()
    }
  }, [isOpen])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key !== 'Tab') return

    const focusables = getFocusable(sheetRef.current)
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={sheetRef}
      className={`${styles.sheet} ${isEntered ? styles.entered : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}
