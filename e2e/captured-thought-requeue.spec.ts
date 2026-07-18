/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md P16/5-A 커버리지 갭 — 딴생각 포착(5-A) 모달까지는 focus-interruptions.spec.ts가
// 이미 실브라우저로 검증하지만, 그 캡처가 회고(RetroPage)의 CapturedThoughtCard에서 "새
// 조각화"(queueBlocks 편입) 또는 "버리기"(조용히 폐기)로 실제 처리되는 왕복은 지금까지 유닛
// 테스트(RetroPage.test.tsx)로만 검증됐다. 실브라우저에서 큐 편입 → 다음 블록 예측 화면까지
// 이어지는지 확인한다.
const VIEWPORT_WIDTHS = [320, 768] as const

async function enterFocusAndCapture(page: import('@playwright/test').Page, thought: string) {
  await page.clock.install()
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
  await page.getByText('책상 정리하기').click()

  const modal = page.getByRole('dialog', { name: '딴생각 포착' })
  await expect(modal).toBeVisible()
  await page.getByLabel('잠깐 스친 생각, 적어두고 다시 집중하세요').fill(thought)
  await page.getByRole('button', { name: '나중에 보기' }).click()
  await expect(modal).not.toBeVisible()

  await page.clock.fastForward(900_000)
  await page.getByRole('button', { name: '이 조각 끝났어요' }).click()
  await expect(page).toHaveURL(/\/retro$/)
}

test.describe('딴생각 포착 → 회고 새 조각화/버리기 왕복 (SCREEN-FLOW P16, 5-A→회고)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`새 조각화 — 큐에 편입돼 다음 예측 화면까지 이어짐 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusAndCapture(page, '빨래도 해야지')

      const captureCard = page.getByText('아까 스친 생각: “빨래도 해야지”')
      await expect(captureCard).toBeVisible()
      await page.getByRole('button', { name: '새 조각화' }).click()
      await expect(captureCard).not.toBeVisible()

      // completed 경로(끝날 것 같아요 예측 + 이 조각 끝났어요) → "바로 다음 블록"
      await page.getByRole('button', { name: '바로 다음 블록' }).click()

      // 새 조각화로 큐에 편입된 조각이 다음 예측 대상으로 뜬다(resolveNextRoute)
      await expect(page).toHaveURL(/\/predict$/)
      await expect(page.getByText('이번 15분: 빨래도 해야지')).toBeVisible()
    })

    test(`버리기 — 조용히 사라지고 큐에 편입되지 않음 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusAndCapture(page, '설거지도 해야지')

      const captureCard = page.getByText('아까 스친 생각: “설거지도 해야지”')
      await expect(captureCard).toBeVisible()
      await page.getByRole('button', { name: '버리기' }).click()
      await expect(captureCard).not.toBeVisible()

      // 버리기는 내비게이션을 트리거하지 않는다 — 회고 화면 그대로
      await expect(page).toHaveURL(/\/retro$/)

      // 큐에 편입되지 않았으므로 조각 소진 → zero 대시보드(대체 조각 없음)
      await page.getByRole('button', { name: '바로 다음 블록' }).click()
      await expect(page).toHaveURL('/')
      await expect(page.getByText('지금 눈에 걸리는 아무거나, 사소해도 괜찮아요')).toBeVisible()
    })
  }
})
