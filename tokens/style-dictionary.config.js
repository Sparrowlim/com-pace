import StyleDictionary from 'style-dictionary'

// 최종 CSS 변수 선언에서 그룹 래퍼를 벗겨낼 top-level 그룹.
// semantic/mode-focus/mode-discharge는 "래퍼"일 뿐 변수명에 남기지 않는다.
// (예: semantic.surface.base → --surface-base, mode-focus.surface.base → --surface-base)
// font/radius/space/elevation/duration/easing은 래퍼가 아니라 그 자체가 최종 이름이라 유지한다.
const WRAPPER_GROUPS = new Set(['semantic', 'mode-focus', 'mode-discharge'])

// 이 그룹들만 :root(기본)로 나간다. 원시 color.* primitive는 의도적으로 어떤 파일에도 내보내지 않는다 —
// alias 해석에만 쓰이고 CSS 변수로는 존재하지 않아야 화면이 semantic 계층만 참조할 수 있다(DESIGN-TOKENS.md §1).
const ROOT_GROUPS = new Set([
  'font',
  'radius',
  'space',
  'elevation',
  'duration',
  'easing',
  'semantic',
])

function cssVarName(token) {
  const withoutWrapper = WRAPPER_GROUPS.has(token.path[0]) ? token.path.slice(1) : token.path
  // DTCG는 한 노드가 $value와 자식 토큰을 동시에 갖는 걸 허용하지 않는다(예: action이 배경값이면서
  // text/ink/tint 자식도 가짐). Tailwind 관례를 따라 "DEFAULT" 세그먼트로 분리해뒀으므로 변수명에서는 벗겨낸다
  // (semantic.action.DEFAULT → --action, DESIGN-TOKENS.md §8 참조).
  const segments = withoutWrapper.filter((segment) => segment !== 'DEFAULT')
  return segments.join('-')
}

function cssVarLine(token) {
  const value = token.$value ?? token.value
  return `  --${cssVarName(token)}: ${value};`
}

function cssBlock(selector, tokens) {
  if (tokens.length === 0) return ''
  return `${selector} {\n${tokens.map(cssVarLine).join('\n')}\n}\n`
}

StyleDictionary.registerFormat({
  name: 'compace/css-tokens',
  format: ({ dictionary }) => {
    const banner =
      '/**\n' +
      ' * AUTO-GENERATED — 직접 수정 금지.\n' +
      ' * 소스: tokens/design-tokens.json (DESIGN-TOKENS.md §9와 동기화 유지)\n' +
      ' * 재생성: npm run tokens:build\n' +
      ' */\n\n'

    const root = dictionary.allTokens.filter((token) => ROOT_GROUPS.has(token.path[0]))
    const focus = dictionary.allTokens.filter((token) => token.path[0] === 'mode-focus')
    const discharge = dictionary.allTokens.filter((token) => token.path[0] === 'mode-discharge')

    return (
      banner +
      cssBlock(':root', root) +
      '\n' +
      cssBlock('[data-mode="focus"]', focus) +
      '\n' +
      cssBlock('[data-mode="discharge"]', discharge)
    )
  },
})

export default {
  source: ['tokens/design-tokens.json'],
  usesDtcg: true,
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.generated.css',
          format: 'compace/css-tokens',
        },
      ],
    },
  },
}
