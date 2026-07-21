import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { runAxe } from '../../test/axe'
import { BottomSheet } from './BottomSheet'

const css = readFileSync('src/components/BottomSheet/BottomSheet.module.css', 'utf-8')

// jsdom은 실제 CSS 트랜지션을 실행하지 않는다(vitest.config.ts는 css:true를 켜지 않음) — 첫
// 포커스가 진입 트랜지션(transform) 종료 이후로 미뤄지는 동작(BottomSheet.tsx 버그 픽스)을
// 재현하려면 transitionend를 수동으로 dispatch해야 한다.
function dispatchTransitionEnd(target: Element, propertyName = 'transform') {
  const event = new Event('transitionend', { bubbles: true })
  Object.defineProperty(event, 'propertyName', { value: propertyName })
  target.dispatchEvent(event)
}

describe('BottomSheet', () => {
  it('renders children when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(screen.getByText('그만하기')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <BottomSheet isOpen={false} onClose={() => {}} label="딴생각 포착">
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('has no axe violations when open', async () => {
    const { container } = render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <button type="button">그만하기</button>
      </BottomSheet>,
    )
    expect((await runAxe(container)).violations).toHaveLength(0)
  })

  it('uses elevation.sheet (DESIGN-TOKENS §2-8, the dedicated sheet shadow token)', () => {
    expect(css).toMatch(/box-shadow:\s*var\(--elevation-sheet\)/)
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <BottomSheet isOpen={true} onClose={onClose} label="딴생각 포착">
        <button type="button">그만하기</button>
      </BottomSheet>,
    )
    dispatchTransitionEnd(screen.getByRole('dialog'))

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the sheet once the entrance transition ends (버그 픽스 — transform 트랜지션 도중 focus()가 걸리면 iOS Safari 확대 고착 유발, transitionend까지 미룬다)', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <button type="button">재개</button>
      </BottomSheet>,
    )

    const button = screen.getByRole('button', { name: '재개' })
    expect(button).not.toHaveFocus()

    dispatchTransitionEnd(screen.getByRole('dialog'))
    expect(button).toHaveFocus()
  })

  // iOS 확대 재발 조사(2026-07-18) — transitionend는 실기기에서 프레임 드랍 등으로 누락될 수
  // 있다. 그 경로가 막히면 포커스가 영구히 안 걸리는 별도의 접근성 회귀가 생기므로, 트랜지션
  // 시간보다 늦게 한 번 더 시도하는 안전망이 필요하다.
  it('falls back to focusing after a timeout if transitionend never fires (dropped/missed event on a real device must not permanently block focus)', () => {
    vi.useFakeTimers()
    try {
      render(
        <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
          <button type="button">재개</button>
        </BottomSheet>,
      )
      const button = screen.getByRole('button', { name: '재개' })
      expect(button).not.toHaveFocus()

      // transitionend를 절대 보내지 않는다 — 실기기의 드랍 상황을 흉내낸다.
      vi.advanceTimersByTime(250)

      expect(button).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not double-fire the fallback after transitionend already focused (no redundant focus call)', () => {
    vi.useFakeTimers()
    try {
      render(
        <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
          <button type="button">재개</button>
          <button type="button">그만하기</button>
        </BottomSheet>,
      )
      dispatchTransitionEnd(screen.getByRole('dialog'))
      const first = screen.getByRole('button', { name: '재개' })
      expect(first).toHaveFocus()

      // 포커스를 다른 곳으로 옮긴 뒤 안전망 타이머가 그걸 다시 덮어쓰지 않는지 확인한다.
      const second = screen.getByRole('button', { name: '그만하기' })
      second.focus()
      vi.advanceTimersByTime(250)

      expect(second).toHaveFocus()
    } finally {
      vi.useRealTimers()
    }
  })

  it('traps Tab focus within the sheet', async () => {
    const user = userEvent.setup()
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <button type="button">재개</button>
        <button type="button">그만하기</button>
      </BottomSheet>,
    )
    dispatchTransitionEnd(screen.getByRole('dialog'))

    const first = screen.getByRole('button', { name: '재개' })
    const last = screen.getByRole('button', { name: '그만하기' })
    expect(first).toHaveFocus()

    await user.tab()
    expect(last).toHaveFocus()

    await user.tab()
    expect(first).toHaveFocus()
  })

  it('re-focuses the first focusable element on each reopen, not just the first open (버그 픽스 회귀 방지 — 딴생각 포착처럼 세션 중 반복 재오픈되는 시트)', () => {
    const { rerender } = render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <input type="text" aria-label="조각" />
      </BottomSheet>,
    )
    dispatchTransitionEnd(screen.getByRole('dialog'))
    expect(screen.getByRole('textbox')).toHaveFocus()

    rerender(
      <BottomSheet isOpen={false} onClose={() => {}} label="딴생각 포착">
        <input type="text" aria-label="조각" />
      </BottomSheet>,
    )

    rerender(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <input type="text" aria-label="조각" />
      </BottomSheet>,
    )
    expect(screen.getByRole('textbox')).not.toHaveFocus()

    dispatchTransitionEnd(screen.getByRole('dialog'))
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('focuses immediately when the entrance transition is instant (prefers-reduced-motion, transition-duration: 0s — spec: transitionend never fires for a 0s transition)', () => {
    // role=dialog(.sheet)에만 0s를 흘려보낸다 — 전역으로 덮으면 RTL의 접근성 이름 계산(다른
    // 요소들의 getComputedStyle 호출)이 getPropertyValue 없는 반쪽 객체를 받아 깨진다.
    const original = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      if (el instanceof Element && el.getAttribute('role') === 'dialog') {
        return { transitionDuration: '0s' } as CSSStyleDeclaration
      }
      return original(el, pseudo)
    })

    const { container } = render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <button type="button">재개</button>
      </BottomSheet>,
    )

    expect(container.querySelector('button')).toHaveFocus()
    vi.restoreAllMocks()
  })

  it('renders as an accessible dialog', () => {
    render(
      <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
        <p>그만하기</p>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('uses duration.fast + easing.quiet for the entrance transition', () => {
    expect(css).toMatch(
      /transition:\s*\n?\s*transform var\(--duration-fast\) var\(--easing-quiet\)/,
    )
  })

  it('collapses the entrance transition to 0s under reduced motion', () => {
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\)\s*\{\s*\.sheet\s*\{\s*transition-duration:\s*0s;/,
    )
  })

  // Finding #5 — 배경 스크림은 순수 시각 요소, 클릭으로 닫히지 않는다(명시적 액션만 닫기 유지).
  describe('scrim (Finding #5)', () => {
    it('renders a non-interactive scrim behind the sheet when open', () => {
      const { container } = render(
        <BottomSheet isOpen={true} onClose={() => {}} label="딴생각 포착">
          <p>그만하기</p>
        </BottomSheet>,
      )
      expect(css).toMatch(/\.scrim\s*\{[^}]*pointer-events:\s*none/)
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })

    it('clicking the scrim does not close the sheet', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()
      const { container } = render(
        <BottomSheet isOpen={true} onClose={onClose} label="딴생각 포착">
          <p>그만하기</p>
        </BottomSheet>,
      )
      const scrim = container.querySelector('[aria-hidden="true"]')
      expect(scrim).toBeInTheDocument()

      if (scrim) await user.click(scrim)

      expect(onClose).not.toHaveBeenCalled()
    })

    it('renders no scrim when closed', () => {
      const { container } = render(
        <BottomSheet isOpen={false} onClose={() => {}} label="딴생각 포착">
          <p>그만하기</p>
        </BottomSheet>,
      )
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
    })
  })
})
