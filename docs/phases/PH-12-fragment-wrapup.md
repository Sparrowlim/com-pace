# PH-12 — 조각 마무리 선택 (5-C)

> **의존:** [PH-05](PH-05-core-loop.md), [PH-06](PH-06-edge-cases.md)
> **SSOT:** [SPEC.md §6 엣지케이스](../SPEC.md#6-엣지케이스-확정)("15분 자연 종료" 행) · [SPEC.md §4](../SPEC.md#4-화면별-확정-명세)("집중" 행) · [SCREEN-FLOW.md §1](../SCREEN-FLOW.md#1-화면상태-인벤토리)(5-C) · [§2 Mermaid](../SCREEN-FLOW.md#2-전체-흐름도-mermaid) · [§3-1](../SCREEN-FLOW.md#3-1-타이머-화면-5--p7p10-반영) · [§4 P14/P15/P16](../SCREEN-FLOW.md#4-논리-이슈-대장-전부-해소) — 내용 재기술 금지, 링크만.
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙-모든-위상-공통--개별-ph-파일에서-반복-서술-금지) DO NOT CHANGE·Runnable State 정의는 반복 안 함.
> **위상 등급:** patch(사유: 신규 컴포넌트 패턴 없음 — `PauseOverlay`/`CaptureModal`과 동일하게 기존 `BottomSheet`+`Button` 조합만 재사용, 카탈로그 신규 등재 없음. 기존 컴포넌트 토큰·CSS 값 변경 없음. `phases/README.md §0-2` 기준.)
> **유래:** 2026-07-14 실사용 감사(PH-11 이후) — 15분 자연 경과 시 시스템이 완료 여부를 묻지 않고 자동 확정하던 갭. 상세 근거는 `SCREEN-FLOW.md` P14/P15/P16.

## Goal

15분이 자연 경과(포그라운드 실시간 도달 또는 백그라운드 복귀 시 경과 확인)하면: ① 에너지가 완료 여부와 무관하게 **즉시** 점등되고, ② `FocusPage` 위에 "이 조각 끝났어요"/"아직 남았어요" 2택 시트(5-C)가 뜨고, ③ 선택에 따라 기존 회고(6/6′ 또는 7/7′)로 그대로 이어지는 상태. 방전 블록·조기 이탈("그만하기")·이후 회고 화면(`RetroPage`)의 기존 로직은 전부 무변경.

## SSOT 발췌 (착수 직전 필수)

**SPEC 발췌 (§6, 신설 행):**

> "15분 자연 종료(일 조기 완료 포함): 에너지는 경과 즉시 점등(완료 여부 무관, D-09). 완료/이어가기 라벨은 시스템이 추정하지 않고 **사용자가 조각 마무리 선택(5-C)에서 결정** — 자연 종료도 조기 이탈('그만하기')과 동일하게 '이어서 15분 더' 경로에 도달 가능(SCREEN-FLOW P14). **15분 자체는 단축하지 않는다**(§2 불변 규칙, D-15)."

**SCREEN-FLOW 전이 발췌 (§3-1):**

| 현재상태 | 이벤트                        | 다음상태                                    | §참조                         |
| -------- | ----------------------------- | ------------------------------------------- | ----------------------------- |
| 진행     | 15분 경과                     | 에너지 즉시 점등 + **5-C 조각 마무리 선택** | §3-1                          |
| 5-C      | "이 조각 끝났어요"            | 회고 판정(6/6′)                             | §3-1                          |
| 5-C      | "아직 남았어요"               | 회고 판정(7/7′)                             | §3-1                          |
| 진행     | 화면잠금·앱이탈·전화·강제종료 | 진행 유지 → 복귀 ≥15분 시 에너지 점등+5-C   | §3-1 (P13 그대로, P15만 추가) |

> P14 "질문은 '다 됐나요?'(사람 판정)가 아니라 조각의 상태를 묻는 2지선다" — 검사형 문구 금지(CLAUDE §4)와 충돌 없도록 카피 방향 고정.

