# 컴포넌트 카탈로그 (11종) — `C`

> 상위: [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) 허브 · 조립 조합: [`recipes.md`](recipes.md) · 화면별 판단: [`decision-guide.md`](decision-guide.md)
> 각 형태의 "왜 이것이고 왜 다른 형태가 아닌가"는 `../phases/PH-04.4-component-catalog.md` Phase 1 워크시트(페르소나 K 마찰 시나리오·기각 대안)를 참조한다.
> **커버리지 게이트:** SCREEN-FLOW §1의 모든 화면이 아래 11종의 조합만으로 설명 가능해야 한다([`recipes.md`](recipes.md)). 새 화면이 기존 11종으로 설명 안 될 때만 12번째를 신설한다.

## C-기존. 6종 (PH-04, PH-04.3 소급 감사 완료)

| ID   | 컴포넌트                 | 위치                                     | 핵심 규약                                                                                                                                                                                                    | 가드레일 근거                                                                                    |
| ---- | ------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| C-01 | `Button`                 | `src/components/Button`                  | `variant="primary"`만 `elevation.cta`(발광), `secondary`는 아웃라인만 — 테라코타 없음                                                                                                                        | DB-02 하드 · `../DESIGN-TOKENS.md §5-3`                                                          |
| C-02 | `Chip`                   | `src/components/Chip`                    | 선택됨 상태에서만 `elevation.soft`, 기본은 평면                                                                                                                                                              | [`elevation.md`](elevation.md) EL-2                                                              |
| C-03 | `TaskCard`               | `src/components/TaskCard`                | `elevation.card`, 대표 콘텐츠 카드. `border: 1px solid var(--border-raised)`로 배경(`surface-page`)과의 경계 확보. mode-agnostic — 방전 분기는 상위 DOM `[data-mode]`가 처리, 컴포넌트 자체엔 모드 prop 없음 | [`elevation.md`](elevation.md) · [`composition.md`](composition.md) · `../DESIGN-TOKENS.md §4-2` |
| C-04 | `EnergyBar`/`EnergyCell` | `src/components/EnergyBar`, `EnergyCell` | `elevation` 0(무-elevation, 의도), `evidence.fill` 단일 색만(완료/미완료/방전 상태 분기 없음). `filledCount > 0`일 때만 보이는 캡션("오늘 N칸")을 동반                                                       | CLAUDE §2 실패 무처벌 · `../DESIGN-TOKENS.md §5-1`                                               |
| C-05 | `OptionRow`              | `src/components/OptionRow`               | `elevation.inner`, 선택 가능한 낮은 표면(눌린 듯한 미세 깊이)                                                                                                                                                | [`elevation.md`](elevation.md) EL-2                                                              |
| C-06 | `BottomSheet`            | `src/components/BottomSheet`             | `elevation.sheet`, 화면 전체를 덮는 최상단 오버레이                                                                                                                                                          | [`elevation.md`](elevation.md) EL-2                                                              |

## C-신규. 5종 (PH-04.4)

| ID   | 컴포넌트         | 위치                                                                       | 핵심 규약                                                                                                                                                                        | 가드레일 근거                                                             |
| ---- | ---------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| C-07 | `TextInput`      | `src/components/TextInput`                                                 | `surface.raised`+`border.default` 무테두리에 가까운 단일 상태. 포커스는 `border`→`action.ink`(텍스트색 전환, 배경 불변). `required`/`error`/`maxLength` props 자체가 타입에 없음 | CLAUDE §2 결정 피로 차단 · §4 톤 · `../DESIGN-TOKENS.md §5-2` 처벌색 없음 |
| C-08 | `TimerDisplay`   | `src/components/TimerDisplay`                                              | 진행률(링·퍼센트·잔여 블록) 완전 배제 — 분 단위 큰 숫자 + 동사 라벨만. `running`/`paused`(`dark.bgDeep`)/`discharge`(문구만 다름, 크기·서체 동일) 3 variant                      | CLAUDE §1 정체성 경계 · §2 결정 피로 차단 · §6-6(볼거리 금지)             |
| C-09 | `StateChip`      | `src/pages/RetroPage.tsx` 로컬(비공개 — `src/components` 밖, export 안 함) | `RetroPage.tsx` 밖에서 import 불가(파일 위치 + ESLint `no-restricted-imports` 이중 격리). 카피는 "완료"/"이어감"만(실패·미완료 단어 UI 노출 금지)                                | `../DESIGN-TOKENS.md §3 결정#6` 경계 조건 · CLAUDE §2·§4                  |
| C-10 | `BonusCard`      | `src/components/BonusCard`                                                 | `hit=false` → `null` 반환(조건부 렌더가 시그니처 자체에 강제됨, 빈 카드·placeholder 없음)                                                                                        | SCREEN-FLOW §3-2 · `../DESIGN-TOKENS.md §5-4`                             |
| C-11 | `NorthStarBadge` | `src/components/NorthStarBadge`                                            | 열망·의무를 독립된 칩 2개로 나란히 렌더. `Chip.default`와 같은 톤(`chip-bg`/`chip-line`)이지만 `<span>`이라 `onClick` prop이 타입에 존재하지 않음(탭 핸들러 자체가 불가능)       | SPEC §9 "두 좌표 나란히, 순위 없음"(D-19) · CLAUDE §1·§5                  |

---

이력·소급 감사 기록(각 컴포넌트의 elevation 배선 완료·`NorthStarBadge` 재구성 등 버전별 변경)은 [`CHANGELOG.md`](CHANGELOG.md).
