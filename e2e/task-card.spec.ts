/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// TaskCard 파일럿 검증 (PH-04.2 §B) — 온보딩 1화면이 이미 TaskCard를 렌더하므로
// 별도 시드 없이 `/onboarding`으로 바로 확인한다(fresh localStorage 전제, 온보딩 미완료).
const VIEWPORT_WIDTHS = [320, 390, 768] as const

test.describe('TaskCard', () => {
  // 뷰포트를 테스트 안에서 직접 지정하므로(320/390/768), 4개 프로젝트 매트릭스 중복 실행은
  // 불필요하다 — 한 프로젝트에서만 돈다.
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`renders without horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/onboarding')

      const card = page.locator('[data-task-card]').first()
      await expect(card).toBeVisible()
      await expect(
        page.getByRole('heading', { name: '여기까지 온 것만으로도 잘하고 있어요' }),
      ).toBeVisible()

      // README §0-1② — 320/360/390/768px에서 가로 스크롤 없음
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)

      // README §0-1② — 터치 타깃 ≥44×44 CSS px (카드 내부 CTA 버튼)
      const button = page.getByRole('button', { name: '다음' })
      const box = await button.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)

      await expect(page).toHaveScreenshot(`task-card-${width}.png`)
    })
  }
})
