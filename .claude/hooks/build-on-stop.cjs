const { spawnSync } = require('node:child_process')

const result = spawnSync('npm', ['run', 'build'], { encoding: 'utf8', shell: true })

if (result.status !== 0) {
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
  console.log(
    JSON.stringify({
      decision: 'block',
      reason: `빌드가 실패했습니다. 세션을 종료하기 전에 고쳐주세요:\n${output}`,
    }),
  )
}
process.exit(0)
