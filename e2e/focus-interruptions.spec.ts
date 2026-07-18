/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md §2 C(집중 중 이탈) 실브라우저 커버리지 — 딴생각 포착(5-A)과 일시정지(5-B)는
// 둘 다 BottomSheet(포커스 트랩 + rAF 진입 트랜지션)로 구현돼 있어 jsdom(RTL) 레벨 테스트로는
// 안 잡히는 실제 레이아웃/포인터 이벤트 문제가 나기 쉬운 지점이다(엣지 커버리지 매트릭스 감사
// 결과). 짧은 탭(useLongPress onTap)과 긴 누름(onLongPress, 500ms 임계값)의 실제 포인터 동작을
// 실브라우저에서 검증한다 — page.clock으로 임계값을 가상으로 넘겨 실제 벽시계 대기 없이 확인한다.
const VIEWPORT_WIDTHS = [320, 768] as const
const LONG_PRESS_THRESHOLD_MS = 500

async function enterFocusScreen(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '시작해볼까요' }).click()

  await page.getByRole('textbox').fill('책상 정리')
  await page.getByRole('button', { name: '다음' }).click()

  await expect(page).toHaveURL(/\/split$/)
  await page.getByRole('textbox').fill('책상')
  await page.getByRole('button', { name: '정리하기' }).click()
  await page.getByRole('button', { name: '완료' }).click()

  await expect(page).toHaveURL('/')
  await page.getByRole('button', { name: '이 블록 시작하기' }).click()

  await expect(page).toHaveURL(/\/predict$/)
  await page.getByRole('button', { name: '끝날 것 같아요' }).click()

  await expect(page).toHaveURL(/\/focus$/)
  await expect(page.getByText('책상 정리하기')).toBeVisible()
}

test.describe('집중 중 이탈 — 딴생각 포착 / 일시정지 (SCREEN-FLOW §2 C, 5-A/5-B)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`짧은 탭 → 딴생각 포착 모달(타이머 유지) — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)

      await page.getByText('책상 정리하기').click()

      const modal = page.getByRole('dialog', { name: '딴생각 포착' })
      await expect(modal).toBeVisible()
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`capture-modal-${width}.png`)

      await page.getByLabel('잠깐 스친 생각, 적어두고 다시 집중하세요').fill('빨래도 해야지')
      await page.getByRole('button', { name: '나중에 보기' }).click()

      // 탭은 타이머를 멈추지 않는다(SPEC §6) — 모달만 닫히고 집중 화면 그대로
      await expect(modal).not.toBeVisible()
      await expect(page).toHaveURL(/\/focus$/)
      await expect(page.getByText('책상 정리하기')).toBeVisible()
    })

    // 버그 픽스(2026-07-18) — 딴생각 포착은 15분 세션 중 반복 재오픈되도록 설계돼 있다(SCREEN-FLOW
    // 5-A). 재오픈 시 BottomSheet의 자동 포커스가 슬라이드-인 트랜지션(transform) 도중에 걸리면
    // iOS Safari에서 뷰포트 확대가 고착되는 WebKit 버그가 있었다(BottomSheet.tsx, transitionend까지
    // 미루도록 수정). 이 프로젝트의 Playwright 프로젝트는 전부 Chromium이라 실제 확대 고착 자체는
    // 여기서 재현 불가 — 이 테스트는 "두 번째 재오픈에서도 입력에 포커스가 정상 안착하는가"라는
    // 회귀만 잡는다. 실제 iOS 확대 고착 여부는 실기기 수동 검증 필요(계획 Phase 4).
    test(`딴생각 포착을 두 번 연속 열고 닫아도 재오픈마다 입력에 포커스가 안착한다 — ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)

      const captureInput = page.getByLabel('잠깐 스친 생각, 적어두고 다시 집중하세요')

      await page.getByText('책상 정리하기').click()
      const modal = page.getByRole('dialog', { name: '딴생각 포착' })
      await expect(modal).toBeVisible()
      await expect(captureInput).toBeFocused()
      await captureInput.fill('빨래도 해야지')
      await page.getByRole('button', { name: '나중에 보기' }).click()
      await expect(modal).not.toBeVisible()

      // 재오픈 — 이번 재포커스가 이번 픽스의 핵심 회귀 대상
      await page.getByText('책상 정리하기').click()
      await expect(modal).toBeVisible()
      await expect(captureInput).toBeFocused()
      await expect(captureInput).toHaveValue('')
      await page.getByRole('button', { name: '나중에 보기' }).click()
      await expect(modal).not.toBeVisible()

      await expect(page).toHaveURL(/\/focus$/)
      await expect(page.getByText('책상 정리하기')).toBeVisible()
    })

    test(`긴 누름 → 일시정지 → 재개, 그리고 그만하기(미완료 회고) — ${width}px`, async ({
      page,
    }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)

      const label = page.getByText('책상 정리하기')
      const box = await label.boundingBox()
      if (!box) throw new Error('타이머 라벨을 찾을 수 없어요')

      // 긴 누름 — 실제 500ms를 기다리는 대신 가상 시계를 임계값 너머로 넘긴다
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.clock.fastForward(LONG_PRESS_THRESHOLD_MS + 100)
      await page.mouse.up()

      const pauseOverlay = page.getByRole('dialog', { name: '일시정지' })
      await expect(pauseOverlay).toBeVisible()
      await expect(page.getByText('잠시 멈췄어요')).toBeVisible()
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`pause-overlay-${width}.png`)

      // 재개 — 명시적 정지의 재개만 유효한 길(SPEC §6 P13)
      await page.getByRole('button', { name: '재개' }).click()
      await expect(pauseOverlay).not.toBeVisible()
      await expect(page).toHaveURL(/\/focus$/)

      // 다시 길게 눌러 이번엔 그만하기 — 5-B → 미완료 회고("실패" 표시 없음, 무처벌)
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.clock.fastForward(LONG_PRESS_THRESHOLD_MS + 100)
      await page.mouse.up()
      await expect(pauseOverlay).toBeVisible()

      await page.getByRole('button', { name: '그만하기' }).click()

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')).toBeVisible()
      for (const banned of ['실패', '미완료', '못 했']) {
        expect(await page.textContent('body')).not.toContain(banned)
      }
    })
  }
})
