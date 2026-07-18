# Plan: 대기 중인 조각 큐 영구 소실 버그 — 재현 e2e + 영속화 수정

**Source**: 베타 사용자 적합도 감사(2026-07-18) — `e2e/` 커버리지와 `docs/SCREEN-FLOW.md` 대조 중 발견
**Selected Milestone**: 감사 CRITICAL 항목 A(재현)+B(수정)
**Complexity**: Medium

## Summary

과제를 여러 조각으로 쪼갠 뒤 타이머가 안 도는 상태(대시보드)에서 새로고침/앱 재기동이 일어나면, 아직 시작하지 않은 조각들이 영구히 사라진다. `tasks`/`queuedBlocks`가 IndexedDB에 제대로 영속화되지 않거나(`queuedBlocks`는 아예 인메모리 전용) 부팅 시 재하이드레이션되지 않기 때문이다. 페르소나 K("배터리 5%")의 일상적 사용 패턴(앱을 자주 들락날락)과 정확히 겹치는 데이터 손실이라 베타 첫 주에 감지될 위험이 높다. 먼저 e2e로 재현(Phase A)하고, IndexedDB 영속화 + 부팅 하이드레이션으로 수정한다(Phase B).

## 근본 원인 (코드로 확인 완료)

- `src/store/slices/block-queue-slice.ts` — `queuedBlocks`는 IndexedDB 쓰기가 전혀 없는 순수 Zustand 인메모리 상태
- `src/store/slices/task-slice.ts` — `tasks`는 생성 시 IndexedDB에 쓰지만(`idbStorage.create('tasks', task)`), 부팅 시 다시 읽어오는 코드가 앱 어디에도 없음
- `src/hooks/useSessionRecovery.ts`가 복구하는 건 **활성 타이머 세션 포인터 하나뿐**(주석: "tasks/queuedBlocks 전체 복구는 의도적으로 하지 않는다")
- `src/pages/DashboardPage.tsx`의 `resolveActiveTaskView`가 `tasks`/`queuedBlocks`가 비어있으면 무조건 `AddTaskPrompt`(온보딩과 동일한 "새 과제" 화면)를 보여줘서, 데이터 소실이 사용자에게는 티가 안 남

## Patterns to Mirror

| Category                | Source                                                           | Pattern                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 슬라이스 영속화         | `src/store/slices/task-slice.ts:16-27`                           | `idbStorage.create` 먼저 await → `set()`으로 메모리 반영. 액션은 `Promise<T>` 반환                                                 |
| 스키마 마이그레이션     | `src/storage/idb-schema.ts` + `src/storage/idb-storage.ts:36-56` | `DB_VERSION` 증가 + `if (oldVersion < N)` 블록에서 `db.createObjectStore(...).createIndex(...)`                                    |
| 날짜 스코프 조회        | `src/storage/idb-storage.ts:88-93` (`findByDate`)                | 엔티티에 `date: string` 필드 + schema `date` 인덱스 → `findByDate(store, todayDateString())`                                       |
| 부팅 시 하이드레이션 훅 | `src/hooks/useSessionRecovery.ts` 전체                           | `useEffect` 1회 실행(`ranRef`) → 스토어 `setState` → `AppShell.tsx`에서 `isRecovering` 게이트로 깜빡임 방지                        |
| 슬라이스 단위 테스트    | `src/store/slices/task-slice.test.ts`                            | `idbStorage.findById`로 영속 여부까지 직접 검증                                                                                    |
| e2e 갭 재현 스펙        | `e2e/zero-dashboard.spec.ts`, `e2e/session-recovery.spec.ts`     | 헤더 주석에 SCREEN-FLOW 근거 명시, `page.clock.install()`, 320/768px 루프, `mobile-320`에서만 실행하는 `test.beforeEach` skip 패턴 |

## Files to Change

