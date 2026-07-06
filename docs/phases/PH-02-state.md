# PH-02 — 상태관리 (Zustand slice)

> **의존:** [PH-01](PH-01-storage.md)
> **SSOT:** [TECH-SPEC.md §2 상태관리](../TECH-SPEC.md#2-상태관리)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙)
> **참고 스킬:** `frontend-patterns`(Zustand 상태관리 섹션)

## Goal

`taskSlice`/`timerSlice`/`energySlice`/`predictionSlice`/`sessionSlice`가 PH-01 Storage와 동기화되며, UI 없이 단위 테스트로 전이 로직이 검증되는 상태.

## In-Scope

- [x] `zustand` 의존성 추가(`package.json`, TECH-SPEC §2)
- [x] `src/lib/id.ts` — `generateId()` (`crypto.randomUUID()` 래핑, 슬라이스 전역 공용)
- [x] `src/lib/time.ts` — `nowIso()`(ISO 타임스탬프)·`todayDateString()`(`YYYY-MM-DD`, `findByDate` 조회용)
- [x] `src/lib/id.test.ts` — uuid 형식·호출 간 유일성 검증
- [x] `src/lib/time.test.ts` — `vi.setSystemTime`로 고정 시각 대상 포맷 검증
- [x] `src/store/slices/task-slice.ts` — `TaskSlice`(`tasks: Task[]`, `addTask`, `markTaskSplitDone`)
- [x] `addTask(title)`: `id`/`createdAt`/`splitDone:false` 채워 `storage.create('tasks', …)` 후 상태에 불변 append(반환값은 저장된 Task)
- [x] `markTaskSplitDone(id)`: `storage.update('tasks', id, { splitDone: true })` 후 반환된 레코드로 상태 배열 교체(불변, `map`)
- [x] `src/store/slices/task-slice.test.ts` — `addTask`/`markTaskSplitDone`이 상태·Storage 양쪽에 동일하게 반영되는지 검증
- [x] `src/store/slices/timer-slice.ts` — `TimerSlice`(`activeBlock: Block | null`, `elapsedSeconds: number`, `startBlock`, `pause`, `resume`, `complete`, `markIncomplete`, `tick`)
- [x] `startBlock(taskId, verbLabel)`: Block 생성(`status:'in_progress'`, `startedAt: nowIso()`, `endedAt: null`) + `storage.create('blocks', …)` + `activeBlock` 세팅 + `elapsedSeconds` 0 리셋
- [x] `pause()`/`resume()`: `activeBlock`이 없으면 명시적 `throw`(침묵 실패 금지). 있으면 `storage.update('blocks', id, { status })` 후 `activeBlock` 교체
- [x] `complete()`/`markIncomplete()`: `activeBlock` 없으면 `throw`. 있으면 `status`+`endedAt: nowIso()` 확정 저장 후 `activeBlock: null`·`elapsedSeconds: 0` 리셋(세션 종료)
- [x] `tick()`: `activeBlock?.status === 'in_progress'`일 때만 `elapsedSeconds`+1, 그 외(일시정지·없음) no-op — 초당 setInterval 연결 자체는 PH-05 화면 책임(여기선 순수 상태 전이 함수만)
- [x] `src/store/slices/timer-slice.test.ts` — start/pause/resume/complete/markIncomplete/tick 각 전이 + guard(활성 블록 없을 때 pause 등 호출 시 throw) 검증
- [x] `src/store/slices/energy-slice.ts` — `EnergySlice`(`energyCells: EnergyCell[]`, `loadEnergyCellsForDate`, `lightEnergyCell`)
- [x] `lightEnergyCell(blockId, date)`: `EnergyCell` 생성(색 분기 필드 없음 — DESIGN-TOKENS §5-1 단일성 정합) + 저장 + 상태 append
- [x] `loadEnergyCellsForDate(date)`: `storage.findByDate('energyCells', date)` 결과로 상태 하이드레이션(치환, append 아님)
- [x] `src/store/slices/energy-slice.test.ts` — 점등·날짜별 로드 검증(다른 날짜 배제 포함)
- [x] `src/store/slices/prediction-slice.ts` — `PredictionSlice`(`predictions: Prediction[]`, `setPrediction`, `resolvePrediction`)
- [x] `setPrediction(blockId, guess)`: `actual: null`로 생성 + 저장 + append
- [x] `resolvePrediction(blockId, actual)`: `storage.update('predictions', blockId, { actual })` 후 상태 배열에서 해당 `blockId` 항목만 교체(불변)
- [x] `src/store/slices/prediction-slice.test.ts` — 설정→확정 라운드트립, 다른 예측 항목 불변 검증
- [x] `src/store/slices/session-slice.ts` — `SessionSlice`(`sessions: Session[]`, `loadSessionsForDate`, `startSession`)
- [x] `startSession(date, dischargeMode)`: `Session` 생성 + 저장 + append(내부 지표 전용, 사용자 비노출 — PH-10에서 소비)
- [x] `loadSessionsForDate(date)`: `storage.findByDate('sessions', date)`로 상태 하이드레이션
- [x] `src/store/slices/session-slice.test.ts` — 시작·날짜별 로드 검증
- [x] `src/store/index.ts` — 5개 슬라이스를 결합한 `useAppStore`(zustand `create`), 슬라이스 간 직접 참조 없음(각자 독립 `StateCreator`)
- [x] `src/store/index.test.ts` — 결합 스토어에서 슬라이스별 상태·액션이 서로 간섭 없이 동작하는 스모크 테스트
- [x] 모든 액션 상태 갱신은 불변 패턴(`set(state => ({ ...spread/map }))`) — 원본 배열/객체 직접 mutate 금지(`common/coding-style.md`)
- [x] 모든 slice 액션은 `Storage`(PH-01) 호출 실패 시 catch로 삼키지 않고 그대로 전파(호출자가 처리) — 침묵 실패 금지
- [x] Zustand `persist`/`devtools` 미들웨어 미도입 — Storage가 이미 영속화 계층이라 중복(YAGNI, DECISIONS D-26 "얇은 저장 모듈"과 정합)

## DO NOT CHANGE (국소)

- PH-01 `Storage` 인터페이스 시그니처, 5종 데이터 타입 필드명(전역 상속)
- 이 위상이 확정하는 5개 슬라이스의 상태 필드명·액션 시그니처는 **이후 PH-03/PH-05의 전역 DO NOT CHANGE로 승격**(UI가 이 슬라이스를 그대로 바인딩)

## Positive Non-Goals

- UI 없음(PH-03 이후)
- 온보딩·방전 등 화면별 특수 분기 없음(PH-05 이후) — 예: "다음 블록 있음/없음", "zero 대시보드" 판단은 여기서 만들지 않는다
- 슬라이스 간 교차 오케스트레이션 없음(예: `timerSlice.complete()`가 `energySlice.lightEnergyCell()`을 직접 호출하지 않음) — 그 연결은 PH-05 화면 레이어 책임
- Zustand `persist`/`devtools` 미들웨어 없음
- 타이머 `setInterval` 연결 없음(순수 `tick()` 상태 전이 함수만, 실제 초당 호출은 PH-05)

## 수용 기준 (기계 검증만)

- [x] `npm run build` exit 0
- [x] `npm run test src/store src/lib` 전체 통과
- [x] `src/store`, `src/lib` 커버리지 ≥80%
- [x] `npm run lint` exit 0 (`src/store src/lib` 포함)
- [x] `npm run typecheck` exit 0

## Runnable-State 커맨드

```
npm run build && npm run test src/store src/lib
```

## Changelog

- **v0.1** — 헤더만 작성. PH-01 완료 후 상세화.
- **v0.2** — 착수 직전 상세화. 5개 슬라이스 책임 분리 확정: Block 생명주기는 `timerSlice`가 전담(쪼개기 단계의 미시작 블록은 이 위상 범위 밖 — `Block.status`에 "대기" 상태가 없어 시작 시점에만 엔티티 생성), `taskSlice`는 Task CRUD만. `Storage` 인터페이스에 taskId/날짜 조회 메서드가 없어 "task의 전체 블록 조회" 같은 하이드레이션은 이 위상 범위 밖(PH-03/05에서 필요 시 재검토).
- **v0.3** — 구현 완료. `zustand` 추가, `src/lib/{id,time}.ts` 유틸, 5개 슬라이스(`src/store/slices/*.ts`) + 결합 스토어(`src/store/index.ts`) 구현. `npm run build`/`lint`/`typecheck` 모두 exit 0. code-reviewer 검토 반영(MEDIUM): `markTaskSplitDone`/`resolvePrediction`이 존재하지 않는 id 대상 호출 시 Storage 에러를 그대로 전파하는지 검증하는 음성 경로 테스트 추가. 최종 46개 테스트 통과, `src/store`·`src/lib` 커버리지 100%.
