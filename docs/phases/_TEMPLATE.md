# PH-xx — [위상 이름]

> **의존:** [PH-yy](PH-yy-xxx.md) (또는 없음)
> **SSOT:** [SPEC.md §n](../SPEC.md#n-제목) · [TECH-SPEC.md §n](../TECH-SPEC.md#n-제목) — 내용 재기술 금지, 링크만.
> **참고 스킬:** (해당 시) `~/.claude/skills/ecc/<skill-name>` — Rules(항상 자동 로드)와 달리 Skills는 온디맨드이므로 여기 명시해야 확실히 트리거됨.
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) DO NOT CHANGE·Runnable State 정의는 여기 반복 안 함.

## Goal

한 문장. 이 위상이 끝나면 무엇이 "돌아가는 상태"가 되는가.

## SPEC 커버리지 표 (착수 직전 필수 — [README §0 SPEC 커버리지 게이트](README.md#0-전역-규칙-모든-위상-공통--개별-ph-파일에서-반복-서술-금지) 참조)

> 이 위상이 인용한 SSOT 절(`SPEC.md §n`)의 문장/화살표를 전부 나열하고, 각각을 In-Scope 항목 / 착수 전 설계 결정 / Positive Non-Goals 중 정확히 하나에 배정한다. 어디에도 없는 문장이 남으면 상세화 미완료.

| SPEC 문장/화살표                         | 매핑 위치                                      | 비고                |
| ---------------------------------------- | ---------------------------------------------- | ------------------- |
| (예: "쪼개진 것 중 만만한 1개 자기선택") | In-Scope B-3 / 설계 결정 4 / Positive Non-Goal | (단순화했다면 사유) |

## In-Scope (체크리스트 — 착수 직전 30~50개로 상세화)

- [ ] (착수 전까지는 헤더만. 착수 직전 세션에서 이 목록을 30~50개 하위 항목으로 전개)

## DO NOT CHANGE (이 위상 국소 — 전역 목록은 README §0 참조)

- (이 위상에서 손대면 안 되는 이전 위상 산출물 명시)

## Positive Non-Goals (이번 위상에서 만들지 않는 것)

- (SPEC §12 Post-MVP 항목 중 겹치는 것 인용, 또는 "다음 위상에서 다룸" 명시)

## 수용 기준 (기계 검증만 — 사람 판단 문구 금지)

**공통(모든 위상):**

- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0
- [ ] `npm run test` 통과, 관련 모듈 커버리지 ≥80%
- [ ] SPEC 커버리지 표의 모든 행이 실제 구현과 일치(완료 선언 직전 재확인 — README §0 SPEC 커버리지 게이트 2단계)

**UI 위상 추가(화면·컴포넌트 렌더 시 — [README §0-1 UI 정량 수용 기준](README.md#0-1-ui-정량-수용-기준-화면컴포넌트-렌더하는-모든-위상-공통--ph-030405060708090-상속) 베이스라인을 상속. 아래엔 이 위상 고유 수치만, `___`를 실측·구체값으로 채운다):**

- [ ] (대비·상호작용) 예 `Button` 라벨 `action.text`(#FFF7EE) on `action`(#E79155) = `___`:1 ≥ 4.5:1 · axe-core `color-contrast` 위반 0
- [ ] (대비·조용요소 기록) 예 `text.quiet`(#B5A78E) on `surface.base`(#F6F1E6) = `1.7`:1 — 4.5:1 **면제·의식적 수락**(침묵 규칙, README §0-1 ①)
- [ ] (레이아웃) 이 위상 화면이 320·360·390·768px에서 가로 스크롤 0 · 뷰포트 오버플로 요소 0
- [ ] (타깃) 이 화면 상호작용 요소 전부 ≥ 44×44 CSS px
- [ ] (모션·해당 시) reduced-motion에서 점등 `transition-duration` === 0s / 기본 === 260ms
- [ ] (상태 어서션·해당 시) 예 활성 과제 없이 `/focus` 진입 → `/dashboard` 리다이렉트
- [ ] (가드레일 어서션) 처벌색·부정 표식 0 · (해당 시) 에너지 fill 상태 스냅샷 간 computed color 불변
- [ ] (시각 회귀·해당 시) 핵심 화면 스크린샷 `maxDiffPixelRatio ≤ 0.001`

## Runnable-State 커맨드

```
npm run build && npm run test
```

> UI 위상은 위 커맨드에 e2e(Playwright)를 잇는다: `&& npx playwright test`(또는 확정된 `test:e2e` 스크립트).

## Changelog

- **v0.1** — 최초 작성(헤더만 / 상세 완료).
- **v0.2** — 수용 기준을 공통/UI 위상 2블록으로 분리. UI 블록은 README §0-1 상속 + 대비·레이아웃·타깃·모션·상태·시각회귀·가드레일 어서션의 복사용 폼(실측 `___` 자리) 제공. 커맨드 `pnpm`→`npm`(PH-00 확정), UI 위상 e2e 연결 주석 추가.
- **v0.3** — PH-05 "만만한 1개 자기선택"(SPEC §3·D-05) 누락 사고 이후 SPEC 커버리지 표 신설(README §0 SPEC 커버리지 게이트와 연동). 착수 직전에 SSOT 절의 모든 문장을 In-Scope/설계 결정/Non-Goal 중 하나로 강제 배정, 완료 선언 직전 재확인 체크박스를 공통 수용 기준에 추가.
