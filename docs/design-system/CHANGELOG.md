# 디자인 시스템 — 이력 / 소급 감사

> 상위: [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) 허브.
> `docs/README.md` 작성 규칙 #2("버전 태그 인라인 금지 — 이력은 Changelog 한 곳")에 따라, 규약 본문(모듈 파일)은 **현재 따라야 할 규칙만** 담고, 아래는 그 규칙이 어떻게 도달했는가의 이력이다. 규약 본문에서 링크로만 참조한다.

## 규약 본문에 유지되는 "현재 결정"과 이력의 경계

- **의도적 편차(현재 결정)** 는 규약 본문에 남긴다 — 예: [`composition.md`](composition.md) CMP-2 "두 그룹 버튼 절대 위치 차이는 의도적 유지".
- **"이때 이렇게 고쳤다"(과거 해소)** 는 아래 Changelog로만.

---

## 소급 감사 결과 요약 (편차 없음 확인 항목)

`PH-04.2` 파일럿·`PH-04.3` 소급 감사에서 `TaskCard` 대조 결과 **편차 없음**으로 확정된 항목(규약 본문에서 매번 재기술하지 않기 위해 여기 모음):

- **여백(SP):** `TaskCard` 자체 패딩 `space.7`(섹션-간), 제목-본문 마진 `space.4`(카드-내부). 편차 없음.
- **타이포(TY):** `TaskCard` 제목만 `font.size.2xl`+`font.serif`(주 1단계), 본문은 사용처가 크기 결정 → 카드 자체는 1단계만 점유. 편차 없음.
- **깊이(EL):** `TaskCard`에 `elevation.card`·`radius.2xl` 이미 적용. 편차 없음.
- **모션(MO):** `TaskCard`는 상호작용 상태 없는 정적 컨테이너 → 모션 규칙 밖(N/A). 편차 없음.

---

## Changelog

