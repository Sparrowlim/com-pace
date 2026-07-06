# PH-01 — 데이터 모델 & 저장소

> **의존:** [PH-00](PH-00-tooling.md)
> **SSOT:** [TECH-SPEC.md §3 저장소](../TECH-SPEC.md#3-저장소-d-26-얇은-저장-모듈-구현) · [TECH-SPEC.md §4 데이터 모델](../TECH-SPEC.md#4-데이터-모델-5종--spec-0-데이터-4층--세션-로그)
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) 참조 — 특히 Storage 인터페이스 시그니처는 여기서 "정의"하되 이후 위상은 이 시그니처를 DO NOT CHANGE로 상속.

## Goal

TypeScript 타입 5종(Task/Block/Prediction/EnergyCell/Session)과 IndexedDB 기반 `Storage` 모듈이 완성되어, UI 없이도 `create/update/findByDate/findById`가 전부 단위 테스트로 검증되는 상태.

## In-Scope

- [ ] `src/types/task.ts` — `Task { id, title, createdAt, splitDone }` 타입 정의
- [ ] `src/types/block.ts` — `Block { id, taskId, verbLabel, status, startedAt, endedAt }` 타입 정의 (`status` union: 진행/일시정지/완료/미완료 — SCREEN-FLOW §1 상태축과 정합)
- [ ] `src/types/prediction.ts` — `Prediction { blockId, guess, actual }` 타입 정의
- [ ] `src/types/energy-cell.ts` — `EnergyCell { id, date, blockId, litAt }` 타입 정의 (색 분기 필드 금지 — DESIGN-TOKENS §5-1 단일성 정합)
- [ ] `src/types/session.ts` — `Session { id, date, startedTimerAt, dischargeMode }` 타입 정의 (내부 지표 전용, PH-10에서 소비)
- [ ] `src/storage/types.ts` — `Storage` 인터페이스 정의 (TECH-SPEC §3 시그니처 그대로, 이후 전역 DO NOT CHANGE로 승격)
- [ ] `src/storage/idb-schema.ts` — `idb` `openDB` 스키마: 5개 object store(`tasks`/`blocks`/`predictions`/`energyCells`/`sessions`), keyPath `id`
- [ ] `energyCells`/`blocks`/`sessions` store에 `date` 인덱스 추가 (`findByDate` 성능)
- [ ] `blocks` store에 `taskId` 인덱스 추가
- [ ] `src/storage/idb-storage.ts` — `Storage` 인터페이스 구현체 (`create`/`update`/`findByDate`/`findById` 각 store 공용 제네릭)
- [ ] `update`는 불변 패턴 준수 — 기존 레코드 조회 후 `{ ...existing, ...patch }`로 새 객체 생성 후 저장 (원본 참조 직접 mutate 금지, `common/coding-style.md`)
- [ ] 앱 부팅 시 `navigator.storage.persist()` 1회 호출 지점 마련 (`src/storage/persist.ts`, 아직 앱 셸 없으므로 함수만 export, 호출은 PH-03에서 연결)
- [ ] 에러 처리: `findById` 미존재 시 `null` 반환(throw 금지), `update` 대상 미존재 시 명시적 에러 throw
- [ ] `src/storage/idb-storage.test.ts` — store별 CRUD 단위 테스트 (Vitest, `fake-indexeddb` 사용)
- [ ] `create` 테스트: 각 5개 타입에 대해 저장 후 `findById`로 동일 값 회수
- [ ] `update` 테스트: 부분 patch가 나머지 필드를 보존하는지, 원본 객체가 mutate되지 않는지(불변성) 검증
- [ ] `findByDate` 테스트: 동일 날짜 여러 레코드 반환, 다른 날짜 제외 검증
- [ ] `findById` 테스트: 미존재 id → `null`
- [ ] 스키마 버전 상수 `DB_VERSION = 1` 명시 (마이그레이션 전략은 TECH-SPEC §12 미결 — 여기선 v1 고정만)

## DO NOT CHANGE (이 위상 국소)

- 아직 없음(최초 위상). 단, 이 위상이 확정하는 `Storage` 인터페이스 시그니처와 5종 타입 필드명은 **이후 모든 위상의 전역 DO NOT CHANGE로 승격**된다(README §0에 자동 반영 간주).

## Positive Non-Goals

- Zustand 연동 없음(PH-02)
- UI/화면 없음(PH-03 이후)
- 암호화 없음 — TECH-SPEC §10 확정 보류 그대로(MVP 평문)
- 마이그레이션 전략 설계 없음(TECH-SPEC §12 미결 사항, 지금 다루지 않음)

## 수용 기준 (기계 검증만)

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm test src/storage` 전체 통과
- [ ] `src/storage` 커버리지 ≥80% (`common/testing.md`)
- [ ] `pnpm eslint src/storage src/types --max-warnings 0`

## Runnable-State 커맨드

```
pnpm build && pnpm test src/storage src/types
```

## Changelog

- **v0.1** — 최초 작성, 상세 완료(착수 대상 위상).
