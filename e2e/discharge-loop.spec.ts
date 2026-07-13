/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md §2 F(방전 모드) 실브라우저 커버리지 — 지금까지 방전 전체 왕복은 RTL 통합
// 테스트(core-loop.integration.test.tsx PH-08 시나리오)로만 검증됐고, 실제 뷰포트/CSS로 렌더된
// 적이 없었다(엣지 커버리지 매트릭스 감사 결과). 대시보드 저마찰 링크 → 방전 진입 → 방전
// 대시보드 → 집중(방전 변형) → 종료(회고 완전 스킵, 대시보드 직행)까지 320/768px로 왕복한다.
// SPEC §5 확정 — /predict·/retro는 이 경로에서 한 번도 들르지 않으므로 각 단계의 URL을 명시
// 확인한다.
const VIEWPORT_WIDTHS = [320, 768] as const

test.describe('방전 모드 전체 왕복 (SCREEN-FLOW §2 F, §5)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`저마찰 링크 → 방전 대시보드 → 집중 → 대시보드 복귀 — ${width}px`, async ({ page }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })

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

      // 대시보드 — 조각 1개, 방전 저마찰 링크가 함께 노출된다(PH-08 §5 In-Scope A)
      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '오늘은 가볍게 갈까요' }).click()

      // 방전 진입 — 낙인 없는 저마찰 안내("고장" 라벨 금지, §5)
      await expect(page).toHaveURL(/\/discharge$/)
      await expect(page.getByText('무리하지 않아도 괜찮아요')).toBeVisible()
      const entryOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(entryOverflow.scrollWidth).toBeLessThanOrEqual(entryOverflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`discharge-entry-${width}.png`)

      await page.getByRole('button', { name: '딱 하나만 할래요' }).click()

      // 방전 대시보드 — 진짜 과제 보존, 예측(4) 없음(§5 확정)
      await expect(page).toHaveURL(/\/discharge\/dashboard$/)
      await expect(page.getByRole('heading', { name: '책상 정리' })).toBeVisible()
      expect(await page.locator('[data-mode="discharge"]').count()).toBeGreaterThan(0)
      const dashboardOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(dashboardOverflow.scrollWidth).toBeLessThanOrEqual(dashboardOverflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`discharge-dashboard-${width}.png`)

      await page.getByRole('button', { name: '타이머만 켜면 승리' }).click()

      // 집중(방전) — 예측(4) 미경유, TimerDisplay가 discharge 변형으로 렌더
      await expect(page).toHaveURL(/\/focus$/)
      await expect(page.getByText('책상 정리하기')).toBeVisible()
      expect(await page.locator('[data-mode="discharge"]').count()).toBeGreaterThan(0)
      const focusOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(focusOverflow.scrollWidth).toBeLessThanOrEqual(focusOverflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`discharge-focus-${width}.png`)

      // 15분 경과 — 회고 전체 스킵, 대시보드로 직행(§5 확정, /retro 미경유)
      await page.clock.fastForward(900_000)
      await expect(page).toHaveURL('/')
      await expect(page.getByText('오늘 15분, 켠 것만으로 충분해요')).toBeVisible()
    })
  }
})
