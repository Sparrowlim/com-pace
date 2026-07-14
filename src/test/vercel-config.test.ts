import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const vercelConfigPath = resolve(process.cwd(), 'vercel.json')

function readVercelConfig(): {
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
} {
  return JSON.parse(readFileSync(vercelConfigPath, 'utf-8'))
}

function findHeaderRule(config: ReturnType<typeof readVercelConfig>, source: string) {
  return config.headers.find((rule) => rule.source === source)
}

describe('vercel.json — SPA rewrite (실배포 404 실증 후 추가)', () => {
  test('모든 경로가 index.html로 폴백해 클라이언트 라우팅 딥링크/새로고침이 404 나지 않는다', () => {
    const config = readVercelConfig()
    const rewrite = config.rewrites?.find((r) => r.source === '/(.*)')
    expect(rewrite?.destination).toBe('/index.html')
  })
})

describe('vercel.json — cache header contract (TECH-SPEC §9)', () => {
  test('sw.js and workbox runtime are never cached so updates propagate immediately', () => {
    const config = readVercelConfig()
    for (const source of ['/sw.js', '/workbox-(.*).js']) {
      const rule = findHeaderRule(config, source)
      const cacheControl = rule?.headers.find((h) => h.key === 'Cache-Control')?.value
      expect(cacheControl).toContain('no-cache')
    }
  })

  test('manifest.webmanifest is never cached', () => {
    const config = readVercelConfig()
    const rule = findHeaderRule(config, '/manifest.webmanifest')
    const cacheControl = rule?.headers.find((h) => h.key === 'Cache-Control')?.value
    expect(cacheControl).toContain('no-cache')
  })

  test('hashed build assets are cached immutably', () => {
    const config = readVercelConfig()
    const rule = findHeaderRule(config, '/assets/(.*)')
    const cacheControl = rule?.headers.find((h) => h.key === 'Cache-Control')?.value
    expect(cacheControl).toContain('immutable')
  })
})
