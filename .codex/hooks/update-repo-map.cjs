const fs = require('node:fs')
const path = require('node:path')

const ROOT = process.cwd()
const OUT_FILE = path.join(ROOT, '.claude', 'skills', 'repo-structure', 'GENERATED.md')
const WATCHED_PREFIXES = ['src', 'docs'].map((p) => p + path.sep)
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage'])

function isWatchedPath(filePath) {
  const rel = path.relative(ROOT, filePath)
  return WATCHED_PREFIXES.some((prefix) => rel.startsWith(prefix))
}

// Depth-limited walk: full detail near the root, collapsed counts further down,
// so GENERATED.md stays small (and cheap to Read) no matter how the repo grows.
function walk(dir, depth, maxDepth) {
  let entries
  try {
    entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => !IGNORE_DIRS.has(e.name))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }

  const dirs = entries.filter((e) => e.isDirectory())
  const files = entries.filter((e) => e.isFile())
  const lines = []

  for (const file of files) {
    lines.push(`${'  '.repeat(depth)}${file.name}`)
  }

  for (const sub of dirs) {
    const subPath = path.join(dir, sub.name)
    if (depth >= maxDepth) {
      const count = countFiles(subPath)
      lines.push(`${'  '.repeat(depth)}${sub.name}/ (+${count} files)`)
      continue
    }
    lines.push(`${'  '.repeat(depth)}${sub.name}/`)
    lines.push(...walk(subPath, depth + 1, maxDepth))
  }

  return lines
}

function countFiles(dir) {
  let count = 0
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !IGNORE_DIRS.has(e.name))
  } catch {
    return 0
  }
  for (const e of entries) {
    if (e.isDirectory()) count += countFiles(path.join(dir, e.name))
    else count += 1
  }
  return count
}

function render() {
  const lines = [
    '<!-- 자동 생성 파일 — 손으로 수정하지 말 것. .claude/hooks/update-repo-map.cjs가 Write 훅에서 재생성한다. -->',
    `<!-- 마지막 생성: ${new Date().toISOString()} -->`,
    '',
    '## src/',
    '```',
    ...walk(path.join(ROOT, 'src'), 0, 2),
    '```',
    '',
    '## docs/',
    '```',
    ...walk(path.join(ROOT, 'docs'), 0, 1),
    '```',
    '',
  ]
  return lines.join('\n')
}

let raw = ''
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  let input
  try {
    input = JSON.parse(raw || '{}')
  } catch {
    process.exit(0)
  }

  const filePath = input.tool_input && input.tool_input.file_path
  if (!filePath || !isWatchedPath(filePath)) process.exit(0)

  try {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
    fs.writeFileSync(OUT_FILE, render(), 'utf8')
  } catch {
    // Best-effort cache; never block the Write tool call over this.
  }
  process.exit(0)
})
