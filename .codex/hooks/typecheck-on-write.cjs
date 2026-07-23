const { spawnSync } = require('node:child_process')
const { resolveBin } = require('./resolve-bin.cjs')

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
  if (!filePath || !/\.(ts|tsx)$/.test(filePath)) process.exit(0)

  const result = spawnSync(
    process.execPath,
    [resolveBin('typescript', 'tsc'), '-b', '--noEmit', '--pretty', 'false'],
    { encoding: 'utf8' },
  )

  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
    console.log(
      JSON.stringify({
        decision: 'block',
        reason: `타입 에러가 남아 있습니다:\n${output}`,
      }),
    )
  }
  process.exit(0)
})
