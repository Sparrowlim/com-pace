/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// PH-04.4 Phase 4 — 컴포넌트 카탈로그 신규 5종 중 실사용 화면 3개(대시보드·집중·회고)의
// 320/768px 왕복 스냅샷. 회고 화면은 실시간 15분 완료(useFocusTimer)를 거쳐야만 도달 가능하고
// lastResolvedBlock은 세션 메모리 상태라 IndexedDB 시드로는 우회할 수 없다 — 대신 Playwright
// Clock으로 가상 시간만 앞당긴다. FOCUS_SECONDS/타이머 계산 로직 자체는 건드리지 않는다
// (CLAUDE §2 "15분 단일 고정" 불변 규칙 보호, 앱 코드 변경 없음 — 테스트 환경에서만 시간 왜곡).
const VIEWPORT_WIDTHS = [320, 768] as const

test.describe('컴포넌트 카탈로그 — 핵심 루프 3화면(대시보드·집중·회고)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`대시보드(TextInput) → 집중(TimerDisplay) → 회고(StateChip·BonusCard) — ${width}px`, async ({
      page,
    }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })

      await page.goto('/')

      // 면죄부 3화면(OnboardingPage)
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '다음' }).click()
      await page.getByRole('button', { name: '시작해볼까요' }).click()

      // 2 대시보드 — 1-A 아무거나 입력(TextInput, In-Scope A)
      await expect(page.getByRole('textbox')).toBeVisible()
      const dashboardOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(dashboardOverflow.scrollWidth).toBeLessThanOrEqual(dashboardOverflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`dashboard-${width}.png`)

      await page.getByRole('textbox').fill('책상 정리')
      await page.getByRole('button', { name: '다음' }).click()

      // 3 과제 쪼개기 — TextInput 재사용 + Chip(동사칩). addTask()가 비동기라 네비게이션이
      // 끝날 때까지 기다린 뒤에 다음 화면의 필드를 채운다(그렇지 않으면 대시보드의 TextInput을
      // 다시 채우는 경합이 발생한다).
      await expect(page).toHaveURL(/\/split$/)
      await page.getByRole('textbox').fill('책상')
      await page.getByRole('button', { name: '정리하기' }).click()
      await expect(page.getByRole('button', { name: '완료' })).toBeEnabled()
      await page.getByRole('button', { name: '완료' }).click()

      // 대시보드로 복귀 — 조각 1개뿐이라 바로 "이 블록 시작하기" CTA(FragmentChoice 미노출)
      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '이 블록 시작하기' }).click()

      // 4 사전 예측
      await expect(page).toHaveURL(/\/predict$/)
      await page.getByRole('button', { name: '끝날 것 같아요' }).click()
      await expect(page).toHaveURL(/\/focus$/)

      // 5 집중 — TimerDisplay(In-Scope B). 1분 경과 시점으로 고정해 스냅샷 결정론 확보
      // (진행률/퍼센트 없음 — 1-2 기각한 대안 그대로).
      await expect(page.getByText('책상 정리하기')).toBeVisible()
      await page.clock.fastForward(60_000)
      const focusOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(focusOverflow.scrollWidth).toBeLessThanOrEqual(focusOverflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`focus-${width}.png`)

      // 나머지 840초를 마저 흘려보내 시간 기반 완료(CLAUDE §2)를 그대로 트리거 — /retro 진입
      await page.clock.fastForward(840_000)
      await expect(page).toHaveURL(/\/retro$/)

      // 6/7 회고 — StateChip(로컬)·BonusCard(In-Scope C·D)
      await expect(page.getByText('완료')).toBeVisible()
      const retroOverflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(retroOverflow.scrollWidth).toBeLessThanOrEqual(retroOverflow.clientWidth + 1)
      await expect(page).toHaveScreenshot(`retro-${width}.png`)
    })
  }
})
