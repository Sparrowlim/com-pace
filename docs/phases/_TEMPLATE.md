# PH-xx — [위상 이름]

> **의존:** [PH-yy](PH-yy-xxx.md) (또는 없음)
> **SSOT:** [SPEC.md §n](../SPEC.md#n-제목) · [TECH-SPEC.md §n](../TECH-SPEC.md#n-제목) — 내용 재기술 금지, 링크만.
> **참고 스킬:** (해당 시) `~/.claude/skills/ecc/<skill-name>` — Rules(항상 자동 로드)와 달리 Skills는 온디맨드이므로 여기 명시해야 확실히 트리거됨.
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) DO NOT CHANGE·Runnable State 정의는 여기 반복 안 함.

## Goal

한 문장. 이 위상이 끝나면 무엇이 "돌아가는 상태"가 되는가.

## In-Scope (체크리스트 — 착수 직전 30~50개로 상세화)

- [ ] (착수 전까지는 헤더만. 착수 직전 세션에서 이 목록을 30~50개 하위 항목으로 전개)

## DO NOT CHANGE (이 위상 국소 — 전역 목록은 README §0 참조)

- (이 위상에서 손대면 안 되는 이전 위상 산출물 명시)

## Positive Non-Goals (이번 위상에서 만들지 않는 것)

- (SPEC §12 Post-MVP 항목 중 겹치는 것 인용, 또는 "다음 위상에서 다룸" 명시)

## 수용 기준 (기계 검증만 — 사람 판단 문구 금지)

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm test` 통과, 관련 모듈 커버리지 ≥80%
- [ ] (그 외 이 위상 고유의 정량 기준)

## Runnable-State 커맨드

```
pnpm build && pnpm test
```

## Changelog

- **v0.1** — 최초 작성(헤더만 / 상세 완료).
