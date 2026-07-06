# PH-04 — 디자인 토큰 파이프라인 & UI 프리미티브

> **의존:** 없음 (PH-03과 독립적으로 병행 가능)
> **SSOT:** [TECH-SPEC.md §6 디자인 토큰 파이프라인](../TECH-SPEC.md#6-디자인-토큰-파이프라인) · [TECH-SPEC.md §7 스타일링](../TECH-SPEC.md#7-스타일링) · `DESIGN-TOKENS.md` · `DESIGN-BRIEF.md`
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙)
> **참고 스킬:** `frontend-patterns`, `frontend-design-direction`

## Goal

Style Dictionary → CSS 변수 파이프라인이 동작하고, 공용 UI 프리미티브(Button/Card/EnergyCell 등)가 DESIGN-TOKENS 값만 참조해 렌더되는 상태.

## DO NOT CHANGE (국소)

- `DESIGN-TOKENS.md`의 값 자체(이 위상은 소비만, 값 재정의 금지) — 특히 `action`/`evidence.fill`

## Positive Non-Goals

- 화면 조립 없음(PH-05 이후가 이 프리미티브를 사용)

## Changelog
- **v0.1** — 헤더만 작성.
