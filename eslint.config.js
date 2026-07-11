import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'playwright-report', 'test-results'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // PH-04.4 1-3/§5-5 — StateChip은 RetroPage.tsx 로컬 전용. 회고 화면 밖으로 새면 그린/퍼플
    // 인정색이 성적표처럼 각인된다(DESIGN-TOKENS §3 결정#6). 파일 위치만으론 재사용을 못 막으므로
    // import 자체를 lint 레벨에서 차단한다.
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/pages/RetroPage.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // `paths`는 특정 상대경로 문자열만 정확히 매칭한다 — `src/components/<Name>/`처럼
          // 다른 깊이에서 쓴 `../../pages/RetroPage`는 놓친다(code review 발견). `patterns`의
          // glob은 앞의 `../` 세그먼트 수와 무관하게 매칭되므로 깊이에 상관없이 잡는다.
          patterns: [
            {
              group: ['**/pages/RetroPage'],
              importNames: ['StateChip'],
              message: 'StateChip은 RetroPage.tsx 로컬 전용입니다(PH-04.4 §1-3).',
            },
          ],
        },
      ],
    },
  },
)
