/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// SCREEN-FLOW.md §3-1 P7/P13 "화면잠금·앱이탈·전화·강제종료 → 진행 유지" 커버리지 갭 — 지금까지
// useSessionRecovery는 useSessionRecovery.test.tsx(RTL, IndexedDB 목)로만 검증됐고, 실제
// 새로고침(=강제종료 재기동과 동일 취급, SPEC §6 개정)으로 activeSessionPointer가 블록을 되찾는
// 왕복은 실브라우저로 확인된 적이 없었다.
const VIEWPORT_WIDTHS = [320, 768] as const

async function enterFocusScreen(page: import('@playwright/test').Page) {
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
  await expect(page.getByText('책상 정리하기')).toBeVisible()
}

test.describe('세션 복구 — 새로고침(강제종료 재기동 동일 취급) (SCREEN-FLOW §3-1 P7/P13)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`15분 미만 경과 후 새로고침 — 같은 블록으로 집중 화면 복귀(continue) — ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)

      await page.clock.fastForward(60_000)
      await page.reload()

      // activeSessionPointer(localStorage)로 진행 중이던 블록을 되찾아 대시보드로 튕기지 않고
      // 집중 화면에 그대로 남는다 — 경과 시간도 보존(00:00으로 리셋되지 않음)
      await expect(page).toHaveURL(/\/focus$/)
      await expect(page.getByText('책상 정리하기')).toBeVisible()
      await expect(page.getByText('00:00')).not.toBeVisible()
    })

    test(`15분 이상 경과 후 새로고침 — 자동 완료 처리, 회고로 복귀(finish) — ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)

      // 5-C 시트가 뜨기 전에(사용자가 아직 고르기 전에) 새로고침 — useSessionRecovery.ts의
      // finish 판정은 5-C를 거치지 않고 곧장 complete()를 호출한다(코드 확인됨, recoverSession
      // 39-100행). 자연 경과 시 사용자가 직접 고른다는 P14 원칙이 이 재기동 경로에는 아직 반영
      // 안 돼 있을 가능성이 있다 — 이 테스트는 "현재 실제 동작"을 고정하는 회귀 가드다.
      await page.clock.fastForward(900_000)
      await page.reload()

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('15분, 오늘도 해냈어요.')).toBeVisible()
    })
  }
})
