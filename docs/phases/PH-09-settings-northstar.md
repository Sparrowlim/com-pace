# PH-09 — 설정 & 북극성

> **의존:** [PH-04](PH-04-tokens-ui.md)
> **SSOT:** [SPEC.md §7 설정 페이지](../SPEC.md#7-설정-페이지-확정) · [SPEC.md §9 북극성 취급](../SPEC.md#9-북극성-취급-확정) · [DECISIONS D-19](../DECISIONS.md#d-19) · [DECISIONS D-26](../DECISIONS.md#d-26)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙-모든-위상-공통--개별-ph-파일에서-반복-서술-금지) · [§0-1 UI 정량 수용 기준](README.md#0-1-ui-정량-수용-기준-화면컴포넌트-렌더하는-모든-위상-공통--ph-030405060708090-상속)
> **참고 스킬:** `react-patterns`, `frontend-design-direction`

## Goal

양가 목표(의무·열망) 설정 + 북극성 선택적 정적 라벨이 동작하는 상태. 대시보드에 설정 진입점이 생기고, 설정에서 양가 목표를 수정하러 갈 수 있고, 북극성이 있으면 대시보드 상단에 정적 라벨로만(진행 측정 없이) 표시되며, 없으면 초대 톤 링크만 보인다. 알림은 기본 꺼짐 + 카피 가드 문구가 붙은 2지선다까지만(실제 발송 배선은 이번 위상 범위 밖).

## SSOT 발췌 (원문 미개봉 자족성)

**SPEC 발췌 (§7):**

> "양가 목표(수정): 단일 최종 목표 -> 의무·열망 두 좌표 나란히, 순위 없음(D-19, 대시보드 두 칩과 정합)."
> "알림(유지·우수): 기본 꺼둠 + 재촉/확인 안 함 · pull-only 카피 유지. opt-in 시 알림 내용이 N일째 안 오셨어요 류로 새지 않게 카피 가드 명시."
> "목표·라벨 선택 + 둘 다 비우면 배지·라벨 사라지고 핵심 루프만 — 유지." · "대시보드 메뉴: 기록 항목 제거, 설정만." · "계정 설정은 post-MVP."

**SPEC 발췌 (§9):**

> "의미만 담당 — 진행 측정기 아님. 얼마나 왔나·도달률·책갈피식 어디쯤 표시 금지. 한 발짝 증거는 에너지 바가 담당."
> "역할: 정적 방향 좌표 + K를 열망에 재접속(재촉 아니라 재접속). 빈 북극성은 유도(압박)가 아니라 허용(초대) 톤으로만."
> "MVP 범위: 상단 선택적 정적 라벨 + 양가 칩 + 건너뛰기. 블록-방향 맥락 태그·진행 mechanic은 post-MVP."

**DECISIONS 발췌 (D-19):** "북극성 단수 강요 금지. 의무·열망 둘 다 또는 아직 모르겠어요까지 허용, 순위 강요 없음, 건너뛰기 가능."

**SCREEN-FLOW 전이 발췌 (§2 mermaid · §1 인벤토리 · §3-3):**

| 현재상태         | 이벤트                               | 다음상태         | §참조 |
| ---------------- | ------------------------------------ | ---------------- | ----- |
| 대시보드(2)      | 북극성 더하기(선택)                  | 1-B 북극성(선택) | §2    |
| 1-B 북극성(선택) | 입력 / 건너뛰기                      | 대시보드(2)      | §2    |
| 대시보드(2)      | 설정 메뉴                            | 9 설정           | §2    |
| 9 설정           | 뒤로                                 | 대시보드(2)      | §2    |
| 9 설정           | 양가 목표 수정(의무·열망, 순위 없음) | 1-B 북극성(선택) | §2    |

> §1 인벤토리: 1-B 상태 변형 = 열망만/의무만/둘 다/모르겠어요/비움. §3-3: 대시보드 축1(북극성) = 북극성O(상단 정적 라벨, 진행측정 아님) / 북극성없음(라벨 없음, 북극성 더하기(선택·초대 톤)만). §1 화면 9: "양가 목표(둘 다 선택)·라벨·알림(기본 OFF)".

## SPEC 커버리지 표 (착수 직전 — SSOT = SPEC 문장 ∪ SCREEN-FLOW 전이)

| SPEC 문장 / SCREEN-FLOW 전이                                        | 매핑 위치                       | 비고                                                                           |
| ------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| §7 양가 목표: 의무·열망 두 좌표, 순위 없음                          | In-Scope C·E · 설계 결정 2·3    | 순위 UI 없음(D-19), 두 필드 나란히                                             |
| §7 알림 기본 꺼둠 + pull-only 카피 유지 + 카피 가드                 | In-Scope E · 설계 결정 5        | 실제 발송 배선 없음 — 값 저장까지만                                            |
| §7 목표·라벨 선택 + 둘 다 비우면 배지·라벨 사라짐                   | In-Scope D · 설계 결정 6        | hasNorthStar 파생값으로 배지 조건부 렌더                                       |
| §7 대시보드 메뉴: 기록 제거, 설정만                                 | In-Scope D · 설계 결정 4        | 기록 메뉴는 애초에 존재한 적 없음(신규 추가 금지로 회귀 방지)                  |
| §7 계정 설정은 post-MVP                                             | Positive Non-Goals              | UI 자체를 만들지 않음                                                          |
| §9 진행 측정기 아님, 도달률·책갈피 표시 금지                        | In-Scope C·D · 설계 결정 6      | 배지는 순수 텍스트, 클릭·진행 인터랙션 0                                       |
| §9 정적 방향 좌표 + 재접속, 빈 북극성은 초대 톤                     | In-Scope C·D                    | 초대 링크 카피(재촉 아닌 허용 톤)                                              |
| §9 MVP 범위: 정적 라벨 + 양가 칩 + 건너뛰기, 진행 mechanic post-MVP | In-Scope C · Positive Non-Goals | 블록 맥락 태그 없음                                                            |
| D-19 둘 다/모르겠어요 허용, 순위 강요 없음, 건너뛰기 가능           | 설계 결정 2 · In-Scope C        | 모르겠어요는 별도 상태 추적 안 함(빈 문자열과 표시 동일 취급, 근거는 결정 2)   |
| 전이: 대시보드 -> 1-B(북극성 더하기)                                | In-Scope D                      | 초대 링크                                                                      |
| 전이: 1-B -> 대시보드(입력/건너뛰기)                                | In-Scope C · 설계 결정 3        | 저장·건너뛰기 모두 대시보드로 귀결(다이어그램에 설정으로 돌아가는 화살표 없음) |
| 전이: 대시보드 -> 9 설정(설정 메뉴)                                 | In-Scope D · 설계 결정 4        | 대시보드에 메뉴 자체가 없었으므로 이번 위상이 신규 추가                        |
| 전이: 9 설정 -> 대시보드(뒤로)                                      | In-Scope E                      |                                                                                |
| 전이: 9 설정 -> 1-B(양가 목표 수정)                                 | In-Scope E                      | 설정 자체엔 입력 폼 없음, 편집은 1-B로 위임                                    |

## 전이 -> 명명 테스트 (RED 먼저)

| SSOT 전이/문장                                        | 이음새 | 명명 테스트                                                           |
| ----------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| 대시보드 -> 1-B(북극성 더하기), 북극성 없을 때만 노출 | 1      | dashboard shows the invite link only when north star is empty         |
| 북극성 있으면 대시보드에 정적 배지, 없으면 배지 0     | 3      | dashboard renders a static north star label with zero progress markup |
| 1-B 저장 -> saveNorthStar 호출 + 대시보드로 이동      | 2      | north star page saves both fields and returns to dashboard            |
| 1-B 건너뛰기 -> 대시보드로 이동, 값 미변경(또는 비움) | 2      | north star page skip navigates to dashboard without forcing a value   |
| 대시보드 -> 9 설정(설정 진입점)                       | 2      | dashboard exposes a settings entry point                              |
| 9 설정 -> 1-B(양가 목표 수정)                         | 2      | settings links to the north star edit screen, not an inline form      |
| 9 설정 -> 대시보드(뒤로)                              | 2      | settings back button returns to dashboard                             |
| 알림 기본값 = 꺼짐                                    | 1      | notification preference defaults to off                               |
| 알림 카피에 재촉/확인형 문구 0건                      | 3      | settings renders zero nagging or check-in copy for notifications      |
| 북극성 관련 화면 어디에도 도달률/진행 수치 렌더 0건   | 3      | north star surfaces render zero progress or percentage markup         |

> 이음새: 1 = 순수 셀렉터/슬라이스(Vitest) · 2 = 라우트·상태 전이(Playwright/RTL 라우터) · 3 = 불변식 어서션(Vitest+axe).

## 착수 전 설계 결정 (구현 전 확정)

1. **저장 계층 = localStorage 유틸(Storage/IndexedDB 확장 아님, 전역 DO NOT CHANGE 보존).** 북극성(aspiration/obligation)과 알림 옵트인은 날짜 인덱스·관계형 조회가 필요 없는 단일 전역 값이라, PH-01 Storage 인터페이스(4메서드)를 건드리지 않고 onboarding-status.ts/discharge-block-pointer.ts가 이미 쓰는 "모듈 레벨 localStorage 유틸" 패턴을 그대로 계승한다(src/lib/north-star-storage.ts, src/lib/notification-pref.ts). Zustand 슬라이스도 신설하지 않는다 — 두 값 모두 라우트 이동(리마운트) 시점에만 값이 바뀌므로 DischargeEndBanner류의 세션 내 실시간 반응성이 필요 없다.
2. **양가 목표 데이터 모델 = 독립된 optional 문자열 2개, "모드" state machine 아님.** SCREEN-FLOW 1-B가 나열한 5개 변형(열망만/의무만/둘 다/모르겠어요/비움)은 aspiration/obligation 두 문자열의 파생 표시일 뿐 — "아직 모르겠어요"를 별도 불리언으로 추적하지 않는다. 빈 문자열과 모르겠어요는 표시상 동일하게 "북극성없음/초대 톤"으로 수렴한다(SPEC §9 의미만 담당, 진행 mechanic이 없으므로 구분할 행동상 차이가 없음 — YAGNI).
3. **북극성 편집 화면(1-B) = 신규 라우트 1개(NorthStarPage, /north-star)를 대시보드·설정 두 진입점이 공유.** SCREEN-FLOW가 진입점을 "대시보드(상단 선택) · 설정" 둘로 명시하고 종착은 항상 대시보드(다이어그램에 단일 화살표 1-B에서 대시보드만 존재)이므로, 저장·건너뛰기 두 액션 모두 무조건 navigate(ROUTES.dashboard)로 귀결한다 — 설정에서 진입했어도 설정으로 돌아가는 화살표를 임의로 추가하지 않는다.
4. **대시보드 설정 진입점 신설 — 이번 위상이 대시보드에 추가하는 유일한 항목.** 현재 DashboardPage엔 메뉴가 전혀 없다(SPEC §7 "설정만" 요건이 아직 미구현 상태). Button variant=secondary(텍스트 링크 스타일) 1개만 추가하고, 기존 One Task/방전 링크/에너지 바 레이아웃 순서·로직·props 시그니처는 무변경.
5. **알림 = UI opt-in 토글만, 실제 발송 배선 없음.** 전역 DO NOT CHANGE(D-26: 계정·백엔드·푸시 없음)가 실제 푸시 인프라 구축을 원천 봉쇄하고, SPEC 리스크 R3(밤/아침 pull 접점 미설계)도 아직 open이라 — 이번 위상은 "기본 꺼짐 + 켜기/끄기 2지선다(OptionRow 재사용) + 정적 카피 가드 문구"까지만 만든다. 값은 notification-pref.ts(localStorage bool)에 저장되되 어떤 발송 로직도 이 값을 아직 읽지 않는다 — 사용자 의사만 기록해두고, 실제 알림 파이프라인은 R3가 해소되는 별도 위상 몫이다.
6. **북극성 배지 = 대시보드 헤더의 순수 정적 텍스트, 인터랙션·클릭 이동 0.** SPEC §9 진행 측정기 아님을 지키기 위해 배지는 어떤 탭 핸들러도 갖지 않는다("수정"은 오직 설정 화면 경유로만 접근). 배지 노출 여부는 hasNorthStar(northStar)(둘 다 빈 문자열이면 false) 파생값으로만 결정한다.

## In-Scope (체크리스트)

**A. 타입 (src/types/north-star.ts, 신규)**

- [x] NorthStar { aspiration: string; obligation: string } 정의

**B. 로컬 저장 유틸 (신규)**

- [x] src/lib/north-star-storage.ts — getNorthStar(): NorthStar(기본값 aspiration/obligation 빈 문자열), saveNorthStar(next: NorthStar): void
- [x] src/lib/north-star-selectors.ts — hasNorthStar(ns: NorthStar): boolean(둘 다 trim 후 빈 문자열이면 false) 순수 함수
- [x] src/lib/notification-pref.ts — isNotificationOptIn(): boolean(기본 false), setNotificationOptIn(value: boolean): void
- [x] 유닛 테스트 3파일: 기본값·저장 후 값·여러 번 호출해도 멱등(온보딩 상태 유틸 테스트 패턴 계승)

**C. 북극성 편집 화면 (NorthStarPage.tsx, 신규 — 현재 라우트 자체가 없음)**

- [x] 초대 톤 헤더 카피(재촉 아닌 허용 — CLAUDE §4)
- [x] 열망/의무 텍스트 입력 2개(둘 다 선택, 초기값 = getNorthStar())
- [x] 저장 버튼(variant=primary) -> saveNorthStar({ aspiration, obligation }) -> navigate(ROUTES.dashboard)
- [x] 건너뛰기 버튼(variant=secondary) -> 저장 호출 없이 navigate(ROUTES.dashboard)(기존 값 보존, 강제 비우기 아님)
- [x] 순위 입력·정렬 UI 없음(D-19 — 두 필드 나란히, 우선순위 토글 없음)
- [x] 모르겠어요 전용 버튼/상태 없음(설계 결정 2 — 그냥 비워두고 건너뛰기로 충분)
- [x] 유닛 테스트: 기존 값 프리필, 저장 클릭 시 saveNorthStar 인자 검증 + navigate 1회, 건너뛰기 시 saveNorthStar 미호출 + navigate 1회

**D. 대시보드 수정 (DashboardPage.tsx, 국소)**

- [x] 헤더에 북극성 정적 배지 조건부 렌더(hasNorthStar true일 때만, 클릭 핸들러 없음)
- [x] hasNorthStar false일 때 북극성 더하기(선택) 링크(variant=secondary) -> navigate(ROUTES.northStar)
- [x] 설정 링크(variant=secondary) 신규 추가 -> navigate(ROUTES.settings) — 상시 노출(방전 링크와 달리 활성 블록 여부와 무관하게 항상 접근 가능해야 함)
- [x] 기존 ActiveTaskSection/에너지 바/방전 링크 로직·순서 무변경
- [x] 유닛 테스트: 북극성 없음 -> 초대 링크 노출·배지 DOM 0개, 북극성 있음(열망만/의무만/둘 다 3가지 조합) -> 배지 노출·초대 링크 0개, 설정 링크 클릭 시 navigate 어서션

**E. 설정 화면 (SettingsPage.tsx, 전면 재작성 — 현재 플레이스홀더 교체)**

- [x] 현재 북극성 요약 표시(열망/의무 값이 있으면 텍스트로, 둘 다 없으면 "아직 없어요" 초대 톤 카피)
- [x] 양가 목표 수정 버튼(variant=primary) -> navigate(ROUTES.northStar)(설계 결정 3 — 인라인 폼 아님)
- [x] 알림 2지선다(OptionRow 2개, 꺼둠(기본 선택)/켜기) + 아래 정적 카피 가드 문구 1줄(예: 켜도 재촉하거나 확인하러 오라고 하지 않아요) — 클릭 시 setNotificationOptIn(value) 호출, 초기 선택 상태 = isNotificationOptIn()
- [x] 뒤로 버튼(variant=secondary) -> navigate(ROUTES.dashboard)
- [x] 계정 설정 UI 없음(post-MVP, SPEC §7)
- [x] 기록 메뉴 항목 없음(SPEC §7·§4 — 애초에 만들지 않음)
- [x] 유닛 테스트: 초기 렌더(값 없음 카피/값 있음 카피 각각), 알림 옵션 클릭 시 setNotificationOptIn 호출 + aria-pressed 반영, 양가 목표 수정/뒤로 클릭 시 각각 navigate 어서션

**F. 라우트 등록**

- [x] ROUTES.northStar = /north-star 추가(src/routes/paths.ts)
- [x] router.tsx에 NorthStarPage lazy import + 라우트 등록

## DO NOT CHANGE (이 위상 국소 — 전역 목록은 README §0 참조)

- Storage 인터페이스(4메서드)·StoreName·idb-schema.ts — 이번 위상은 IndexedDB에 손대지 않는다(로컬스토리지만 사용, 설계 결정 1)
- 기존 슬라이스 전체(task-slice·discharge-slice 등)·store/index.ts 구성 — 신규 Zustand 슬라이스 추가 없음(설계 결정 1)
- DashboardPage의 ActiveTaskSection(One Task 분기)·에너지 바·방전 링크 로직·props 시그니처 — 헤더 배지·설정 링크 추가만, 기존 분기 무변경
- Button/OptionRow 컴포넌트 자체 — 재사용만, 신규 variant 추가 없음
- action/evidence.fill 토큰 값

## Positive Non-Goals

- 북극성 진행 mechanic·블록 맥락 태그 없음(SPEC §12 Post-MVP, §9 명시)
- 기록/통계 메뉴 없음(SPEC §7 확정 — 설정만)
- 실제 알림 발송 없음 — Notification 권한 요청·서비스워커 스케줄·밤/아침 pull 접점(R3)은 만들지 않는다. 이번 위상은 opt-in 값 저장까지만(설계 결정 5)
- 계정 설정 없음(post-MVP, SPEC §7)
- 북극성 모르겠어요 별도 상태 추적 없음(설계 결정 2 — 빈 문자열과 표시상 동일 취급)
- 우선순위 순위 매기기 UI 없음(D-19)

## 수용 기준 (기계 검증만)

**공통:**

- [x] npm run typecheck exit 0
- [x] npm run lint exit 0
- [x] npm run test:coverage 통과, 커버리지 80%+ 유지
- [x] npm run build exit 0
- [x] SPEC 커버리지 표의 모든 행이 실제 구현과 일치(완료 선언 직전 재확인)

**설정·북극성 고유:**

- [x] 북극성 없음 -> 대시보드에 초대 링크만, 배지 DOM 0개 / 북극성 있음(3가지 조합 각각) -> 배지 노출, 초대 링크 0개 — 유닛 어서션
- [x] NorthStarPage 저장 클릭 시 saveNorthStar 호출 인자 === 입력값, navigate(ROUTES.dashboard) 1회 — 건너뛰기는 saveNorthStar 미호출 + 동일 navigate
- [x] 대시보드 설정 클릭 -> navigate(ROUTES.settings), 설정 뒤로 클릭 -> navigate(ROUTES.dashboard), 설정 양가 목표 수정 클릭 -> navigate(ROUTES.northStar) — 각각 라우트 어서션
- [x] 알림 기본값 false(isNotificationOptIn()), 설정 화면 최초 렌더 시 꺼둠 옵션이 aria-pressed=true — 토글 클릭 시 setNotificationOptIn 호출 + 반영
- [x] (가드레일) 알림 카피에 N일째/안 오셨/확인류 재촉·검사 문구 0건, danger|error|warning|fail 클래스 0건 — 텍스트 매칭 어서션
- [x] (가드레일) 북극성 관련 화면 전부에 퍼센트/도달률/진행 바 마크업 0건(정적 텍스트만)
- [x] (대비) OptionRow/Button 재사용 — PH-04/PH-05 기존 실측 대비 상속, 재측정 불요
- [x] (레이아웃) NorthStarPage·SettingsPage 320px·375px 실제 Playwright로 확인 — 가로 스크롤 0, 상호작용 요소 44x44px 이상(임시 스펙, 확인 후 삭제)

## Runnable-State 커맨드

```
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

완료 선언 전 npm run build && npm run preview 후 Playwright(Chromium, 320/375px)로 대시보드 -> 설정 -> 양가 목표 수정 -> 대시보드(배지 반영) 왕복을 실제 클릭으로 확인(PH-05~08 교훈 계승 — jsdom만으론 불충분).

## Changelog

- **v0.1** — 헤더만 작성.
- **v0.2** — 착수 직전 상세화(계획만, 구현 없음). SSOT 발췌(SPEC §7·§9 + D-19/D-26 + SCREEN-FLOW 전이 5행) · SPEC 커버리지 표(11행 전부 In-Scope/설계 결정/Positive Non-Goal 중 하나로 배정) · 전이-명명 테스트(10행, 3이음새) · 설계 결정 6개 확정: 저장 계층은 신규 Zustand 슬라이스·Storage 확장 없이 onboarding-status.ts 패턴을 계승한 localStorage 유틸 2개(north-star-storage.ts/notification-pref.ts)로, 양가 목표는 모드 state machine이 아니라 독립 optional 문자열 2개(모르겠어요/비움 구분 안 함), 북극성 편집은 신규 라우트 1개(/north-star)를 대시보드·설정이 공유하고 저장/건너뛰기 모두 대시보드로 귀결, 대시보드 설정 진입점은 이번 위상이 신규 추가(현재 메뉴 자체가 없었음), 알림은 opt-in 값 저장까지만 하고 실제 발송 배선은 D-26·R3로 인해 범위 밖, 북극성 배지는 인터랙션 0의 순수 정적 텍스트. In-Scope A~F(타입·로컬 저장 유틸·NorthStarPage·대시보드 수정·SettingsPage 전면 재작성·라우트 등록), DO NOT CHANGE, Positive Non-Goals, 수용 기준 확정. **구현·Runnable State는 다음 세션.**
- **v0.3** — Runnable State 통과, 완료로 갱신. In-Scope A~F 전부 구현: `NorthStar` 타입 + localStorage 유틸 3개(north-star-storage/north-star-selectors/notification-pref, onboarding-status.ts 패턴 계승, aspiration/obligation은 별도 키 2개로 저장해 JSON 파싱 없이 단순화) · `NorthStarPage`(신규 라우트 `/north-star`, 저장/건너뛰기 모두 대시보드 귀결) · `DashboardPage`에 `DashboardHeader` 서브컴포넌트(북극성 배지 또는 초대 링크 + 상시 노출 설정 링크, 기존 ActiveTaskSection/에너지 바/방전 로직 무변경) · `SettingsPage` 전면 재작성(북극성 요약 + 양가 목표 수정 버튼 + 알림 2지선다 + 카피 가드 + 뒤로). 기존 `router.test.tsx`의 "still-placeholder" 스위트가 SettingsPage 구플레이스홀더 텍스트('설정')를 어서션하고 있어 깨짐 — PH-09 실제 콘텐츠(heading '양가 목표', NorthStarPage 진입)를 검증하는 별도 describe로 교체(회귀 아님, 플레이스홀더 졸업). 명명 테스트 10행 전부 구현. 전체 303개 테스트 통과(커버리지 97.82%stmt), typecheck/lint(경고 7건 기존 수준 유지, 에러 0)/build 전부 exit 0. 임시 Playwright 스크립트(비커밋, 실행 후 삭제)로 320/375px에서 대시보드 → 설정 → 북극성 편집 → 저장 → 대시보드(배지 반영, 초대 링크 소멸) 왕복 실증 — 가로 스크롤 0, 상호작용 요소 44×44px 이상. 다음 착수 대상은 PH-10(내부 지표 로깅)·PH-11(PWA 마무리) 중 사용자 결정 대기.
- **v0.4** — code-reviewer 자동 호출(백그라운드) 결과 MEDIUM 2건·LOW 2건 반영. [MEDIUM] `DashboardPage`가 헤더 배지·설정 링크 추가로 50줄 제한을 5줄 초과해 신규 lint 경고 발생(v0.3 changelog의 "경고 7건 기존 수준 유지" 주장과 불일치) — `handleAddTask`를 RetroPage의 `makeThoughtActions`와 동일한 컴포넌트 밖 팩토리 패턴(`createAddTaskHandler`)으로, `DashboardHeader`는 개별 콜백 2개 대신 `navigate` 함수 자체를 prop으로 받도록 정리해 46줄로 원복(경고 6건, PH-09 이전 기준선과 동일). [MEDIUM] "북극성 관련 화면 어디에도 도달률/진행 수치 렌더 0건" 명명 테스트가 체크리스트엔 완료로 표기됐지만 실제 가드 테스트가 없었음 — `NorthStarPage`/`DashboardPage`/`SettingsPage` 세 곳에 `%`·퍼센트·도달률·`role="progressbar"` 부재를 검증하는 테스트 추가. [LOW] `NorthStarBadge`/`SettingsPage`의 `NorthStarSummary`가 각자 카피 포맷을 조립하던 중복을 `north-star-selectors.ts`의 `formatNorthStarSummary`로 통합. [LOW] `DashboardPage.test.tsx`가 CSS 모듈 클래스명으로 배지 유무를 어서션하던 것을 접근성 텍스트 쿼리(`/열망:|의무:/`)로 교체. 전체 306개 테스트 통과(커버리지 97.82%stmt), typecheck/lint(경고 6건, 에러 0)/build 전부 exit 0, 리팩터 후 재검증 Playwright 왕복 재확인.
