/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md §2 "DASH<->NORTH"·"SET<->DASH/NORTH" 커버리지 갭 — design-qa-gaps.spec.ts는
// 북극성(1-B)·설정(9) 화면의 최초 진입 스냅샷만 찍고 저장/건너뛰기/왕복은 검증하지 않는다.
// 과제 상태와 무관하게 대시보드 헤더에 상시 노출되는 진입점(설계 결정 4)이므로 과제 추가 없이
// 온보딩만 마친 상태에서 바로 확인한다.
const VIEWPORT_WIDTHS = [320, 768] as const

async function completeOnboardingOnly(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '시작해볼까요' }).click()
}

test.describe('북극성/설정 왕복 (SCREEN-FLOW §2 DASH↔NORTH, SET↔DASH/NORTH)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`저장("남길게요") → 대시보드에 배지 노출 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingOnly(page)

      await page.getByRole('button', { name: '북극성 더하기(선택)' }).click()
      await expect(page).toHaveURL(/\/north-star$/)

      await page.getByLabel('열망 — 원하는 방향').fill('더 건강하게')
      await page.getByLabel('의무 — 해내야 하는 방향').fill('보고서 마감')
      await page.getByRole('button', { name: '남길게요' }).click()

      await expect(page).toHaveURL('/')
      await expect(page.getByText('열망: 더 건강하게')).toBeVisible()
      await expect(page.getByText('의무: 보고서 마감')).toBeVisible()
      // 저장 후엔 "북극성 더하기" 초대 버튼 대신 배지로 대체된다
      await expect(page.getByRole('button', { name: '북극성 더하기(선택)' })).not.toBeVisible()
    })

    test(`건너뛰기 — 빈 채로 대시보드 복귀, 배지 없음 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingOnly(page)

      await page.getByRole('button', { name: '북극성 더하기(선택)' }).click()
      await expect(page).toHaveURL(/\/north-star$/)
      await page.getByRole('button', { name: '건너뛸게요' }).click()

      await expect(page).toHaveURL('/')
      await expect(page.getByRole('button', { name: '북극성 더하기(선택)' })).toBeVisible()
      await expect(page.getByText('열망:')).not.toBeVisible()
    })

    test(`설정 → 양가 목표 수정(prefill) → 저장 → 배지 갱신 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingOnly(page)

      // 사전 조건 — 기존 값이 있어야 prefill을 검증할 수 있다
      await page.getByRole('button', { name: '북극성 더하기(선택)' }).click()
      await page.getByLabel('열망 — 원하는 방향').fill('더 건강하게')
      await page.getByRole('button', { name: '남길게요' }).click()
      await expect(page).toHaveURL('/')

      await page.getByRole('button', { name: '설정' }).click()
      await expect(page).toHaveURL(/\/settings$/)
      await expect(page.getByText('열망: 더 건강하게')).toBeVisible()

      await page.getByRole('button', { name: '양가 목표 수정' }).click()
      await expect(page).toHaveURL(/\/north-star$/)
      await expect(page.getByLabel('열망 — 원하는 방향')).toHaveValue('더 건강하게')

      await page.getByLabel('의무 — 해내야 하는 방향').fill('보고서 마감')
      await page.getByRole('button', { name: '남길게요' }).click()

      // 저장은 곧장 대시보드로 이동한다(NorthStarPage.handleSave) — 설정 재진입 시 갱신 확인
      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '설정' }).click()
      await expect(page.getByText('의무: 보고서 마감')).toBeVisible()
    })

    test(`설정 "뒤로" → 대시보드 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingOnly(page)

      await page.getByRole('button', { name: '설정' }).click()
      await expect(page).toHaveURL(/\/settings$/)
      await page.getByRole('button', { name: '뒤로' }).click()

      await expect(page).toHaveURL('/')
    })
  }
})
