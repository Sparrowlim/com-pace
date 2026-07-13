/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// 디자인 개선 전략(Phase 0) — SCREEN-FLOW.md §1 인벤토리 중 지금까지 실브라우저 스냅샷이 한 번도
// 없었던 화면들. 북극성(1-B)·쪼개기(3)·사전예측(4)·설정(9)·휴식(6-A)·회고 3변형(6′ 완료·빗나감 /
// 7 미완료·적중 / 7′ 미완료·빗나감)을 320/768px로 캡처해 "코드는 규칙을 지키는가"가 아니라
// "실제로 어떻게 보이는가"를 사람이 판단할 수 있게 한다.
const VIEWPORT_WIDTHS = [320, 768] as const
const LONG_PRESS_THRESHOLD_MS = 500

async function completeOnboardingAndAddTask(page: import('@playwright/test').Page, title: string) {
  await page.goto('/')
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '시작해볼까요' }).click()

  await page.getByRole('textbox').fill(title)
  await page.getByRole('button', { name: '다음' }).click()
}

async function splitWithSingleFragment(page: import('@playwright/test').Page) {
  await expect(page).toHaveURL(/\/split$/)
  await page.getByRole('textbox').fill('책상')
  await page.getByRole('button', { name: '정리하기' }).click()
  await page.getByRole('button', { name: '완료' }).click()
}

async function assertNoOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
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

test.describe('디자인 QA 갭 — 미커버 화면 스냅샷 (SCREEN-FLOW §1)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`1-B 북극성(선택) — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingAndAddTask(page, '책상 정리')
      await splitWithSingleFragment(page)

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '북극성 더하기(선택)' }).click()

      await expect(page).toHaveURL(/\/north-star$/)
      await expect(page.getByLabel('열망 — 원하는 방향')).toBeVisible()
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`north-star-${width}.png`)
    })

    test(`3 과제 쪼개기 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingAndAddTask(page, '책상 정리')

      await expect(page).toHaveURL(/\/split$/)
      await expect(page.getByRole('heading', { name: '책상 정리' })).toBeVisible()
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`split-${width}.png`)
    })

    test(`4 사전 예측 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingAndAddTask(page, '책상 정리')
      await splitWithSingleFragment(page)

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '이 블록 시작하기' }).click()

      await expect(page).toHaveURL(/\/predict$/)
      await expect(page.getByText('이번 15분에 끝날까요?')).toBeVisible()
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`predict-${width}.png`)
    })

    test(`9 설정 — ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await page.goto('/')
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '시작해볼까요' }).click()

      // 설정 진입점은 과제 상태와 무관하게 대시보드 헤더에 상시 노출된다(설계 결정 4)
      await page.getByRole('button', { name: '설정' }).click()

      await expect(page).toHaveURL(/\/settings$/)
      await expect(page.getByRole('heading', { name: '양가 목표' })).toBeVisible()
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`settings-${width}.png`)
    })

    test(`6-A 휴식 — ${width}px`, async ({ page }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingAndAddTask(page, '책상 정리')
      await splitWithSingleFragment(page)

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '이 블록 시작하기' }).click()
      await expect(page).toHaveURL(/\/predict$/)
      await page.getByRole('button', { name: '끝날 것 같아요' }).click()

      await expect(page).toHaveURL(/\/focus$/)
      await page.clock.fastForward(900_000)
      await expect(page).toHaveURL(/\/retro$/)
      await page.getByRole('button', { name: '잠시 쉬기' }).click()

      await expect(page).toHaveURL(/\/rest$/)
      await expect(page.getByText('여기서 잠깐 숨 돌리고 가도 좋아요.')).toBeVisible()
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`rest-${width}.png`)
    })

    test(`6′ 완료·빗나감(회고, 6과 무표시 동일해야 함) — ${width}px`, async ({ page }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingAndAddTask(page, '책상 정리')
      await splitWithSingleFragment(page)

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '이 블록 시작하기' }).click()
      await expect(page).toHaveURL(/\/predict$/)
      // 빗나감을 만들기 위해 "더 걸릴 것 같아요"를 고르고 그대로 시간을 다 채운다(완료=actual true)
      await page.getByRole('button', { name: '더 걸릴 것 같아요' }).click()

      await expect(page).toHaveURL(/\/focus$/)
      await page.clock.fastForward(900_000)

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('15분, 오늘도 해냈어요.')).toBeVisible()
      // SCREEN-FLOW §3-2 — 빗나감을 알리는 배지·문구가 없어야 완료 화면(6)과 완전 동일
      for (const banned of ['빗나감', '틀렸', '아쉽']) {
        expect(await page.textContent('body')).not.toContain(banned)
      }
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`retro-done-miss-${width}.png`)
    })

    test(`7 미완료·적중(회고) — ${width}px`, async ({ page }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingAndAddTask(page, '책상 정리')
      await splitWithSingleFragment(page)

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '이 블록 시작하기' }).click()
      await expect(page).toHaveURL(/\/predict$/)
      await page.getByRole('button', { name: '더 걸릴 것 같아요' }).click()

      await expect(page).toHaveURL(/\/focus$/)
      await stopViaLongPress(page)

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')).toBeVisible()
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`retro-incomplete-hit-${width}.png`)
    })

    test(`7′ 미완료·빗나감(회고, 7과 무표시 동일해야 함) — ${width}px`, async ({ page }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboardingAndAddTask(page, '책상 정리')
      await splitWithSingleFragment(page)

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '이 블록 시작하기' }).click()
      await expect(page).toHaveURL(/\/predict$/)
      await page.getByRole('button', { name: '끝날 것 같아요' }).click()

      await expect(page).toHaveURL(/\/focus$/)
      await stopViaLongPress(page)

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('오늘은 여기까지, 15분만큼의 증거는 남았어요.')).toBeVisible()
      for (const banned of ['빗나감', '틀렸', '아쉽']) {
        expect(await page.textContent('body')).not.toContain(banned)
      }
      await assertNoOverflow(page)
      await expect(page).toHaveScreenshot(`retro-incomplete-miss-${width}.png`)
    })
  }
})
