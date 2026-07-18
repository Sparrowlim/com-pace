/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md §3-1 "INC_HIT/INC_MISS --이어서 15분 더--> FOCUS(예측 생략)" 커버리지 갭 —
// 미완료 회고(7/7′)의 "오늘은 여기까지" 분기는 focus-interruptions.spec.ts가 이미 실브라우저로
// 검증하지만, 같은 화면의 다른 버튼인 "이어서 15분 더"(같은 조각 즉시 재시작, 예측(4) 생략,
// RetroPage.handleContinue)는 지금까지 실브라우저 커버리지가 없었다.
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

async function stopViaLongPress(page: import('@playwright/test').Page) {
  const label = page.getByText('책상 정리하기')
  const box = await label.boundingBox()
  if (!box) throw new Error('타이머 라벨을 찾을 수 없어요')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.clock.fastForward(LONG_PRESS_THRESHOLD_MS + 100)
  await page.mouse.up()
  await expect(page.getByRole('dialog', { name: '일시정지' })).toBeVisible()
  await page.getByRole('button', { name: '그만하기' }).click()
}

test.describe('미완료 회고 "이어서 15분 더" 왕복 (SCREEN-FLOW §3-1 INC→FOCUS)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`그만하기 → 미완료 회고 → 이어서 15분 더 → 예측 생략 재진입 — ${width}px`, async ({
      page,
    }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)
      await stopViaLongPress(page)

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')).toBeVisible()

      await page.getByRole('button', { name: '이어서 15분 더' }).click()

      // 같은 조각을 즉시 재시작 — 예측(4) 완전 생략, 곧장 집중(5) 재진입
      await expect(page).toHaveURL(/\/focus$/)
      await expect(page.getByText('책상 정리하기')).toBeVisible()

      // 두 번째 15분을 자연 경과시켜 5-C 시트가 다시 뜨는지, 이번엔 완료로 마무리되는지까지
      // 왕복 확인(재시작된 조각도 정상적으로 5-C를 거친다)
      await page.clock.fastForward(900_000)
      await page.getByRole('button', { name: '이 조각 끝났어요' }).click()

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('15분, 오늘도 해냈어요.')).toBeVisible()
    })
  }
})
