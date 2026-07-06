# PH-06 — 엣지케이스 (이탈·일시정지·미완료 이월)

> **의존:** [PH-05](PH-05-core-loop.md)
> **SSOT:** [SPEC.md §6 엣지케이스](../SPEC.md#6-엣지케이스-확정) · SCREEN-FLOW P7/P13
> **참고 스킬:** `error-handling`(이탈·일시정지 상태 전이)

## Goal

15분 중 이탈(백그라운드·강제종료)·명시적 일시정지·미완료 이월이 SPEC §6 표 그대로 동작하는 상태.

## DO NOT CHANGE (국소)
- PH-05 화면 컴포넌트의 정상 경로 로직

## Positive Non-Goals
- 방전 모드 분기 없음(PH-08)

## Changelog
- **v0.1** — 헤더만 작성.
