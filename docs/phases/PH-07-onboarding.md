# PH-07 — 온보딩 플로우

> **의존:** [PH-05](PH-05-core-loop.md)
> **SSOT:** [SPEC.md §2 온보딩 플로우](../SPEC.md#2-온보딩-플로우-확정) · [SCREEN-FLOW.md §1 화면 1/1-A](../SCREEN-FLOW.md#1-화면상태-인벤토리) · [DECISIONS D-22](../DECISIONS.md#d-22)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) · [§0-1 UI 정량 수용 기준](README.md#0-1-ui-정량-수용-기준-화면컴포넌트-렌더하는-모든-위상-공통--ph-030405060708090-상속)
> **참고 스킬:** `react-patterns`, `frontend-design-direction`

## Goal

면죄부 3화면(공감→면죄부→안심) → "아무거나" 입력 → 쪼개기(PH-05 컴포넌트 재사용) → 대시보드 낙하가 실제 앱의 첫 진입 경로가 되는 상태. 앱을 한 번도 연 적 없는 사용자가 `/`(대시보드)로 가면 온보딩으로 우회되고, 온보딩을 마치면 다시는 뜨지 않는다(로컬 플래그).

## 착수 전 설계 결정 (구현 전 확정 — 아래 체크리스트의 전제)

1. **"1-A 아무거나 입력"은 새로 만들지 않는다 — 이미 `DashboardPage`의 zero-task 분기(`AddTaskPrompt`)가 그 화면이다.** `DashboardPage.tsx:96` 의 `!task` 분기가 정확히 SPEC §2의 "아무거나·사소해도 됨" 문구와 입력창을 이미 렌더한다(PH-05/06에서 구현 완료, SCREEN-FLOW ID 1-A·3-A가 "재구성"으로 표시된 이유 — 최초 진입과 "과제 소진 후 재진입"이 동일 UI를 공유하는 게 설계 의도다). **이번 위상이 유일하게 새로 만드는 화면은 SCREEN-FLOW ID `1`(면죄부 3화면)뿐이다.**
2. **최초 실행 판정 = `localStorage` 불리언 플래그, Storage(IndexedDB) 확장 아님.** `src/lib/onboarding-status.ts`(신규, `active-session-pointer.ts` 패턴 그대로 계승)에 `compace:onboardingComplete` 키로 `isOnboardingComplete()`/`markOnboardingComplete()` 2개 함수만 노출. 계정·서버가 없는 D-26 로컬 우선 원칙과 정합 — 기기별로 온보딩 여부가 독립적으로 남는 것은 허용 범위(재설치 시 다시 봄 = 허용되는 트레이드오프).
3. **라우트 가드는 기존 컨벤션(`<Navigate replace>` 컴포넌트 최상단 조기 반환)을 그대로 따른다, 신규 라우터 미들웨어 없음.** `DashboardPage`에 `if (!isOnboardingComplete()) return <Navigate to={ROUTES.onboarding} replace />`를 최상단에 추가(`SplitPage`/`PredictPage`가 이미 쓰는 "국소 가드" 패턴과 동일 스타일). 대칭적으로 `OnboardingPage`도 `if (isOnboardingComplete()) return <Navigate to={ROUTES.dashboard} replace />`를 추가해, 이미 온보딩을 마친 사용자가 뒤로가기/직접 URL 진입으로 화면 1을 재생하는 것을 막는다.
4. **온보딩 3화면은 새 컴포넌트 1개(`OnboardingPage`) 안의 로컬 스텝 상태(0/1/2)로 구현한다, 신규 라우트 3개 아님.** SCREEN-FLOW가 화면 `1`을 "공감/면죄부/안심" 3개 **상태 변형**으로 묶어 배지 1개로 매긴 것과 정합(`5-B 일시정지`가 새 라우트 없이 `/focus` 안 상태 분기였던 PH-06 선례와 동일 패턴). 각 스텝은 문구 1~2문장 + `Button`(재사용) 1개("다음"/마지막 스텝만 "시작해볼까요") — 신규 프리미티브 없음(`TaskCard`/`Button`만 재사용).
5. **카피는 이번 위상에서 새로 창작한다, 과거 초안(v1.2 아카이브) 문구를 그대로 붙여넣지 않는다.** `docs/_archive/제품 기획-결정 문서 v1.3.md` 8-1의 3문장은 온보딩에 북극성 입력 스텝(4번째)까지 포함했던 **폐기된 v1.2 안**이라 그대로 쓰면 안 된다(북극성 스텝은 SPEC §2에서 명시적으로 제외됨). 3문장의 **주제**(공감→면죄부→안심)만 유지하고 문장 자체는 톤(`CLAUDE.md §4` 따뜻한 큰 어른 톤, 경고·차가운 문구 금지)에 맞춰 새로 쓴다. SPEC.md §체크리스트의 "자체 창작 카피" 미해결 항목을 이 위상에서 닫는다.
6. **북극성 입력 스텝은 만들지 않는다(SPEC §2 명시 제외).** 대시보드 진입 후 북극성을 "선택적으로 더하기"(1-B, PH-09 몫)만 가능 — 온보딩 경로 자체엔 북극성 관련 UI를 일절 두지 않는다.
7. **타이머·회고는 온보딩에 미포함(SPEC §2).** 온보딩의 종료 지점은 "쪼개기 완료 후 대시보드 낙하"이며, 그 뒤 사용자가 "이 블록 시작하기"를 누르는 순간부터는 이미 존재하는 PH-05 루프(예측→집중→회고)로 자연 전이된다 — 이 위상은 그 전이를 강제로 잇는 코드를 추가하지 않는다(사용자가 스스로 누른다).
8. **기존 테스트 2건이 이번 변경으로 깨진다 — 이건 phases/README §2가 명시한 "이번 위상에 허용된 유일한 라우팅 변경"의 직접 결과이므로 수정 대상이지 회귀가 아니다.** `router.test.tsx`의 `"renders the dashboard add-task prompt at '/' with no seeded task"`와 `core-loop.integration.test.tsx`의 대시보드 진입 지점 모두 `initialEntries: [ROUTES.dashboard]`로 직행하는데, 온보딩 게이트가 생기면 온보딩 미완료 상태(기본값)에서 `/`가 `/onboarding`으로 리다이렉트된다. 두 테스트의 `beforeEach`에 `markOnboardingComplete()` 호출(또는 `localStorage.setItem`)을 추가해 "온보딩을 마친 재방문 사용자" 전제를 명시한다 — 이것이 실제 프로덕션에서 정확히 일어날 상태이기도 하다.

## In-Scope (체크리스트)

**A. 온보딩 상태 유틸 (`src/lib/onboarding-status.ts`, 신규)**

- [x] `isOnboardingComplete(): boolean` — `localStorage.getItem('compace:onboardingComplete') === 'true'`
- [x] `markOnboardingComplete(): void` — `localStorage.setItem(...)`
- [x] 유닛 테스트: 기본값(플래그 없음) = false, set 후 true, 여러 번 호출해도 멱등

**B. 온보딩 화면 (`OnboardingPage.tsx`, 전면 재작성 — 현재 `<div>온보딩</div>` 플레이스홀더 교체)**

- [x] 이미 온보딩 완료 상태면 최상단에서 `<Navigate to={ROUTES.dashboard} replace />` (설계 결정 3)
- [x] 로컬 스텝 상태(`useState<0|1|2>`) — 공감(0)/면죄부(1)/안심(2) 3개 화면
- [x] 각 스텝: `TaskCard`류 컨테이너(또는 동등 레이아웃) 안에 문구 1~2문장 + `Button variant="primary"` 1개
- [x] 스텝 0·1의 버튼 라벨 "다음" → `setStep(step + 1)`
- [x] 스텝 2("안심")의 버튼 라벨은 종료 CTA(예: "시작해볼까요") → `markOnboardingComplete()` 호출 후 `navigate(ROUTES.dashboard, { replace: true })`
- [x] 카피 3문장 신규 창작(설계 결정 5) — 공감→면죄부→안심 순서, 경고·처벌·명령형 문구 0건(CLAUDE §4)
- [x] 북극성 관련 UI·문구 0건(설계 결정 6), 타이머/회고 관련 전이 코드 0건(설계 결정 7)
- [x] 유닛 테스트: 완료 상태 진입 시 즉시 리다이렉트, 스텝 0→1→2 전진(뒤로가기 없음 확인), 마지막 스텝에서 `markOnboardingComplete` 호출 + 대시보드 이동 어서션

**C. 대시보드 라우트 가드 (`DashboardPage.tsx`, 국소 수정)**

- [x] 최상단에 `if (!isOnboardingComplete()) return <Navigate to={ROUTES.onboarding} replace />` 추가(설계 결정 3) — 그 아래 기존 `activeBlock`/`task` 분기 로직은 무변경(설계 결정 1). 구현 시 rules-of-hooks 준수를 위해 가드를 모든 훅 호출 **이후**로 배치(SplitPage/PredictPage와 동일한 실제 순서 — 설계 결정 3의 서술은 "최상단"이었지만 실제 컨벤션은 훅 다음 조건부 반환).
- [x] 유닛 테스트: 플래그 없음 → `/onboarding`으로 리다이렉트, 플래그 있음 → 기존 zero-task/task-exists 분기 그대로 동작(회귀)

**D. 기존 테스트 갱신 (설계 결정 8)**

- [x] `router.test.tsx`: 대시보드 관련 `beforeEach`(신규 `describe` 로컬 `beforeEach`)에 `markOnboardingComplete()` 추가, 온보딩 placeholder 케이스(`[ROUTES.onboarding, '온보딩']`)는 제거하고 신규 "router — onboarding gate (PH-07)" describe로 대체
- [x] `router.test.tsx`에 신규 케이스 추가: 플래그 없이 `/`(대시보드) 진입 → 온보딩 화면 1(공감)로 리다이렉트, 플래그 있이 `/onboarding` 진입 → 대시보드로 리다이렉트
- [x] `core-loop.integration.test.tsx`: `beforeEach`에 동일하게 `markOnboardingComplete()` 추가, 나머지 시나리오 로직 무변경
- [x] `router.test.tsx`/`DashboardPage.test.tsx` 최상위 `beforeEach`에서 `localStorage.clear()`로 정리(다른 테스트 간 오염 방지)

**E. 라우터 등록 확인 (`router.tsx`)**

- [x] `ROUTES.onboarding` 엔트리는 이미 존재(변경 없음) — 온보딩 placeholder 문자열이 실제 컴포넌트로 교체됨을 확인

## DO NOT CHANGE (이 위상 국소 — 전역 목록은 README §0 참조)

- `DashboardPage`·`SplitPage`·`PredictPage`·`FocusPage`·`RetroPage`의 가드 이후 내부 로직·props 시그니처(가드 1줄 추가 외 무변경)
- `AddTaskPrompt`(대시보드 zero-task 입력) 컴포넌트 자체 — 재사용만, 신규 카피/로직 추가 없음(설계 결정 1)
- `TimerSlice`/`RetroContextSlice`/Storage 인터페이스 — 이 위상은 순수 라우팅·신규 정적 화면만 건드림
- 디자인 토큰 값(`action`/`evidence.fill` 등) — 신규 색상 조합 없음, 기존 `Button variant="primary"` 그대로 재사용(대비 상속, 재측정 불요)

## Positive Non-Goals

- **북극성 입력 스텝 없음**(SPEC §2 명시 제외 — 온보딩 경로 자체에서 완전히 배제, PH-09 몫)
- **타이머·회고 온보딩 미포함**(SPEC §2) — 온보딩의 마지막 산출물은 "대시보드 낙하"까지
- **온보딩 재생/스킵 버튼 없음** — 한 번 완료하면 설정에서도 다시 볼 수 있는 경로를 만들지 않는다(설정 §PH-09 범위, 이번 위상은 최초 1회 경로만)
- **면죄부 3화면에 애니메이션·일러스트 신규 제작 없음** — 정적 텍스트 + 버튼(담백함, README §0-1 모션 기준은 "없음"으로 자동 통과)
- **다국어/i18n 없음** — 기존 코드베이스 전체가 한국어 하드코딩 관례를 따름(범위 밖)

## 수용 기준 (기계 검증만)

**공통:**

- [x] `npm run typecheck` exit 0
- [x] `npm run lint` exit 0
- [x] `npm run test:coverage` 통과, 커버리지 80%+ 유지 (전체 97.81% stmts / 92.17% branch)
- [x] `npm run build` exit 0

**온보딩 고유:**

- [x] `isOnboardingComplete()` 기본값 false, `markOnboardingComplete()` 후 true — 유닛 테스트
- [x] 플래그 없이 `/` 진입 → `/onboarding` 리다이렉트, 플래그 있이 `/` 진입 → 기존 대시보드 분기 그대로(회귀) — 각각 어서션
- [x] 플래그 있는 상태에서 `/onboarding` 직접 진입 → `/` 리다이렉트(재생 방지)
- [x] 스텝 0→1→2 전진 후 마지막 버튼 클릭 시 `markOnboardingComplete` 호출 1회 + `/`로 navigate 1회 — 스토어/네비게이션 모킹 어서션
- [x] (대비) `Button variant="primary"` 재사용 — `action.text`(#3F382F) on `action`(#E79155) = 4.72:1(PH-04 기존 실측 상속, 재측정 불요) ≥ 4.5:1
- [x] (레이아웃) 3개 스텝 + 대시보드 낙하 + 쪼개기 왕복을 320px·375px 실제 Playwright로 확인 — 가로 스크롤 0, CTA 버튼 ≥44×44px (임시 스펙으로 1회 실행 후 삭제, 커밋 대상 아님)
- [x] (가드레일) `danger|error|warning|fail` 클래스 0건, 부정 문구 0건(공감·면죄부·안심 카피 전부 긍정형 — CLAUDE §4)
- [x] (모션) 신규 UI에 keyframe/transition 애니메이션 없음(정적 텍스트+버튼만)

## Runnable-State 커맨드

```
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

> 완료 선언 전 `npm run build && npm run preview` 후 Playwright(Chromium, 320/375px)로 온보딩 3스텝 → 대시보드 낙하 → 쪼개기 → 대시보드(블록 노출)까지 실제 클릭으로 왕복 확인(PH-05/06 교훈 계승 — jsdom만으론 불충분, [[feedback-verify-mobile-viewport]]).

## Changelog

- **v0.1** — 헤더만 작성, 우선순위 하향 반영.
- **v0.2** — 착수 직전 상세화(작업 계획만, 구현 없음). 설계 결정 8개 확정: 1-A는 신규 화면이 아니라 기존 `DashboardPage` zero-task 분기 재사용임을 명시 · 최초 실행 판정은 `localStorage` 플래그(Storage 확장 아님) · 라우트 가드는 기존 `<Navigate replace>` 컨벤션 계승 · 온보딩 3화면은 신규 라우트가 아니라 컴포넌트 내부 스텝 상태 · 카피는 신규 창작(과거 v1.2 아카이브 문구 그대로 금지, 북극성 스텝 배제) · 북극성/타이머/회고 온보딩 미포함 재확인 · 기존 테스트 2건(`router.test.tsx`/`core-loop.integration.test.tsx`)의 대시보드 직행 전제가 이번 라우팅 변경으로 깨지는 것은 의도된 갱신 대상. In-Scope A~E, DO NOT CHANGE, Positive Non-Goals, 수용 기준 확정.
- **v0.3** — 구현 완료. `src/lib/onboarding-status.ts`(신규) · `OnboardingPage.tsx` 전면 재작성(면죄부 3화면, 신규 창작 카피) · `DashboardPage.tsx`에 온보딩 게이트 1줄 추가. 계획 대비 실제 구현에서 조정된 점 1가지: 설계 결정 3의 "최상단에 가드"라는 서술은 문자 그대로 따르면 `react-hooks/rules-of-hooks` 위반(가드가 이후 `useAppStore`/`useState`/`useEffect` 호출들을 조건부로 만듦)이라, 가드를 모든 훅 호출 **다음**으로 옮겨 SplitPage/PredictPage가 실제로 쓰는 순서(훅 무조건 호출 → 조건부 반환)에 맞췄다 — 동작은 계획과 동일, 코드 위치만 조정. `router.test.tsx`/`core-loop.integration.test.tsx`/`DashboardPage.test.tsx` 갱신, `OnboardingPage.test.tsx`/`onboarding-status.test.ts` 신규 — 전체 210개 테스트 통과, 커버리지 97.81%. `npm run build` 성공 후 Playwright로 320px/375px 온보딩 3스텝→대시보드 낙하→쪼개기→블록 노출까지 실제 클릭 왕복 확인(가로 스크롤 0, CTA ≥44×44px) — 검증용 임시 스펙은 확인 후 삭제, 커밋 대상 아님.
