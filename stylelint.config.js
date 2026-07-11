// PH-04.3 — 간격/색 하드코딩 기계 차단(phases/README.md §0, DESIGN-SYSTEM.md 여백·깊이 규약).
// 포맷팅 규칙(들여쓰기·따옴표 등)은 의도적으로 넣지 않는다 — 이 위상의 범위는 토큰 강제뿐.
export default {
  ignoreFiles: ['src/styles/tokens.generated.css', 'dist/**', 'coverage/**'],
  rules: {
    'declaration-property-value-disallowed-list': {
      '/^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)(-\\w+)?$/': [
        /\d+(\.\d+)?px/,
      ],
      '/^(color|background|background-color|border-color|border-top-color|border-right-color|border-bottom-color|border-left-color|outline-color|fill|stroke|box-shadow)$/':
        [/#[0-9a-fA-F]{3,8}\b/, /\brgba?\(/],
    },
  },
}
