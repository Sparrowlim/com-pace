# PH-02 — 상태관리 (Zustand slice)

> **의존:** [PH-01](PH-01-storage.md)
> **SSOT:** [TECH-SPEC.md §2 상태관리](../TECH-SPEC.md#2-상태관리)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙)
> **참고 스킬:** `frontend-patterns`(Zustand 상태관리 섹션)

## Goal

`taskSlice`/`timerSlice`/`energySlice`/`predictionSlice`/`sessionSlice`가 PH-01 Storage와 동기화되며, UI 없이 단위 테스트로 전이 로직이 검증되는 상태. (착수 직전 30~50개 체크리스트로 상세화 예정)

## DO NOT CHANGE (국소)

- PH-01 `Storage` 인터페이스 시그니처, 5종 데이터 타입 필드명

## Positive Non-Goals

- UI 없음(PH-03 이후)
- 온보딩·방전 등 화면별 특수 분기 없음(PH-05 이후)

## Changelog
- **v0.1** — 헤더만 작성. PH-01 완료 후 상세화.
