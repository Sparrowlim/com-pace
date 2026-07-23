let raw = ''
process.stdin.on('data', (chunk) => (raw += chunk))
process.stdin.on('end', () => {
  let input
  try {
    input = JSON.parse(raw || '{}')
  } catch {
    // Malformed payload: fail open. This is a code-quality guard, not a
    // security control, so we must not risk blocking every future Write.
    process.exit(0)
  }

  const content = (input.tool_input && input.tool_input.content) || ''
  const lineCount = content.split('\n').length

  if (lineCount > 800) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `파일이 800줄을 초과합니다(${lineCount}줄). 더 작은 모듈로 분리하세요.`,
        },
      }),
    )
  }
  process.exit(0)
})