## SSOT 대조 표

| SSOT 문장/전이                                   | 배정          | 이음새             | 명명 테스트                                                                                      | 비고(근거/검색 로그)                                                                                                                                                                             |
| ------------------------------------------------ | ------------- | ------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "에너지는 경과 즉시 점등(완료 여부 무관)"        | In-Scope A    | ① 순수 셀렉터/훅   | `lights energy exactly once when elapsed reaches 900s, before any wrap-up choice is made`        | `lightEnergyCell`이 멱등이 아님(호출마다 신규 셀) 확인 — `energy-slice.ts:21-27`. 훅 내부에 `energyLitRef`로 블록당 1회만 호출되게 가드                                                          |
| "완료/이어가기 라벨은 사용자가 5-C에서 결정"     | In-Scope A·B  | ② 라우트·상태 전이 | `does not auto-complete at 900s — shows the wrap-up sheet instead`                               | 기존 `useEffect(() => { if (elapsedSeconds >= FOCUS_SECONDS) void finish(true) }, [elapsedSeconds])`(`useFocusTimer.ts:129-135`) 제거 대상                                                       |
| "이 조각 끝났어요" 선택 → 회고 판정(6/6′)        | In-Scope B    | ②                  | `choosing "finished" completes the block and navigates to retro with status done`                | 기존 `finish(true)` 재사용, 신규 로직 없음                                                                                                                                                       |
| "아직 남았어요" 선택 → 회고 판정(7/7′)           | In-Scope B    | ②                  | `choosing "not yet" marks incomplete and navigates to retro with status incomplete`              | 기존 `finish(false)` 재사용                                                                                                                                                                      |
| "복귀 ≥15분 시 에너지 점등+5-C"(P13 확장)        | In-Scope A    | ②                  | `returning from background with elapsed >= 900s also shows the wrap-up sheet, not auto-complete` | 기존 900초 점프 후 `tick()` 1회 테스트(`FocusPage.test.tsx:93-114`)를 이 위상에서 재작성                                                                                                         |
| 방전 블록은 5-C 대상 아님(SPEC §5 "시작=승리")   | DO NOT CHANGE | ③ 불변식           | `discharge blocks still auto-complete at 900s without showing the wrap-up sheet`                 | `dischargeBlockPointer.get() === block.id`로 기존 `finish()`의 `wasDischarge` 판정과 동일 기준 재사용. `grep 방전.*예측 SCREEN-FLOW.md` → 방전은 회고 자체가 스킵되므로 5-C도 스킵 대상(§5 확정) |
| "그만하기"(조기 이탈)는 무변경                   | DO NOT CHANGE | ③                  | `quitting via pause before 900s still marks incomplete and lights energy exactly once`           | 15분 도달 전이므로 A의 사전 점등이 없음 — `finish()` 쪽에 폴백 점등 필요(아래 설계결정 2)                                                                                                        |
| 검사형 문구 금지(CLAUDE §4)                      | 설계결정      | —                  | —                                                                                                | 카피는 "다 됐나요?" 대신 조각 상태 질문("이 조각 끝났어요"/"아직 남았어요") — SCREEN-FLOW P14가 이미 확정한 방향, 자체 창작(CLAUDE §8)                                                           |
| 5-C 이후 회고 화면(`RetroPage`) 로직             | DO NOT CHANGE | —                  | —                                                                                                | `grep RetroPage PH-12` → 0 matches 의도(변경 계획 없음). `block.status`만 보고 분기하는 기존 구조 그대로 재사용                                                                                  |
| "볼거리 금지, 즉시성은 전환 순간에만"(CLAUDE §6) | 설계결정      | —                  | —                                                                                                | 5-C는 상시 노출 UI가 아니라 전환 시점(15분 도달)에만 뜨는 `BottomSheet` — `PauseOverlay`와 동일 성격이라 §6 위반 아님                                                                            |

## 착수 전 설계 결정

