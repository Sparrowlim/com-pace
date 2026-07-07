# PH-04 — 디자인 토큰 파이프라인 & UI 프리미티브

> **의존:** 없음 (PH-03과 독립적으로 병행 가능)
> **SSOT:** [TECH-SPEC.md §6 디자인 토큰 파이프라인](../TECH-SPEC.md#6-디자인-토큰-파이프라인) · [TECH-SPEC.md §7 스타일링](../TECH-SPEC.md#7-스타일링) · `DESIGN-TOKENS.md` · `DESIGN-BRIEF.md`
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) · [§0-1 UI 정량 수용 기준](README.md#0-1-ui-정량-수용-기준-화면컴포넌트-렌더하는-모든-위상-공통--ph-030405060708090-상속)
> **참고 스킬:** `frontend-patterns`, `frontend-design-direction`

## Goal

Style Dictionary → CSS 변수 파이프라인이 동작하고, 공용 UI 프리미티브(`Button`·`Chip`·`TaskCard`·`EnergyCell`/`EnergyBar`·`OptionRow`·`BottomSheet` — DESIGN-TOKENS §10-5 확정 목록)가 DESIGN-TOKENS **semantic 계층 값만** 참조해 렌더되는 상태.

## 착수 전 실측 결과 (중요 — 체크리스트 전제)

PH-04가 실제로 만들 `Button`(CTA)·`EnergyCell`에 axe-core 대비 검증을 걸기 전에, README §0-1① 기준으로 토큰 값을 실측했다(계산: WCAG 상대휘도 공식, `sRGB` 선형화 — `src/test/contrast.ts`로 코드화, `src/test/contrast.test.ts`로 검증).

- **CTA 수정 완료:** `action.text`(구 `color.accent.on` #FFF7EE) on `action`(#E79155) = **2.31:1**로 §0-1① 기준(≥4.5:1) 미달 확인 → `DESIGN-TOKENS.md` §3·§9를 `action.text = color.ink.900`로 재매핑, **4.72:1**로 통과(배경 `action` 자체는 불변, DB-02 브랜드 색 유지). 상세: `DESIGN-TOKENS.md` §10-3·Changelog v0.3.
- **미해결 — `evidence.fill` 비텍스트 대비:** `evidence.fill`(#E79B62) vs `surface.base`(#F6F1E6) = **2.01:1**, vs `surface.page`(#E7DECF) = **1.70:1** — §0-1② 기준(≥3:1) 미달. `evidence.ring` 상시 테두리 보완도 표면별 편차가 커 불충분. §5-1(상태별 분기 금지)은 지키되 hex 자체 재조정이 필요해 보이나, 제품의 상징색이라 브리프/사용자 승인 없이 이 위상에서 임의로 바꾸지 않는다. `EnergyCell.test.tsx`는 이 두 비율을 `toBeCloseTo`로 **고정(characterization test)** — 통과/실패 게이트가 아니라 "지금 이 값"을 기록해 향후 실수로 바뀌면 잡아내는 용도.
- **기록만(수정 없음):** `text.quiet`(#B5A78E) on `surface.base` = 2.10:1 — §0-1① "의도적 조용 요소" 면제 대상.

## 구현 중 발견 & 수정 (착수 후, 완료 시점 기준 기록)

- **`semantic.action` DTCG 규격 위반:** 한 노드가 `$value`(CTA 배경)와 자식 토큰(`text`/`ink`/`tint`)을 동시에 가짐 — DTCG는 이를 허용하지 않아 Style Dictionary가 자식들을 통째로 무시했다(빌드는 성공하지만 `--action-text`/`--action-ink`/`--action-tint`가 통째로 누락되는 조용한 실패). Tailwind 관례를 따라 `action.DEFAULT`로 배경값을 분리(`DESIGN-TOKENS.md` §8·§9), Style Dictionary 포맷 함수가 `DEFAULT` 세그먼트를 벗겨 변수명은 그대로 `--action`으로 되돌린다.
- **`chip.bg`/`chip.line` semantic 승격 누락:** primitive(`color.chip.*`, §2-4)는 있었는데 semantic 테이블(§3)에 행이 없어 `Chip` 컴포넌트가 자기 색을 참조할 방법이 없었다. 값 변경 없이 semantic 행만 추가(`DESIGN-TOKENS.md` §3·§9, Changelog v0.4).
- **jsdom 레이아웃 한계:** `getBoundingClientRect()`는 jsdom에서 항상 0을 반환하고(실제 레이아웃 엔진 없음), Vitest 기본 설정(`css` 옵션 미설정)에서는 CSS Modules 스타일시트가 테스트 DOM에 주입되지 않아 `getComputedStyle()`도 값을 못 읽는다. **44×44 타깃·트랜지션 duration·색 매핑 검증은 모두 CSS 모듈 소스 텍스트를 직접 정규식으로 읽는 방식**으로 통일(`tokens.generated.test.ts`와 동일 패턴) — 실제 렌더 좌표/computed style 검증은 PH-05+ Playwright 몫으로 명시적으로 미룬다.
- **`vitest-axe@0.1.0` 타입 비호환:** 이 패키지의 `toHaveNoViolations()` 앰비언트 타입이 pre-v3 Vitest의 전역 `Vi` 네임스페이스를 확장하는데, 설치된 `vitest@4.1.10`은 이 컨벤션을 안 씀 — 타입체크 실패. `expect.extend` 등록을 걷어내고, `src/test/axe.ts`의 `runAxe()` 헬퍼로 `axe()` 결과의 `.violations` 배열 길이를 직접 단언하는 방식으로 대체(런타임 동작은 동일). 같은 헬퍼에서 jsdom에 canvas가 없어 `color-contrast` 룰이 내부적으로 조용히 스킵되는 것도 명시적으로 비활성화(노이즈 제거, 대비는 §10-3/10-4 수동 계산이 정본).
- **RTL 자동 cleanup 미동작:** `vitest.config.ts`에 `test.globals`가 없어 `@testing-library/react`가 전역 `afterEach`를 못 찾고 자동 cleanup을 등록하지 않았다 — 한 테스트의 DOM이 다음 테스트로 새는 버그(`getByRole` "found multiple elements"로 발현). `test.globals: true` 추가로 해결(기존 파일들의 명시적 `import { describe, it } from 'vitest'`는 그대로 유지, 충돌 없음).
- **`TaskCard`는 `variant` prop을 갖지 않는다:** 최초 체크리스트는 `variant?: 'default' | 'discharge'`를 계획했으나, 방전 모드 오버레이는 `[data-mode="discharge"]` 조상 스코프가 CSS 캐스케이드로 전부 처리한다(DESIGN-TOKENS §4-2) — 컴포넌트가 모드를 아예 몰라야 구조적으로 §4-2를 지킨다. `TaskCard.test.tsx`가 소스에 `discharge`/`variant` 문자열이 없음을 단언해 이 경계를 고정한다.
- **`@testing-library/user-event` 추가 설치:** `OptionRow`의 클릭 상호작용 테스트에 필요(react/testing.md 권장 — `fireEvent` 대신 `userEvent`).

## In-Scope

**A. 토큰 파이프라인**

- [x] `tokens/design-tokens.json` — `DESIGN-TOKENS.md §9` DTCG JSON 블록을 그대로 분리(내용 재기술 금지, 원본과 동기화 유지)
- [x] `style-dictionary` devDependency 추가(TECH-SPEC §6, v5.5.0)
- [x] `tokens/style-dictionary.config.js` — 커스텀 포맷(`compace/css-tokens`) 1개로 `:root`/`[data-mode="focus"]`/`[data-mode="discharge"]` 3블록을 한 파일에 조립(v5의 `files[].filter`+`selector` 조합은 파일당 1블록이라 여러 destination이 필요해지므로, 대신 `dictionary.allTokens`를 직접 partition하는 커스텀 포맷 함수로 단일 파일 산출):
  - [x] `:root` 블록 — `font`·`radius`·`space`·`elevation`(box-shadow 문자열로 조합)·`duration`·`easing`·`semantic`(color) 그룹만 포함
  - [x] `[data-mode="focus"]` 블록 — `mode-focus` 그룹만
  - [x] `[data-mode="discharge"]` 블록 — `mode-discharge` 그룹만
  - [x] 원시 `color.*`(primitive) 그룹은 **어떤 출력 파일에도 포함하지 않음** — alias 해석에는 쓰이되 CSS 변수로 노출되지 않음(§1 "화면은 semantic만 참조"를 CSS 레벨에서 물리적으로 강제)
  - [x] `transformGroup: 'css'` 그대로 사용(`fontFamilyCss`/`cubicBezierCss`/`shadowCssShorthand` 등 내장 변환이 DTCG 객체·배열 값을 올바른 CSS 문자열로 변환 — `duration`은 `$type: 'duration'`이라 내장 `time/seconds` 변환(`$type: 'time'` 전용)과 충돌하지 않아 `260ms` 원문 그대로 보존됨을 확인)
- [x] `src/styles/tokens.generated.css` — 빌드 산출물(커밋 대상, 파일 상단에 AUTO-GENERATED 배너)
- [x] `package.json` scripts: `"tokens:build"`, `"predev"`/`"prebuild"`에 연결(수동 체이닝 없이 `npm run dev`/`build` 시 자동 재생성)
- [x] `src/index.css`에 `@import './styles/tokens.generated.css';` 연결(전역 1회 로드)
- [x] `src/styles/tokens.generated.test.ts` (Vitest) — 생성된 CSS를 `readFileSync`로 직접 읽어(`?raw` import는 Vite의 CSS 플러그인과 충돌해 빈 문자열을 반환함을 확인 — Node `fs` 사용으로 우회) 가드레일 정규식 검증:
  - [x] `[data-mode="focus"]` 블록 안에 `--action:`/`--evidence-fill:` 없음
  - [x] `[data-mode="discharge"]` 블록 안에 `--action:`/`--evidence-fill:` 없음
  - [x] `--color-`로 시작하는 변수 0건(primitive 비노출)
  - [x] `--danger`/`--error`/`--warning`/`--fail` 0건
  - [x] `--evidence-fill` 정확히 1곳에서만 선언

**B. 접근성 자동화 하네스**

- [x] `axe-core`(4.12.1) + `vitest-axe`(0.1.0) devDependency 추가
- [x] `src/test/axe.ts`의 `runAxe()` 헬퍼로 대체 등록(위 "구현 중 발견" — `toHaveNoViolations` 타입 비호환 + jsdom color-contrast 무의미 스킵 대응)
- [x] Playwright 레벨 axe 통합은 이 위상 범위 밖(PH-05 이후)

**C. UI 프리미티브 (DESIGN-TOKENS §10-5 확정 목록 6종, `src/components/<Name>/`)**

각 프리미티브 공통: presentational-only, CSS Modules + `tokens.generated.css` 변수만 참조, `index.ts` 재수출, `.test.tsx`(RTL 렌더 + `runAxe` + 소스 레벨 토큰/타깃 어서션).

- [x] `Button` — `variant: 'primary' | 'secondary'`, `primary`=`action`+`action.text`, `secondary`=`surface.raised`+`border.default` 아웃라인, 44px 타깃, `:focus-visible`은 `action.ink`(3:1+ 확보)
- [x] `Chip` — `variant: 'default' | 'selected'`, `chip.bg`/`chip.line` 기본 · 선택 시 `action.tint`/`action.ink`, `radius.pill`, `data-variant` 속성으로 상태 검증(해시된 CSS Module 클래스명은 `toHaveClass` 부분일치가 안 돼 속성 기반으로 전환)
- [x] `TaskCard` — `title`+`children`만(모드 프롭 없음, 위 "발견" 참조), `radius.2xl`+`elevation.card`
- [x] `EnergyCell`(원자)+`EnergyBar`(래퍼) — `EnergyCell`은 `filled`/`justFilled?` 2개 boolean만(상태별 색 분기 타입 자체가 없음, §5-1 타입 레벨 강제), `aria-hidden` 데코레이티브 + `data-filled`/`data-just-filled` 테스트용 속성. `EnergyBar`는 `filledCount`+`justFilledIndex?`, `role="group" aria-label`로 접근성 라벨 1곳에 집중, 빈 칸 미리보기 렌더 없음(append-only라 index key 안전 — 주석으로 근거 남김)
- [x] `OptionRow` — `label`+`selected`+`onSelect?`, `aria-pressed`로 토글 상태 노출(그룹 role은 조립 시점 PH-05 몫), 44px 타깃
- [x] `BottomSheet` — `isOpen`+`children`, `isOpen=false`면 `null` 반환, `elevation.sheet` 전용 소비처, 포커스 트랩/ESC/애니메이션 없음(Positive Non-Goals)

## DO NOT CHANGE (국소)

- `DESIGN-TOKENS.md`의 값 자체(이 위상은 소비만, 값 재정의 금지) — 특히 `action`/`evidence.fill`. **예외:** 착수 전·중 실측으로 반영된 `action.text` 재매핑, `action.DEFAULT` 구조 수정, `chip.bg`/`chip.line` semantic 승격은 모두 값 변경이 아니라 DTCG 규격 준수·누락 보완이며 PH-04 시작 전/중 DESIGN-TOKENS.md 자체를 고친 것 — 이후 이 값들을 다시 바꾸는 것은 금지.
- PH-00~03 산출물(라우트·스토어·저장소 시그니처)

## Positive Non-Goals

- 화면 조립 없음(PH-05 이후) — 대시보드·쪼개기·예측·집중·회고 화면 자체는 만들지 않음
- Zustand 스토어·라우팅 연결 없음 — 모든 프리미티브는 props만 받는 순수 표현 컴포넌트
- Playwright e2e/시각 회귀 없음 — 이 위상의 접근성·대비 검증은 Vitest+jsdom 컴포넌트 단위로 대체, 실제 렌더 좌표·computed style 검증은 PH-05+ 몫
- `BottomSheet` 포커스 트랩·ESC 닫기·열림/닫힘 애니메이션 없음(PH-06)
- `evidence.fill` hex 재조정 없음 — 미해결 항목은 기록만(§10-4)
- Storybook 등 컴포넌트 카탈로그 도구 도입 없음(YAGNI)

## 미결 사항 (해결됨 — 기록용)

- **`EnergyBar` 빈 칸 렌더링 방식:** "채워진 칸만 렌더, 다음 칸 미리보기 없음"으로 구현 확정(`EnergyBar.test.tsx`가 `filledCount`개 초과 렌더 없음을 단언).

## 수용 기준 (기계 검증만)

**공통:**

- [x] `npm run typecheck` exit 0
- [x] `npm run lint` exit 0
- [x] `npm run test` 통과(97개), 전체 커버리지 100%(`npm run test:coverage`)
- [x] `npm run build` exit 0(`prebuild`가 `tokens:build` 선행 실행)

**토큰 파이프라인 고유:**

- [x] `src/styles/tokens.generated.test.ts` 5개 어서션 전부 통과

**UI 프리미티브 고유 (README §0-1 상속, 이 위상 실측값):**

- [x] `Button` primary: `action.text`(#3F382F) on `action`(#E79155) = **4.72:1** ≥ 4.5:1(수동 WCAG 계산, `contrast.test.ts`로 고정 — axe-core의 `color-contrast`는 jsdom 제약으로 비활성화, 근거는 위 "구현 중 발견")
- [x] `Button`/`Chip`/`OptionRow` 44×44 타깃 — CSS 소스 레벨 검증(jsdom 레이아웃 한계로 실제 좌표는 PH-05 Playwright 몫)
- [x] `text.quiet` on `surface.base` = **2.10:1** — 4.5:1 면제·기록
- [x] `EnergyCell` 트랜지션이 `var(--duration-cell) var(--easing-quiet)`이고 reduced-motion 블록이 `transition-duration: 0s`인지 소스 검증
- [x] `EnergyCell` `evidence.fill` 비텍스트 대비(2.01:1/1.70:1) — characterization test로 고정, 실패 게이트 아님(§10-4)
- [x] 가드레일: `danger|error|warning|fail` 토큰 0건 · `evidence.fill` 배경색 선언이 CSS 소스에 정확히 1곳(상태 분기 없음)

## Runnable-State 커맨드

```
npm run tokens:build && npm run build && npm run test:coverage
```

## Changelog

- **v0.1** — 헤더만 작성.
- **v0.2** — 착수 직전 상세화. 착수 전 WCAG 실측으로 `DESIGN-TOKENS.md`의 `action.text` 재매핑(§10-3 이행, CTA 대비 2.31→4.72:1) 및 `evidence.fill` 비텍스트 대비 미달(1.70~2.01:1) 발견·기록(§10-4, 해결 보류). Style Dictionary 파이프라인 + axe-core/vitest-axe 신규 도입 + DESIGN-TOKENS §10-5 확정 프리미티브 6종 체크리스트 확정.
- **v0.3** — 구현 완료, Runnable State 통과. Style Dictionary v5 커스텀 포맷으로 3-selector 단일 파일 산출(`primitive color` 비노출 확인), `semantic.action` DTCG 위반 발견·`action.DEFAULT` 구조로 수정, `chip.bg`/`chip.line` semantic 승격 누락 발견·보완, `vitest-axe` 타입 비호환 발견·`runAxe()` 헬퍼로 대체, RTL 자동 cleanup 미동작 발견·`vitest.config.ts` `globals: true`로 수정, jsdom 레이아웃/computed-style 한계로 44px·트랜지션·색 검증을 CSS 소스 텍스트 정규식 검증으로 통일, `TaskCard`는 `variant` prop 없이 순수 CSS 캐스케이드로 모드 대응하도록 설계 변경. 6개 프리미티브(Button/Chip/TaskCard/EnergyCell·EnergyBar/OptionRow/BottomSheet) 전부 구현, 테스트 97개·커버리지 100%·빌드/린트/타입체크 전부 통과.
- **v0.4** — code-reviewer 적용(CRITICAL/HIGH 0건, 승인). MEDIUM 1건 반영: `DESIGN-TOKENS.md` §8·§9 서문이 "스택 미확정·Style Dictionary 분리는 미래 작업"이라고 낡게 서술하던 것을 PH-04에서 이미 채택·구현 완료로 갱신. LOW 1건 반영: `src/test/contrast.ts`가 커버리지 제외 대상 디렉토리(`src/test/`)에 있던 실제 로직이라 `src/lib/contrast.ts`로 이동(기존 `src/lib/id.ts`·`time.ts` 컨벤션과 정합), 커버리지 집계에 포함되도록 수정(테스트 97개·커버리지 100% 유지 확인). 나머지 LOW 1건(포커스 링 대비 미테스트)은 정보성으로 남겨둠.
