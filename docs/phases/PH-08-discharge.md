# PH-08 — 방전 모드

> **의존:** [PH-05](PH-05-core-loop.md), [PH-06](PH-06-edge-cases.md)
> **SSOT:** [SPEC.md §5 방전 모드](../SPEC.md#5-방전-모드-완전-확정)
> **참고 스킬:** `react-patterns`

## Goal
승리조건 완화("시작=승리") + 회고 전체 스킵 분기가 기존 블록 화면 위에 판정·카피 분기로만 얹히는 상태(새 콘텐츠 없음).

## DO NOT CHANGE (국소)
- PH-05/06 정상 루프 로직 — 방전은 분기만 추가, 대체 아님

## Positive Non-Goals
- 과제를 캔 액션으로 치환하지 않음(SPEC §5 확정)

## Changelog
- **v0.1** — 헤더만 작성.