1. **에너지 점등을 `finish()`에서 분리한다.** `useFocusTimer`에 `energyLitRef`(블록별 1회 가드)를 신설하고 `ensureEnergyLit(blockId)` 헬퍼를 만든다. 15분 경과 감지 effect가 (방전이 아니면) 이걸 즉시 호출 + `awaitingWrapUp: true` 상태를 노출한다. `finishNormalPath`의 기존 `lightEnergyCell` 호출은 제거하고, 대신 `finish()` 최상단에서 `ensureEnergyLit`을 (이미 불렀으면 no-op) 다시 호출해 조기 이탈("그만하기") 경로의 점등을 보장한다.
2. **방전 블록은 5-C를 완전히 우회한다.** 15분 경과 effect 내부에서 `dischargeBlockPointer.get() === block.id`를 먼저 확인 — 참이면 기존과 동일하게 `void finish(true)`를 즉시 호출(에너지는 방전 대시보드가 시작 시점에 이미 점등했으므로 `ensureEnergyLit`도 호출 안 함, 기존 `finishDischargePath` 동작 그대로).
3. **5-C UI = 신규 `WrapUpOverlay`, `PauseOverlay`와 동일 패턴.** `FocusPage.tsx` 로컬 컴포넌트(카탈로그 미등재, `RetroPage`의 `StateChip` 선례와 동일하게 export 안 함). `BottomSheet` + `Button` 2개(`variant="primary"` "이 조각 끝났어요" / `variant="secondary"` "아직 남았어요")로 조립. 카피는 이번 위상에서 확정(자체 창작, 원문 차용 금지).
4. **`awaitingWrapUp` 동안 일시정지·딴생각 포착 제스처는 비활성화한다.** 15분 floor는 이미 충족됐으므로 "그만하기"(조기 이탈용 메커니즘)는 더 이상 의미가 없다 — `WrapUpOverlay`가 뜨면 탭/롱프레스 영역을 `PauseOverlay`/`CaptureModal`과 동일하게 비활성화(`isPaused || isCaptureOpen` 가드에 `awaitingWrapUp` 추가).
5. **`tick()` 인터벌은 15분 경과 후에도 굳이 멈추지 않는다.** `formatRemaining`이 이미 0 이하를 클램프하므로 화면상 문제 없음. 인터벌을 멈추는 최적화는 이번 위상 범위 밖(Positive Non-Goal) — 굳이 추가 상태·effect 분기를 늘리지 않는다(YAGNI).
6. **`RetroPage`는 완전히 무변경.** `block.status`만 보고 6/6′ vs 7/7′을 나누는 기존 구조가 5-C의 두 선택지를 그대로 소비할 수 있으므로 손댈 이유가 없다.

## In-Scope

**A. `src/hooks/useFocusTimer.ts` (핵심 로직)**

- [x] `energyLitRef`(블록 id 저장, 신규 블록마다 자연 리셋 — 훅이 라우트 전환마다 리마운트되므로 컴포넌트 스코프 ref로 충분) 신설
- [x] `ensureEnergyLit(blockId)` 헬퍼 — 이미 점등된 블록이면 no-op, 아니면 `lightEnergyCell` 호출 + ref 갱신
- [x] `awaitingWrapUp` 상태 신설(15분 경과 & 방전 아님 & 아직 미해결) — 훅 반환값에 노출
- [x] 기존 `if (elapsedSeconds >= FOCUS_SECONDS) { void finish(true) }` effect를 교체:
  - [x] 방전 블록(`dischargeBlockPointer.get() === block.id`)이면 기존 그대로 `void finish(true)` 즉시 호출(무변경 경로)
  - [x] 방전이 아니면 `ensureEnergyLit(block.id)` 호출 + `awaitingWrapUp` true로 설정, `finish()` 호출 안 함
- [x] `finish(completed)` 최상단에 `ensureEnergyLit(block.id)` 폴백 호출 추가(조기 이탈 경로 보장)
- [x] `finishNormalPath`에서 기존 `lightEnergyCell` 직접 호출 제거(중복 점등 방지, A의 ensureEnergyLit로 일원화)
- [x] `finish()` 호출 시 `awaitingWrapUp` false로 리셋(다음 블록 대비, 안전 차원 — 리마운트로 자연 리셋되지만 명시)