- **v0.11(2026-07-17)** — **구조 대개편 + 화면 구성층 신설.** `docs/README.md` 작성 규칙(결론 먼저·인라인 버전 태그 금지·DRY·원자적 안정 ID)에 정합시키기 위해 단일 모놀리식 `DESIGN-SYSTEM.md`를 [`docs/design-system/`](.) 모듈 디렉터리로 분해([`spacing`](spacing.md)·[`typography`](typography.md)·[`elevation`](elevation.md)·[`motion`](motion.md)·[`composition`](composition.md)·[`decision-guide`](decision-guide.md)·[`components`](components.md)·[`recipes`](recipes.md)·이 파일). `DESIGN-SYSTEM.md`는 안정 허브(§번호↔모듈 매핑 유지)로 남겨 인바운드 링크(`.module.css`·phases·README) 무손상. 규약 본문에 흩어져 있던 `✔ 해소`·`대조`·`남은 편차` 산문을 이 Changelog로 이관(삭제 없이 이동, 추적성 보존). **신규 [`composition.md`](composition.md)** — "비어/뭉쳐 보이는" 바벨 공허의 배치 규정 공백을 메움(초점 밴드 CMP-3·공백 프레이밍 CMP-4·앵커 비가시 방지 CMP-5·채움≠장식 하드 CMP-6). 구 §1-1(앵커 불변·두 그룹·중앙정렬 폐기)은 CMP-2로 이관. **신규 [`decision-guide.md`](decision-guide.md)** — 화면 6원형→구성 패턴 매핑, "비어 보이는가" 자문 순서(DG-2), 새 컴포넌트·색 판단(DG-3·4). 토큰 값·기존 규약 값 무변경(순수 재구조화 + 배치 규정 신설).
- **v0.10(2026-07-13)** — **북극성 "표현하는 형식" 자체를 SPEC 정본대로 재구성([`components.md`](components.md) C-11 `NorthStarBadge`).** `SPEC §9`("의무·열망 두 좌표 나란히, 순위 없음" D-19)와 대조하니 `NorthStarBadge`가 `formatNorthStarSummary`로 "열망: X · 의무: Y"를 한 줄 텍스트에 합쳐 렌더하고 있어 SPEC이 명시한 "두 칩"이 아니었다. `Chip.default` 톤의 독립 `<span>` 2개로 재구성(클릭 불가 시그니처 유지, `formatNorthStarSummary`는 `role="group"` `aria-label`로 재사용). 부수로 `DashboardHeader`가 320px에서 칩 2개+"설정"을 한 줄에 욱여넣어 "설정"이 깨지던 문제 발견 → `.header`에 `flex-wrap` 추가. 유닛 340개·e2e 116개 그린, `core-loop-catalog`·`zero-dashboard` 스냅샷 재생성(북극성 미설정이라 칩 자체는 미등장).
- **v0.9(2026-07-13)** — **북극성 시각적 무게 재조정([`elevation.md`](elevation.md) EL-2/EL-3).** `NorthStarPage`(남길게요)·`SettingsPage`(양가 목표 수정)가 `variant="primary"`(테라코타 `elevation.cta` 글로우)를 써 "즉시성의 순간" 전용 CTA와 구분이 안 되던 위반을 발견·수정(둘 다 `variant="secondary"`로 하향). 근거: CLAUDE §5(북극성=가벼운 좌표·선택·순위 강요 금지)와 "즉시성의 순간에만" 원칙의 정면 충돌. `NorthStarBadge`(무-elevation)는 이미 적절해 무변경.
- **v0.8(2026-07-13)** — **구 §1-1 이월 항목 후속(현 [`composition.md`](composition.md)).** ① `DashboardPage` 카드/비카드 혼재 — `canEnterDischarge` 링크 + `EnergyBar`를 `.bottomGroup`(`margin-top: auto`)으로 묶어 어떤 One Task 상태가 위에 렌더되든 이 둘은 항상 뷰포트 하단 같은 y좌표(부분 해소, `TaskCard` 재구조화 없이). ② 온보딩·zero 대시보드 `TaskCard` 경계 흐림 — 이미 "올라온 카드" 용도로 정의됐으나 미배선이던 `border.raised`를 `TaskCard.card`에 연결(새 값 없이 해소). ③ 카드/비카드 절대 위치 통일 — `zero-dashboard.spec.ts`가 zero 대시보드 `[data-task-card]` 개수 0을 하드 검증하므로 "카드 없음"이 명시적 설계임이 재확인 → 이월에서 **의도적 유지**로 재분류(현 CMP-2).
- **v0.7(2026-07-13)** — **구 §1-1 수정 — ADHD 공간적 예측가능성 반영.** v0.6의 "카드 없는 화면=세로 중앙정렬"이 사용자 피드백으로 폐기 — 콘텐츠 길이가 화면마다 다르면 중앙정렬 버튼 위치도 흔들려 "같은 요소는 항상 같은 자리에"(페르소나 K)와 충돌. 대체: 콘텐츠 상단 시작 + 행동 버튼군 `margin-top: auto` 하단 고정(현 CMP-2). 적용 확장 — 북극성·사전예측·설정·휴식 재작업 + `DischargeEntryPage`(기존 중앙정렬 anti-pattern 신규 발견)·`RetroPage`(하단 고정 신규 적용).
- **v0.6(2026-07-13)** — **디자인 개선 전략 Phase 0~2.** 실브라우저 스냅샷이 없던 8개 화면을 신규 e2e(`design-qa-gaps.spec.ts`)로 캡처해 육안 대조하는 워크스루를 처음 실행. ① 구 §1-1 신설(현 CMP) — `TaskCard` 없는 화면이 콘텐츠를 상단에만 쌓고 하단 방치하던 편차. ② [`components.md`](components.md) C-04 `EnergyBar` — 기존 접근성 라벨("오늘 N칸")이 시각적으로 숨겨져 라벨 없는 고립 정사각형처럼 보이던 편차를 보이는 캡션으로 승격(`filledCount > 0`일 때만). 다크 바텀시트 흐림 의심은 픽셀 샘플링 결과 오탐으로 판명(수정 없음).
- **v0.5(2026-07-12)** — **문서 정합성 감사(코드 diff 없음).** [`recipes.md`](recipes.md) 6-A(휴식) 행이 `PH-05.2` 완료 후에도 "미구현"으로 방치된 드리프트 정정 — `Button`×2, `DischargeEntryPage`와 동일 패턴 재사용이라 카탈로그 신규 등재 불요.
- **v0.4(PH-04.4 Phase 4, 2026-07-11)** — 구현(TDD) 완료: 신규 5종([`components.md`](components.md) C-07~11)을 코드로 채우고 `DashboardPage`/`NorthStarPage`/`SplitPage`/`FocusPage`/`RetroPage`/`SettingsPage`의 ad-hoc `<input>`/`<textarea>`/로컬 재발명을 전부 교체. `StateChip` 스코프는 파일 위치 + `no-restricted-imports` 이중 격리로 확정.
- **v0.3(PH-04.4, 2026-07-11)** — [`components.md`](components.md) 카탈로그(6종+5종) 신설, [`recipes.md`](recipes.md) 조립 레시피 신설. 토큰 값 자체는 무변경.
- **v0.2(PH-04.3, 2026-07-11)** — `Button`/`Chip` 여백 계층 관찰, `Button.primary`/`Chip.selected`/`OptionRow` elevation 매핑 누락 관찰을 소급 수정으로 해소. 문서 규약(계층 정의·매핑표)은 무변경.
- **v0.1** — 최초 작성(PH-04.2). `DESIGN-TOKENS §10-6` 항목 6("컴포넌트 토큰")을 채움. 여백 리듬(3계층)·타이포 위계(≤3단계)·elevation 서열(6종 매핑)·모션 일관성 표 신설. `TaskCard` 파일럿 대조 결과 4개 절 전부 편차 없음.
