/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// 살아있는 디자인 시스템 갤러리(src/styleguide)의 실브라우저 스냅샷. 문서(docs/design-system/*)
// 만으론 "어떻게 생겼는지" 가늠할 수 없다는 한계를 메우는 비주얼 검증 표면 — 규약이 실제로
// 렌더된 형태를 사람이 눈으로/스냅샷으로 대조한다. dev/QA 전용 라우트(앱 내비게이션 미링크).
test.describe('디자인 시스템 갤러리 — 비주얼 검증 (docs/design-system)', () => {
  test('갤러리가 렌더되고 가로 오버플로가 없다', async ({ page }) => {
    await page.goto('/styleguide')
    await expect(page.getByRole('heading', { name: '살아있는 갤러리', level: 1 })).toBeVisible()

    // 화면 구성 섹션(CMP)의 초점 밴드/앵커 비교가 실제로 그려졌는지 확인
    await expect(page.getByRole('heading', { name: /화면 구성 \(CMP\)/ })).toBeVisible()

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)

    await expect(page).toHaveScreenshot('design-system-gallery.png', { fullPage: true })
  })
})