**B. `src/pages/FocusPage.tsx` (5-C UI)**

- [x] `WrapUpOverlay` 로컬 컴포넌트 신설(`PauseOverlay`와 동일 조립: `BottomSheet` + `Button` 2개)
- [x] `awaitingWrapUp`이 true일 때 `WrapUpOverlay` 렌더, "이 조각 끝났어요" → `finish(true)`, "아직 남았어요" → `finish(false)`
- [x] 탭/롱프레스 제스처 가드에 `awaitingWrapUp` 추가(`{...(isPaused || isCaptureOpen || awaitingWrapUp ? {} : longPressHandlers)}`)
- [x] `DevSkipButton`은 무변경(5-C 우회하고 즉시 `finish(true)`, dev 전용이라 §2 가드레일 영향 없음)

**C. 테스트 (RED 먼저)**

- [x] `FocusPage.test.tsx`의 기존 `'auto-finishes at 900 seconds...'` 테스트를 **교체**: 900초 도달 시 자동으로 RETRO_STUB에 안 가고, 대신 5-C 시트("이 조각 끝났어요"/"아직 남았어요" 버튼)가 뜨는지 + 그 시점에 에너지가 이미 점등돼 있는지(완료 라벨 확정 전) 확인
- [x] 신규: "이 조각 끝났어요" 클릭 → `status: 'done'`으로 회고 이동, 에너지 중복 점등 없음(1건만)
- [x] 신규: "아직 남았어요" 클릭 → `status: 'incomplete'`로 회고 이동, 에너지 중복 점등 없음
- [x] 신규: 방전 블록은 900초 도달 시 5-C 없이 기존처럼 자동 완료(회귀 방지, `dischargeBlockPointer` 시나리오)
- [x] 기존 "그만하기"(조기 이탈) 테스트 전부 회귀 확인 — 에너지 1건만 점등되는지 명시적으로 추가 확인
- [x] 신규: 900초 경과 상태에서 탭/롱프레스가 무시됨(캡처 모달·일시정지 안 뜸)
- [x] 신규: `awaitingWrapUp` 중 `danger|error|warning|fail` 클래스·부정 문구 0건(가드레일 어서션)

## DO NOT CHANGE (이 위상 국소 — 전역은 README §0)

- `RetroPage.tsx` 전체(6/6′/7/7′ 판정·영점조절·보너스카드·"이어서 15분 더"/"오늘은 여기까지" 버튼) — 무변경
- `finishDischargePath`, `DischargeDashboardPage`, `dischargeBlockPointer` 관련 로직 전부
- `timer-slice.ts`(`complete`/`markIncomplete`/`pause`/`resume`/`tick`) 시그니처·동작
- `energy-slice.ts`(`lightEnergyCell`) 시그니처 — 호출 시점만 조정, 슬라이스 자체는 무변경
- Storage 인터페이스(TECH-SPEC §3), Block/EnergyCell 스키마

## Positive Non-Goals

- `tick()` 인터벌을 15분 경과 후 정지하는 최적화 없음(설계 결정 5, YAGNI)
- 5-C에서 "아직 남았어요" 선택 시 회고 화면(7/7′)을 건너뛰고 곧장 재시작하는 단축 경로 없음 — 기존 회고 화면(영점조절·보너스)을 그대로 거친다(사용자 확인 완료, 이전 턴)
- 조기 완료 버튼(15분 미만 시점의 "끝났어요") 없음 — SCREEN-FLOW.md "조기 완료 버튼 기각" 확정 사항, 이번 위상도 그 결정을 따른다
- `DESIGN-SYSTEM.md §5` 신규 컴포넌트 등재 없음(patch 등급, `PauseOverlay` 선례와 동일 조립)
- 딴생각 포착(5-A)의 "다음 조각 예약" 카피 확장(P16)은 **이 위상 범위 밖** — 별도 patch 또는 후속 세션(문구만 바꾸는 국소 변경이라 이 위상과 결합할 필요 없음, 착수 시점에 재검토)
- 집중 화면 이탈 가능 안내 문구(P15, `text.quiet` 상시 안내)도 **이 위상 범위 밖** — 5-C와 독립적인 카피 전용 변경이라 별도 patch로 분리 가능(착수 시점에 통합 여부 재검토)

