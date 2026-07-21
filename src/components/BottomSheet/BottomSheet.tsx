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

// --duration-fast(150ms)보다 넉넉히 늦게 잡는다 — 아래 안전망 전용 상수.
const FOCUS_FALLBACK_DELAY_MS = 250

// 버그 픽스(2026-07-18) — .sheet가 transform으로 슬라이드-인 중일 때 텍스트 입력에 focus()가
// 걸리면 iOS Safari에서 뷰포트 확대 상태가 고착되는 WebKit 버그가 있다("딴생각 포착"처럼 세션 중
// 반복 재오픈되는 시트에서 재현). 진입 트랜지션이 끝난 뒤로 첫 포커스를 미룬다.
// prefers-reduced-motion(transition-duration: 0s)에서는 스펙상 transitionend가 아예 발생하지
// 않으므로 그 경우엔 즉시 포커스로 폴백한다.
// 안전망(2026-07-18 재발 조사) — transitionend는 실기기에서 프레임 드랍·저사양 기기의 컴포지팅
// 지연 등으로 누락될 수 있다(스크림이 시트와 동시에 애니메이션하면서 컴포지팅 부담이 늘어난 뒤
// 관찰된 재발 — 인과관계 확정은 실기기 없이 불가하나, 이 경로가 막히면 포커스 자체가 영구히
// 안 걸리는 별도의 접근성 회귀가 생기므로 근거와 무관하게 방어할 가치가 있다). transitionend가
// 오지 않아도 트랜지션 시간보다 늦게 한 번 더 시도해, 포커스가 무한정 보류되지 않게 한다.
// 리스너/타이머 해제용 cleanup을 반환한다.
function scheduleFirstFocus(sheet: HTMLElement | null, focusFirst: () => void): () => void {
  if (!sheet) return () => {}
  if (isTransitionInstant(sheet)) {
    focusFirst()
    return () => {}
  }

  let hasFocused = false
  function focusOnce() {
    if (hasFocused) return
    hasFocused = true
    focusFirst()
  }

  function handleTransitionEnd(event: TransitionEvent) {
    if (event.target !== sheet || event.propertyName !== 'transform') return
    focusOnce()
  }

  sheet.addEventListener('transitionend', handleTransitionEnd)
  const fallback = window.setTimeout(focusOnce, FOCUS_FALLBACK_DELAY_MS)

  return () => {
    sheet.removeEventListener('transitionend', handleTransitionEnd)
    window.clearTimeout(fallback)
  }
}

function handleSheetKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  sheet: HTMLElement | null,
  onClose: () => void,
): void {
  if (event.key === 'Escape') {
    onClose()
    return
  }
  if (event.key !== 'Tab') return

  const focusables = getFocusable(sheet)
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

  if (!isOpen) return null

  return (
    <>
      {/* Finding #5 — 시트 뒤에 배경 구분이 전혀 없어 카드 콘텐츠와 시트 콘텐츠가 시각적으로
          붙어 보였다. 탭-바깥-닫기는 의도적으로 달지 않는다 — 명시적 액션(버튼/ESC)으로만 닫는
          기존 철학(우발적 닫힘 방지)을 그대로 유지, 순수 시각 딤 처리만 추가한다. */}
      <div className={`${styles.scrim} ${isEntered ? styles.entered : ''}`} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${isEntered ? styles.entered : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={(event) => handleSheetKeyDown(event, sheetRef.current, onClose)}
      >
        {children}
      </div>
    </>
  )
}