| File                                                            | Action | Why                                                                                                              |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `e2e/queue-persistence-recovery.spec.ts`                        | CREATE | Phase A — 재현 스펙 (레드 → 수정 후 그린)                                                                        |
| `src/types/queued-block.ts`                                     | CREATE | `QueuedBlock` 도메인 타입을 `Task`/`Block`과 같은 위치로 이동(현재 슬라이스 파일에 끼어 있음), `date` 필드 추가  |
| `src/storage/types.ts`                                          | UPDATE | `StoreName`에 `'queuedBlocks'` 추가, `Storage`에 `delete<T>(store, id): Promise<void>` 추가                      |
| `src/storage/idb-schema.ts`                                     | UPDATE | `ComPaceDB`에 `queuedBlocks: { key, value: QueuedBlock, indexes: { taskId, date } }` 추가, `DB_VERSION` 2→3      |
| `src/storage/idb-storage.ts`                                    | UPDATE | `oldVersion < 3` 마이그레이션 블록(새 스토어+인덱스 생성만, 백필 불필요), `delete()` 구현                        |
| `src/store/slices/block-queue-slice.ts`                         | UPDATE | `queueBlocks`/`dequeueBlock`을 async+영속화로 전환, `QueuedBlock` 재수출 대신 `types/queued-block.ts`에서 import |
| `src/hooks/useTaskQueueRecovery.ts`                             | CREATE | 부팅 시 `findByDate('tasks', today)` + `findByDate('queuedBlocks', today)`로 하이드레이션                        |
| `src/hooks/useTaskQueueRecovery.test.tsx`                       | CREATE | `useSessionRecovery.test.tsx` 패턴 미러                                                                          |
| `src/app/AppShell.tsx`                                          | UPDATE | `useTaskQueueRecovery()` 호출 추가, 렌더 게이트에 합류                                                           |
| `src/pages/SplitPage.tsx`                                       | UPDATE | `queueBlocks(...)` 앞에 `await`                                                                                  |
| `src/pages/PredictPage.tsx`                                     | UPDATE | `dequeueBlock(nextId)` 앞에 `await`                                                                              |
| `src/store/slices/block-queue-slice.test.ts`                    | UPDATE | 기존 동기 호출을 `await`로, IDB 영속 검증 추가(task-slice.test.ts 패턴)                                          |
| `src/pages/DashboardPage.tsx`, `src/lib/core-loop-selectors.ts` | UPDATE | `QueuedBlock` import 경로를 `../store/slices/block-queue-slice` → `../types/queued-block`로 변경                 |

## Tasks

### Phase A — 재현 (레드 테스트)

#### Task A1: `e2e/queue-persistence-recovery.spec.ts` 작성

- **Action**: 아래 3개 시나리오를 담은 새 e2e 스펙 작성
  - 시나리오 1: 온보딩 → 과제 쪼개기(조각 2개) → 대시보드(타이머 미시작) → `page.reload()` → 조각 2개 다 있고 `FragmentChoice`가 그대로 뜨는지 확인
  - 시나리오 2: 조각 1개만 쪼개고 새로고침 → `TaskCta`("이 블록 시작하기")가 살아있는지 확인(현재는 `AddTaskPrompt`로 리셋됨)
  - 시나리오 3: 조각 2개 중 1개 완료 → 대시보드 복귀(2번째 조각 대기 중) → 새로고침 → 2번째 조각이 남아있는지 확인
- **Mirror**: `e2e/session-recovery.spec.ts`(헤더 주석 스타일) + `e2e/fragment-choice.spec.ts`(2조각 쪼개기 헬퍼)
- **Validate**: `npx playwright test e2e/queue-persistence-recovery.spec.ts` — 수정 전에는 반드시 실패해야 함(레드 확인)

### Phase B — 수정

#### Task B1: 도메인 타입 분리

- **Action**: `src/types/queued-block.ts` 신설 — `{ id, taskId, verbLabel, date }`
- **Mirror**: `src/types/task.ts`

#### Task B2: Storage 계약 확장

- **Action**:
  - `types.ts`에 `'queuedBlocks'` 스토어명 + `delete` 메서드 추가
  - `idb-schema.ts`에 `queuedBlocks` 스토어(`keyPath: 'id'`, 인덱스 `taskId`+`date`) 추가, `DB_VERSION = 3`
  - `idb-storage.ts`: `oldVersion < 3` 블록에 `createObjectStore`+`createIndex` 2개, `delete<T>` 구현(`db.delete(store, id)`)
- **Validate**: `npm run typecheck`, 기존 `idb-migration.test.ts`(v1→v2 백필) 회귀 없는지 `npm test -- idb-migration`

#### Task B3: block-queue-slice 영속화

- **Action**:
  - `queueBlocks(taskId, verbLabels)`: 각 `QueuedBlock`에 `date: todayDateString()` 부여 → `idbStorage.create('queuedBlocks', b)` 병렬 await → `set()`. 반환 타입 `Promise<void>`
  - `dequeueBlock(id)`: `await idbStorage.delete('queuedBlocks', id)` → 메모리에서 filter. 반환 타입 `Promise<void>`
  - `promoteQueuedBlock`은 그대로 둔다(범위 밖, Non-goals 참조)
