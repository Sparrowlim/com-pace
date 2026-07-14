/// <reference lib="dom" />
import { test, expect } from '@playwright/test'

// PH-11 — phases/README.md §0-1④ "SW/오프라인": 오프라인 리로드가 캐시에서 문서 200 서빙,
// manifest.webmanifest 200·유효 파싱. 뷰포트 무관(네트워크 계층 검증)이라 단일 프로젝트로
// 스코프(TaskCard/zero-dashboard 선례와 동일하게 4-매트릭스 중복 실행 방지).
test.describe('PWA — SW 오프라인 캐싱 & manifest', () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright의 fixture-skip 관용구(공식 문서 패턴)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-320', '네트워크 계층 검증, 뷰포트 무관')
  })

  test('manifest.webmanifest는 200으로 응답하고 필수 필드를 포함해 유효 파싱된다', async ({
    page,
  }) => {
    const response = await page.request.get('/manifest.webmanifest')
    expect(response.status()).toBe(200)

    const manifest = await response.json()
    expect(manifest.name).toBe('컴페이스')
    expect(manifest.start_url).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  test('오프라인 상태에서 리로드해도 캐시된 문서를 200으로 서빙한다', async ({ page, context }) => {
    // 첫 방문 — SW 등록·설치·활성화(+ 앱 셸 precache) 대기
    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)

    await context.setOffline(true)
    const response = await page.reload()

    expect(response?.status()).toBe(200)
    await expect(page.locator('#root')).not.toBeEmpty()

    await context.setOffline(false)
  })
})
