/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md §1 화면 3 부속 상태 "만만한 1개 자기선택"(FragmentChoice, PH-05.1/D-05)
// 커버리지 갭 — 지금까지 모든 e2e 헬퍼가 단일 조각만 만들어 왔기 때문에(1개면 FragmentChoice가
// 아예 렌더되지 않고 TaskCta로 자동 진행), 조각 2개 이상일 때 뜨는 자기선택 UI가 한 번도 실제
// 뷰포트로 검증된 적이 없었다.
const VIEWPORT_WIDTHS = [320, 768] as const

test.describe('과제 조각 2개 이상 — 자기선택(FragmentChoice) (SCREEN-FLOW §1 화면 3, D-05)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`조각 2개 쪼개기 → 자기선택 노출 → 탭 즉시 확정 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await page.goto('/')
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '시작해볼까요' }).click()

      await page.getByRole('textbox').fill('집안일')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page).toHaveURL(/\/split$/)
      await page.getByRole('textbox').fill('책상')
      await page.getByRole('button', { name: '정리하기' }).click()
      await page.getByRole('textbox').fill('메일')
      await page.getByRole('button', { name: '쓰기' }).click()
      await page.getByRole('button', { name: '완료' }).click()

      // 조각이 2개라 TaskCta 자동 진행 대신 자기선택 UI가 뜬다 — 확인 버튼 없이 탭이 곧 확정
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: '집안일' })).toBeVisible()
      await expect(page.getByText('어떤 조각부터 해볼까요? 만만한 걸로 골라봐요')).toBeVisible()
      const option1 = page.getByRole('button', { name: '책상 정리하기' })
      const option2 = page.getByRole('button', { name: '메일 쓰기' })
      await expect(option1).toBeVisible()
      await expect(option2).toBeVisible()
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`fragment-choice-${width}.png`)

      await option2.click()

      // 탭 즉시 확정 — 별도 확인 버튼 없이 곧장 예측(4)로, 선택한 조각의 verbLabel 반영
      await expect(page).toHaveURL(/\/predict$/)
      await expect(page.getByText('이번 15분: 메일 쓰기')).toBeVisible()
    })
  }
})
