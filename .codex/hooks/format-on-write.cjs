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
  if (!filePath) process.exit(0)

  spawnSync(process.execPath, [resolveBin('prettier'), '--write', '--ignore-unknown', filePath], {
    stdio: 'ignore',
  })
  process.exit(0)
})
