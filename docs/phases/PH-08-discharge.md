# PH-08 — 방전 모드

> **의존:** [PH-05](PH-05-core-loop.md), [PH-05.1](PH-05.1-core-loop-remediation.md), [PH-06](PH-06-edge-cases.md)
> **SSOT:** [SPEC.md §5 방전 모드](../SPEC.md#5-방전-모드-완전-확정) · [SCREEN-FLOW.md §5 방전 모드 상세](../SCREEN-FLOW.md#5-방전-모드-상세-spec-§5-정합) · [§2 Mermaid F 방전](../SCREEN-FLOW.md#2-전체-흐름도-mermaid)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙-모든-위상-공통--개별-ph-파일에서-반복-서술-금지) · [§0-1 UI 정량 수용 기준](README.md#0-1-ui-정량-수용-기준-화면컴포넌트-렌더하는-모든-위상-공통--ph-030405060708090-상속)
> **참고 스킬:** `react-patterns`, `react-testing`, `frontend-design-direction`(차분한 방전 표면)

## Goal

대시보드 상시 저마찰 링크("오늘은 가볍게 갈까요") → 방전 진입 → 방전 대시보드 → 집중 15분(예측 생략) → **시작 즉시 에너지 점등 + 따뜻한 한 줄** → 대시보드. **회고 전체 스킵**, 진짜 과제·큐 **보존**(소모 ❌). 기존 블록 화면 위에 **판정·카피 분기로만** 얹힘(새 콘텐츠 없음).

## SSOT 발췌 (원문 미개봉 자족성)

**SPEC 발췌 (§5):**

> "진짜 One Task 블록을 **그대로 유지**, 승리조건만 **'시작 = 오늘의 승리'**로 완화. (캔 액션으로 치환하지 않는다.)"
> "진짜 과제: 보존(파괴·소모 ❌). 다음날 그대로." · "에너지 바: 시작 순간 **즉시 점등**, 정상 블록과 **시각적으로 동일**(무처벌)."
> "사전 예측: **생략**. 회고가 전체 스킵되면 예측을 대조할 곳이 사라지므로." · "회고: **전체 스킵**(영점조절·예측보너스·이월) → 시작 점등 + 따뜻한 한 줄로 종료."
> "발동 주체: **상시 노출 저마찰 링크**('오늘은 가볍게 갈까요') — 사용자를 '고장'으로 라벨하지 않음." · "설계 비용: 별도 화면이되 새 콘텐츠 불필요 — 기존 블록의 **판정·카피만** 방전용 분기."

**SCREEN-FLOW 전이 발췌 (§5 · §2 F):**

| 현재상태        | 이벤트                            | 다음상태        | §참조 |
| --------------- | --------------------------------- | --------------- | ----- |
| 대시보드(2)     | "저마찰 링크: 오늘은 가볍게"      | 방전 진입       | §2    |
| 방전 진입       | "딱 하나만 할래요"                | 방전 대시보드   | §5    |
| 방전 진입       | "평소 모드로 볼게요"              | 대시보드(2)     | §5    |
| 방전 대시보드   | "타이머만 켜면 승리"(예측 생략)   | 집중 15분(방전) | §5    |
| 방전 대시보드   | "평소 모드로 돌아가기"            | 대시보드(2)     | §5    |
| 집중 15분(방전) | 시작 즉시 점등 + 한 줄, 회고 스킵 | 대시보드(2)     | §5    |

## SPEC 커버리지 표 (착수 직전 — SSOT = SPEC 문장 ∪ SCREEN-FLOW 전이)

| SPEC 문장 / SCREEN-FLOW 전이                       | 매핑 위치                | 비고                                                      |
| -------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| §5 "진짜 블록 유지, 승리조건만 완화(치환 ❌)"      | In-Scope C·D             | 방전은 진짜 과제 큐 선두로 타이머 구동, 캔 액션 치환 없음 |
| §5 "진짜 과제 보존, 소모 ❌, 다음날 그대로"        | 설계 결정 3 · In-Scope D | 방전 블록은 큐를 `dequeue`하지 않음                       |
| §5 "에너지 시작 즉시 점등, 정상과 시각적 동일"     | In-Scope D · 설계 결정 4 | `evidence.fill` 단일 토큰 그대로(모드 비재정의)           |
| §5 "사전 예측 생략"                                | In-Scope C · 설계 결정 2 | 방전 대시보드 → 집중 직행, `/predict` 미경유              |
| §5 "회고 전체 스킵 → 시작 점등 + 따뜻한 한 줄"     | In-Scope D               | `/retro` 미경유, 방전 종료 카피 1줄                       |
| §5 "상시 노출 저마찰 링크, '고장' 라벨 ❌"         | In-Scope A               | 대시보드 상시 링크, 초대 톤                               |
| §5 "새 콘텐츠 불필요 — 판정·카피만 분기"           | 설계 결정 1              | 모드 플래그 + 기존 화면 조건 분기(신규 화면 최소)         |
| SCREEN-FLOW §2 "방전 진입 2지선다(딱 하나만/평소)" | In-Scope B               | 방전 진입 확인 화면                                       |
| §5 방전 대시보드 "차분한 색"                       | In-Scope C · 설계 결정 5 | 기존 `[data-mode="discharge"]` 토큰 재사용                |

## 전이 → 명명 테스트 (RED 먼저)

| SSOT 전이/문장                            | 이음새 | 명명 테스트                                                    |
| ----------------------------------------- | ------ | -------------------------------------------------------------- |
| 대시보드 → 방전 진입(저마찰 링크)         | ②      | `dashboard shows always-on discharge link and enters on tap`   |
| 방전 대시보드 → 집중, `/predict` 미경유   | ②      | `discharge start goes straight to focus, never visits predict` |
| 방전 집중 시작 즉시 에너지 +1             | ①      | `discharge lights an energy cell at focus start`               |
| 방전 종료 → 대시보드, `/retro` 미경유     | ②      | `discharge end returns to dashboard, never visits retro`       |
| 진짜 과제 큐 보존(소모 ❌)                | ①      | `discharge does not dequeue the real task fragment`            |
| 방전 에너지 fill 색 === 정상 블록 fill 색 | ③      | `discharge energy fill color identical to normal block`        |
| 방전 화면 처벌색·부정/낙인 문구 0         | ③      | `discharge screens render no punish color or stigma copy`      |

## 착수 전 설계 결정 (구현 전 확정)

1. **방전은 인메모리 모드 플래그다 — 새 라우트 최소.** 세션 범위 `dischargeMode`(신규 경량 슬라이스 또는 기존 세션 슬라이스 가법 필드). 대시보드·집중이 이 플래그로 분기(판정·카피). 방전 진입 확인만 소형 화면/시트. Storage·Block 스키마 무변경(전역 DO NOT CHANGE).
2. **예측 생략 = 방전 대시보드에서 집중 직행.** `/predict`를 경유하지 않는다(라우트 자체를 건너뜀). `setPrediction` 호출 없음 → 종료 시 대조할 예측 없음(회고 스킵과 정합).
3. **진짜 과제·큐 보존 = `dequeue` 안 함.** 방전 블록은 큐 선두 조각 라벨로 `startBlock(taskId, verbLabel)` 하되 `dequeueBlock`을 호출하지 않는다 → 조각이 큐에 그대로 남아 다음날/평소 모드에서 재사용. **착수 시 검증:** `startBlock`이 큐 소비와 독립적으로 `activeBlock`을 만드는지(PH-05 구조상 dequeue는 predict 단계 별개 — 방전은 그 단계를 건너뛰므로 자연히 미소비). 큐가 비어 있으면(과제 소진) 방전 링크는 zero 대시보드에서 숨기거나 새 과제 유도로 갈음(착수 시 확정).
4. **에너지 시작 즉시 점등, 시각 동일.** 집중 진입(방전) 시점에 `lightEnergyCell(blockId, today)` 호출(정상 루프는 종료 시점 — 방전은 시작 시점). `evidence.fill` 단일 토큰을 그대로 소비(모드 비재정의 — 감사 v1.4 확인). 완료/미완료 개념 없음(시작=승리).
5. **차분한 표면 = 기존 `[data-mode="discharge"]` 토큰 재사용.** 방전 대시보드·집중 래퍼에 `data-mode="discharge"` 부여. 새 색 토큰 신설 없음. `action`/`evidence.fill`은 이 모드가 재정의하지 않음(감사 확인 — 무처벌·즉시성 유지).
6. **종료 = 회고 전체 스킵.** 방전 집중 종료(15분 도달 또는 방전 특성상 시작이 승리) 시 `/retro`를 거치지 않고 대시보드로 직행하며 `dischargeMode`를 해제. 종료 시 `complete()`/`markIncomplete()` 대신 방전 전용 정리(활성 블록만 비움, 큐·에너지 무변경 — 에너지는 이미 시작 시 점등됨).
7. **따뜻한 한 줄 = 자체 창작 카피.** 원문 차용 금지(DECISIONS 부록A). 방전 종료 카피 1줄(예: "오늘 켠 것만으로 충분해요" 류 — 실제 문구는 SPEC §13 미완 카피 태스크와 정합, 결과 칭찬 ❌·과정 인정).

## In-Scope

**A. 방전 발동 링크 (`src/pages/DashboardPage.tsx`)**

- [x] 정상 대시보드에 상시 노출 저마찰 링크("오늘은 가볍게 갈까요" 류, 초대 톤) → 방전 진입으로 이동. '고장'·처벌 라벨 없음
- [x] 큐 소진(zero) 상태에서의 링크 노출/숨김 규칙 확정(설계 결정 3) — 실행할 진짜 조각(`task.splitDone && next`)이 있고 타이머가 진행 중이지 않을 때만 노출. 과제 미입력·미분할·타이머 진행 중엔 숨김.

**B. 방전 진입 확인 (신규 소형 화면/시트)**

- [x] "딱 하나만 할래요"(→ `dischargeMode` on, 방전 대시보드) / "평소 모드로 볼게요"(→ 대시보드) 2지선다
- [x] 낙인 없는 안내 카피 1~2줄(자체 창작), 결정 피로 없는 닫힌 2지선다

**C. 방전 대시보드 (모드 분기)**

- [x] `dischargeMode` 시 대시보드가 차분한 표면(`data-mode="discharge"`) + "타이머만 켜면 승리" 카피 렌더, 진짜 과제(큐 선두) 노출
- [x] "타이머만 켜면 승리" → 집중(방전) **직행**(`/predict` 미경유)
- [x] "평소 모드로 돌아가기" → `dischargeMode` off + 대시보드

**D. 집중(방전 분기) (`src/pages/FocusPage.tsx` / `useFocusTimer`)**

- [x] 방전 진입 시 `startBlock(taskId, 큐 선두 verbLabel)` — **`dequeue` 호출 없음**(설계 결정 3) — `DischargeDashboardPage.handleStart`가 담당
- [x] **시작 즉시** `lightEnergyCell(blockId, today)`(설계 결정 4) — 정상 루프의 종료 시 점등과 분기 — `/focus` 진입 전 `DischargeDashboardPage`에서 호출
- [x] 15분 타이머는 그대로 흐름(길이 완화 ❌), `data-mode="discharge"` 래퍼 — focus 전용 다크 오버레이(`[data-mode="focus"]`)와는 배타적으로 적용되어 충돌 없음(둘 중 하나만 항상 세팅)
- [x] 종료 시 `/retro` 미경유 → 대시보드 직행 + `dischargeMode` off + 방전 종료 한 줄 노출(설계 결정 6·7) — `useFocusTimer`의 `finishDischargePath` + `onFinished(true)`
- [x] 딴생각 포착·일시정지(PH-06)는 방전에서도 유지되나 회고 스킵과 무충돌 — 일시정지/재개는 무변경 재사용, 포착물은 방전 종료 시 `setCapturedThought(null)`로 조용히 폐기(회고 화면이 없어 처리 UI가 없음)

**E. 상태 슬라이스 (`dischargeMode`)**

- [x] 세션 범위 `dischargeMode: boolean` + `enterDischarge()`/`exitDischarge()`(인메모리, Storage 무변경) + 유닛 테스트 — `src/store/slices/discharge-slice.ts` + `discharge-slice.test.ts`
- [x] 앱 재기동 시 방전 미복원(세션 범위 — post-MVP 아님, 방전은 그 순간의 상태) — Storage/영속 계층에 손대지 않았으므로 자연히 성립(검증 대상 없음)

## DO NOT CHANGE (이 위상 국소 — 전역은 README §0)

- PH-05/PH-05.1/PH-06 정상 루프·엣지케이스 로직 — 방전은 **분기만 추가, 대체 아님**
- Storage 인터페이스, Block/TECH-SPEC §4 데이터 모델, `queuedBlocks` 소비 규칙(방전은 미소비)
- `action`/`evidence.fill` 토큰 값, `[data-mode="discharge"]` 기존 토큰 정의
- 에너지 점등 로직(방전은 호출 **시점**만 시작으로 옮김, 로직 자체 재사용)

## Positive Non-Goals

- **과제를 캔 액션으로 치환하지 않음**(SPEC §5 확정, [D-18](../DECISIONS.md#d-18) 원안 = 승리조건 완화)
- **방전 전용 예측·회고·영점조절 없음**(전부 스킵)
- **방전 상태의 재기동 복원 없음**(세션 순간 상태 — 큐 영속과 무관)
- **방전 빈도 로깅은 PH-10 몫**(내부 지표) — 이 위상은 루프만
- **날짜 간 방전 통계·시각화 없음**(SPEC §8·§10 침묵 원칙)
- Playwright e2e 신규 작성은 완료 선언 전 1회 수동 `build && preview` + 320/375px 왕복으로 대체(PH-05/06 계승)

## 수용 기준 (기계 검증만)

**공통:**

- [x] `npm run typecheck` exit 0
- [x] `npm run lint` exit 0 (경고 6건 전부 이 위상 이전부터 있던 테스트 파일 `max-lines-per-function` — 신규 코드 0건)
- [x] `npm run test:coverage` 통과(260/260), 커버리지 80%+ 유지(97.76% stmt)
- [x] `npm run build` exit 0
- [x] SPEC 커버리지 표의 모든 행이 실제 구현과 일치(완료 선언 직전 재확인) — 위 In-Scope A~E 각 항목에 구현 위치 주석으로 대조 완료

**방전 고유:**

- [x] 방전 시작 시 `/predict` 라우트 진입 0회, 방전 종료 시 `/retro` 진입 0회(라우트 어서션) — `core-loop.integration.test.tsx` PH-08 describe
- [x] 방전 집중 **시작** 시점에 에너지 셀 카운트 +1(시작=승리, 종료 아님) — 동 통합 테스트 + `DischargeDashboardPage.test.tsx`
- [x] 방전 전후 해당 과제 `queuedBlocks` 길이 불변(큐 미소비 — 진짜 과제 보존) — 동 테스트들
- [x] 방전 에너지 fill computed color === 정상 블록 fill computed color(무처벌·시각 동일) — `EnergyCell`이 모드 무관 단일 `--evidence-fill` CSS 선언 1개만 가짐을 이미 `EnergyCell.test.tsx`가 고정, `tokens.generated.test.ts`가 `[data-mode="discharge"]`가 `--evidence-fill`을 재정의하지 않음을 고정(PH-04 산출물 재사용, 별도 신규 테스트 불필요)
- [x] 방전 진입·대시보드·집중·종료 전 화면에서 `danger|error|warning|fail` 클래스·부정/낙인 문구 0건 — `DischargeEntryPage.test.tsx`가 낙인 문구 부재를 어서션, 나머지 화면은 새 클래스 신설 없음(기존 토큰 재사용)
- [x] `dischargeMode` on/off 전이 유닛(진입·평소 복귀·종료 시 해제) — `discharge-slice.test.ts` + 각 페이지 테스트
- [x] (레이아웃) 방전 진입 시트·방전 대시보드 320/375px 가로 스크롤 0 · 링크/버튼 ≥44×44 — 수동 Playwright 왕복으로 확인(§Changelog 참조), `Button`/`OptionRow` 기존 44×44 보장 컴포넌트 재사용(신규 인터랙티브 요소 없음)

## Runnable-State 커맨드

```
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

## Changelog

- **v0.1** — 헤더만 작성.
- **v0.2** — 착수 직전 상세화(확장 템플릿). SSOT 발췌(SPEC §5 + SCREEN-FLOW §5/§2 전이) · SPEC 커버리지 표 · 전이→명명테스트 · 설계 결정 7개(인메모리 모드 플래그·예측 생략 직행·큐 미소비 보존·시작 즉시 점등·discharge 토큰 재사용·회고 스킵 종료·자체 카피) · In-Scope A~E · DO NOT CHANGE · Positive Non-Goals · 수용 기준 확정. **구현·Runnable State는 다음 세션**(PH-06.1 세션 내 이월 수정 후 착수 권장).
- **v0.3** — PH-08(방전 모드) Runnable State 통과, 완료로 갱신. `discharge-slice.ts`(`dischargeMode`·`dischargeEndMessage`·`enterDischarge`/`exitDischarge`/`setDischargeEndMessage`, 세션 범위 인메모리) 신설 + 스토어 결합. `DischargeEntryPage`(2지선다 확인)·`DischargeDashboardPage`(진짜 과제 노출, `startBlock` 후 즉시 `lightEnergyCell`, `dequeue` 없음)를 플레이스홀더에서 실제 구현으로 교체. `useFocusTimer`에 `finishDischargePath`/`finishNormalPath` 분기 신설 — 방전 종료는 재점등·예측해석·회고 진입 없이 `dischargeMode` 해제 + 자체 창작 한 줄("오늘 15분, 켠 것만으로 충분해요") 세팅 후 대시보드로 직행. `DashboardPage`에 상시 노출 저마찰 링크(실행 가능한 조각이 있고 타이머 미진행 시에만 노출)와 방전 종료 배너(언마운트 시 정리) 추가. 기존 `router.test.tsx`의 "방전 페이지는 플레이스홀더" 테스트를 제거하고 실제 가드 리다이렉트 테스트로 교체. 전체 260개 테스트 통과(커버리지 97.76% stmt), typecheck/lint(신규 경고 0건)/build 전부 exit 0. 임시 Playwright 스펙(커밋 안 함)으로 320px·375px 왕복 확인 — 온보딩→아무거나 입력→쪼개기→대시보드 방전 링크→방전 진입 2지선다→방전 대시보드→집중(가상 시계로 15분 진행)→방전 종료 배너까지 가로 스크롤 0, `/predict`·`/retro` 미경유 실증.
- **v0.4** — **code-reviewer 소급 적용 + CRITICAL 수정.** v0.3 완료 선언 직후(사용자 지적으로) `code-reviewer` 에이전트를 뒤늦게 호출한 결과, 세션 범위 `dischargeMode` 앰비언트 플래그를 `useFocusTimer.finish()`/`FocusPage`의 시각 모드/`useSessionRecovery`가 그대로 읽어 분기하던 것이 **CRITICAL**로 지적됨 — 방전 대시보드에서 블록을 시작하지 않고 뒤로가기/다른 화면으로 이탈해도 `dischargeMode`가 켜진 채 남을 수 있고, 그 상태에서 완전히 무관한 정상 블록을 진행·종료하면 그 블록이 방전으로 오분류돼 에너지 미점등·예측 미해석·회고 미경유가 조용히 새는 버그였다(재기동 중 방전 블록 복구 시 이중 점등하는 별개 재현 경로도 동일 근본 원인). **수정:** `dischargeBlockPointer`(`src/lib/discharge-block-pointer.ts`, `activeSessionPointer`와 동일한 localStorage 포인터 패턴) 신설 — "이 블록이 방전으로 시작됐는가"를 세션 플래그가 아니라 블록 자신에 붙여 추적. `DischargeDashboardPage.handleStart`가 `startBlock` 직후 포인터를 세팅하고, `useFocusTimer.finish()`·`FocusPage`의 시각 모드·`useSessionRecovery.recoverSession`(재기동 복구) 셋 다 이 포인터로만 분기하도록 교체(`dischargeMode`는 이제 방전 진입/대시보드 화면 노출만 게이트). `DischargeDashboardPage`에 언마운트 시 `dischargeMode` 무조건 해제(방어적 이중 안전장치) + 시작 버튼 재진입 가드(`isStarting`, MEDIUM 지적)도 함께 추가. 회귀 테스트 8건 신설(`discharge-block-pointer.test.ts` 4건, `FocusPage.test.tsx`의 stale-flag 회귀 1건, `useSessionRecovery.test.tsx`의 재기동 방전 종료 분기 2건, `DischargeDashboardPage.test.tsx`의 포인터 태깅·더블탭·언마운트 리셋 3건). 전체 270개 테스트 통과(커버리지 97.69% stmt), typecheck/lint(신규 경고 0건)/build 전부 exit 0.
