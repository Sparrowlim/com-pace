/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md §2 "NEXT --없음(과제 소진)--> ZERO" 실브라우저 커버리지(엣지 커버리지 매트릭스
// 감사에서 발견된 갭). 2z(빈 대시보드)는 §1 인벤토리에 따라 AddTaskPrompt를 그대로 재사용하므로
// (PH-04.4, 별도 와이어 없음) 코드 경로는 첫 진입 화면과 동일하지만, "블록을 소진한 뒤" 실제로
// 같은 화면이 안전하게 다시 뜨는지, 그리고 그 자리에서 새 과제를 추가해 원 루프로 복귀할 수
// 있는지(2z → 3-A → 3, SPEC §4·§6·§8 P3)는 지금까지 한 번도 실브라우저로 확인된 적이 없었다.
const VIEWPORT_WIDTHS = [320, 768] as const

test.describe('빈 대시보드(zero) → 새 과제 재진입 (SCREEN-FLOW §2 P3/P8)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`단일 블록 소진 → zero 대시보드 → 새 과제로 재개 — ${width}px`, async ({ page }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })

      await page.goto('/')
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '시작해볼까요' }).click()

      await page.getByRole('textbox').fill('청소')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page).toHaveURL(/\/split$/)
      await page.getByRole('textbox').fill('책상')
      await page.getByRole('button', { name: '정리하기' }).click()
      await page.getByRole('button', { name: '완료' }).click()

      // 조각이 1개뿐이라 자기선택 UI 없이 곧장 시작 CTA
      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '이 블록 시작하기' }).click()

      await expect(page).toHaveURL(/\/predict$/)
      await page.getByRole('button', { name: '끝날 것 같아요' }).click()

      await expect(page).toHaveURL(/\/focus$/)
      await expect(page.getByText('책상 정리하기')).toBeVisible()
      await page.clock.fastForward(900_000)
      await page.getByRole('button', { name: '이 조각 끝났어요' }).click()

      await expect(page).toHaveURL(/\/retro$/)
      await page.getByRole('button', { name: '바로 다음 블록' }).click()

      // 큐 소진 — NEXT 없음 → zero 대시보드(AddTaskPrompt 겸용, One Task 카드 잔존 없음)
      await expect(page).toHaveURL('/')
      const zeroDashboard = await page.evaluate(() => ({
        taskCards: document.querySelectorAll('[data-task-card]').length,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(zeroDashboard.taskCards).toBe(0)
      expect(zeroDashboard.scrollWidth).toBeLessThanOrEqual(zeroDashboard.clientWidth + 1)
      await expect(page.getByText('지금 눈에 걸리는 아무거나, 사소해도 괜찮아요')).toBeVisible()
      await expect(page).toHaveScreenshot(`zero-dashboard-${width}.png`)

      // 3-A — zero에서 곧장 새 과제 입력(잠금 해제, SPEC §3·D-17·P8)
      await page.getByRole('textbox').fill('설거지')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page).toHaveURL(/\/split$/)
      await page.getByRole('textbox').fill('그릇')
      await page.getByRole('button', { name: '확인하기' }).click()
      await page.getByRole('button', { name: '완료' }).click()

      // One Task 불변식 — 새 과제만 단독으로 다시 뜬다(소진된 이전 과제 잔존 없음)
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: '설거지' })).toBeVisible()
      const refilled = await page.evaluate(
        () => document.querySelectorAll('[data-task-card]').length,
      )
      expect(refilled).toBe(1)
    })
  }
})
