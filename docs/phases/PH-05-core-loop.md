# PH-05 — 핵심 루프 화면 (대시보드·쪼개기·예측·집중·회고)

> **의존:** [PH-02](PH-02-state.md), [PH-03](PH-03-shell.md), [PH-04](PH-04-tokens-ui.md)
> **SSOT:** [SPEC.md §3 핵심 루프](../SPEC.md#3-핵심-루프-확정--ssot) · [SPEC.md §4 화면별 확정 명세](../SPEC.md#4-화면별-확정-명세) · [SCREEN-FLOW.md](../SCREEN-FLOW.md) 화면 2/3/4/5/6/6′/7/7′
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙)
> **우선순위:** 사용자 결정(2026-07-06)으로 온보딩(PH-07)보다 먼저 착수. 재정렬 근거는 [phases/README.md §2](README.md#2-순서-변경-근거-재정렬-로그).
> **참고 스킬:** `react-patterns`, `react-testing`, `frontend-design-direction`, `error-handling`(타이머 이탈·저장 실패 처리), `react-performance`

## Goal

온보딩 없이도 — 테스트 픽스처로 시드된 과제 1개 상태에서 — 대시보드→쪼개기→예측→집중(15분 타이머)→회고까지 전체 루프가 실제로 동작하고 Storage에 반영되는 상태. (착수 직전 30~50개 체크리스트로 상세화 예정. 항목은 SPEC §3·§4·SCREEN-FLOW 화면 2/3/4/5/6/6′/7/7′를 그대로 분해해서 채운다.)

## DO NOT CHANGE (국소)

- PH-01~04 산출물 전부 (Storage 인터페이스, slice 계약, 라우트 골격, 디자인 토큰 값)

## Positive Non-Goals

- **온보딩 UI 없음** — 대시보드 진입은 테스트 픽스처로 과제 1개를 Storage에 직접 시드해서 연다. 실제 온보딩 플로우(면죄부 3화면 등)는 PH-07에서 이 화면들을 재사용해 감싼다.
- 엣지케이스(이탈·일시정지·미완료 이월) 세부 로직 없음 — PH-06에서 확장
- 방전 모드 분기 없음 — PH-08에서 확장
- 기록/통계 페이지 없음 (SPEC §12 Post-MVP 스코프아웃)

## Changelog
- **v0.1** — 헤더만 작성, 우선순위 상향 반영. PH-02~04 완료 후 상세화.
