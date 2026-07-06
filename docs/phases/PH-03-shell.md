# PH-03 — 라우팅 & 앱 셸

> **의존:** [PH-02](PH-02-state.md)
> **SSOT:** [TECH-SPEC.md §1 프레임워크·빌드](../TECH-SPEC.md#1-프레임워크--빌드) · [TECH-SPEC.md §5 라우팅](../TECH-SPEC.md#5-라우팅)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙)
> **참고 스킬:** `frontend-patterns`(앱 셸/라우팅 구성)

## Goal

React Router 라우트 골격 + 앱 셸 + PWA manifest/SW 등록이 완성되어, 각 라우트가 (내용 없어도) 최소 동작 placeholder를 실제로 렌더하는 상태. 주석 처리된 미완성 코드 금지 — placeholder는 실제 컴파일·렌더되는 컴포넌트여야 한다.

## In-Scope

- [x] `react-router-dom` 의존성 추가(TECH-SPEC §5)
- [x] `vite-plugin-pwa` 의존성 추가(TECH-SPEC §1, §9)
- [x] `src/routes/paths.ts` — 라우트 경로 상수 (매직 스트링 금지, `common/coding-style.md`): `/onboarding`(1) · `/`(2 대시보드) · `/split`(3) · `/predict`(4) · `/focus`(5) · `/retro`(6/6′/7/7′ 공용, 회고 판정 분기는 PH-05 책임) · `/discharge`(방전 진입) · `/discharge/dashboard`(방전 대시보드) · `/settings`(9)
- [x] SCREEN-FLOW §1 인벤토리 기준 라우트 얕음 유지 — 화면 하위 상태(zero 대시보드, 5-A/5-B, 6/6′/7/7′ 4조합)는 **라우트 분기 아님**, 각 페이지 컴포넌트 내부 상태로 PH-05 이후 처리(Positive Non-Goals 참조)
- [x] `src/pages/*` — 라우트당 placeholder 페이지 컴포넌트 9개 + `NotFoundPage`(라우팅 위생, 화면 인벤토리 외 기술적 보강). 각 파일은 실제 렌더되는 최소 컴포넌트(스크린 이름 텍스트만, 로직 없음) — 주석 처리된 미완성 코드 금지
  - [x] `src/pages/OnboardingPage.tsx`
  - [x] `src/pages/DashboardPage.tsx`
  - [x] `src/pages/SplitPage.tsx`
  - [x] `src/pages/PredictPage.tsx`
  - [x] `src/pages/FocusPage.tsx`
  - [x] `src/pages/RetroPage.tsx`
  - [x] `src/pages/DischargeEntryPage.tsx`
  - [x] `src/pages/DischargeDashboardPage.tsx`
  - [x] `src/pages/SettingsPage.tsx`
  - [x] `src/pages/NotFoundPage.tsx`
- [x] 화면(feature) 단위 lazy import(`React.lazy`) 적용 — 번들 스플리팅(TECH-SPEC §1), 특히 `FocusPage`는 최소 번들 우선 로드 원칙 유지(배터리 5% K 대응, `web/performance.md`)
- [x] `src/app/AppShell.tsx` — 공통 레이아웃(현재는 `<Outlet />`만 렌더하는 얇은 래퍼, 헤더/네비 없음 — 이 앱은 상시 네비 구조가 없는 선형 흐름이라 셸 자체엔 시각 요소 없음, DESIGN-TOKENS 미적용 상태와 정합) + `<Suspense>` 경계(lazy 페이지 로딩 fallback)
- [x] `src/app/router.tsx` — `createBrowserRouter`로 `AppShell` 하위에 10개 라우트 등록(위 경로 상수 참조), `*` catch-all → `NotFoundPage`
- [x] `src/main.tsx` — `RouterProvider` 연결(기존 `<App />` 직접 렌더 대체) + `persistStorage()`(PH-01 `src/storage/persist.ts`) 앱 부팅 시 1회 호출 연결(PH-01 문서에 "호출은 PH-03에서 연결"로 명시된 항목)
- [x] `src/App.tsx` 제거 또는 역할 정리 — 라우팅이 `router.tsx`/`AppShell`로 이전되므로 기존 placeholder(`<div>컴페이스</div>`) 컴포넌트는 더 이상 엔트리 역할 아님(빈 파일 잔존 금지, YAGNI)
- [x] `vite.config.ts` — `VitePWA` 플러그인 등록: `registerType: 'autoUpdate'`, `manifest`(`name`/`short_name`/`description`/`start_url`/`display: 'standalone'`/`background_color`/`theme_color`/`icons`)
- [x] manifest 색상은 기존 확정 토큰 원시값 재사용(파이프라인은 PH-04 소관, 여기선 상수만) — `background_color` = `color.paper #E7DECF`, `theme_color` = `color.accent.500 #E79155`(D-24 "햇살 톤" 정합)
- [x] `public/icon.svg` — 임시 placeholder 아이콘(단색 마크, 브랜딩 확정 아님) 1개, manifest `icons` 배열에 `sizes: "192x192"`/`"512x512"` 두 엔트리로 재사용(SVG는 scalable — 별도 PNG 래스터화 없이 설치 요건 충족, 최종 아이콘은 PH-04/09에서 교체)
- [x] `index.html` — `<link rel="icon">` 등 파비콘 참조를 `public/icon.svg`로 연결
- [x] `src/routes/router.test.tsx` (또는 `src/app/router.test.tsx`) — `createMemoryRouter`로 10개 라우트 각각 진입 시 대응 placeholder가 실제 렌더되는지 검증(라우트 스모크 테스트, RTL)
- [x] `src/storage/persist.test.ts` 기존 테스트 외 — `main.tsx` 부팅 경로에서 `persistStorage()` 호출 자체는 통합 테스트 범위 밖(단순 부팅 시퀀스, PH-01에서 이미 함수 자체는 단위 테스트 완료)

## DO NOT CHANGE (국소)

- PH-01/PH-02 산출물
- PH-01 `Storage` 인터페이스·5종 타입, PH-02 5개 슬라이스 상태/액션 시그니처(전역 승격 완료, README §0)

## Positive Non-Goals

- 실제 화면 로직 없음(PH-05 이후가 내용을 채움) — 각 페이지는 화면 이름만 렌더하는 텍스트 placeholder
- 디자인 토큰 적용 없음(PH-04 병행/이후) — `AppShell`/페이지에 CSS Modules·토큰 CSS 변수 미적용, manifest 색상은 예외적으로 확정 원시값만 재사용(위 In-Scope 참조, 파이프라인 자체는 미도입)
- 라우트 하위 상태 분기 없음 — zero 대시보드, 타이머 3상태, 회고 4조합, 방전 색 차분 등은 페이지 내부 상태(PH-05~08 책임), 라우트를 쪼개지 않는다
- 온보딩→대시보드 등 실제 네비게이션 트리거(버튼 클릭 시 `navigate()`) 없음 — 화면 간 실제 전이 로직은 PH-05 이후 각 화면이 완성되며 연결
- Zustand 스토어와 페이지 연결 없음(PH-05 이후)
- Service Worker 커스텀 캐싱 전략 없음 — `vite-plugin-pwa` 기본 `generateSW`/`autoUpdate` 그대로, Workbox 세부 튜닝은 다루지 않음(YAGNI)

## 수용 기준 (기계 검증만)

- [x] `npm run build` exit 0 (PWA 플러그인 포함 빌드)
- [x] `npm run test src/app src/routes src/pages` 전체 통과(라우트 스모크 테스트)
- [x] `npm run lint` exit 0
- [x] `npm run typecheck` exit 0
- [x] 빌드 산출물(`dist/`)에 `manifest.webmanifest`·서비스워커 스크립트 생성 확인(수동 확인, 자동화 테스트 범위 밖)

## Runnable-State 커맨드

```
npm run build && npm run test src/app src/routes src/pages
```

## Changelog

- **v0.1** — 헤더만 작성.
- **v0.2** — 착수 직전 상세화. 10개 라우트(SCREEN-FLOW §1 인벤토리 + NotFound) 확정, `AppShell`은 시각 요소 없는 `<Outlet/>` 래퍼로 범위 한정(네비 구조 없는 선형 흐름 앱 특성 반영), PWA manifest 색상은 D-24/DESIGN-TOKENS 확정 원시값만 예외적으로 차용(파이프라인은 PH-04 그대로 소관).
- **v0.3** — 구현 완료. `react-router-dom`/`vite-plugin-pwa` 추가, 10개 라우트(`src/routes/paths.ts` + `src/app/router.tsx`) + `AppShell` + 페이지별 lazy import 구현. `persistStorage()`를 `main.tsx` 부팅 시퀀스에 연결(PH-01에서 유예됐던 항목). `vite.config.ts`에 `VitePWA` manifest 등록, `public/icon.svg` 임시 아이콘 추가. `npm run build`(PWA manifest/SW 생성 확인) · `npm run test` · `npm run lint` · `npm run typecheck` 모두 exit 0. 라우트 스모크 테스트 10개 전체 통과.