## 수용 기준 (기계 검증만)

**공통:**

- [x] `npm run typecheck` exit 0
- [x] `npm run lint` exit 0(신규 경고 0건, 착수 전 기준선과 대조 — 12건 그대로, 신규 0)
- [x] `npm run test` 통과, `useFocusTimer.ts`/`FocusPage.tsx` 변경분 커버리지 ≥80%(96.34%/95.23%)
- [x] `npm run build` exit 0
- [x] SSOT 대조 표의 모든 행이 실제 구현과 일치(완료 선언 직전 재확인)

**UI 위상 기준(patch 등급 — README §0-1 상속, 대비 실측·시각회귀 신규 기준선은 생략):**

- [x] 320·375px에서 `WrapUpOverlay` 노출 시 가로 스크롤 0, 뷰포트 오버플로 요소 0(Playwright 실측)
- [x] `WrapUpOverlay`의 두 버튼 전부 ≥44×44 CSS px(기존 `Button` 재사용이라 사실상 자동 충족, 실측만)
- [x] `danger|error|warning|fail` 클래스·부정 문구 렌더 0건
- [x] 에너지 fill 색상이 5-C 진입 시점(완료 라벨 미확정 상태)에도 완료/미완료 최종 상태와 동일(무처벌 불변식 유지) — `EnergyBar`/`lightEnergyCell` 무변경이라 자동 충족
- [x] 상태 어서션: 900초 도달 시 `/retro`로 자동 리다이렉트되지 않음(사용자 선택 전까지 `/focus`에 머무름)

## Runnable-State 커맨드

```
npm run typecheck && npm run lint && npm run test && npm run build
```

## Changelog

- **v0.1(2026-07-14)** — 상세화(미구현). PH-11 이후 실사용 감사(P14/P15/P16, `SCREEN-FLOW.md` v0.6)를 코드 레벨로 옮기는 첫 위상. 에너지 점등-완료판정 분리(`ensureEnergyLit`)·방전 블록 우회·5-C `WrapUpOverlay` 조립·기존 900초 자동완료 테스트 교체까지 설계 결정 6개 확정. P15(이탈 안내 문구)·P16(딴생각 포착 용도 확장)은 이 위상과 결합하지 않고 범위 밖으로 분리(Positive Non-Goals). 구현·Runnable State는 다음 세션.
- **v0.2(2026-07-14)** — 구현 완료. `useFocusTimer.ts`에 `useEnsureEnergyLit`/`runFinish`/`detectWrapUp` 헬퍼 신설(함수당 라인 예산 유지 겸용), `finishNormalPath`의 직접 점등 제거. `FocusPage.tsx`에 `WrapUpOverlay`·`Overlays`·`CountdownArea` 로컬 컴포넌트 신설. 기존 900초 자동완료 테스트 교체 + 신규 6건(5-C 노출·양 선택지·방전 우회·제스처 잠금·무처벌 카피) 추가, `core-loop.integration.test.tsx`도 새 2택 흐름에 맞춰 갱신. Runnable State 전부 통과(`typecheck`/`lint`(신규 경고 0)/`test` 373/373/`build`), 변경분 커버리지 `useFocusTimer.ts` 96.34%·`FocusPage.tsx` 95.23%. Playwright로 320/375px `WrapUpOverlay` 실측(가로 스크롤·오버플로 0, 버튼 ≥44×44px, 부정 문구 0) 및 code-reviewer 검증 완료(CRITICAL/HIGH/MEDIUM 0건).
