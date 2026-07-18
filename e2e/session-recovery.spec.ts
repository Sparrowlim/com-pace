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

    test(`15분 이상 경과 후 새로고침 — 5-C 마무리 시트가 다시 뜨고, 확정해야 회고로 이어짐(finish) — ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)

      // 5-C 시트가 뜨기 전에(사용자가 아직 고르기 전에) 새로고침 — 버그 수정(#6) 이후
      // useSessionRecovery.ts의 finish 판정은 곧장 complete()를 호출하지 않고 continue와
      // 동일하게 /focus로 복귀시킨다. FocusPage 재마운트 시 useFocusTimer.detectWrapUp이
      // elapsedSeconds>=FOCUS_SECONDS를 보고 라이브 타이머 경로와 완전히 같은 코드로 5-C
      // 마무리 시트를 다시 띄운다 — 시스템이 자동으로 완료를 확정하지 않는다(SCREEN-FLOW P14).
      await page.clock.fastForward(900_000)
      await page.reload()

      await expect(page).toHaveURL(/\/focus$/)
      await page.getByRole('button', { name: '이 조각 끝났어요' }).click()

      await expect(page).toHaveURL(/\/retro$/)
      await expect(page.getByText('15분, 오늘도 해냈어요.')).toBeVisible()
    })

    // code review 발견(#6 수정 부작용) — 정지 구간은 Storage에 없어 세션 복구가 벽시계 경과만
    // 으로 elapsedSeconds를 계산한다. 일시정지된 채로 15분을 넘긴 블록이 복구되면
    // PauseOverlay·WrapUpOverlay(둘 다 BottomSheet)가 겹쳐 뜨는 걸 막아야 한다.
    test(`일시정지된 채로 15분 이상 경과 후 새로고침 — 마무리 시트가 겹쳐 뜨지 않음 — ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 320 ? 700 : 1024 })
      await enterFocusScreen(page)

      const label = page.getByText('책상 정리하기')
      const box = await label.boundingBox()
      if (!box) throw new Error('타이머 라벨을 찾을 수 없어요')
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.clock.fastForward(600)
      await page.mouse.up()
      await expect(page.getByRole('dialog', { name: '일시정지' })).toBeVisible()

      await page.clock.fastForward(900_000)
      await page.reload()

      // 일시정지 중엔 5-C를 얹지 않는다 — PauseOverlay만, 단독으로
      await expect(page).toHaveURL(/\/focus$/)
      await expect(page.getByText('잠시 멈췄어요')).toBeVisible()
      await expect(page.getByRole('button', { name: '이 조각 끝났어요' })).not.toBeVisible()
      await expect(page.getByRole('button', { name: '아직 남았어요' })).not.toBeVisible()

      // 재개하면(실제로 15분+ 지난 시각 기준) 다음 tick에서 5-C가 정상적으로, 단독으로 뜬다
      await page.getByRole('button', { name: '재개' }).click()
      await page.clock.fastForward(1_000)

      await expect(page.getByRole('button', { name: '이 조각 끝났어요' })).toBeVisible()
      await expect(page.getByText('잠시 멈췄어요')).not.toBeVisible()
    })
  }
})
