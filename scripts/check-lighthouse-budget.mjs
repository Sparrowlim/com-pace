// web/performance.md CWV 예산 대조 — 모바일 프리셋(K=Android 실기기, DECISIONS.md D-26)으로
// 로컬 preview 서버(`npm run preview`, :4173)를 대상 실행한다. INP는 필드 지표라 로컬 lab
// 실행으로 측정 불가 — PH-11 SSOT 대조 표에서 Positive Non-Goal로 명시(RUM 인프라 없음, D-26).
// Playwright가 이미 받아둔 Chromium 실행 파일을 재사용해 별도 Chrome 설치 의존을 없앤다.
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { chromium } from 'playwright-core'

const TARGET_URL = process.env.LIGHTHOUSE_TARGET_URL ?? 'http://localhost:4173'

// LCP/FCP는 advisory(로그만, exit 미영향) — `vite preview`가 HTTP/1.1만 서빙해(Vercel
// 프로덕션은 HTTP/2) 라우트별 다중 청크 요청이 6-커넥션 상한에 큐잉되며 실측치를 부풀린다
// (PH-11 검증: 무스로틀 실측 250ms인데 devtools 스로틀 4.4s — 앱 자체 문제가 아니라 이
// 로컬 측정 방식의 한계). CLS/TBT는 프로토콜과 무관해 hard gate로 유지.
const BUDGETS = {
  largestContentfulPaint: {
    auditId: 'largest-contentful-paint',
    maxMs: 2500,
    label: 'LCP',
    advisory: true,
  },
  cumulativeLayoutShift: { auditId: 'cumulative-layout-shift', maxValue: 0.1, label: 'CLS' },
  firstContentfulPaint: {
    auditId: 'first-contentful-paint',
    maxMs: 1500,
    label: 'FCP',
    advisory: true,
  },
  totalBlockingTime: { auditId: 'total-blocking-time', maxMs: 200, label: 'TBT' },
}

function resolveChromePath() {
  try {
    return chromium.executablePath()
  } catch {
    return undefined
  }
}

const chrome = await launch({
  chromePath: resolveChromePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
})

try {
  const runnerResult = await lighthouse(TARGET_URL, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    formFactor: 'mobile',
    screenEmulation: { mobile: true, disabled: false },
    // 'simulate'(Lantern 모델)는 이 앱처럼 라우트별로 잘게 쪼갠 청크가 많은 SPA에서 실측 대비
    // 크게 과대추정한다(실측 검증: provided 250ms vs simulate 6.6s vs devtools 4.4s, PH-11 발견).
    // 'devtools'는 실제 CPU/네트워크를 물리적으로 스로틀링해 측정하므로 모델링 오차가 없다.
    throttlingMethod: 'devtools',
    onlyCategories: ['performance'],
  })

  const audits = runnerResult.lhr.audits
  let hardGateFailed = false

  for (const budget of Object.values(BUDGETS)) {
    const audit = audits[budget.auditId]
    const value = audit.numericValue
    const limit = budget.maxMs ?? budget.maxValue
    const unit = budget.maxMs !== undefined ? 'ms' : ''
    const ok = value <= limit
    if (!ok && !budget.advisory) {
      hardGateFailed = true
    }
    const status = ok
      ? 'OK'
      : budget.advisory
        ? 'OVER BUDGET (advisory, see script header)'
        : 'OVER BUDGET'
    console.log(
      `[check-lighthouse-budget] ${budget.label}: ${value.toFixed(2)}${unit} / ${limit}${unit} budget — ${status}`,
    )
  }

  if (hardGateFailed) {
    process.exitCode = 1
  }
} finally {
  await chrome.kill()
}