- **Validate**: `npm test -- block-queue-slice`

#### Task B4: 호출부 await 추가

- **Action**: `SplitPage.tsx` `finishSplit()`, `PredictPage.tsx` `choose()`에 `await` 추가
- **Validate**: `npm run typecheck`(async 시그니처 불일치는 컴파일 타임에 잡힘), `npm test -- SplitPage PredictPage`

#### Task B5: 부팅 하이드레이션 훅

- **Action**:
  - `useTaskQueueRecovery.ts`: `useSessionRecovery`와 동일하게 1회 실행 가드, `findByDate('tasks', today)` + `findByDate('queuedBlocks', today)` 병렬 조회 → `useAppStore.setState({ tasks, queuedBlocks })`
  - `AppShell.tsx`: 두 번째 훅 호출 추가, `isRecovering || isHydrating`일 때 렌더 보류(기존 깜빡임 방지 패턴 그대로 확장)
- **Mirror**: `useSessionRecovery.ts:24-37`, `AppShell.tsx:21-34`
- **Validate**: `npm test -- useTaskQueueRecovery`

#### Task B6: 레드 테스트 그린화

- **Action**: Task A1의 e2e 3개 시나리오 재실행 → 통과 확인
- **Validate**: `npx playwright test e2e/queue-persistence-recovery.spec.ts`

## Non-goals (의도적 범위 제외)

- `promoteQueuedBlock`(자기선택 재정렬)의 순서는 영속화하지 않는다 — 선택 직후 곧장 `dequeueBlock`으로 이어지는 찰나의 창(select→predict 이동 직전)에만 새로고침이 겹쳐야 발생하는 희귀 케이스라, 최악의 경우 원래 쪼갠 순서로 되돌아갈 뿐 데이터 소실은 없음
- 며칠 뒤 재방문 시 진행 중이던/일시정지된 블록의 "다음날 그대로" 이월은 SCREEN-FLOW P4가 이미 post-MVP로 문서화한 경계라 이번 수정 범위 밖(오늘 하루 안에서 조각이 사라지는 이번 버그와는 별개 사안)
- 방전 모드는 `DischargeDashboardPage.tsx`가 이미 `dequeueBlock`을 호출하지 않으므로(SPEC §5 "진짜 과제 보존") 이번 변경으로 동작이 바뀌지 않음, 회귀 여부만 기존 `DischargeDashboardPage.test.tsx`로 확인

## Validation

```bash
npm run typecheck
npm test
npm run test:e2e -- queue-persistence-recovery zero-dashboard fragment-choice session-recovery discharge-loop
```

## Risks

| Risk                                                                                          | Likelihood | Mitigation                                                                                                                                                             |
| --------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_VERSION` 증가가 기존 사용자의 IDB를 잘못 마이그레이션                                     | LOW        | 새 스토어 추가만, 기존 스토어/인덱스 무변경 — `idb-migration.test.ts`로 v1→v2 경로 회귀 확인                                                                           |
| async 시그니처 전환이 놓친 호출부에서 컴파일 에러 없이 조용히 깨짐(Promise를 fire-and-forget) | MEDIUM     | `queueBlocks`/`dequeueBlock` 호출부는 grep으로 전수 확인 완료(SplitPage, PredictPage 2곳뿐) — `await` 누락은 결과적으로 "쓰기 전에 네비게이션"이라 e2e에서 바로 드러남 |
| `AppShell`에 두 번째 부팅 훅 추가로 인한 렌더 깜빡임 재발                                     | MEDIUM     | `useSessionRecovery`가 이미 푼 패턴(`isRecovering` 게이트)을 그대로 재사용, 두 훅 모두 `false`일 때만 `Outlet` 렌더                                                    |
| `promoteQueuedBlock` 미영속화로 인한 잔여 리스크                                              | LOW        | Non-goals에 명시, 데이터 소실 없고 UX만 순서 되돌림 — 심각도 낮음                                                                                                      |

## Acceptance

- [ ] Phase A e2e 스펙이 수정 전 레드 확인됨
- [ ] Phase B 전체 구현 완료
- [ ] `npm run typecheck`, `npm test`, 관련 e2e 전부 통과
- [ ] Non-goals 항목은 건드리지 않음(범위 준수)

## Estimated Complexity: MEDIUM

- Storage/schema 확장: 1-2h
- 슬라이스+호출부 async 전환: 1h
- 하이드레이션 훅+AppShell 배선: 1-2h
- 테스트(단위+e2e) 작성/조정: 2-3h
- 총 5-8h
