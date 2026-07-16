# 컴페이스 — 디자인 토큰 (Design Tokens)

> **역할:** `DESIGN-BRIEF.md §3`이 유예한 **"디자인 시스템 단계"의 산출물.** 브리프가 정한 토큰의 *의미·방향*을, 와이어프레임에서 추출해 **구체 값 + 기계 변환 가능한 스펙**으로 승격시킨다.
> **정본 경계:** 시각 _방향·원칙(왜/느낌)_ = `DESIGN-BRIEF.md (DB-xx)` · 불변 규칙 = `/CLAUDE.md` · 확정 스코프 = `SPEC.md`. **본 문서는 토큰의 *구체값·구조·변환*만 소유한다.** 미적 방향이 브리프와 어긋나면 브리프가, 브리프가 SPEC과 어긋나면 SPEC이 최신.
> **스택 중립:** 기술 스택 미정([D-26](DECISIONS.md#d-26) → `TECH-SPEC.md` 예정). 소스는 **W3C DTCG JSON**(§9)이며 스택 확정 시 Style Dictionary 등으로 CSS 변수·Tailwind·RN·SwiftUI·Compose로 변환한다(§8). 어떤 프레임워크에도 아직 묶여 있지 않다.
> **위계:** 본 문서의 색·크기 값도 §2 불변 규칙과 브리프 하드 규칙(DB-02 처벌색 없음 등)을 **깨지 못한다.**

---

## 0. 한 줄 요약

> **와이어에서 실측한 "따뜻한 종이 + 즉시성 테라코타 + 방전 차분톤" 시각 언어를, 상태별로 절대 분기하면 안 되는 것(에너지 칸)과 모드별로 갈아끼우는 것(크롬)을 분리해 토큰으로 고정한다.**

---

## 1. 토큰 아키텍처 (3계층)

화면·컴포넌트는 **semantic 계층만 참조한다.** primitive를 직접 쓰지 않는다.

```
Primitive (원시값)      →   Semantic (의미/의도)     →   Mode theme (스코프 오버라이드)
color.cream.200 #F6F1E6      surface.base                [mode=focus]   surface.base ← dark.bg
color.accent.500 #E79155     action                      [mode=discharge] action.tint ← calm.bg
color.energy.fill #E79B62    evidence.fill  ← 신성불가침    (action·evidence는 모드가 못 건드림)
```

- **Primitive** = 팔레트 원자. 이름은 색상-단계(hue-step). 의미 없음.
- **Semantic** = "이 색이 무슨 뜻이고 어디에만 쓰는가." 브리프 하드 규칙이 여기 붙는다.
- **Mode theme** = 특정 화면 컨텍스트(집중=다크 / 방전=차분)에서 **일부 semantic만** 재지정. `action`(테라코타 CTA)과 `evidence`(에너지 칸)는 **어떤 모드도 재지정 금지**(§5-1, §5-3).

값 표기는 브리프와 맞춰 **hex**. 원시 rgb는 §9 JSON 주석에 병기.

---

## 2. Primitive 토큰

### 2-1. 웜 뉴트럴 (종이·표면·테두리·텍스트)

| 토큰              | hex       | 와이어 출처                            |
| ----------------- | --------- | -------------------------------------- |
| `color.paper`     | `#E7DECF` | 앱 배경(종이) — 브리프 DB-02 canonical |
| `color.cream.50`  | `#FFFDF7` | 떠 있는 팝오버                         |
| `color.cream.100` | `#FCF9F2` | 올라온 입력/카드 안쪽                  |
| `color.cream.200` | `#F6F1E6` | 기본 화면(카드) 바탕                   |
| `color.cream.300` | `#F2ECDF` | 잔잔한 정보 패널                       |
| `color.cream.400` | `#F0E7D6` | 큰 과제 박스                           |
| `color.sand.200`  | `#EADFCB` | 섹션 강조 틴트                         |
| `color.line.100`  | `#E7DDCB` | 올라온 카드 테두리                     |
| `color.line.200`  | `#E2D8C6` | 기본 테두리                            |
| `color.line.300`  | `#D8CCB6` | 점선(잠김/추가)                        |
| `color.ink.900`   | `#3F382F` | 카드 제목 최강                         |
| `color.ink.800`   | `#4A423B` | 본문 기본                              |
| `color.ink.600`   | `#7E7263` | 강한 보조                              |
| `color.ink.500`   | `#8C8070` | 보조                                   |
| `color.ink.400`   | `#A0937F` | 라벨                                   |
| `color.ink.300`   | `#B5A78E` | 힌트/조용함                            |
| `color.ink.200`   | `#C4B7A2` | 아주 흐림/아이콘                       |

> 와이어의 회색 8종·크림 6종을 **위 램프로 수렴**함(미세 중간값 제거). 미세조정 여지는 §10.

### 2-2. 액션 테라코타 (제품 시그니처 — 즉시성의 순간에만)

| 토큰                    | hex       | 용도                            |
| ----------------------- | --------- | ------------------------------- |
| `color.accent.500`      | `#E79155` | 주 액션/CTA 바탕                |
| `color.accent.600`      | `#C9743C` | 딥 (뱃지 텍스트·숫자·수정 링크) |
| `color.accent.700`      | `#9A6A38` | 최심 ("N블록" 텍스트)           |
| `color.accent.on`       | `#FFF7EE` | 테라코타 위 텍스트              |
| `color.accent.tint.100` | `#F7E7D4` | 선택된 옵션 바탕                |
| `color.accent.tint.200` | `#F3DDC8` | 15분 pill·섹션 칩               |
| `color.accent.glow`     | `#D88C50` | CTA 그림자 색 (35% alpha)       |

### 2-3. 에너지 = 증거 (⚠️ 신성불가침 — §5-1)

| 토큰                | hex       | 용도                                           |
| ------------------- | --------- | ---------------------------------------------- |
| `color.energy.fill` | `#E79B62` | 채워진 칸 — **완료·미완료·방전 전부 동일**     |
| `color.energy.ring` | `#C9743C` | "방금 채운 칸" **순간 하이라이트 전용**(DB-06) |

### 2-4. 중립 칩 / 보너스(적중 가산 전용)

| 토큰               | hex       | 용도                    |
| ------------------ | --------- | ----------------------- |
| `color.chip.bg`    | `#F1E8D8` | 동사칩·예시칩 바탕      |
| `color.chip.line`  | `#E4DAC7` | 칩 테두리               |
| `color.bonus.bg`   | `#FCF6EC` | 적중 보너스 카드 바탕   |
| `color.bonus.line` | `#EAD4B6` | 적중 보너스 카드 테두리 |

### 2-5. 회고 상태 강조 (그린=완료 · 퍼플=미완료 — §3 결정 "유지")

| 토큰              | hex       | 용도                         |
| ----------------- | --------- | ---------------------------- |
| `color.ok.500`    | `#9DBF8C` | "다 했어요" 체크 원          |
| `color.ok.700`    | `#557049` | 완료 텍스트                  |
| `color.ok.bg`     | `#EAF0E5` | 완료 인정 행 바탕            |
| `color.ok.line`   | `#D7E5CF` | 완료 뱃지 테두리             |
| `color.carry.500` | `#A99BC4` | "못 했지만 괜찮아요" 체크 원 |
| `color.carry.700` | `#6B5E86` | 미완료(이월) 텍스트          |
| `color.carry.bg`  | `#F0EAF4` | 미완료 인정 행 바탕          |

### 2-6. 방전(쿨) 모드 팔레트 ⚠️ 미정 · 브리프 소유(§10)

> 아래 blue-gray hex는 **와이어 관측값(참조용)일 뿐 미채택.** 방전톤 최종값은 `DESIGN-BRIEF §3/§7`이 소유하며 **세이지(green-gray) 지향으로 미정.** 브리프 확정 전까지 이 값을 정본으로 쓰지 않는다.

| 토큰                 | hex       | 용도                       |
| -------------------- | --------- | -------------------------- |
| `color.calm.500`     | `#8494A0` | 방전 크롬 강조(블루그레이) |
| `color.calm.700`     | `#7C8892` | 방전 텍스트                |
| `color.calm.bg`      | `#DFE6EA` | 방전 틴트 바탕             |
| `color.calm.surface` | `#ECE7DC` | 방전 화면 바탕             |
| `color.calm.line`    | `#DDD4C4` | 방전 테두리                |

### 2-7. 집중(다크) 모드 팔레트

| 토큰                 | hex       | 용도                             |
| -------------------- | --------- | -------------------------------- |
| `color.dark.bg`      | `#3A332C` | 집중 화면 바탕                   |
| `color.dark.bgDeep`  | `#322C26` | 일시정지 바탕                    |
| `color.dark.surface` | `#433A30` | 올라온 표면(딴생각 버튼)         |
| `color.dark.line`    | `#514738` | 테두리                           |
| `color.dark.amber`   | `#C9A878` | 집중 강조(블록 라벨·정지 아이콘) |
| `color.dark.timer`   | `#F1E8D6` | 대형 타이머 숫자                 |
| `color.dark.text`    | `#C4B6A0` | 밝은 텍스트                      |
| `color.dark.muted`   | `#8A7B64` | 흐린 텍스트                      |

### 2-8. 타이포 · 라운드 · 간격 · 엘리베이션 · 모션

**서체 (최대 2종 — DB-03)**

| 토큰         | 값                                     | 역할                      |
| ------------ | -------------------------------------- | ------------------------- |
| `font.serif` | `"Gowun Batang", serif`                | 제목·브랜드·타이머 (온기) |
| `font.sans`  | `"Gowun Dodum", system-ui, sans-serif` | 본문·라벨·UI (담백)       |

**폰트 크기 (와이어 24스텝 → 9스텝 수렴, base 16px)**

| 토큰              | rem / px         | 용도                               |
| ----------------- | ---------------- | ---------------------------------- |
| `font.size.xs`    | `0.75rem` / 12   | 힌트·조용한 메타                   |
| `font.size.sm`    | `0.8125rem` / 13 | 라벨                               |
| `font.size.base`  | `0.875rem` / 14  | 보조 본문                          |
| `font.size.md`    | `0.9375rem` / 15 | 본문                               |
| `font.size.lg`    | `1rem` / 16      | 버튼·입력(모바일 확대 방지 임계값) |
| `font.size.xl`    | `1.1875rem` / 19 | 카드 제목(소)                      |
| `font.size.2xl`   | `1.375rem` / 22  | 카드 제목                          |
| `font.size.3xl`   | `1.5rem` / 24    | 온보딩 헤드라인                    |
| `font.size.timer` | `6rem` / 96      | 집중 타이머(serif)                 |

**라운드**

| 토큰          | px  | 용도                 |
| ------------- | --- | -------------------- |
| `radius.xs`   | 4   | 에너지 칸            |
| `radius.md`   | 13  | 입력·리스트·옵션     |
| `radius.lg`   | 16  | 버튼·박스·보너스카드 |
| `radius.xl`   | 18  | CTA                  |
| `radius.2xl`  | 22  | 대표 과제 카드       |
| `radius.pill` | 999 | 칩·뱃지              |

> `radius.frame`(34px)은 **목업 폰 베젤** — 풀스크린 PWA엔 없음. 토큰화 제외(§7).

**간격 (4px 베이스)**

| 토큰      | px  |
| --------- | --- |
| `space.1` | 4   |
| `space.2` | 6   |
| `space.3` | 8   |
| `space.4` | 12  |
| `space.5` | 16  |
| `space.6` | 20  |
| `space.7` | 24  |
| `space.8` | 30  |

**엘리베이션** (와이어는 `filter: drop-shadow`; 구현 시 `box-shadow` 권장 — §8)

| 토큰                | 값                                |
| ------------------- | --------------------------------- |
| `elevation.inner`   | `0 4px 14px rgba(74,66,59,.05)`   |
| `elevation.soft`    | `0 12px 30px rgba(74,66,59,.10)`  |
| `elevation.card`    | `0 14px 36px rgba(74,66,59,.12)`  |
| `elevation.popover` | `0 10px 24px rgba(74,66,59,.16)`  |
| `elevation.cta`     | `0 8px 18px rgba(216,140,80,.35)` |
| `elevation.sheet`   | `0 -14px 30px rgba(0,0,0,.28)`    |

**모션 (DB-04 · §3 즉시성 · §6 담백)**

| 토큰            | 값                              | 비고                                |
| --------------- | ------------------------------- | ----------------------------------- |
| `duration.fast` | `150ms`                         | 일반 전환                           |
| `duration.cell` | `260ms`                         | 에너지 점등 — 종료 즉시·짧게·조용히 |
| `easing.quiet`  | `cubic-bezier(0.16, 1, 0.3, 1)` | 튀지 않는 감속                      |

> `prefers-reduced-motion` 시 점등 모션은 **즉시 상태변화로 대체**(DB-04). 반짝임·파티클·바운스 **anti-token**(§6).

---

## 3. Semantic 토큰 (화면은 여기부터 참조)

| Semantic                  | → Primitive             | 뜻 / 사용처                                                                                       |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `surface.page`            | `color.paper`           | 앱 최하단 종이 배경                                                                               |
| `surface.base`            | `color.cream.200`       | 기본 화면/카드                                                                                    |
| `surface.raised`          | `color.cream.100`       | 입력·올라온 카드 안쪽                                                                             |
| `surface.float`           | `color.cream.50`        | 팝오버·플로팅                                                                                     |
| `surface.subtle`          | `color.cream.300`       | 잔잔한 정보 패널                                                                                  |
| `border.default`          | `color.line.200`        | 기본 테두리                                                                                       |
| `border.raised`           | `color.line.100`        | 올라온 카드                                                                                       |
| `border.dashed`           | `color.line.300`        | 점선(잠김/추가 어포던스)                                                                          |
| `text.strong`             | `color.ink.900`         | 카드 제목                                                                                         |
| `text.primary`            | `color.ink.800`         | 본문                                                                                              |
| `text.secondary`          | `color.ink.500`         | 보조                                                                                              |
| `text.label`              | `color.ink.400`         | 필드 라벨                                                                                         |
| `text.quiet`              | `color.ink.300`         | 힌트·조용한 안내                                                                                  |
| `action`                  | `color.accent.500`      | **CTA 바탕 — 즉시성의 순간에만**(DB-02 하드)                                                      |
| `action.text`             | `color.ink.900`         | CTA 위 텍스트(§10-3 WCAG 실측 후 `color.accent.on`→`color.ink.900` 재매핑 — 배경은 불변)          |
| `action.ink`              | `color.accent.700`      | 테라코타 계열 텍스트                                                                              |
| `action.tint`             | `color.accent.tint.200` | 액션 틴트(15분 pill 등)                                                                           |
| `chip.bg` / `chip.line`   | `color.chip.*`          | 동사칩·예시칩 바탕/테두리(PH-04 구현 중 누락 발견 — §2-4 primitive는 있었으나 semantic 승격 누락) |
| `evidence.fill`           | `color.energy.fill`     | **에너지 칸 — 상태별 분기 절대 금지**(§5-1)                                                       |
| `evidence.ring`           | `color.energy.ring`     | 방금 채운 칸 순간 하이라이트                                                                      |
| `bonus.bg` / `bonus.line` | `color.bonus.*`         | **적중 시에만 가산**(빗나감엔 미적용)                                                             |
| `state.done.*`            | `color.ok.*`            | 회고 완료 인정(그린)                                                                              |
| `state.carry.*`           | `color.carry.*`         | 회고 미완료·이월 인정(퍼플)                                                                       |

### 결정 #6 — 회고 그린/퍼플 = **유지** (확정)

- 완료 인정칩 = 그린(`state.done`), 미완료·이월 인정칩 = 퍼플(`state.carry`)을 **유지한다.**
- **가드레일 정합:** §2·§8 "성공·미완료 시각 구분 금지"의 하드 대상은 **에너지 바**이며, 에너지 칸은 여전히 단일 `evidence.fill`로 동일하다(위반 아님). 그린/퍼플은 (a)처벌색(빨강/경고)이 **아니고**, (b)에너지 바가 아니라 **회고 인정칩**에 국한되며, (c)둘 다 따뜻한 무처벌 톤("못 했지만 괜찮아요")이라 §3 표현성 허용 범위로 판단.
- **경계 조건(구현 시 지킬 것):** 이 두 색은 **회고 인정칩 밖으로 확산 금지.** 에너지 바·대시보드·통계류로 새어 나가면 성적표 프레임이 되어 위반. `state.*`는 회고 화면 전용 토큰이다.

---

## 4. Mode Theme (스코프 오버라이드)

특정 화면 컨텍스트에서 **아래 semantic만** 재지정한다. 표에 없는 semantic(특히 `action`·`evidence`)은 **기본값을 승계**한다.

### 4-1. `mode: focus` (집중·일시정지 — 다크, 저자극)

| Semantic           | →                    | 근거                 |
| ------------------ | -------------------- | -------------------- |
| `surface.base`     | `color.dark.bg`      | 집중 화면 저자극(§6) |
| `surface.raised`   | `color.dark.surface` |                      |
| `border.default`   | `color.dark.line`    |                      |
| `text.primary`     | `color.dark.text`    |                      |
| `text.secondary`   | `color.dark.muted`   |                      |
| `action.ink`       | `color.dark.amber`   | 타이머 라벨 앰버     |
| `text.timer(role)` | `color.dark.timer`   | 대형 숫자            |

> `action`(테라코타 CTA)·`evidence.fill`(에너지)은 **재지정 안 함.** 다크에서도 CTA는 테라코타, 에너지 칸은 동일 색. 다크모드는 **기본 아님** — 이 컨텍스트에서만 의도적(DB-01/DB-04).

### 4-2. `mode: discharge` (방전 — 쿨 차분톤, 크롬만)

| Semantic         | →                    | 근거                  |
| ---------------- | -------------------- | --------------------- |
| `surface.base`   | `color.calm.surface` | 무드만 차분(§5 방전)  |
| `border.default` | `color.calm.line`    |                       |
| `action.tint`    | `color.calm.bg`      | 뱃지/pill 틴트만 쿨로 |
| `action.ink`     | `color.calm.700`     |                       |

> **불변:** `action`(오렌지 CTA)·`evidence.fill`(에너지 칸)은 **정상과 동일.** 와이어 하단 주석 "오렌지 CTA 토큰 승계 · 에너지 칸 정상과 동일"과 SPEC §5·브리프 §6-방전 정합. 방전은 **승리조건만 완화**하지 시각 보상을 깎지 않는다.

---

## 5. 가드레일 바인딩 (토큰 레벨 하드 규칙)

### 5-1. `evidence.fill` 단일성 (§2·§8 · DB-06)

완료/미완료/방전이 **하나의 토큰**을 공유한다. **상태별 fill 색 토큰을 새로 만드는 것은 영구 금지.** "방금 채운 칸"은 `evidence.ring`(순간 강조) + `duration.cell`로만 표현하고 곧 동일화한다.

### 5-2. 처벌색 없음 (§4 · DB-02)

`danger` / `error` / `warning` / `fail` 계열 토큰을 **정의하지 않는다**(§6 anti-token). 빨강·경고 노랑 팔레트 부재.

### 5-3. `action` = 즉시성의 순간에만 (DB-02 하드)

`action`(테라코타)은 CTA·적중 순간에만. 보조 버튼은 `surface.raised`+`border.default`(아웃라인). 테라코타를 버튼마다 도배하면 "특별함" 붕괴 → 위반.

### 5-4. `bonus.*` 가산 전용 (SCREEN-FLOW §3-2)

적중(6·7)에만 붙는다. 빗나감(6′·7′)엔 미적용 → 완료/미완료 화면과 **완전 동일**(무표시). 조건부 렌더이지 색 차이가 아니다.

### 5-5. QA 체크리스트 (구현·리뷰 통과 기준)

브리프 §6-1을 토큰 관점으로:

- [ ] `danger/error/warning` 토큰이 정의·사용되지 않았는가
- [ ] 에너지 칸이 오직 `evidence.fill` 하나만 쓰는가 (상태 분기 없음)
- [ ] `action`이 CTA·적중 순간에만 등장하는가 (보조는 아웃라인)
- [ ] `state.done/carry`가 회고 인정칩 밖으로 새지 않았는가 (#6 경계)
- [ ] `mode:focus`/`discharge`가 `action`·`evidence`를 재지정하지 않았는가
- [ ] 점등 모션이 `duration.cell`+`easing.quiet`이고 reduced-motion 대체가 있는가
- [ ] 폰트가 `font.serif`/`font.sans` 2종을 넘지 않는가
- [ ] `StateChip`이 회고 페이지 배럴 밖에서 import되지 않았는가 (PH-04.4 §1-3 — 회고 인정칩 색이 다른 화면으로 새면 성적표 도장처럼 각인됨)

---

## 6. Anti-tokens (의도적으로 정의하지 않는 것)

| 안 만드는 것                                      | 이유                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `color.danger` / `error` / `warning`              | §4 처벌색 없음                                                             |
| `color.energy.fill.incomplete` (미완료 전용 fill) | §5-1 단일성 위반                                                           |
| `color.energy.empty` (미리 그린 빈 할당칸)        | SPEC §8 "0에서 자람, 빈 칸 ❌". 단 테두리용 중립은 `border.default` 재사용 |
| `motion.bounce` / `sparkle` / `confetti`          | §3 anti-goal(도파민 슬롯머신) · DB-04                                      |
| `color.streak` / `badge.level`                    | §4 스트릭 처벌·성적표 프레임                                               |
| `radius.frame` (34px 폰 베젤)                     | 목업 크롬, 앱 아님(§7)                                                     |

---

## 7. 와이어에서 버릴 것 (앱 아님 — 재구성 시 제거)

토큰이 아니라 시안 설명용 크롬. 화면 재구성 시 제거:
섹션 레터(A~F) · `신규/재구성/유지` 뱃지 · 화살표 커넥터 · `→ 5-A`·`1-A/3-A 바인딩` 주석 · `예측×결과 4조합` 매트릭스 · 하단 데모 안내문 · `9:41`·목업 배터리 · **폰 베젤(34px 프레임)**.

---

## 8. 스택 채택 가이드 (웹은 PH-04에서 확정·구현 완료)

§9 DTCG JSON을 소스로 삼아 아래 중 하나로 변환한다. **웹(CSS/PWA) 경로는 이미 채택·구현됨** — `tokens/design-tokens.json`(§9 블록 분리본) + `tokens/style-dictionary.config.js`(Style Dictionary v5) → `src/styles/tokens.generated.css`, `npm run tokens:build`로 재생성(상세: `phases/PH-04-tokens-ui.md`). 다른 스택(Tailwind/RN/iOS/Android)은 여전히 미착수.

| 스택                  | 변환 경로                                     | 산출                                                      |
| --------------------- | --------------------------------------------- | --------------------------------------------------------- |
| **웹 (CSS/PWA)**      | Style Dictionary → CSS custom properties      | `:root{--surface-base:…}` + `[data-mode=focus]{…}` 스코프 |
| **웹 (Tailwind)**     | SD → `tailwind.config` theme extend           | `bg-surface-base`, `text-action` 유틸                     |
| **React Native**      | SD → JS/TS 객체                               | `tokens.surface.base`                                     |
| **iOS (SwiftUI)**     | SD → `.swift` Color extension / Asset catalog | `Color.surfaceBase`                                       |
| **Android (Compose)** | SD → Kotlin `Color` + Theme                   | `MaterialTheme` 대체 팔레트                               |

**변환 시 주의:**

- 와이어의 `filter: drop-shadow(...)` + `box-shadow:none!important`는 **아티팩트 산출물 특성**이다. 실제 구현은 `elevation.*`를 **`box-shadow`로** 매핑(성능·제어 우수). 모양 따라가는 그림자가 꼭 필요할 때만 drop-shadow.
- `font.size`는 rem 기준. RN/네이티브는 sp/pt로 재계산.
- Mode theme는 DTCG 표준에 네이티브 개념이 없으므로, **별도 token set**(`mode-focus`, `mode-discharge`)으로 두고 변환기에서 오버레이한다(§9 구조 참조).
- `semantic.action`은 자신도 값(CTA 배경)이면서 동시에 `text`/`ink`/`tint` 자식을 갖는 유일한 노드다. DTCG는 한 노드가 `$value`와 자식 토큰을 동시에 갖는 걸 허용하지 않아(파서가 리프로 취급, 자식 무시) Tailwind 관례를 따라 `action.DEFAULT`로 배경값을 분리했다 — 변환기(Style Dictionary)는 `DEFAULT` 세그먼트를 벗겨 최종 변수명을 그대로 `action`으로 되돌린다(§8 스택 어댑터가 이 규칙을 따름, `phases/PH-04-tokens-ui.md` 구현 참조).

---

## 9. 기계 소스 (W3C DTCG JSON)

> **이것이 토큰의 정본 값이다.** 위 표는 사람용 요약. **이 블록은 `tokens/design-tokens.json`으로 이미 분리되어 있다**(PH-04에서 구현, 두 파일은 동기화 유지 대상 — 이 문서를 고치면 `tokens/design-tokens.json`도 같이 갱신) — Style Dictionary가 이를 소스로 `src/styles/tokens.generated.css`를 빌드한다. `{group.token}`은 참조(alias).

```json
{
  "$description": "컴페이스 디자인 토큰 — DESIGN-BRIEF §3 승격. 스택 중립. hex 옆 // 는 원시 rgb.",
  "color": {
    "$type": "color",
    "paper": { "$value": "#E7DECF" },
    "cream": {
      "50": { "$value": "#FFFDF7" },
      "100": { "$value": "#FCF9F2" },
      "200": { "$value": "#F6F1E6" },
      "300": { "$value": "#F2ECDF" },
      "400": { "$value": "#F0E7D6" }
    },
    "sand": { "200": { "$value": "#EADFCB" } },
    "line": {
      "100": { "$value": "#E7DDCB" },
      "200": { "$value": "#E2D8C6" },
      "300": { "$value": "#D8CCB6" }
    },
    "ink": {
      "900": { "$value": "#3F382F" },
      "800": { "$value": "#4A423B" },
      "600": { "$value": "#7E7263" },
      "500": { "$value": "#8C8070" },
      "400": { "$value": "#A0937F" },
      "300": { "$value": "#B5A78E" },
      "200": { "$value": "#C4B7A2" }
    },
    "accent": {
      "500": { "$value": "#E79155" },
      "600": { "$value": "#C9743C" },
      "700": { "$value": "#9A6A38" },
      "on": { "$value": "#FFF7EE" },
      "tint": { "100": { "$value": "#F7E7D4" }, "200": { "$value": "#F3DDC8" } },
      "glow": { "$value": "#D88C50" }
    },
    "energy": { "fill": { "$value": "#E79B62" }, "ring": { "$value": "#C9743C" } },
    "chip": { "bg": { "$value": "#F1E8D8" }, "line": { "$value": "#E4DAC7" } },
    "bonus": { "bg": { "$value": "#FCF6EC" }, "line": { "$value": "#EAD4B6" } },
    "ok": {
      "500": { "$value": "#9DBF8C" },
      "700": { "$value": "#557049" },
      "bg": { "$value": "#EAF0E5" },
      "line": { "$value": "#D7E5CF" }
    },
    "carry": {
      "500": { "$value": "#A99BC4" },
      "700": { "$value": "#6B5E86" },
      "bg": { "$value": "#F0EAF4" }
    },
    "calm": {
      "$description": "⚠️ 미정 · 브리프(§3/§7) 소유. 세이지(green-gray) 지향. 아래 블루그레이는 와이어 관측값(미채택) — 브리프 확정 시 교체.",
      "500": { "$value": "#8494A0" },
      "700": { "$value": "#7C8892" },
      "bg": { "$value": "#DFE6EA" },
      "surface": { "$value": "#ECE7DC" },
      "line": { "$value": "#DDD4C4" }
    },
    "dark": {
      "bg": { "$value": "#3A332C" },
      "bgDeep": { "$value": "#322C26" },
      "surface": { "$value": "#433A30" },
      "line": { "$value": "#514738" },
      "amber": { "$value": "#C9A878" },
      "timer": { "$value": "#F1E8D6" },
      "text": { "$value": "#C4B6A0" },
      "muted": { "$value": "#8A7B64" }
    }
  },
  "font": {
    "family": {
      "$type": "fontFamily",
      "serif": { "$value": ["Gowun Batang", "serif"] },
      "sans": { "$value": ["Gowun Dodum", "system-ui", "sans-serif"] }
    },
    "size": {
      "$type": "dimension",
      "xs": { "$value": "0.75rem" },
      "sm": { "$value": "0.8125rem" },
      "base": { "$value": "0.875rem" },
      "md": { "$value": "0.9375rem" },
      "lg": { "$value": "1rem" },
      "xl": { "$value": "1.1875rem" },
      "2xl": { "$value": "1.375rem" },
      "3xl": { "$value": "1.5rem" },
      "timer": { "$value": "6rem" }
    }
  },
  "radius": {
    "$type": "dimension",
    "xs": { "$value": "4px" },
    "md": { "$value": "13px" },
    "lg": { "$value": "16px" },
    "xl": { "$value": "18px" },
    "2xl": { "$value": "22px" },
    "pill": { "$value": "999px" }
  },
  "space": {
    "$type": "dimension",
    "1": { "$value": "4px" },
    "2": { "$value": "6px" },
    "3": { "$value": "8px" },
    "4": { "$value": "12px" },
    "5": { "$value": "16px" },
    "6": { "$value": "20px" },
    "7": { "$value": "24px" },
    "8": { "$value": "30px" }
  },
  "elevation": {
    "$type": "shadow",
    "inner": {
      "$value": {
        "offsetX": "0",
        "offsetY": "4px",
        "blur": "14px",
        "spread": "0",
        "color": "rgba(74,66,59,0.05)"
      }
    },
    "soft": {
      "$value": {
        "offsetX": "0",
        "offsetY": "12px",
        "blur": "30px",
        "spread": "0",
        "color": "rgba(74,66,59,0.10)"
      }
    },
    "card": {
      "$value": {
        "offsetX": "0",
        "offsetY": "14px",
        "blur": "36px",
        "spread": "0",
        "color": "rgba(74,66,59,0.12)"
      }
    },
    "popover": {
      "$value": {
        "offsetX": "0",
        "offsetY": "10px",
        "blur": "24px",
        "spread": "0",
        "color": "rgba(74,66,59,0.16)"
      }
    },
    "cta": {
      "$value": {
        "offsetX": "0",
        "offsetY": "8px",
        "blur": "18px",
        "spread": "0",
        "color": "rgba(216,140,80,0.35)"
      }
    },
    "sheet": {
      "$value": {
        "offsetX": "0",
        "offsetY": "-14px",
        "blur": "30px",
        "spread": "0",
        "color": "rgba(0,0,0,0.28)"
      }
    }
  },
  "duration": {
    "$type": "duration",
    "fast": { "$value": "150ms" },
    "cell": { "$value": "260ms" }
  },
  "easing": {
    "$type": "cubicBezier",
    "quiet": { "$value": [0.16, 1, 0.3, 1] }
  },
  "semantic": {
    "$type": "color",
    "surface": {
      "page": { "$value": "{color.paper}" },
      "base": { "$value": "{color.cream.200}" },
      "raised": { "$value": "{color.cream.100}" },
      "float": { "$value": "{color.cream.50}" },
      "subtle": { "$value": "{color.cream.300}" }
    },
    "border": {
      "default": { "$value": "{color.line.200}" },
      "raised": { "$value": "{color.line.100}" },
      "dashed": { "$value": "{color.line.300}" }
    },
    "text": {
      "strong": { "$value": "{color.ink.900}" },
      "primary": { "$value": "{color.ink.800}" },
      "secondary": { "$value": "{color.ink.500}" },
      "label": { "$value": "{color.ink.400}" },
      "quiet": { "$value": "{color.ink.300}" }
    },
    "action": {
      "DEFAULT": { "$value": "{color.accent.500}" },
      "text": { "$value": "{color.ink.900}" },
      "ink": { "$value": "{color.accent.700}" },
      "tint": { "$value": "{color.accent.tint.200}" }
    },
    "chip": { "bg": { "$value": "{color.chip.bg}" }, "line": { "$value": "{color.chip.line}" } },
    "evidence": {
      "fill": { "$value": "{color.energy.fill}" },
      "ring": { "$value": "{color.energy.ring}" }
    },
    "bonus": { "bg": { "$value": "{color.bonus.bg}" }, "line": { "$value": "{color.bonus.line}" } },
    "state": {
      "done": {
        "mark": { "$value": "{color.ok.500}" },
        "text": { "$value": "{color.ok.700}" },
        "bg": { "$value": "{color.ok.bg}" }
      },
      "carry": {
        "mark": { "$value": "{color.carry.500}" },
        "text": { "$value": "{color.carry.700}" },
        "bg": { "$value": "{color.carry.bg}" }
      }
    }
  },
  "mode-focus": {
    "$description": "집중/일시정지 다크 오버레이. action·evidence는 재지정 금지.",
    "$type": "color",
    "surface": {
      "base": { "$value": "{color.dark.bg}" },
      "raised": { "$value": "{color.dark.surface}" }
    },
    "border": { "default": { "$value": "{color.dark.line}" } },
    "text": {
      "primary": { "$value": "{color.dark.text}" },
      "secondary": { "$value": "{color.dark.muted}" },
      "timer": { "$value": "{color.dark.timer}" }
    },
    "action": { "ink": { "$value": "{color.dark.amber}" } }
  },
  "mode-discharge": {
    "$description": "방전 쿨 오버레이(크롬만). action(오렌지 CTA)·evidence(에너지)는 재지정 금지.",
    "$type": "color",
    "surface": { "base": { "$value": "{color.calm.surface}" } },
    "border": { "default": { "$value": "{color.calm.line}" } },
    "action": { "tint": { "$value": "{color.calm.bg}" }, "ink": { "$value": "{color.calm.700}" } }
  }
}
```

---

## 10. 미결 / 튜닝 여지 (브리프 §7 유예 잔여)

1. **✔ 방전톤(`color.calm`) — 브리프 기준으로 유예 확정.** 브리프 §3-1이 방전톤을 소유하며 **세이지(green-gray) 지향·미정**이다. 와이어의 블루그레이(`#8494A0`)는 **관측값일 뿐 미채택** — 브리프 방향과 어긋나므로 정본으로 승격하지 않는다. 브리프가 세이지 hex를 확정하면 `color.calm.*`를 그 값으로 교체한다(semantic 매핑은 불변).
2. **명조 폰트 최종 선정** — `Gowun Batang`은 후보(브리프 §7). 무게감 과하면 더 가벼운 명조로 교체 가능 → `font.family.serif`만 바꾸면 전파.
3. **✔ CTA 텍스트 대비 — PH-04 착수 전 실측·수정 완료.** `action.text`(구 `color.accent.on` #FFF7EE) on `action`(#E79155) = **2.31:1**, README §0-1① 기준(≥4.5:1) 미달 확인 → `action.text`를 `color.ink.900`(#3F382F)로 재매핑, **4.72:1**로 통과(§3·§9 반영, 배경 `action` 자체는 불변 — DB-02 브랜드 색 유지). `text.quiet`(#B5A78E) on `surface.base`(#F6F1E6) = **2.10:1** — 이건 §0-1① "의도적 조용 요소" 면제 대상이라 수정 없이 기록만.
4. **⚠️ `evidence.fill` 비텍스트 대비 — 미해결, 결정 필요.** `evidence.fill`(#E79B62)이 `surface.base`(#F6F1E6) 대비 **2.01:1**, `surface.page`(#E7DECF) 대비 **1.70:1** — README §0-1② 비텍스트 기준(≥3:1) 미달. `evidence.ring`을 상시 테두리로 얹는 보완도 표면별 편차가 커 불충분(`surface.base` 3.08:1은 통과하나 `surface.page` 2.60·`cream.400` 2.83은 여전히 미달). §5-1 "상태별 분기 금지"는 유지한 채 **단일 `evidence.fill` hex 자체를 더 진하게 재조정**하는 게 유일한 확실한 해법으로 보이나, 이 색은 제품의 가장 상징적인 "증거" 색(§0/§3 CLAUDE.md)이라 브리프·사용자 승인 없이 임의 변경하지 않음. **PH-04는 이 값을 그대로 소비하고, 자동화 대비 검증에서 이 항목만 "기록"으로 표시(가드 통과 아님)** — 해결 전까지 남는 리스크로 SPEC 리스크 레지스터 등재 권장.
5. **간격·라인하이트 스케일 확장** — 컴포넌트 토큰 단계에서 line-height 토큰 추가 예정.
6. **✔ 컴포넌트 조립 규약 — `PH-04.2`에서 완료.** 여백 리듬(3계층)·타이포 위계(≤3단계)·elevation 서열(6종 매핑)·모션 일관성 표는 [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) 참조(원리 차용/거부 근거는 `DECISIONS.md D-27`). 6종 컴포넌트·9개 페이지 전수 소급 대조는 `PH-04.3` 범위.

---

## Changelog

- **v0.6** — 모바일 실사용 버그 2건 수정. (1) `font.size.md`(입력 필드가 참조하던 토큰)가 14px로 iOS Safari/Chrome의 "포커스 시 자동 확대" 임계값(16px) 미만이라 입력 시 화면이 확대되는 문제 발견 — `TextInput.module.css`가 입력 필드에 한해 이미 존재하는 `font.size.lg`(16px, 버튼용)를 재사용하도록 변경(신규 토큰 생성 없음, §9 값 무변경). (2) 모바일에서 전반적으로 글자가 작다는 피드백에 따라 `font.size.xs/sm/base/md` 4단계를 각 1px씩 상향(11/12/13/14 → 12/13/14/15). `lg` 이상은 이미 16px 이상이라 변경 없음. WCAG 대비(§10-3)는 색상 문제라 폰트 크기 변경과 무관, 영향 없음.
- **v0.5** — `PH-04.2` 완료로 §10-6 항목 6("컴포넌트 토큰(다음 단계)")을 [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) 링크로 교체(여백 리듬·타이포 위계·elevation 서열·모션 일관성 표 신설, 토큰 값 자체는 무변경).
- **v0.4** — PH-04 `Chip` 프리미티브 구현 중 발견: `color.chip.bg`/`color.chip.line`(§2-4)가 primitive로만 존재하고 semantic 승격이 누락돼 있었음(§3에 행 없음) — CSS 파이프라인이 semantic 계층만 노출하므로 이 상태로는 Chip이 자기 색을 참조할 방법이 없었다. `chip.bg`/`chip.line` semantic을 §3·§9에 추가(값 변경 없음, 순수 승격). 동시에 `semantic.action`을 DTCG 규격 위반(한 노드가 `$value`와 자식 토큰을 동시에 가짐) 수정 위해 `action.DEFAULT`로 재구조화(§8에 근거 기록).
- **v0.3** — PH-04 착수 전 WCAG 실측(§10-3 예비 조항 이행). `action.text`를 `color.accent.on`→`color.ink.900`로 재매핑(CTA 텍스트 대비 2.31:1→4.72:1, 배경 `action` 불변). `evidence.fill` 비텍스트 대비 미달(1.70~2.01:1 vs ≥3:1) 발견 — 브랜드 상징색이라 임의 수정하지 않고 §10-4에 미해결 기록, PH-04 자동화 검증에서 "기록"으로만 표시.
- **v0.2** — 방전톤(`color.calm`)을 **브리프 기준으로 정리**: 최종값은 `DESIGN-BRIEF §3/§7`이 소유(세이지 지향·미정), 와이어 블루그레이는 **관측·미채택**으로 강등(§2-6·§10·§9 desc). 나머지 방향(폰트 후보 등)도 브리프 소유 재확인. 기술 스택 매핑은 별도 세션에서 진행.
- **v0.1** — 최초 산출. 와이어프레임(`컴페이스 와이어프레임.html`, 30여 화면) 실측 → DESIGN-BRIEF §3 잠정값을 구체 토큰으로 승격. 3계층(primitive/semantic/mode) 구조 · DTCG JSON 기계 소스 · 가드레일 토큰 바인딩 · anti-token · 스택 채택 가이드. 결정 #6(회고 그린/퍼플) = **유지** 확정 및 가드레일 정합 명시.
