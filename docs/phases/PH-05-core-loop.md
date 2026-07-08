# PH-05 — 핵심 루프 화면 (대시보드·쪼개기·예측·집중·회고)

> **의존:** [PH-02](PH-02-state.md), [PH-03](PH-03-shell.md), [PH-04](PH-04-tokens-ui.md)
> **SSOT:** [SPEC.md §3 핵심 루프](../SPEC.md#3-핵심-루프-확정--ssot) · [SPEC.md §4 화면별 확정 명세](../SPEC.md#4-화면별-확정-명세) · [SCREEN-FLOW.md](../SCREEN-FLOW.md) 화면 2/3/4/5/6/6′/7/7′
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) · [§0-1 UI 정량 수용 기준](README.md#0-1-ui-정량-수용-기준-화면컴포넌트-렌더하는-모든-위상-공통--ph-030405060708090-상속)
> **우선순위:** 사용자 결정(2026-07-06)으로 온보딩(PH-07)보다 먼저 착수. 재정렬 근거는 [phases/README.md §2](README.md#2-순서-변경-근거-재정렬-로그).
> **참고 스킬:** `react-patterns`, `react-testing`, `frontend-design-direction`, `error-handling`(타이머 이탈·저장 실패 처리), `react-performance`

## Goal

온보딩 없이도 — 테스트가 스토어 액션을 직접 호출해 시드한 과제 1개 상태에서 — 대시보드→쪼개기→예측→집중(15분 타이머)→회고까지 전체 루프가 실제로 동작하고 Storage에 반영되는 상태.

## 착수 전 설계 결정 (구현 전 확정 — 아래 체크리스트의 전제)

PH-01~~04 산출물을 그대로 쓰되, 몇 가지 구조적 공백을 이 위상에서 메운다. 모두 **PH-01~~04 계약을 변경하지 않고 새 파일로 추가**하는 방식이다.

1. **블록 대기열(큐)은 스토어 인메모리 상태다, Storage 스키마 추가 아님.** 쪼개기 화면은 동사 칩으로 "조각 라벨" 목록만 만든다 — 실제 `Block` 엔티티는 `timerSlice.startBlock()`이 타이머 시작 시점에만 생성한다(PH-02 기존 동작 그대로). 따라서 대기 중인 조각은 `blockQueueSlice`(신규)의 `queuedBlocks: {id, taskId, verbLabel}[]`로만 보관 — Storage 인터페이스(`findByDate`/`findById`만 지원, 임의 인덱스 조회 없음)를 건드리지 않는다.
2. **"현재 활성 과제"는 파생 상태다, 별도 필드 아님.** One Task 불변식(`CLAUDE.md §2`) 덕분에 활성 과제는 항상 최대 1개뿐이다 — `currentTaskId`를 스토어에 새로 두지 않고, `selectActiveTask(tasks, queuedBlocks)` 순수 셀렉터(= "아직 안 쪼갰거나, 쪼갰지만 큐에 조각이 남은 과제")로 매 화면이 독립적으로 도출한다. 화면 간 라우터 state 전달도 없다 — 5개 화면 전부 스토어만 구독한다.
3. **회고는 "마지막으로 종료된 블록"이 필요하다.** `timerSlice.complete()`/`markIncomplete()`는 종료 즉시 `activeBlock`을 `null`로 비운다(PH-02 기존 동작) — 회고 화면이 참조할 대상이 사라진다. 새 `retroContextSlice.lastResolvedBlock`에 집중 화면이 종료 처리 직전 캡처해 넘긴다.
4. **Focus 화면의 "그만하기"는 5-B(길게 누름 일시정지/재개) 전체가 아니다.** SCREEN-FLOW의 미완료 경로(7/7′)는 원래 "길게 누름→일시정지→그만하기"를 거치지만, 5-A(딴생각 포착)·5-B(일시정지·재개)는 "이탈" 카테고리로 **PH-06 몫**이다(Positive Non-Goals). PH-05는 그 앞 조건 없이 즉시 미완료로 전이하는 단순 "그만하기" 버튼 하나만 제공해 7/7′ 조합을 실제로 도달 가능하게 한다 — 이 단순화는 SPEC 위반이 아니라 범위 절단선이며, 실제 길게 누름 제스처·재개는 PH-06에서 얹는다.
5. **2z(빈 대시보드)·6-A(휴식)·3-A(새 과제 추가 전용 화면)는 SSOT 화면 목록에 없다** — 별도로 만들지 않는다. 대시보드는 "활성 과제 없음"을 인라인 과제 추가 폼으로, 회고 완료 경로는 "잠시 쉬기"를 생략하고 "바로 다음 블록" 단일 버튼으로 대체한다. 정식 2z/6-A 와이어와 화면은 후속 위상 몫이다.

## SPEC 커버리지 표 (회고성 재감사 — 2026-07-08, README §0 SPEC 커버리지 게이트 소급 적용)

> PH-07(온보딩) 세션 중 사용자가 "쪼개기 후 자기선택이 없다"는 걸 실제 사용으로 발견 → PH-05가 이미 "완료"로 마킹돼 있었기에 SPEC.md §3·§4를 문장 단위로 재대조한 결과. **2건 갭 확인, 둘 다 미해결 상태로 별도 처리 대상.**

| SPEC 문장/화살표                                              | 매핑 위치                                 | 비고                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| "쪼개기(행동 동사)"                                           | In-Scope C                                | 구현됨                                                                                                                                             |
| **"만만한 1개 자기선택"**(§3, D-05)                           | **어디에도 없음 — 갭 ①**                  | 대시보드가 큐 맨 앞(FIFO, 입력 순서)을 자동 노출·선택 UI 없음. 착수 전 설계 결정 1~5 중 어디에도 이 단순화가 명시되지 않음(조용히 누락).           |
| "[사전 예측: 이번 15분에 끝날까? 2지선다]"                    | In-Scope D                                | 구현됨                                                                                                                                             |
| "15분 고정"                                                   | In-Scope E                                | 구현됨                                                                                                                                             |
| "[딴생각 포착]"                                               | Positive Non-Goals(PH-06 몫으로 명시)     | 의도된 이관, 정상                                                                                                                                  |
| **"영점조절(체감 3버튼: 순식간/딱 15분/너무 길게)"**(§3·D-11) | **어디에도 없음 — 갭 ②**                  | `RetroPage`엔 완료/이어감 뱃지·예측 적중 카드만 있고 체감 3버튼 자체가 존재하지 않음(코드베이스 전체 검색 결과 0건). 착수 전 설계 결정에도 미기재. |
| "예측 적중 보너스(적중 시에만, 침묵 규칙)"                    | In-Scope F, `BonusCard`                   | 구현됨                                                                                                                                             |
| "보상·이월(노력/완료 분리, 인지 재구성, 에너지 동일)"         | In-Scope F, `RecognitionChip`/`EnergyBar` | 구현됨                                                                                                                                             |
| "상주 목록 없음"(D-17)                                        | 착수 전 설계 결정 1                       | 구현됨(큐는 인메모리, 화면 닫히지 않음 — 쪼개기 목록 자체는 SplitPage 로컬 상태라 이탈 시 사라짐)                                                  |

**결론:** 갭 ①·②는 코드가 아니라 **사람(이전 세션)과 에이전트 둘 다 SPEC 문장을 체크리스트에 옮기지 않고 넘어간 것** — 지금 도입한 SPEC 커버리지 게이트가 있었다면 착수 직전 상세화 단계에서 걸렸을 항목들이다. 수정은 별도 위상/태스크로 처리하고 이 파일은 "완료"에서 되돌리지 않되(다른 5개 화면의 나머지 In-Scope는 실제로 완료), 상태 표에는 갭을 명시한다.

## In-Scope

**A. 신규 셀렉터·슬라이스 (Storage/기존 슬라이스 계약 변경 없음)**

- [x] `src/lib/core-loop-selectors.ts` — `selectActiveTask(tasks, queuedBlocks)`, `selectNextQueuedBlock(queuedBlocks, taskId)` 순수 함수 + 유닛 테스트(과제 0/1개, 큐 有/無, 소진 후 재선택 케이스)
- [x] `src/store/slices/block-queue-slice.ts` — `queuedBlocks: QueuedBlock[]`, `queueBlocks(taskId, verbLabels)`, `dequeueBlock(id)` + 유닛 테스트(다건 큐잉, 특정 id만 제거, 다른 과제 큐 비간섭)
- [x] `src/store/slices/retro-context-slice.ts` — `lastResolvedBlock: Block | null`, `setLastResolvedBlock(block)` + 유닛 테스트
- [x] `src/store/index.ts` — 위 2개 슬라이스를 `AppState`에 합성(기존 5개 슬라이스 시그니처는 무변경)
- [x] `src/lib/verb-chips.ts` — 동사 칩 고정 목록(예: 확인하기·열기·쓰기·정리하기·보내기·읽기) + 유닛 테스트(목록 비어있지 않음, 중복 없음)

**B. 대시보드 (화면 2, `/`)**

- [x] `activeBlock` 있음 → "타이머 진행 중" 카드 + 집중 화면 복귀 버튼(One Task 불변식 보호 — 진행 중에 새 블록 시작 CTA 노출 금지)
- [x] `selectActiveTask` 결과 없음(과제 없음 또는 소진) → 인라인 과제 추가 폼(제목 입력 + 제출) → `addTask` → `/split`으로 이동
- [x] 활성 과제 있음 + `splitDone === false` → `TaskCard` + "쪼개러 가기" 버튼 → `/split`
- [x] 활성 과제 있음 + 쪼개짐 + 큐에 다음 조각 있음 → `TaskCard`(다음 조각 라벨 노출) + "이 블록 시작하기" 버튼 → `/predict`
- [x] 오늘 날짜 기준 `loadEnergyCellsForDate` 호출, `EnergyBar filledCount={energyCells.length}` 렌더(불변 규칙 §2 에너지 바 — 완료/미완료 무관 단일 표시는 컴포넌트가 이미 보장, PH-04 산출물 그대로 소비)
- [x] One Task 어서션 대상: 주 과제 카드 DOM 카운트 항상 1개 이하(README §0-1②)

**C. 쪼개기 (화면 3, `/split`)**

- [x] 활성 과제 없음 → `/`로 리다이렉트(가드)
- [x] 조각 텍스트 입력 + 동사 칩(A의 `verb-chips.ts`) 클릭 시 "{입력} {동사}" 형태로 초안 목록에 추가, 입력창 초기화
- [x] 초안 목록 각 항목 제거 가능(확정 전 취소)
- [x] 초안 0개면 "완료" 버튼 비활성화(결정 피로 차단 — 에러 토스트·경고 문구 없이 버튼 자체로 유도)
- [x] "완료" → `queueBlocks(taskId, drafts)` + `markTaskSplitDone(taskId)` + `/`로 이동
- [x] AI 자동 분할 없음(수동 입력만, CLAUDE §2 불변 규칙)

**D. 사전 예측 (화면 4, `/predict`)**

- [x] 활성 과제 없음 또는 다음 큐 조각 없음 → `/`로 리다이렉트(가드)
- [x] 다음 조각 라벨 표시 + `OptionRow` 2지선다("끝날 것 같아요" / "더 걸릴 것 같아요")
- [x] 선택 시: `dequeueBlock(next.id)` → `startBlock(taskId, next.verbLabel)` → `setPrediction(block.id, guess)` → `/focus`로 이동(순서 중요 — `resolvePrediction`이 참조할 `blockId`는 `startBlock`이 반환한 실제 Block의 id)
- [x] 3지선다 이상으로 늘리지 않음(CLAUDE §2 결정 피로 차단)

**E. 집중 (화면 5, `/focus`)**

- [x] `activeBlock` 없음 → `/`로 리다이렉트(가드, README §0-1④ 라우트 가드 어서션 대상)
- [x] 1초 간격으로 `tick()` 호출(상태가 `in_progress`일 때만 — `timerSlice.tick()`이 이미 가드), 언마운트 시 인터벌 정리
- [x] 남은 시간 = `900 - elapsedSeconds`(음수 클램프), `mm:ss` 포맷 렌더(`font.size.timer` 토큰 소비)
- [x] 래퍼에 `data-mode="focus"` 부여 — DESIGN-TOKENS `[data-mode="focus"]` 다크 오버레이 적용(의도된 유일한 다크 컨텍스트, `action`/`evidence.fill` 값은 오버레이가 재정의하지 않음을 기존 토큰 CSS가 이미 보장)
- [x] 900초 도달 시 자동 종료(완료) — 중복 호출 방지 가드(ref) 포함
- [x] "그만하기" 버튼 → 즉시 미완료 종료(위 "착수 전 설계 결정 4" 단순화, 길게 누름·일시정지·재개 없음)
- [x] 종료 처리(완료·미완료 공통 `finish()`): `activeBlock` 캡처 → `setLastResolvedBlock(block)` → `complete()`/`markIncomplete()` → 해당 `blockId`에 예측이 존재할 때만 `resolvePrediction(blockId, completed)`(이어하기 블록은 예측이 없으므로 건너뜀, SCREEN-FLOW §3-1) → `lightEnergyCell(blockId, todayDateString())`(완료/미완료 무관 무조건 점등, D-09) → `/retro`로 이동
- [x] 딴생각 포착(5-A)·일시정지 UI(5-B) 없음(Positive Non-Goals, PH-06)

**F. 회고 (화면 6/6′/7/7′, `/retro`)**

- [x] `lastResolvedBlock` 없음 → `/`로 리다이렉트(가드)
- [x] `completed = lastResolvedBlock.status === 'done'`, `hit = prediction?.guess === prediction?.actual`(예측 없으면 `hit = false`) 판정
- [x] 완료(6/6′) 공통 카피 — 결과 퀄리티 무관 따뜻한 완주 문구(CLAUDE §4 톤, "잘했다/부족했다" 평가어 금지)
- [x] 미완료(7/7′) 공통 카피 — "실패"/"미완료"/"못 했어요" 등 부정 단어 없이 "오늘은 여기까지, 15분만큼의 증거는 남았어요" 류(CLAUDE §2 침묵 규칙 — 부재/미달성 무표시 원칙을 텍스트에도 적용)
- [x] 적중(`hit === true`)일 때만 `bonus.bg`/`bonus.line` 토큰의 조용한 보너스 카드 렌더 — 빗나감(6′/7′)은 **완료/미완료 화면과 완전 동일**, 배지·박스 없음(SCREEN-FLOW §3-2 🛡️)
- [x] "회고 인정칩" — 완료는 `state-done-*`, 미완료는 `state-carry-*` 토큰(처벌색 아님, DESIGN-TOKENS §5-2 정합 — `danger|error|warning|fail` 클래스는 여전히 0건)
- [x] `EnergyBar filledCount={energyCells.length}` + `justFilledIndex={energyCells.length - 1}` 렌더(방금 점등 강조)
- [x] 완료 경로 버튼: "바로 다음 블록" 단일 버튼 → `selectNextQueuedBlock` 있으면 `/predict`, 없으면 `/`(6-A 잠시 쉬기 생략, 위 설계 결정 5)
- [x] 미완료 경로 버튼: "이어서 15분 더"(`startBlock(taskId, verbLabel)` 재호출로 동일 조각 재시작, 예측 재생성 없음 → `/focus`) / "오늘은 여기까지"(→ `/`)
- [x] 화면 이탈 시 `setLastResolvedBlock(null)`로 컨텍스트 정리(뒤로가기로 회고 재진입 시 스테일 상태 방지)

**G. 라우팅·기존 산출물 정합**

- [x] `src/app/router.test.tsx` — 플레이스홀더 텍스트 어서션을 실제 화면 동작 기준으로 교체(가드 리다이렉트 확인 포함)
- [x] `router.tsx`/`AppShell.tsx`/`routes/paths.ts` 자체는 무변경(라우트 골격 DO NOT CHANGE)

## DO NOT CHANGE (국소)

- PH-01~04 산출물 전부(Storage 인터페이스, 기존 5개 슬라이스 계약, 라우트 골격, 디자인 토큰 값)
- `timerSlice`/`predictionSlice`/`energySlice`/`sessionSlice`/`taskSlice`의 기존 함수 시그니처와 동작(새 슬라이스로 확장만)

## Positive Non-Goals

- **온보딩 UI 없음** — 대시보드 진입은 테스트가 스토어 액션(`addTask` 등)을 직접 호출해 과제를 시드해서 연다. 실제 온보딩 플로우(면죄부 3화면 등)는 PH-07에서 이 화면들을 재사용해 감싼다.
- **엣지케이스 없음(PH-06 몫):** 15분 중 이탈(화면잠금·백그라운드·강제종료) 타임스탬프 기반 경과 재계산, 명시적 길게 누름 일시정지·재개, 딴생각 포착 모달, 미완료 블록의 "다음날 그대로 이월" 영속 로직.
- **방전 모드 분기 없음**(PH-08).
- **2z(빈 대시보드 정식 와이어)·6-A(휴식)·3-A(새 과제 추가 전용 화면)·9(설정)·북극성 없음** — 위 "착수 전 설계 결정 5" 대체 UI로 최소 처리.
- **기록/통계 페이지 없음**(SPEC §12 Post-MVP).
- **세션(`sessionSlice`) 연동 없음** — 내부 지표 로깅 배선은 PH-10 몫, 이 위상은 루프 자체만 완성한다.
- Playwright e2e/시각 회귀 신규 작성 없음(하네스는 PH-00에 있으나, 이 위상은 Vitest+RTL 유닛/통합으로 논리를 검증 — 실제 브라우저 시각 회귀·axe 통합은 후속 확장 여지로 남김, PH-04와 동일 결정 계승).

## 수용 기준 (기계 검증만)

**공통:**

- [x] `npm run typecheck` exit 0
- [x] `npm run lint` exit 0
- [x] `npm run test:coverage` 통과, 커버리지 80%+ 유지
- [x] `npm run build` exit 0

**핵심 루프 고유:**

- [x] `router.test.tsx`: 활성 과제 없이 `/focus` 진입 시 `/`로 리다이렉트(README §0-1④)
- [x] 대시보드: 주 과제 카드 DOM 카운트 어서션 `=== 1`(과제 있는 모든 상태에서, README §0-1② One Task)
- [x] 회고: 빗나감(6′/7′) 렌더 시 보너스 카드 DOM 카운트 `=== 0`, 적중(6/7) 시 `=== 1`
- [x] 회고: 완료/미완료 각각에서 `danger|error|warning|fail` 클래스·부정 문구 0건(소스/렌더 텍스트 검증)
- [x] 회고: `EnergyBar`가 렌더하는 필드 셀 색(evidence.fill 단일 토큰)이 완료·미완료 경로에서 동일(PH-04 컴포넌트 계약을 그대로 소비하는 것으로 자동 충족 — 별도 상태 분기 prop을 추가하지 않았음을 소스 검증)
- [x] 전체 루프 통합 테스트 1개 이상: 과제 시드(2블록 쪼개기 완료 상태) → 대시보드 → 예측 → 집중(900회 `tick()` 직접 구동으로 900초 경과) → 회고(완료+적중, 보너스 렌더) → "바로 다음 블록" → 예측(빗나감 선택) → 집중 → 회고(완료+빗나감, 보너스 없음 확인) → "바로 다음 블록" → 큐 소진 시 대시보드의 "과제 소진" 대체 상태(인라인 새 과제 폼) 복귀까지 실제 라우트 트리(`routeObjects`, 스텁 없음)로 검증(`src/app/core-loop.integration.test.tsx`)

## 구현 중 발견 (완료 시점 기준 기록)

- **`vi.useFakeTimers()` + IndexedDB + React Router 조합이 안정적으로 재현되지 않음:** Focus 화면의 900초 자동 종료를 `vi.advanceTimersByTime`/`advanceTimersByTimeAsync`로 흉내 내려 하면 `act()` 내부에서 5초(Vitest 기본 `testTimeout`)까지 멈춰버렸다(정확한 원인은 fake-indexeddb·React Router 데이터 라우터의 내부 스케줄링 중 하나가 fake 타이머에 의존하는 것으로 추정, 완전히 규명하지는 않음). **해결:** 실제 인터벌 배선(`setInterval(tick, 1000)`)은 진짜 1.1초 실시간 대기로 가볍게 1회만 검증하고, "900초 도달 시 자동 종료" 로직 자체는 `useAppStore.getState().tick()`을 900번 직접 호출해 구동 — 컴포넌트가 구독하는 `elapsedSeconds` 임계값 로직만 순수하게 격리해서 검증한다(인터벌 배선과 임계값 판정을 분리 테스트, 둘 다 실제 사용자 시나리오를 커버). `FocusPage.test.tsx`·통합 테스트 전부 이 패턴을 따른다.
- **`complete()`/`markIncomplete()`가 갱신된 Block을 반환하지 않음(PH-02 기존 계약):** `activeBlock`을 `null`로 비우기만 해서, 회고로 넘길 "종료된 블록"의 최종 `status`/`endedAt`을 `useFocusTimer.finish()`가 직접 재구성해야 했다(캡처해둔 이전 `block`에 `status`/`endedAt`만 덮어씀) — PH-02 계약을 바꾸지 않기 위한 이 위상 내 대응.
- **`RetroPage`의 컨텍스트 정리 타이밍:** 처음에는 각 버튼 핸들러 안에서 `setLastResolvedBlock(null)`을 호출했는데, 그 즉시 컴포넌트가 `lastResolvedBlock === null`로 리렌더되어 상단 리다이렉트 가드가 먼저 대시보드로 튕겨버리고 핸들러의 `navigate()` 호출과 경합했다. 언마운트 시 정리하는 `useEffect` 클린업으로 옮겨 해결.
- **max-lines-per-function(50줄) 경고 대응:** Dashboard/Split/Retro는 상태별 렌더 분기를 작은 프레젠테이셔널 서브컴포넌트로, Focus는 오케스트레이션 자체를 `src/hooks/useFocusTimer.ts` 커스텀 훅으로 분리해 전부 임계값 이하로 낮췄다(SplitPage 테스트 파일 1건만 경고로 남김 — 테스트 케이스 나열이라 쪼개는 것이 오히려 가독성을 해친다고 판단).
- **(2026-07-08 회고성 재감사) SPEC §3·D-05·D-11 대비 2건 갭 확인, 미해결:** ① "만만한 1개 자기선택" — 대시보드가 큐 선두를 자동 노출할 뿐 사용자가 여러 조각 중 고르는 화면이 없음(현재는 FIFO). ② "영점조절 체감 3버튼(순식간/딱 15분/너무 길게)"(D-11) — `RetroPage`에 이 상호작용 자체가 없음. 둘 다 당시 "착수 전 설계 결정"에 단순화로 기록되지 않은 채 조용히 빠졌다 — 코드 리뷰·수용 기준 자동화(테스트·타입체크·커버리지) 어느 것도 "SPEC에 있는데 구현이 없는 문장"은 잡지 못하는 사각지대였음. 재발 방지로 `phases/README.md §0`에 SPEC 커버리지 게이트, `_TEMPLATE.md`에 SPEC 커버리지 표를 신설(위 표 참조). **수정은 이 파일을 다시 열지 않고 별도 위상으로 분리 — [PH-05.1(핵심 루프 보강)](PH-05.1-core-loop-remediation.md)에서 구현 완료(2026-07-08, Runnable State 통과).**

## Runnable-State 커맨드

```
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

## Changelog

- **v0.1** — 헤더만 작성, 우선순위 상향 반영. PH-02~04 완료 후 상세화.
- **v0.2** — 착수 직전 상세화. 블록 대기열/활성 과제/회고 컨텍스트를 신규 슬라이스+순수 셀렉터로 설계(Storage·기존 슬라이스 계약 무변경), Focus "그만하기" 단순화(5-B 전체는 PH-06), 2z/6-A/3-A 화면 생략과 대체 UI를 명시적 범위 절단선으로 확정. In-Scope A~G 체크리스트, DO NOT CHANGE, Positive Non-Goals, 수용 기준 확정.
- **v0.3** — 구현 완료, Runnable State 통과. `block-queue-slice`·`retro-context-slice`·`core-loop-selectors`·`verb-chips` 신규 + 5개 화면(Dashboard/Split/Predict/Focus/Retro) 전부 실제 로직으로 구현, `useFocusTimer` 훅으로 집중 화면 오케스트레이션 분리. `router.test.tsx` 갱신(가드 리다이렉트 검증) + 실제 라우트 트리 기반 전체 루프 통합 테스트 신설. 테스트 153개·커버리지 98.6%(문·라인 100%)·타입체크/린트(0 errors)/빌드 전부 통과. fake-timer+IDB+라우터 조합 불안정 발견 및 직접 `tick()` 구동으로 우회한 결정 기록.
- **v0.4** — `code-reviewer` 적용. **HIGH 1건 반영:** `SplitPage`/`PredictPage`가 `activeBlock`(이미 진행 중인 블록)을 가드하지 않아, 브라우저 뒤로가기로 되돌아오면 같은 과제의 다음 조각을 또 시작할 수 있어 이전 블록이 `in_progress`로 고아가 되는 One Task 위반 경로 발견 — 두 화면 모두 `activeBlock` 존재 시 `/focus`로 리다이렉트하는 가드 추가, 회귀 테스트 각 1건 추가. **MEDIUM 1건 반영:** `useFocusTimer.finish()`가 `complete()`/`markIncomplete()` 완료 직후(아직 `/retro`로 내비게이트하기 전) 리렌더가 끼어들면 `FocusPage`의 `!activeBlock` 가드가 그 찰나에 대시보드로 잘못 리다이렉트할 수 있는 스케줄링 경합 발견 — 훅이 `isFinishing` 플래그를 노출하도록 하고, `FocusPage`가 `!activeBlock && !isFinishing`일 때만 리다이렉트하도록 수정(그사이엔 크래시 방지를 위해 `null` 렌더). 테스트 155개·커버리지 98.7% 유지, 타입체크/린트/빌드 전부 통과.
- **v0.5** — **실제 모바일 뷰포트 검증 최초 수행(사용자 지적으로 수행).** 이전까지 UI 수용 기준은 전부 Vitest+jsdom(레이아웃 엔진 없음) 또는 소스 정규식 검증뿐이었고, 실제 브라우저 렌더는 한 번도 확인하지 않았다(PH-04 Positive Non-Goals·PH-05 Positive Non-Goals 양쪽 다 "실제 브라우저 시각 회귀는 후속 확장"으로 명시적으로 미뤄뒀던 것). `npm run build && npm run preview`로 띄운 뒤 Playwright(320/375px, 임시 스크립트 — 커밋 대상 아님)로 실제 루프를 왕복 확인한 결과: **`DashboardPage`의 인라인 과제 추가 `<input>`이 375px 뷰포트에서 381px까지 튀어나가는 가로 스크롤 발견**(`document.documentElement.scrollWidth` 375 초과, README §0-1② 위반). 근본 원인은 전역 `box-sizing: border-box` 리셋이 애초에 없었던 것 — `width: 100%` + padding/border를 가진 모든 요소(`DashboardPage`/`RetroPage`/`SplitPage`의 `.input`, PH-04의 `OptionRow`까지)가 잠재적으로 같은 결함을 안고 있었다(content-box 기본값이 padding만큼 부모 폭을 초과시킴). **수정:** `src/index.css`에 `*, *::before, *::after { box-sizing: border-box; }` 전역 리셋 1줄 추가(개별 컴포넌트 패치 대신 근본 원인 1곳에서 해결). 재빌드 후 320px·375px 전 구간(대시보드 zero/unsplit/블록有·쪼개기·예측·집중·회고) 가로 스크롤 0건 재확인. 테스트 155개·커버리지 98.7%·타입체크/린트/빌드 전부 통과 유지. **교훈(PH-06 이후에도 적용):** jsdom 기반 컴포넌트 테스트는 실제 레이아웃 버그를 못 잡는다 — 화면을 조립하는 위상은 완료 선언 전에 반드시 `npm run build && npm run preview` + Playwright로 최소 1회 실제 뷰포트 왕복 확인을 거친다.
- **v0.6** — **두 번째 실제 렌더 버그 발견(사용자가 실제 다크 모드 기기 스크린샷 제시).** `src/index.css`의 `:root { color-scheme: light dark; }`가 `html`/`body`에 명시적 배경색 없이 방치돼 있어, 시스템이 다크를 선호하는 기기/브라우저에서는 브라우저가 투명 캔버스를 검게 기본 렌더링 — `.page` 래퍼 자체에 배경색을 지정하지 않은 Dashboard/Split/Predict/Retro 전 화면에서 여백이 시커멓게 비쳐 보였다(Playwright 기본 컨텍스트는 `colorScheme: light`라 v0.5 점검에서는 재현되지 않았던 것). 이는 렌더링 사고가 아니라 **DESIGN-TOKENS §4-2(DB-01/DB-04) "다크모드는 기본이 아니다 — 유일한 의도된 다크 표면은 FocusPage `[data-mode="focus"]` 뿐" 위반**이기도 하다. **수정:** `color-scheme`을 `light`로 고정하고 `body`에 `background-color: var(--surface-page)` 명시(개별 `.page` 배경 누락에도 안전망 역할). Playwright로 `colorScheme: 'light'`/`'dark'` 양쪽 렌더 후 캔버스 배경이 동일한 `--surface-page`로 고정됨을 재확인. 테스트 155개·커버리지 98.7%·타입체크/린트/빌드 전부 통과 유지.
- **v0.7** — **SPEC 커버리지 회고성 재감사(PH-07 세션 중 사용자가 "쪼개기 후 자기선택이 없다"를 실사용으로 발견 → SPEC §3·§4·DECISIONS D-05/D-11 전면 재대조).** 2건 갭 확인(위 "SPEC 커버리지 표" 참조): ① "만만한 1개 자기선택"(D-05) 없음 — 현재 대시보드는 큐 선두를 FIFO로 자동 노출. ② "영점조절 체감 3버튼"(D-11) 없음 — `RetroPage`에 이 상호작용 자체가 없음. 둘 다 v0.2 "착수 전 설계 결정"에 단순화로 기록되지 않은 채 조용히 누락됐던 것으로, 당시 code-reviewer 리뷰(v0.4)와 수용 기준 자동화 어느 쪽도 "SPEC에 있는데 구현이 없는 문장"을 잡는 용도가 아니었다(전자는 존재하는 코드의 결함만, 후자는 존재하는 구현 기준의 통과 여부만 검증). **이 사고를 계기로 `phases/README.md §0`에 SPEC 커버리지 게이트, `_TEMPLATE.md`에 SPEC 커버리지 표를 신설**해 향후 위상은 착수 직전·완료 직전 두 시점에 SSOT 문장을 전수 배정하도록 강제한다. 이 위상 자체는 "완료" 상태를 유지하되(나머지 In-Scope는 실제로 완료), 두 갭의 수정은 별도 위상/태스크로 분리 — 사용자 결정 대기 중이라 이 세션에서 구현하지 않음.
