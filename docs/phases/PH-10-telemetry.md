# PH-10 — 내부 지표 로깅

> **의존:** [PH-02](PH-02-state.md)
> **SSOT:** [SPEC.md §10 내부 지표](../SPEC.md#10-내부-지표-확정--사용자-비노출) · [CLAUDE.md §9](../../CLAUDE.md#9-내부-지표-사용자-비노출)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) DO NOT CHANGE·Runnable State 정의는 여기 반복 안 함.
> **위상 등급:** patch(사유: 신규 화면·신규 컴포넌트 패턴 없음 — 순수 계산 모듈 1개 + 기존 3개 페이지의 기존 `startBlock` 호출부에 `startSession` 한 줄씩 추가. 토큰·CSS 무변경. README §0-1 UI 정량 수용 기준은 전부 N/A — 와이어 영향 0이 SPEC §10 확정 요구사항.)

## Goal

시동 성공률·예측 적중률 시계열·방전 진입 빈도가 루프가 이미 저장한 Task/Block/Prediction/Session만으로 순수 함수 한 개(`computeDailyTelemetry`)로 계산 가능한 상태. 사용자 노출·개입 0.

## SSOT 발췌 (착수 직전 필수)

**SPEC 발췌 (§10):**

> 로깅: 시동 성공률 · 예측 적중률 시계열 · 방전 진입 빈도(전부). 루프 배출물만, 새 질문 ❌. 관측만, 최적화 타깃은 §0뿐. 어떤 사용자 노출·메시지·개입도 촉발 ❌. **와이어 영향 0.**

**SCREEN-FLOW 전이 발췌:** 없음 — `grep §10\|내부 지표 docs/SCREEN-FLOW.md` → `0 matches`(와이어 영향 0과 정합, 확인 완료).

## SSOT 대조 표

| SSOT 문장/전이                                           | 배정                             | 이음새                                   | 명명 테스트                                                                                                                                                                                                                                                               | 비고(근거/검색 로그)                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "시동 성공률(입력→타이머 시작 전환)"                     | In-Scope                         | ① 순수 셀렉터                            | `counts a task as started only when a block for it started the same day` / `returns 0 (not NaN) when no tasks were created that day`                                                                                                                                      | `computeStartSuccessRate` — 같은 날짜 버킷 내 Task.id ∩ Block.taskId 교집합 / 그날 생성된 Task 수                                                                                                                                                                                                    |
| "예측 적중률 시계열"                                     | In-Scope                         | ① 순수 셀렉터                            | `computes hit rate per day from resolved predictions joined through blocks` / `returns one entry per calendar date across a multi-day range, in order`                                                                                                                    | Prediction은 date 없음(blockId 키) → 그날 Block마다 `findById('predictions', blockId)`로 조인. 날짜 범위 전체에 매일 1건씩 반환(시계열)                                                                                                                                                              |
| "방전 진입 빈도"                                         | In-Scope                         | ① 순수 셀렉터 + ③ 불변식(세션 생성 자체) | `computes discharge session ratio from Session.dischargeMode` / `starting logs a session with dischargeMode: true` (DischargeDashboardPage.test.tsx) / `"이어서 15분 더"도 …dischargeMode: false로 세션을 남긴다` (RetroPage.test.tsx) / PredictPage.test.tsx 세션 어서션 | **갭 발견(착수 전 코드 확인)**: `session-slice.ts`의 `startSession`이 정의만 있고 실제 `startBlock` 호출 3곳(PredictPage.choose·RetroPage.handleContinue·DischargeDashboardPage.handleStart) 어디서도 호출되지 않고 있었음 — Session 레코드가 지금까지 한 건도 안 만들어짐. 이번 위상에서 3곳에 배선 |
| "루프 배출물만, 새 질문 ❌"                              | DO NOT CHANGE(국소)              | —                                        | —                                                                                                                                                                                                                                                                         | 신규 Storage 스토어·신규 사용자 입력 없음(기존 Task/Block/Prediction/Session·기존 `findByDateRange` 재사용)                                                                                                                                                                                          |
| "어떤 사용자 노출·메시지·개입도 촉발 ❌ / 와이어 영향 0" | DO NOT CHANGE(국소) + ⑥ 가드레일 | ⑥ 불변식                                 | Grep 검증: `telemetry-selectors`를 import하는 파일이 테스트 파일 자신 외엔 0건                                                                                                                                                                                            | `grep -r telemetry-selectors src` → `src/lib/telemetry-selectors.test.ts` 1건만(모듈 자신 제외), 컴포넌트·페이지 import 0건 확인                                                                                                                                                                     |
| "구현은 post-MVP" (SPEC §10)                             | 설계결정(사용자 확인 완료)       | —                                        | —                                                                                                                                                                                                                                                                         | 직전 세션이 이미 이 위상 대비 DB 마이그레이션(`date` 인덱스·`findByDateRange`, 커밋 `aa672ab`)을 완료해뒀고 `phases/README.md` 로드맵도 PH-10을 PH-11(배포) 이전에 배치 — 사용자 확인 하에 "계산 로직·세션 배선"은 지금 구현하고 "노출/대시보드"만 post-MVP로 스코프 분리해 진행                     |

## In-Scope

- [x] `src/store/slices/session-slice.ts`의 `startSession` 갭 배선 — `PredictPage.tsx`(`choose`, dischargeMode: false), `RetroPage.tsx`(`makeRetroActions.handleContinue`, dischargeMode: false), `DischargeDashboardPage.tsx`(`handleStart`, dischargeMode: true) 3곳
- [x] `src/lib/telemetry-selectors.ts` 신설 — `computeDailyTelemetry(startDate, endDate): Promise<DailyTelemetry[]>`
  - [x] 시동 성공률: 날짜별 Task.id ∩ Block.taskId(같은 날 시작분) / 그날 Task 수
  - [x] 예측 적중률 시계열: 날짜별 Block → Prediction(blockId) 조인, `actual !== null`만 resolved로 카운트
  - [x] 방전 진입 빈도: 날짜별 Session 중 `dischargeMode === true` 비율
  - [x] 분모 0인 날은 `0` 반환(NaN 방지)
- [x] 테스트: `telemetry-selectors.test.ts`(6개, RED 먼저) + 3개 페이지 테스트에 세션 로깅 어서션 추가

## DO NOT CHANGE (이 위상 국소)

- `TimerSlice`(`startBlock` 등)의 타입 시그니처 — 세션 배선은 페이지/훅 레이어에서 오케스트레이션(교차 슬라이스 `get()` 접근 없이 기존 슬라이스 경계 유지, `useFocusTimer.ts`의 기존 오케스트레이션 관례와 동일)
- `Storage` 인터페이스(TECH-SPEC §3) — `findByDateRange`는 PH-01/직전 세션에서 이미 도입 완료, 신규 메서드 추가 없음
- 어떤 페이지/컴포넌트도 `telemetry-selectors`를 import하지 않는다(SPEC §10 확정)

## Positive Non-Goals

- 사용자 대상 통계 화면·대시보드 없음(SPEC §10 "구현은 post-MVP" 중 노출 부분, post-MVP 유지)
- `computeDailyTelemetry`를 호출하는 프로덕션 코드 경로 없음 — 테스트로만 계산 로직을 검증한다
- 새로운 사용자 입력 질문 없음(임상 척도·자기보고 금지, SPEC §10 확정)
- 최적화 타깃으로 사용하지 않음(관측만, §0 Goodhart 방어)

## 수용 기준 (기계 검증만)

**공통:**

- [x] `npm run typecheck` exit 0
- [x] `npm run lint` exit 0(경고 11건 — 이 위상 착수 전 기준선과 동일, 신규 경고 0건 확인)
- [x] `npm run test` 통과(354/354), `telemetry-selectors.ts` 신규 로직 100% 커버(6개 테스트로 전 분기 커버)
- [x] SSOT 대조 표의 모든 행이 실제 구현과 일치(완료 선언 직전 재확인)

**UI 위상 기준:** 해당 없음 — 이 위상은 화면·컴포넌트를 렌더하지 않는다(SPEC §10 "와이어 영향 0", 위 위상 등급 참조). 대신 가드레일 어서션으로 대체: `telemetry-selectors`를 import하는 비테스트 파일 0건(Grep 확인 완료).

## Runnable-State 커맨드

```
npm run build && npm run test
```

## 구현 중 발견

- **세션 로깅 갭**: `session-slice.ts`의 `startSession`이 PH-02부터 존재했지만 실제 블록 시작 경로 어디에서도 호출되지 않아 Session 레코드가 한 건도 생성되지 않고 있었다. TECH-SPEC 데이터 모델 문서는 Session을 "내부 지표(SPEC §10), 로깅만"이라 서술해 이미 동작하는 것처럼 읽혔으나 실제로는 미배선 상태 — 코드 실동작 역추출(phases/README.md §0 "코드 실동작 역추출" 절차) 없이 문서만 읽었다면 놓쳤을 갭.

## Changelog

- **v0.1** — 헤더만 작성.
- **v1.0(2026-07-13)** — Runnable State 통과, 완료로 갱신. `session-slice.ts`의 미배선 갭(세션 로깅이 지금까지 한 건도 안 됐던 것) 발견·수정 + `src/lib/telemetry-selectors.ts` 신설(시동 성공률·예측 적중률 시계열·방전 진입 빈도, 순수 함수·기존 Storage만 사용, 신규 스토리지 확장 없음). 3개 페이지(`PredictPage`/`RetroPage`/`DischargeDashboardPage`)에 `startSession` 배선 + 각 페이지 테스트에 세션 로깅 어서션 추가. `RetroPage.tsx`가 이 배선으로 50줄 lint 제한을 넘길 뻔해 `store.startSession` 직접 참조로 되돌려 회귀 방지(PH-09 선례와 동일 이슈·해법). 전체 354개 테스트 통과, typecheck/lint(경고 11건, 착수 전과 동일 — 신규 0건)/build 전부 exit 0. Grep으로 `telemetry-selectors` import가 테스트 파일 자신 외 0건임을 확인해 "와이어 영향 0" 가드레일 실증.
