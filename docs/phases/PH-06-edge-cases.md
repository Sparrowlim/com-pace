# PH-06 — 엣지케이스 (이탈·일시정지·미완료 이월)

> **의존:** [PH-05](PH-05-core-loop.md)
> **SSOT:** [SPEC.md §6 엣지케이스](../SPEC.md#6-엣지케이스-확정) · [SCREEN-FLOW.md §3-1](../SCREEN-FLOW.md#3-1-타이머-화면-5--p7p10-반영) (P7/P13) · SCREEN-FLOW 화면 5-A/5-B
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙) · [§0-1 UI 정량 수용 기준](README.md#0-1-ui-정량-수용-기준-화면컴포넌트-렌더하는-모든-위상-공통--ph-030405060708090-상속)
> **참고 스킬:** `error-handling`(이탈·일시정지 상태 전이), `react-testing`

## Goal

15분 중 이탈(화면잠금·백그라운드·강제종료)·명시적 일시정지(길게 누름)·딴생각 포착·미완료 블록의 다음날 이월이 SPEC §6 표 그대로 동작하는 상태(PH-05 Positive Non-Goals에서 명시적으로 미룬 4개 항목: 타임스탬프 기반 경과 재계산·길게 누름 일시정지/재개·딴생각 포착 모달·미완료 블록 이월 영속 로직).

## 착수 전 설계 결정 (구현 전 확정 — 아래 체크리스트의 전제)

1. **경과 시간 = 순수 타임스탬프 계산, 인터벌 증가 아님.** `timerSlice.tick()`을 `elapsedSeconds += 1`에서 `Math.floor((Date.now() - startedAt - pausedMs) / 1000)` 재계산으로 교체한다. D-26/P13 근거("① 백그라운드 실행 불요 — 포그라운드 복귀 시 재계산으로 웹 최대 약점 제거")대로, 백그라운드에서 인터벌이 스로틀돼도 포그라운드 복귀 후 다음 tick 1회가 즉시 정확한 값으로 점프하면 그걸로 충분하다 — 별도 `visibilitychange` 리스너 불필요.
2. **일시정지 부기(pausedAt/pausedMs)는 스토어 인메모리 상태다, Block 스키마 추가 아님.** `TimerSlice`에 `pausedAt: string | null`, `pausedMs: number`를 새 필드로 둔다(Block/TECH-SPEC §4 데이터 모델·Storage 인터페이스는 무변경). **트레이드오프:** 일시정지 도중 프로세스가 완전히 죽으면(강제종료) 재기동 시 일시정지 구간을 복원 못 해 그 구간이 경과 시간에 포함된다 — 결과는 "조금 더 일찍 완료 판정"(크레딧 방향)이라 CLAUDE §2 실패 무처벌 원칙과 충돌하지 않으므로 수용한다. 반대로 "미완료로 깎이는" 실패 방향 오차였다면 이 단순화는 기각해야 했을 것.
3. **세션 복구(재기동 생존)는 `localStorage` 포인터 + 기존 `findById`만 쓴다, Storage 인터페이스 확장 아님.** `startBlock()`이 `localStorage['compace:activeBlockId']`에 id를 쓰고, `complete()`/`markIncomplete()`가 지운다. 앱 부팅 시(`AppShell` 1회) 그 id로 `idbStorage.findById('blocks', id)`(기존 메서드)만 사용해 블록 1개를 복구한다. **의도적 미해결 범위:** `tasks`/`queuedBlocks`는 전체 재조회 메서드가 Storage 인터페이스에 없어(전역 DO NOT CHANGE) 이번 위상에서 복구하지 않는다 — 새로고침 후 예측/회고 화면의 "다음 조각" 판단은 빈 큐로 보수적으로 대체(대시보드로 안전하게 귀결, 사용자가 다시 과제를 눈으로 확인). 활성 블록 자체(집중 화면 이어보기/완료·회고 재현)는 Block 레코드 하나만으로 완전히 복구 가능해 이 범위 밖에서도 값어치가 있다.
4. **"다음날/장시간 방치" 판정 = 달력 날짜 비교.** `block.startedAt`의 날짜문자열과 복귀 시점 날짜문자열이 다르면 무조건 이월(그 사이 경과 초는 보지 않음) — SPEC 문구("익일·장시간 방치")에서 기계 검증 가능한 유일한 신호가 날짜 경계이기 때문. 같은 날 ≥900초는 "15분 시점 종료"(완료+회고+에너지), 다른 날은 "미완료 이월"(침묵: 회고 無·에너지 無·`자동완료 ❌`이므로 상태는 `incomplete`).
5. **길게 누름 = 새 `useLongPress` 훅(포인터 이벤트, 500ms 임계값).** 짧은 탭(≤500ms, 이동 없음)은 딴생각 포착 모달(5-A), 500ms 이상 유지는 일시정지(5-B) 진입. 두 제스처 모두 `FocusPage`의 동일 탭 영역에 배선.
6. **일시정지 화면(5-B)은 새 라우트가 아니다.** `/focus` 그대로, `activeBlock.status === 'paused'`일 때 같은 화면이 타이머 대신 "재개"/"그만하기" 오버레이를 렌더한다(SCREEN-FLOW 5-B가 별도 화면 목록에 없는 것과 정합).
7. **딴생각 포착은 상주 목록이 아니라 단일 초안 슬롯.** `retroContextSlice`에 `capturedThought: string | null` 필드 추가(SPEC §6 "상주 목록 ❌" — 두 번째 포착은 첫 번째를 덮어씀). 블록 종료 후 회고 화면에서 1회성 카드로 노출, "버리기"(비움) 또는 "새 조각화"(`queueBlocks(taskId, [text])`)로 처리. 처리 안 하고 화면을 벗어나면(뒤로가기·다음 블록 이동) 조용히 사라진다 — `RetroPage` 언마운트 클린업에서 `lastResolvedBlock`과 함께 지운다.
8. **`BottomSheet`의 "포커스 트랩·ESC 닫기·열림/닫힘 애니메이션은 PH-06 몫"(PH-04 코드 주석의 명시적 이관)을 이번 위상에서 갚는다.** 일시정지 오버레이·딴생각 모달 둘 다 이 컴포넌트를 재사용해 한 곳에서 접근성/모션을 보장한다.
9. **하루 블록 상한·이어하기 블록 예측 생략(SPEC §6의 나머지 두 행)은 이미 만족.** 하드 상한 코드가 아예 없고(회귀 테스트로 고정), `RetroPage.handleContinue`가 이미 예측을 건너뛰고 곧장 `/focus`로 간다(회귀 테스트로 고정) — 이번 위상은 신규 코드 없이 테스트만 추가한다.

## In-Scope

**A. 순수 타이머 엔진 (`src/lib/session-timer.ts`, 신규)**

- [x] `FOCUS_SECONDS = 900` 단일 정의(현 `useFocusTimer.ts`의 상수를 여기로 이전, 재export로 하위 호환)
- [x] `computeElapsedSeconds(startedAtIso, pausedMs, nowMs)` — 음수 클램프(0 하한), 유닛 테스트(일시정지 無, 일시정지 반영, 경계값 0/899/900)
- [x] `judgeSessionReturn(startedAtIso, nowIso, elapsedSeconds): 'continue' | 'finish' | 'carryover'` — 유닛 테스트(같은 날 <900=continue, 같은 날 ≥900=finish, 다른 날짜=carryover 우선순위 확인, 자정 경계 문자열 비교)

**B. 타이머 슬라이스 확장 (`timer-slice.ts`, 시그니처 무변경·필드/내부 동작만 확장)**

- [x] `pausedAt: string | null`, `pausedMs: number` 상태 추가, `startBlock()`에서 `0`/`null`로 초기화
- [x] `pause()` — 기존 `status: 'paused'` 영속에 더해 `pausedAt: nowIso()` 세팅(스토어만, Storage 무변경)
- [x] `resume()` — 일시정지 구간(`Date.now() - pausedAt`)을 `pausedMs`에 누적, `pausedAt: null`, `status: 'in_progress'` 영속
- [x] `tick()` — 증가 대신 `computeElapsedSeconds` 재계산으로 교체, `status !== 'in_progress'`(일시정지 포함) 가드 유지
- [x] `complete()`/`markIncomplete()` — `pausedAt`/`pausedMs` 리셋 추가
- [x] `startBlock()`/`complete()`/`markIncomplete()` — `localStorage['compace:activeBlockId']` set/remove 배선(설계 결정 3)
- [x] 유닛 테스트: pause→resume 왕복 후 `tick()`이 일시정지 구간을 제외한 경과만 반영, pause 중 `tick()` 무동작, localStorage 키 set/remove 타이밍

**C. 회고 컨텍스트 슬라이스 확장 (`retro-context-slice.ts`)**

- [x] `capturedThought: string | null`, `setCapturedThought(text: string | null)` 추가
- [x] 유닛 테스트: set/clear, `lastResolvedBlock`과 독립적으로 동작

**D. 세션 복구 훅 (`src/hooks/useSessionRecovery.ts`, 신규)**

- [x] 마운트 1회(StrictMode 이중 호출 가드 포함) `localStorage` 포인터 읉음, 없으면 즉시 반환
- [x] `idbStorage.findById('blocks', id)` — 없거나 이미 `done`/`incomplete`면 포인터만 정리하고 반환
- [x] `judgeSessionReturn` 결과별 분기:
  - `continue`: `useAppStore.setState({ activeBlock, elapsedSeconds: computeElapsedSeconds(...) })` 후 `navigate(ROUTES.focus)`(이미 그 라우트면 무동작)
  - `finish`: 복구한 블록을 `activeBlock`으로 세팅 후 기존 `complete()` 재사용(설계 결정 3의 "기존 로직 재사용") → 예측 존재 시 `resolvePrediction(id, true)` → `loadEnergyCellsForDate` 후 `lightEnergyCell` → `setLastResolvedBlock` → `navigate(ROUTES.retro)`
  - `carryover`: `activeBlock` 세팅 후 기존 `markIncomplete()` 재사용 → 에너지·회고·내비게이션 없음(침묵) → `localStorage` 포인터 정리만
- [x] 유닛 테스트(훅 단위, `renderHook` + 메모리 라우터 래퍼): 포인터 없음 무동작, continue/finish/carryover 3경로 각각 스토어 최종 상태 어서션

**E. 길게 누름 훅 (`src/hooks/useLongPress.ts`, 신규)**

- [x] `useLongPress({ onLongPress, onTap, thresholdMs = 500 })` — `onPointerDown/onPointerUp/onPointerCancel/onPointerMove`(임계 이동 초과 시 취소) 핸들러 객체 반환
- [x] 유닛 테스트(`renderHook` + `act` + `vi.useFakeTimers`): 임계값 이전 해제=tap, 임계값 도달=longPress, 포인터 이탈/취소 시 중립화

**F. 집중 화면 — 일시정지(5-B) (`FocusPage.tsx`)**

- [x] 기존 "오늘은 여기까지" 버튼을 진행 중 화면에서 제거(SCREEN-FLOW: 그만하기는 일시정지를 거쳐야만 도달)
- [x] 타이머 탭 영역에 `useLongPress` 배선 — 짧은 탭→포착 모달 오픈, 길게 누름→`pause()`
- [x] `activeBlock.status === 'paused'`일 때 담백한 텍스트 오버레이(`BottomSheet` 재사용): "잠시 멈췄어요" + "재개"(→`resume()`) + "그만하기"(→ 기존 `finish(false)` 경로, 변경 없음)
- [x] 일시정지 중 남은시간 텍스트는 고정(재계산 없음 — `tick()`이 이미 가드)
- [x] 회귀: 기존 즉시완료(900초)·기존 미완료 API 경로(스토어 직접 호출) 동작 불변(PH-05 test 유지)

**G. 딴생각 포착 (5-A) (`FocusPage.tsx` + `RetroPage.tsx`)**

- [x] `FocusPage`: 포착 모달(`BottomSheet`) — 텍스트 입력 1칸 + "나중에 보기"(비어있지 않으면 `setCapturedThought(text)` 후 닫기, 비어있으면 그냥 닫기) — 타이머는 배경에서 계속 흐름(포착 모달은 일시정지 아님)
- [x] `RetroPage`: `capturedThought` 있으면 1회성 카드 — "버리기"(→ `setCapturedThought(null)`) / "새 조각화"(→ `queueBlocks(activeTaskId, [capturedThought])` + `setCapturedThought(null)`) — 카드는 배지·처벌색 없이 중립 톤
- [x] `RetroPage` 언마운트 클린업에서 `capturedThought`도 `null`로 정리(미처리분 침묵 소멸)
- [x] 유닛 테스트: 포착 후 회고에 카드 노출, 버리기/새 조각화 각각의 스토어 결과, 미처리 후 이탈 시 다음 회고에 안 남음

**H. `BottomSheet` 접근성·모션 (PH-04 이관분 상환)**

- [x] 열릴 때 포커스를 시트 내부 첫 상호작용 요소로 이동, 닫힐 때 트리거로 복귀(포커스 트랩 최소형 — Tab 순환은 시트 내부로 제한)
- [x] `Escape` 키로 닫기(`onClose` prop 추가, 시그니처 확장이라 기존 두 자리 `{isOpen, children}` 호출부 전부 갱신)
- [x] 열림/닫힘 트랜지션 — `--duration-fast`(150ms) + `--easing-quiet`, `prefers-reduced-motion: reduce`에서 `transition-duration: 0s`(README §0-1③ 그대로)
- [x] 유닛 테스트: ESC로 `onClose` 호출, 열릴 때 포커스 이동, reduced-motion에서 duration 0

**I. 세션 복구 배선 (`AppShell.tsx`)**

- [x] `useSessionRecovery()` 호출 1줄 추가(라우트 트리 최상단, 렌더 차단 없음 — `null` 반환 훅)
- [x] `router.test.tsx`/`core-loop.integration.test.tsx`에 영향 없음을 회귀 확인(포인터 없는 정상 부팅 경로는 훅이 즉시 no-op)

## DO NOT CHANGE (이 위상 국소 — 전역 목록은 README §0 참조)

- PH-05 화면 컴포넌트의 정상 경로 로직(대시보드·쪼개기·예측·회고의 완료 경로 — F/G에서 명시한 지점 외)
- `timerSlice`/`retroContextSlice`의 기존 공개 함수 시그니처(`startBlock`/`pause`/`resume`/`complete`/`markIncomplete`/`tick`/`setLastResolvedBlock`) — 내부 동작·신규 필드 확장만
- Block/TECH-SPEC §4 데이터 모델, Storage 인터페이스 시그니처(설계 결정 2·3)
- 디자인 토큰 값(`action`/`evidence.fill` 등)

## Positive Non-Goals

- **방전 모드 분기 없음**(PH-08).
- **`tasks`/`queuedBlocks`의 전체 재기동 복구 없음** — Storage에 목록 조회 메서드가 없어 전역 계약 확장 없이는 불가능(설계 결정 3). 활성 블록 자체의 복구만 이번 위상 몫.
- **딴생각 포착의 다중 항목·상주 목록 없음**(SPEC §6 "상주 목록 ❌" 명시) — 단일 슬롯만.
- **일시정지 도중 진동/소리 피드백 없음** — D-12 "부드러운 소리/진동"은 종료 시점 몫으로 이미 범위 밖(PH-05), 이번 위상도 늘리지 않음.
- Playwright e2e/시각 회귀 신규 작성 없음(Vitest+RTL로 로직 검증, 실제 뷰포트는 완료 선언 전 1회 수동 `build && preview` 확인으로 대체 — PH-05 v0.5/v0.6 교훈 계승).

## 수용 기준 (기계 검증만)

**공통:**

- [x] `npm run typecheck` exit 0
- [x] `npm run lint` exit 0
- [x] `npm run test:coverage` 통과, 커버리지 80%+ 유지
- [x] `npm run build` exit 0

**엣지케이스 고유:**

- [x] `judgeSessionReturn`: 같은 날 899초=continue, 900초=finish, 자정 넘긴 다른 날짜=carryover(경과 초 무관) — 3경로 유닛 테스트
- [x] 일시정지→재개 왕복 후 `elapsedSeconds`가 일시정지 구간(예: 30초)만큼 덜 진행됨을 정확히 어서션(수치 검증, "자연스럽다" 문구 금지)
- [x] 세션 복구 3경로(continue/finish/carryover) 각각 최종 스토어 상태(`activeBlock`/`lastResolvedBlock`/`energyCells`/localStorage 키) 어서션
- [x] carryover 경로에서 `danger|error|warning|fail` 클래스·부정 문구 렌더 0건 + 회고 내비게이션 0회(침묵 규칙 기계 검증)
- [x] `BottomSheet`: `Escape` 키다운 시 `onClose` 호출 1회, reduced-motion에서 computed `transition-duration === '0s'`
- [x] 딴생각 포착: 포착 후 회고 카드 노출 1건, "버리기"/"새 조각화" 각각 스토어 최종 상태, 미처리 이탈 후 재진입 시 카드 0건
- [x] (레이아웃) 일시정지 오버레이·포착 모달 — 실제 Playwright(Chromium)로 320px·375px 왕복 확인, 가로 스크롤 0(`scrollWidth - clientWidth === 0`)·"재개" 버튼 272×44px(≥44×44 충족). 360/390/768px은 jsdom 컴포넌트 테스트로만 확인(box-sizing 전역 리셋이 PH-05에서 이미 검증됨 — 신규 UI도 같은 레이아웃 규칙을 상속).
- [x] (가드레일) 위 신규 UI 전부에서 처벌색 클래스 0건, 에너지 fill 미변경(carryover는 애초에 안 켜짐 — "무점등"도 무처벌 원칙 위반이 아님을 위 침묵 규칙 항목이 함께 보증)

## Runnable-State 커맨드

```
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

## 구현 중 발견 (완료 시점 기준 기록)

- **`vi.useFakeTimers()` 전체 페이크가 IDB와 충돌하는 문제(PH-05에서 이미 관측)가 이번에도 재현 — 해결은 `vi.useFakeTimers({ toFake: ['Date'] })`.** `Date`만 골라 페이크하면 `setTimeout`/Promise 스케줄링은 실제로 동작해 fake-indexeddb가 멈추지 않으면서도 타임스탬프 점프를 흉내낼 수 있었다. `timer-slice.test.ts`·`FocusPage.test.tsx`·`core-loop.integration.test.tsx`의 900초 도달 테스트 전부 이 패턴(`vi.setSystemTime`으로 15분 앞으로 이동 후 `tick()` 1회)으로 재작성했다 — PH-05가 쓰던 "900번 동기 `tick()` 호출" 방식은 타임스탬프 기반 재계산과 근본적으로 안 맞아 폐기.
- **`BottomSheet`에 `role="dialog"`를 추가하자 axe-core `aria-dialog-name` 위반이 새로 발생.** 접근 가능한 이름이 없는 dialog는 위반이라 필수 `label: string` prop을 추가해 `aria-label`로 연결 — 시그니처 확장이라 모든 호출부(테스트 전체, 실제 사용처는 FocusPage 신설분)를 갱신했다.
- **`max-lines-per-function`(50줄) 경고 대응:** `timerSlice`는 `pause`/`resume`/`complete`/`markIncomplete`가 공유하는 종료·일시정지 로직을 `endBlock`/`accumulatePause`/`clearedTimerState` 순수 헬퍼로 뽑아 슬라이스 팩토리 자체를 50줄 아래로 낮췄다. `RetroPage`는 스토어 훅 10개 구독을 `useRetroStoreState`로, 언마운트 정리 `useEffect`를 `useClearRetroContextOnUnmount`로, "다음 라우트 계산"·"딴생각 액션"을 순수 함수로 각각 분리해 68→49줄로 낮췄다. 신규 테스트 파일 4건(`BottomSheet.test.tsx`·`useLongPress.test.ts`·`RetroPage.test.tsx`·기존 `SplitPage.test.tsx`)은 경고로 남겼다 — PH-05도 테스트 파일 1건의 이 경고를 "테스트 케이스 나열이라 쪼개는 게 오히려 가독성을 해친다"는 판단으로 수용한 전례를 그대로 따름.
- **실제 브라우저 스모크 확인(임시 스크립트, 커밋 대상 아님):** `npm run build && npm run preview` 후 Playwright(Chromium, 320px·375px)로 대시보드→쪼개기→예측→집중까지 실제 클릭·포인터 제스처로 왕복. 탭 영역에 실제 마우스 다운→600ms 대기→업으로 길게 누름을 재현해 일시정지 오버레이가 뜨는 것, "재개"로 닫히는 것, 짧은 클릭으로 딴생각 포착 모달이 뜨는 것, 텍스트 입력 후 "나중에 보기"로 닫히는 것을 확인 — 두 뷰포트 모두 가로 스크롤 0.
- **`code-reviewer` 적용, HIGH 1건·MEDIUM 2건 전부 반영:**
  1. **[HIGH] `judgeSessionReturn`의 날짜 경계가 UTC ISO 슬라이스 비교였다.** K=Android 로케일(D-26, KST=UTC+9)에서 로컬 자정 직후(00:00~08:59 KST)에 시작한 블록은 UTC 날짜가 "전날"로 찍혀, 같은 로컬 날짜 아침에 돌아와도 `carryover`로 오판정되어 정당히 번 에너지가 조용히 사라졌다(설계 결정 2가 금지한 "실패 방향 오차"). `new Date(iso).toDateString()` 기반 로컬 날짜 비교로 교체, KST 자정 경계를 정확히 넘나드는 회귀 테스트 추가.
  2. **[MEDIUM] 새로고침 시 URL이 `/focus`였고 복구할 세션이 있으면 대시보드가 한 프레임 깜빡였다.** `FocusPage`의 "활성 블록 없음→대시보드" 가드가 `useSessionRecovery`의 비동기 IDB 조회보다 먼저 커밋되기 때문. `useSessionRecovery`가 `isRecovering`(포인터 존재 시에만 `true`로 시작)을 반환하도록 바꾸고 `AppShell`이 그동안 라우트 렌더 자체를 미루도록 수정 — 복구할 세션이 없는 보통의 부팅 경로는 지연이 없음을 실제 브라우저로 재확인.
  3. **[MEDIUM] 세션 복구의 예측 해소 분기가 죽은 코드였다.** 부팅 직후 인메모리 `predictions`는 항상 빈 배열이라 `hasPrediction` 체크가 절대 참이 될 수 없었다 — `idbStorage.findById('predictions', blockId)`로 Storage에서 직접 조회하도록 교체, 예측이 실제로 해소됨을 검증하는 회귀 테스트 추가.
     테스트 202개(+4)·커버리지 97.7%·타입체크/린트/빌드 전부 통과 유지.

## Changelog

- **v0.1** — 헤더만 작성.
- **v0.2** — 착수 직전 상세화. 설계 결정 9개(타임스탬프 재계산·일시정지 인메모리 부기·localStorage 세션 복구 포인터·날짜경계 이월 판정·길게누름 훅·같은 라우트 오버레이·단일 슬롯 포착·BottomSheet 접근성 이관 상환·기존 만족 항목 확인) 확정. In-Scope A~I, DO NOT CHANGE, Positive Non-Goals, 수용 기준 확정.
- **v0.3** — 구현 완료, Runnable State 통과. `lib/session-timer.ts`(타임스탬프 순수 함수)·`lib/active-session-pointer.ts`·`hooks/useLongPress.ts`·`hooks/useSessionRecovery.ts` 신규. `timerSlice`(pausedAt/pausedMs·타임스탬프 재계산 tick·세션 포인터 배선)·`retroContextSlice`(capturedThought)·`BottomSheet`(포커스 트랩·ESC·진입 트랜지션)·`FocusPage`(일시정지 오버레이·딴생각 포착 모달, 직접 그만하기 버튼 제거)·`RetroPage`(딴생각 1회성 카드)·`AppShell`(세션 복구 배선) 전부 구현. 테스트 155→198개(신규 43개)·커버리지 97.5%(문 97.5%/라인 98.9%)·타입체크·린트(0 errors)·빌드 전부 통과. 실제 Chromium 320/375px 스모크로 길게 누름·짧은 탭 제스처가 실제 포인터 이벤트로 정상 동작함과 가로 스크롤 0을 확인.
- **v0.4** — `code-reviewer` 반영(HIGH 1건·MEDIUM 2건, 상세는 위 "구현 중 발견" 참조): 이월 판정을 UTC→로컬 날짜 비교로 수정(KST 자정 경계 에너지 유실 버그), 세션 복구 중 대시보드 깜빡임 제거(`isRecovering` 게이팅), 부팅 복구의 예측 해소를 Storage 직접 조회로 수정(죽은 코드였음). 테스트 198→202개, 커버리지 97.7%, 타입체크/린트/빌드 전부 통과 유지.
