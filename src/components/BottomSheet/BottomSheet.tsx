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

// 열림 시 포커스 이동 + Tab 순환(포커스 트랩) + ESC 닫기 + 진입 트랜지션(PH-06, PH-04 이관분).
// 닫힘은 즉시 언마운트로 유지한다 — 담백함(D-12)을 위해 퇴장 애니메이션은 의도적으로 안 만든다.
export function BottomSheet({ isOpen, onClose, label, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const [isEntered, setIsEntered] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    getFocusable(sheetRef.current)[0]?.focus()
    const raf = requestAnimationFrame(() => setIsEntered(true))

    return () => {
      cancelAnimationFrame(raf)
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
