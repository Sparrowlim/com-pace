# 컴페이스 — 디자인 시스템 (화면 조립 규약) · 허브

> **역할:** [`DESIGN-TOKENS.md`](DESIGN-TOKENS.md)의 semantic 토큰을 실제 컴포넌트·화면에 **어떻게 배치하는가**의 규약(HOW-it-assembles). 토큰 자체의 값·구조는 소유하지 않는다 — "어떤 상황에 어떤 토큰을 쓰는가"만 고정한다.
> **정본 경계:** 토큰 구체값 = `DESIGN-TOKENS.md`(불변, 이 문서가 재정의 못 함) · 원리 차용/거부 근거 = [`DECISIONS.md D-27`](DECISIONS.md#d-27) · 불변 규칙 = [`/CLAUDE.md`](../CLAUDE.md) · 확정 스코프가 어긋나면 `SPEC.md`가 최신.
> **위계 선언(필수):** 본 문서와 하위 모듈은 `CLAUDE.md §2` 불변 규칙·`DB-02` 하드 규칙(처벌색 없음·액센트=즉시성 순간만)을 **깨지 못한다.** 어떤 배치 규칙도 이 둘과 충돌하면 이 문서가 진다.
> **값이 필요하면 여기 적지 않는다:** 새 색·간격·크기는 [`DESIGN-TOKENS.md`](DESIGN-TOKENS.md) + `tokens/design-tokens.json` + 재생성(`npm run tokens:build`)으로. 이 시스템은 기존 토큰 **참조만** 한다.

---

## 이 문서는 허브다

상세 규약은 [`design-system/`](design-system/) 모듈로 분해되어 있다(한 관심사 = 한 파일 = 외과적 수정 가능). 이 파일은 **정본 경계·위계·§번호 매핑**만 소유하고, 규칙 본문은 아래 모듈이 소유한다.

## 규약 모듈 (따르는 것)

| 구 §번호 | 모듈                                                                 | ID  | 소유하는 규칙                                            |
| -------- | -------------------------------------------------------------------- | --- | -------------------------------------------------------- |
| §0       | (원리 매핑 — 아래 "원리 매핑" 절)                                    | —   | Apple HIG 선택적 차용 근거(`D-27`)                       |
| §1       | [`design-system/spacing.md`](design-system/spacing.md)               | SP  | `space.*` 3계층 용도 고정                                |
| §1-1     | [`design-system/composition.md`](design-system/composition.md)       | CMP | **화면 세로 배치·무게중심·초점 밴드·앵커·공백 프레이밍** |
| §2       | [`design-system/typography.md`](design-system/typography.md)         | TY  | 동시 노출 크기 ≤3단계·세리프 제한                        |
| §3       | [`design-system/elevation.md`](design-system/elevation.md)           | EL  | elevation 6종 서열·컴포넌트 매핑                         |
| §4       | [`design-system/motion.md`](design-system/motion.md)                 | MO  | 상태 변화→duration/easing·anti-motion                    |
| §5       | [`design-system/components.md`](design-system/components.md)         | C   | 컴포넌트 카탈로그 11종(C-01~11)                          |
| §6       | [`design-system/recipes.md`](design-system/recipes.md)               | RC  | 화면별 프리미티브 조합                                   |
| (신규)   | [`design-system/decision-guide.md`](design-system/decision-guide.md) | DG  | **언제 어떤 조립을 고르는가**(화면 6원형)                |

> 인바운드 참조("`DESIGN-SYSTEM.md §1-1`" 등)는 이 매핑표를 거쳐 해당 모듈로 이어진다. `.module.css`·phases 문서가 § 번호로 가리키던 규칙은 위 표에서 모듈을 찾는다.

## 눈으로 확인 (비주얼 검증)

문서만으로는 "어떻게 생겼는지" 가늠할 수 없다는 한계를 메우기 위해, 규약이 실제로 어떻게 렌더되는지 보는 **살아있는 갤러리**를 둔다(dev 전용 — 프로덕션 라우터 미포함, 페르소나 K 비노출). 토큰 스와치·컴포넌트 11종×변형·화면 구성 패턴을 320/375/768에서 렌더하고 Playwright가 스냅샷한다.

> 위치·실행법: [`design-system/README-gallery.md`](design-system/README-gallery.md) — 화면 `src/styleguide/`, 라우트 `/styleguide`, 스냅샷 `e2e/design-system-gallery.spec.ts`.

## 이력

버전별 변경·소급 감사·"✔ 해소" 기록은 [`design-system/CHANGELOG.md`](design-system/CHANGELOG.md) 한 곳(README 작성 규칙 #2).

---

## 원리 매핑 (Apple HIG 선택적 차용 — `D-27`)

`D-27`이 확정한 대로 아래 3원칙의 **원리만** 차용한다. SF Pro·SF Symbols·시스템 블루·iOS 크롬·iOS 제스처는 이식하지 않는다(K=Android, `D-26` 정합).

| HIG 원칙                                           | 이 시스템에서의 구현                                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Clarity** (명료함)                               | [`typography`](design-system/typography.md) — 동시 노출 크기 단계를 제한해 위계를 명확히 함                      |
| **Deference** (양보 — 크롬이 콘텐츠를 이기지 않음) | [`spacing`](design-system/spacing.md) + [`composition`](design-system/composition.md) + 낮은 서열 elevation 우선 |
| **Depth** (깊이)                                   | [`elevation`](design-system/elevation.md) — "얼마나 떠 있는가"를 컴포넌트 역할에 매핑                            |

모션은 HIG의 "목적성 있는 절제" 원리만 차용([`motion`](design-system/motion.md)), `DB-04`가 정한 값을 재확인만 한다(신규 값 없음).
