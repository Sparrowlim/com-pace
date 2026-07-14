// web/performance.md 번들 예산("앱 페이지"): JS < 300kb gzip, CSS < 50kb gzip.
// 대상은 dist/index.html이 초기 로드에서 직접 참조하는 entry 자산만이다 — 라우트별
// lazy chunk(PredictPage/RetroPage 등)는 온디맨드 로드라 초기 예산에 포함하지 않는다.
import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

const JS_BUDGET_BYTES = 300 * 1024
const CSS_BUDGET_BYTES = 50 * 1024

const distDir = resolve(process.cwd(), 'dist')
const indexHtmlPath = resolve(distDir, 'index.html')

if (!existsSync(indexHtmlPath)) {
  console.error('[check-bundle-budget] dist/index.html not found — run `npm run build` first')
  process.exit(1)
}

const html = readFileSync(indexHtmlPath, 'utf-8')

function extractEntryPaths(pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1])
}

const jsPaths = extractEntryPaths(/<script[^>]+src="(\/assets\/[^"]+\.js)"/g)
const cssPaths = extractEntryPaths(/<link[^>]+href="(\/assets\/[^"]+\.css)"/g)

// code review MEDIUM — Vite의 index.html 출력 형식이 바뀌어 정규식이 매치 0건이 되면
// sumGzipBytes([])가 0을 반환해 "0.00kb / 300kb — OK"로 조용히 통과해버린다. 검사 대상
// 자체를 못 찾은 경우는 예산 통과가 아니라 게이트 실패로 취급한다.
if (jsPaths.length === 0 || cssPaths.length === 0) {
  console.error(
    `[check-bundle-budget] entry 자산을 찾지 못함(JS ${jsPaths.length}건, CSS ${cssPaths.length}건) — dist/index.html 형식이 바뀌었는지 확인`,
  )
  process.exit(1)
}

function gzipSizeOf(assetPath) {
  const filePath = resolve(distDir, `.${assetPath}`)
  const contents = readFileSync(filePath)
  return gzipSync(contents).length
}

function sumGzipBytes(assetPaths) {
  return assetPaths.reduce((total, assetPath) => total + gzipSizeOf(assetPath), 0)
}

const jsBytes = sumGzipBytes(jsPaths)
const cssBytes = sumGzipBytes(cssPaths)

function report(label, bytes, budgetBytes) {
  const kb = (bytes / 1024).toFixed(2)
  const budgetKb = (budgetBytes / 1024).toFixed(0)
  const status = bytes <= budgetBytes ? 'OK' : 'OVER BUDGET'
  console.log(`[check-bundle-budget] ${label}: ${kb}kb gzip / ${budgetKb}kb budget — ${status}`)
  return bytes <= budgetBytes
}

const jsOk = report('entry JS', jsBytes, JS_BUDGET_BYTES)
const cssOk = report('entry CSS', cssBytes, CSS_BUDGET_BYTES)

if (!jsOk || !cssOk) {
  process.exit(1)
}
