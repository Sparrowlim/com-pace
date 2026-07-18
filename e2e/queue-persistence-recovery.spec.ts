/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// 베타 적합도 감사(2026-07-18) CRITICAL 발견 — `queuedBlocks`는 IndexedDB 쓰기가 전혀 없는 순수
// Zustand 인메모리 상태이고(src/store/slices/block-queue-slice.ts), `tasks`는 생성 시 IDB에
// 쓰지만 부팅 시 재하이드레이션하는 코드가 없다. useSessionRecovery.ts는 활성 타이머 세션
// 포인터 하나만 복구할 뿐(주석: "tasks/queuedBlocks 전체 복구는 의도적으로 하지 않는다") — 그
// 결과 과제를 쪼갠 뒤 타이머가 안 도는 상태(대시보드)에서 새로고침/앱 재기동이 일어나면 아직
// 시작 안 한 조각들이 영구히 사라지고, resolveActiveTaskView가 AddTaskPrompt(온보딩과 동일한
// "새 과제" 화면)로 조용히 대체해 데이터 손실이 티가 안 난다. 페르소나 K("배터리 5%")의 일상적
// 사용 패턴(앱을 자주 들락날락)과 정확히 겹치는 손실이라 베타 첫 주 감지 위험이 높다.
const VIEWPORT_WIDTHS = [320, 768] as const

async function completeOnboarding(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('button', { name: '시작해볼까요' }).click()
}

test.describe('대기 중인 조각 큐 영구 소실 재현 (베타 적합도 감사 CRITICAL)', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '뷰포트는 테스트 내부에서 직접 지정')
  })

  for (const width of VIEWPORT_WIDTHS) {
    test(`조각 2개 쪼개기 → 타이머 미시작 상태로 새로고침 → 자기선택 화면 보존 — ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboarding(page)

      await page.getByRole('textbox').fill('집안일')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page).toHaveURL(/\/split$/)
      await page.getByRole('textbox').fill('책상')
      await page.getByRole('button', { name: '정리하기' }).click()
      await page.getByRole('textbox').fill('메일')
      await page.getByRole('button', { name: '쓰기' }).click()
      await page.getByRole('button', { name: '완료' }).click()

      await expect(page).toHaveURL('/')
      await expect(page.getByText('어떤 조각부터 해볼까요? 만만한 걸로 골라봐요')).toBeVisible()

      await page.reload()

      // 버그: 새로고침 후 tasks/queuedBlocks가 하이드레이션되지 않아 zero 대시보드
      // (AddTaskPrompt)로 조용히 리셋된다 — 쪼갠 두 조각이 사라진다.
      await expect(page.getByRole('heading', { name: '집안일' })).toBeVisible()
      await expect(page.getByText('어떤 조각부터 해볼까요? 만만한 걸로 골라봐요')).toBeVisible()
      await expect(page.getByRole('button', { name: '책상 정리하기' })).toBeVisible()
      await expect(page.getByRole('button', { name: '메일 쓰기' })).toBeVisible()
    })

    test(`조각 1개 쪼개기 → 타이머 미시작 상태로 새로고침 → 시작 CTA 보존 — ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboarding(page)

      await page.getByRole('textbox').fill('청소')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page).toHaveURL(/\/split$/)
      await page.getByRole('textbox').fill('책상')
      await page.getByRole('button', { name: '정리하기' }).click()
      await page.getByRole('button', { name: '완료' }).click()

      await expect(page).toHaveURL('/')
      await expect(page.getByRole('button', { name: '이 블록 시작하기' })).toBeVisible()

      await page.reload()

      // 버그: 조각 1개짜리 과제도 새로고침 한 번에 사라지고 AddTaskPrompt로 대체된다.
      await expect(page.getByRole('heading', { name: '청소' })).toBeVisible()
      await expect(page.getByRole('button', { name: '이 블록 시작하기' })).toBeVisible()
    })

    test(`조각 2개 중 1개 완료 후 대시보드 복귀 → 새로고침 → 남은 조각 보존 — ${width}px`, async ({
      page,
    }) => {
      await page.clock.install()
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await completeOnboarding(page)

      await page.getByRole('textbox').fill('집안일')
      await page.getByRole('button', { name: '다음' }).click()

      await expect(page).toHaveURL(/\/split$/)
      await page.getByRole('textbox').fill('책상')
      await page.getByRole('button', { name: '정리하기' }).click()
      await page.getByRole('textbox').fill('메일')
      await page.getByRole('button', { name: '쓰기' }).click()
      await page.getByRole('button', { name: '완료' }).click()

      await expect(page).toHaveURL('/')
      await page.getByRole('button', { name: '책상 정리하기' }).click()

      await expect(page).toHaveURL(/\/predict$/)
      await page.getByRole('button', { name: '끝날 것 같아요' }).click()

      await expect(page).toHaveURL(/\/focus$/)
      await page.clock.fastForward(900_000)
      await page.getByRole('button', { name: '이 조각 끝났어요' }).click()

      await expect(page).toHaveURL(/\/retro$/)
      await page.getByRole('button', { name: '바로 다음 블록' }).click()

      // 남은 조각(메일 쓰기)으로 곧장 예측(4)을 경유한다 — 아직 시작 전이므로 여기서 새로고침
      await expect(page).toHaveURL(/\/predict$/)
      await expect(page.getByText('이번 15분: 메일 쓰기')).toBeVisible()

      await page.reload()

      // 버그: 진행 중이던 타이머가 없으니 activeSessionPointer가 비어 있고, queuedBlocks도
      // 하이드레이션되지 않아 남은 조각(메일 쓰기)이 사라진다 — /predict가 대시보드로 튕긴 뒤
      // AddTaskPrompt(zero)가 뜬다.
      await expect(page).toHaveURL(/\/predict$/)
      await expect(page.getByText('이번 15분: 메일 쓰기')).toBeVisible()
    })
  }
})
