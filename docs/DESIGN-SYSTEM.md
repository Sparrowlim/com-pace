# 컴페이스 — 디자인 시스템 (화면 조립 규약)

> **역할:** `DESIGN-TOKENS.md`의 semantic 토큰을 실제 컴포넌트·화면에 **어떻게 배치하는가**의 규약(HOW-it-assembles). 토큰 자체의 값·구조는 소유하지 않는다 — 이 문서는 "어떤 상황에 어떤 토큰을 쓰는가"만 고정한다.
> **정본 경계:** 토큰 구체값 = `DESIGN-TOKENS.md`(불변, 이 문서가 재정의 못 함) · 원리 차용/거부 근거 = [`DECISIONS.md D-27`](DECISIONS.md#d-27) · 불변 규칙 = `/CLAUDE.md` · 확정 스코프가 어긋나면 `SPEC.md`가 최신.
> **위계 선언(필수):** 본 문서는 `CLAUDE.md §2` 불변 규칙·`DB-02` 하드 규칙(처벌색 없음·액센트=즉시성 순간만)을 **깨지 못한다.** 아래 어떤 배치 규칙도 이 둘과 충돌하면 이 문서가 진다.

---

## 0. 원리 매핑 (Apple HIG 선택적 차용 — `D-27`)

`D-27`이 확정한 대로, 아래 3원칙의 **원리만** 차용한다. SF Pro·SF Symbols·시스템 블루·iOS 내비게이션/탭바 크롬·iOS 제스처는 이식하지 않는다(K=Android, `D-26` 정합).

| HIG 원칙                                           | 이 문서에서의 구현                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Clarity** (명료함)                               | §2 타이포 위계 — 카드 하나에 동시 노출 가능한 글자 크기 단계를 제한해 위계를 명확히 함 |
| **Deference** (양보 — 크롬이 콘텐츠를 이기지 않음) | §1 여백 리듬 + §3 낮은 서열 elevation 우선 사용 — 장식이 콘텐츠보다 튀지 않게          |
| **Depth** (깊이)                                   | §3 elevation 서열 — "얼마나 떠 있는가"를 컴포넌트 역할에 매핑                          |

모션은 HIG의 "목적성 있는 절제" 원칙만 차용(§4), `DB-04`가 이미 정한 값을 재확인만 한다(신규 값 없음).

---

## 1. 여백 리듬

`space.*` 8종을 **3계층 용도**로 고정한다. 컴포넌트마다 임의로 값을 고르는 것(현재 상태)을 막기 위함 — 새 컴포넌트/화면은 아래 표에서 역할에 맞는 계층의 토큰만 쓴다.

| 계층                                   | 토큰                                                               | 용도                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **카드-내부** (요소 간)                | `space.1`(4px) · `space.2`(6px) · `space.3`(8px) · `space.4`(12px) | 카드 하나 안에서 아이콘-라벨 간격, 제목-본문 마진, 버튼/칩 내부 gap 등 요소끼리의 좁은 간격 |
| **카드-간** (형제 항목 사이)           | `space.5`(16px) · `space.6`(20px)                                  | 리스트/스택에서 반복되는 형제 카드·옵션 행 사이 간격                                        |
| **섹션-간** (카드 자체 외곽 패딩 포함) | `space.7`(24px) · `space.8`(30px)                                  | 대표 카드(`TaskCard`·`BottomSheet`)의 테두리-콘텐츠 외곽 패딩, 화면 내 큰 블록 사이 여백    |

**근거:** 카드의 외곽 패딩은 "이 카드가 화면·주변과 얼마나 호흡하는가"를 결정하는 거시 리듬이라 섹션 간격과 같은 스케일을 공유한다. 카드 내부 요소끼리의 간격은 훨씬 좁은 스케일로 분리해야 "카드 하나"라는 응집력이 시각적으로 유지된다.

**✔ 해소(PH-04.3, 2026-07-11):** `Button`/`Chip`의 내부 패딩을 "카드-내부" 계층 토큰(`space-4`)으로 정렬 완료. 이전 관찰: "`Button`의 가로 패딩(`space.6`)은... `Chip`의 가로 패딩(`space.5`)도... 카드-간 계층 값을 내부 패딩에 쓰고 있었다."

**TaskCard 대조(파일럿):** 카드 자체 패딩 `space.7`(섹션-간 계층, 대표 카드) · 제목-본문 마진 `space.4`(카드-내부 계층). **편차 없음 — 배치 변경 불필요.**

---

## 2. 타이포 위계

**규칙:** 카드 1개 또는 화면 1개 안에서 동시에 쓰는 `font.size` 조합은 **최대 3단계**(주·보조·라벨)로 제한한다. 세리프(`font.serif`)는 **제목 1곳에만** 한정한다(`DB-03` 재확인 — 신규 값 없음).

| 단계        | 역할                       | 권장 토큰                      | 서체                               |
| ----------- | -------------------------- | ------------------------------ | ---------------------------------- |
| 주 (제목)   | 카드/화면의 대표 문구      | `font.size.xl`~`font.size.2xl` | `font.serif`(유일한 세리프 사용처) |
| 보조 (본문) | 설명·CTA 라벨              | `font.size.md`~`font.size.lg`  | `font.sans`                        |
| 라벨 (메타) | 힌트·필드 라벨·조용한 안내 | `font.size.xs`~`font.size.sm`  | `font.sans`                        |

한 카드에 이 3단계를 넘는 크기 조합이 등장하면 위계가 무너진 것으로 간주한다(예: 제목 2종·본문 2종을 동시에 쓰는 것 금지).

**TaskCard 대조(파일럿):** 제목만 `font.size.2xl` + `font.serif`(주 단계 1개)를 명시적으로 스타일링하고, 본문(children)은 자체 크기를 지정하지 않아 사용처가 정한다 — 카드 자체는 1단계만 점유해 규칙 위반 여지가 없다. **편차 없음.**

---

## 3. 깊이 규칙 (Elevation 서열)

`elevation.*` 6종을 "얼마나 떠 있는가" 순으로 서열화하고, 6종 UI 프리미티브(`Button`·`Chip`·`TaskCard`·`EnergyBar`·`OptionRow`·`BottomSheet`)에 매핑한다.

| 서열(낮음→높음)        | 토큰                | 시각적 의미                                            |
| ---------------------- | ------------------- | ------------------------------------------------------ |
| 0 (무-elevation, 의도) | — (그림자 없음)     | 완전히 평면 — 담백함이 규약인 요소 전용                |
| 1                      | `elevation.inner`   | 미세 깊이 — 표면에 거의 붙어 있는 눌린 듯한 표면       |
| 2                      | `elevation.soft`    | 은은한 부양 — 보조 패널                                |
| 3                      | `elevation.card`    | 기본 카드 부양 — 대표 콘텐츠                           |
| 4                      | `elevation.popover` | 화면 위 오버레이 부양                                  |
| 5                      | `elevation.cta`     | 액션 발광(테라코타 글로우) — 유일하게 색이 있는 그림자 |
| 6                      | `elevation.sheet`   | 최상단 — 화면 아래에서 밀고 올라오는 시트              |

### 컴포넌트 매핑표

| 컴포넌트                        | 서열                    | 근거                                                                                      |
| ------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `EnergyBar`/`EnergyCell`        | 0 (무-elevation, 의도)  | 에너지 칸은 담백해야 하는 신성불가침 요소(`DESIGN-TOKENS §5-1`) — 깊이 장식을 얹지 않는다 |
| `OptionRow`                     | 1 (`elevation.inner`)   | 선택 가능한 낮은 표면, 눌린 듯한 미세 깊이만                                              |
| `Chip`                          | 2 (`elevation.soft`)    | 선택됨 상태에서만 살짝 뜸(기본 상태는 평면)                                               |
| `TaskCard`                      | 3 (`elevation.card`)    | 화면의 대표 콘텐츠                                                                        |
| (팝오버류 — 아직 컴포넌트 없음) | 4 (`elevation.popover`) | 예비 — 신규 컴포넌트 신설 시 이 서열부터 배정                                             |
| `Button`(`variant="primary"`만) | 5 (`elevation.cta`)     | 즉시성의 순간에만 발광(`DB-02` 하드 — 보조 버튼은 elevation 없음)                         |
| `BottomSheet`                   | 6 (`elevation.sheet`)   | 화면 전체를 덮는 최상단 오버레이                                                          |

**✔ 해소(PH-04.3, 2026-07-11):** `Button.primary`(`elevation.cta`)·`Chip.selected`(`elevation.soft`)·`OptionRow`(`elevation.inner`)에 위 매핑표대로 `box-shadow`를 적용 완료.

**TaskCard 대조(파일럿):** `box-shadow: var(--elevation-card)` 이미 적용, `border-radius: var(--radius-2xl)`도 대표 카드 규약과 일치. **편차 없음.**

---

## 4. 모션 / 피드백 일관성 표

상태 변화마다 `duration`/`easing` 조합을 고정한다. `DB-04`가 이미 동결한 값의 재확인이며 신규 값은 추가하지 않는다.

| 상태 변화                                        | duration                   | easing         | 적용 컴포넌트               |
| ------------------------------------------------ | -------------------------- | -------------- | --------------------------- |
| 일반 상호작용 전환(hover/press/포커스/선택 토글) | `duration.fast`(150ms)     | `easing.quiet` | `Button`·`Chip`·`OptionRow` |
| 에너지 칸 점등                                   | `duration.cell`(260ms)     | `easing.quiet` | `EnergyCell`                |
| 바텀시트 진입/퇴장                               | `duration.fast`(150ms)     | `easing.quiet` | `BottomSheet`               |
| `prefers-reduced-motion: reduce`                 | `0s`(즉시 상태변화로 대체) | —              | 전체                        |

**TaskCard 대조(파일럿):** `TaskCard`는 그 자체로 상호작용 상태(hover/press)를 갖지 않는 정적 컨테이너라 위 표의 어떤 행에도 해당하지 않는다 — 모션 미적용은 편차가 아니라 규칙 밖(N/A). **편차 없음.**

---

## 5. 컴포넌트 카탈로그 (11종)

`PH-04.4` 감사·소급 산출물. SCREEN-FLOW §1의 모든 화면이 아래 11종의 조합만으로 설명 가능해야 한다(§6). "가드레일 근거" 열은 `phases/PH-04.4-component-catalog.md` Phase 1 워크시트의 요약 인용 — 각 형태를 "왜 이것이고 왜 다른 형태가 아닌가"까지 보려면 그 문서의 페르소나 K 마찰 시나리오·기각한 대안을 참조한다.

### 기존 6종 (PH-04, PH-04.3 소급 감사 완료)

| 컴포넌트                 | 위치                                     | 핵심 규약                                                                                                                     | 가드레일 근거                                 |
| ------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `Button`                 | `src/components/Button`                  | `variant="primary"`만 `elevation.cta`(발광), `secondary`는 아웃라인만 — 테라코타 없음                                         | DB-02 하드 · §5-3(`action`=즉시성의 순간에만) |
| `Chip`                   | `src/components/Chip`                    | 선택됨 상태에서만 `elevation.soft`, 기본은 평면                                                                               | §3 elevation 서열                             |
| `TaskCard`               | `src/components/TaskCard`                | `elevation.card`, 대표 콘텐츠 카드. mode-agnostic — 방전 분기는 상위 DOM `[data-mode]`가 처리, 컴포넌트 자체엔 모드 prop 없음 | §3 elevation 서열 · DESIGN-TOKENS §4-2        |
| `EnergyBar`/`EnergyCell` | `src/components/EnergyBar`, `EnergyCell` | `elevation` 0(무-elevation, 의도), `evidence.fill` 단일 색만(완료/미완료/방전 상태 분기 없음)                                 | CLAUDE §2 실패 무처벌 · DESIGN-TOKENS §5-1    |
| `OptionRow`              | `src/components/OptionRow`               | `elevation.inner`, 선택 가능한 낮은 표면(눌린 듯한 미세 깊이)                                                                 | §3 elevation 서열                             |
| `BottomSheet`            | `src/components/BottomSheet`             | `elevation.sheet`, 화면 전체를 덮는 최상단 오버레이                                                                           | §3 elevation 서열                             |

### 신규 5종 (PH-04.4)

| 컴포넌트         | 위치                                                                       | 핵심 규약                                                                                                                                                                        | 가드레일 근거                                                              |
| ---------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `TextInput`      | `src/components/TextInput`                                                 | `surface.raised`+`border.default` 무테두리에 가까운 단일 상태. 포커스는 `border`→`action.ink`(텍스트색 전환, 배경 불변). `required`/`error`/`maxLength` props 자체가 타입에 없음 | CLAUDE §2 결정 피로 차단 · §4 톤 · DESIGN-TOKENS §5-2 처벌색 없음          |
| `TimerDisplay`   | `src/components/TimerDisplay`                                              | 진행률(링·퍼센트·잔여 블록) 완전 배제 — 분 단위 큰 숫자 + 동사 라벨만. `running`/`paused`(`dark.bgDeep`)/`discharge`(문구만 다름, 크기·서체 동일) 3 variant                      | CLAUDE §1 정체성 경계 · §2 결정 피로 차단 · §6 체크리스트 6번(볼거리 금지) |
| `StateChip`      | `src/pages/RetroPage.tsx` 로컬(비공개 — `src/components` 밖, export 안 함) | `RetroPage.tsx` 밖에서 import 불가(파일 위치 + ESLint `no-restricted-imports` 이중 격리). 카피는 "완료"/"이어감"만(실패·미완료 단어 UI 노출 금지)                                | DESIGN-TOKENS §3 결정#6 경계 조건 · CLAUDE §2·§4                           |
| `BonusCard`      | `src/components/BonusCard`                                                 | `hit=false` → `null` 반환(조건부 렌더가 시그니처 자체에 강제됨, 빈 카드·placeholder 없음)                                                                                        | SCREEN-FLOW §3-2 · DESIGN-TOKENS §5-4                                      |
| `NorthStarBadge` | `src/components/NorthStarBadge`                                            | 순수 정적 텍스트. `onClick` prop이 타입에 존재하지 않음(탭 핸들러 자체가 불가능)                                                                                                 | SPEC §9 "진행 측정기 아님" · CLAUDE §1·§5                                  |

---

## 6. 조립 레시피 (SCREEN-FLOW §1 화면별 프리미티브 조합)

**규칙:** 이 표에 없는 화면 = 카탈로그 커버리지 게이트 위반. 새 화면을 추가할 때 이 표에 먼저 한 행을 채우고, 기존 11종으로 설명이 안 될 때만 §5에 12번째 컴포넌트를 신설한다(신설 전에 "기존 조합으로 충분한가"부터 검토 — 아래 기각 사례 참조).

| 화면 ID(SCREEN-FLOW §1) | 화면                               | 조립 = 프리미티브 조합                                                                                                         | 비고                                                                                                                                                                           |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1                       | 면죄부 3화면                       | `TaskCard` + `Button`                                                                                                          | 3스텝 카피 스왑, 컴포넌트 조합은 불변(`OnboardingPage`)                                                                                                                        |
| 1-A / 2z / 3-A          | 아무거나 입력(신규·소진 후 재진입) | `TextInput` + `Button`                                                                                                         | 대시보드 `AddTaskPrompt` 조립 하나가 3개 화면 상태를 겸함 — 별도 컴포넌트 불필요                                                                                               |
| 1-B                     | 북극성(선택)                       | `TextInput`×2 + `Button`×2                                                                                                     | 열망/의무 각각 `TextInput`, 저장/건너뛰기 `Button`(`NorthStarPage`)                                                                                                            |
| 3                       | 과제 쪼개기                        | `TaskCard` + `TextInput` + `Chip`(동사칩 반복) + `Button`                                                                      | 조각 입력은 `TextInput`, 동사칩은 기존 `Chip` 재사용(`SplitPage`)                                                                                                              |
| 2                       | 대시보드(홈)                       | `NorthStarBadge`(선택) + `TaskCard`류(진행중/CTA/조각선택 변형) + `OptionRow`(조각 2개 이상 자기선택) + `Button` + `EnergyBar` | One Task 분기별로 `TaskCard` 내부 조합만 바뀐다 — 새 primitive 없음(`DashboardPage`)                                                                                           |
| 4                       | 사전 예측                          | `OptionRow`×2                                                                                                                  | 2지선다(`PredictPage`)                                                                                                                                                         |
| 5                       | 집중 화면                          | `TimerDisplay`                                                                                                                 | `[data-mode="focus"]` ambient 오버레이가 다크 전환을 담당 — 컴포넌트 자체엔 mode prop 없음                                                                                     |
| 5-A                     | 딴생각 포착                        | `BottomSheet` + `TextInput`(multiline) + `Button`                                                                              | §1-6 기각 근거 — 새 모달 primitive 대신 기존 `BottomSheet` 재사용(학습 비용 최소화)                                                                                            |
| 5-B                     | 일시정지                           | `BottomSheet` + `Button`×2                                                                                                     | §1-6 기각 근거 — "그만하기"도 중립 어휘, 버튼 44×44px 이상(오탭 방지)                                                                                                          |
| 6 / 6′ / 7 / 7′         | 회고 4조합                         | `StateChip` + `OptionRow`×3(영점조절) + `BonusCard`(적중 시만) + `EnergyBar` + `Button`                                        | 6′/7′은 6/7과 완전 동일 렌더(SCREEN-FLOW §3-2) — `BonusCard`가 `hit=false`일 때 `null`을 반환하는 것만으로 4조합이 2가지 렌더로 수렴, 별도 분기 컴포넌트 불필요                |
| 6-A                     | 휴식                               | `Button`×2(다음 블록/오늘은 그만)                                                                                              | `PH-05.2`(2026-07-12)가 구현. `routes/paths.ts`에 `rest: '/rest'` 추가, `RestPage`는 `DischargeEntryPage`와 동일 조립 패턴 재사용(카탈로그 신규 등재 불요) — 새 primitive 없음 |
| 방전 진입               | 방전 진입                          | `Button`×2(primary+secondary)                                                                                                  | `DischargeEntryPage`                                                                                                                                                           |
| 방전 대시보드           | 방전 대시보드                      | `TaskCard` + `Button`×2                                                                                                        | §1-6 기각 근거 — "QuietLink" 신규 primitive 기각, `[data-mode="discharge"]` ambient 오버레이만 얹음(`DischargeDashboardPage`)                                                  |
| 9                       | 설정                               | `OptionRow`×2(알림 on/off) + `NorthStarBadge`(있을 때만) + `Button`×2                                                          | `NorthStarBadge` 재사용(`SettingsPage`), 빈 상태 초대 문구는 화면 로컬 유지(대시보드와 다른 카피 — 화면 고유 재량)                                                             |

---

## Changelog

- **v0.5(2026-07-12)** — **문서 정합성 감사 반영(코드 diff 없음).** §6 6-A(휴식) 행이 `PH-05.2`(2026-07-12, `RestPage` 구현·`routes/paths.ts`에 `rest: '/rest'` 추가) 완료 이후에도 "미구현"으로 방치돼 있던 드리프트를 발견·정정 — 조립은 `Button`×2(다음 블록/오늘은 그만), `DischargeEntryPage`와 동일 패턴 재사용이라 카탈로그 신규 등재 불요.
- **v0.4(PH-04.4 Phase 4, 2026-07-11)** — 구현(TDD) 완료: 신규 5종(`TextInput`/`TimerDisplay`/`BonusCard`/`NorthStarBadge` — `src/components`, `StateChip` — `src/pages/RetroPage.tsx` 로컬)을 코드로 채우고 `DashboardPage`/`NorthStarPage`/`SplitPage`/`FocusPage`/`RetroPage`/`SettingsPage`의 ad-hoc `<input>`/`<textarea>`/로컬 재발명을 전부 교체(`grep -rn "<input\|<textarea" src/pages/*.tsx` 0건 확인). `StateChip` 스코프는 파일 위치 + `eslint.config.js`의 `no-restricted-imports` 이중 격리로 확정(폴더 전환은 범위 밖 — §5 표 위치 문자열을 실제 flat 파일 경로로 보정). 기존 vitest 스위트 전부 그린 유지.
- **v0.3(PH-04.4, 2026-07-11)** — §5 컴포넌트 카탈로그(기존 6종 + 신규 5종 `TextInput`/`TimerDisplay`/`StateChip`/`BonusCard`/`NorthStarBadge`) 신설, §6 조립 레시피(SCREEN-FLOW §1 화면별 프리미티브 조합 표) 신설. `PH-04.4-component-catalog.md` Phase 1 워크시트 소스 코드 대조 검증 완료(감사 누락 1건 보정 — `SplitPage`의 `TextInput` 재발명 4번째 위치 반영). 토큰 값 자체는 무변경.
- **v0.2(PH-04.3, 2026-07-11)** — `Button`/`Chip` 여백 계층 관찰, `Button.primary`/`Chip.selected`/`OptionRow` elevation 매핑 누락 관찰을 소급 수정으로 해소(§1·§3 관찰 문단을 "✔ 해소"로 갱신). 이 문서 자체의 규약(계층 정의·매핑표)은 무변경.
- **v0.1** — 최초 작성(PH-04.2). `DESIGN-TOKENS.md §10-6` 항목 6("컴포넌트 토큰(다음 단계)")을 채움. 여백 리듬(3계층)·타이포 위계(≤3단계)·elevation 서열(6종 매핑)·모션 일관성 표 신설. `TaskCard` 파일럿 대조 결과 4개 절 전부 편차 없음(배치 변경 불필요) — `Button`/`Chip`/`OptionRow`의 기존 미스매치는 관찰로 기록하고 `PH-04.3` 소급 감사로 이관.
