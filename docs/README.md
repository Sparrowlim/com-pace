# 컴페이스 — 문서 지도
원본 보존은 `_archive/`

## 문서 역할 & 로드 시점

| 문서 | 역할 | 언제 읽나 | 분량 |
|---|---|---|---|
| [`/CLAUDE.md`](../CLAUDE.md) | **가드레일 / 불변 규칙** | 항상(자동 로드) | 최소 |
| [`VISION.md`](VISION.md) | **의도·방향(WHY)** — 북극성·페르소나·안티골 | 제품 의도를 판단할 때 | 짧음 |
| [`SPEC.md`](SPEC.md) | **현재 확정 스코프(WHAT/NOW)** — MVP 규칙·화면·엣지 | 구현·기능 결정 시 | 중간 |
| [`SCREEN-FLOW.md`](SCREEN-FLOW.md) | **화면 전이·상태 로직** | 화면/플로우 작업 시 | 중간 |
| [`DESIGN-BRIEF.md`](DESIGN-BRIEF.md) | **시각·인터랙션·톤 방향(HOW-it-feels)** — 스타일·팔레트·타이포·모션·톤/만트라·상태 시각 규약 | 디자인·와이어·프론트 작업 시 | 중간 |
| [`DESIGN-TOKENS.md`](DESIGN-TOKENS.md) | **디자인 토큰 구체값·구조·변환(HOW-it-computes)** — primitive/semantic/mode 3계층 · DTCG JSON 기계 소스 · 스택 중립 | 토큰·컴포넌트·프론트 구현 시 | 중간 |
| [`DECISIONS.md`](DECISIONS.md) | **결정 근거 아카이브(WHY-detail, ADR)** | "왜 X를 택했나" 조회 시(해당 D-번호만) | 참조용 |
| [`phases/README.md`](phases/README.md) | **구현 순서·의존성(HOW-to-build)** — 위상(PH-xx) 분해·Runnable State 판정 | 구현 착수·다음 작업 결정 시 | 위상별 분할(PH-xx) |
| `_archive/` | 원본 스냅샷 (히스토리 대체) | 원문 서술이 필요할 때만 | — |

## 위계 (충돌 시 우선순위)

```
CLAUDE.md (불변 규칙)  ─┐
                       ├─ SPEC.md 가 현재 확정 정본. VISION/DECISIONS/CLAUDE가
VISION.md (의도)        │   SPEC과 어긋나면 SPEC이 최신 (Grillme 봉합 결과).
DECISIONS.md (근거)   ─┘   단, 불변 규칙(§2 One Task 등)은 SPEC도 못 깬다.
```

## 정본(canonical) 소유표 — 한 사실은 한 곳에서만

| 사실 | 정본 위치 | 다른 곳은 |
|---|---|---|
| 북극성 문장 | `VISION.md §1` | CLAUDE.md는 가드레일용 1줄만, 나머지 링크 |
| 페르소나 A/K | `VISION.md §3` | DECISIONS D-03은 "K를 floor로 삼은 근거"만 |
| 안티골 | `VISION.md §8` | CLAUDE.md §2는 불변 규칙(다른 각도) |
| 핵심 루프(현재) | `SPEC.md §3` | VISION §5는 서술 요약, SCREEN-FLOW는 화면단 |
| MVP 스코프 | `SPEC.md §12` | DECISIONS 로드맵은 근거 |
| 각 결정의 근거 | `DECISIONS.md D-xx` | SPEC/CLAUDE는 결론만 + D-번호 링크 |
| 화면 전이·P이슈 | `SCREEN-FLOW.md` | 확정된 규칙은 SPEC로 승격 |
| 시각·디자인 방향 | `DESIGN-BRIEF.md DB-xx` | 미적 선택이 SPEC과 어긋나면 SPEC이 최신 |
| 디자인 토큰 구체값·구조 | `DESIGN-TOKENS.md`(값·DTCG) | BRIEF §3은 *의미/방향*만, 값은 TOKENS가 정본. 방향이 어긋나면 BRIEF가 최신 |
| 플랫폼·기술 스택 | `DECISIONS.md D-26`(근거) → `TECH-SPEC.md`(명세, 확정) | SPEC/ROUTES는 결론만 참조 |
| 구현 위상·의존성 순서 | `phases/README.md` | SPEC/TECH-SPEC은 스코프·스택만, 순서는 여기가 정본 |

## 작성 규칙 (AI 컨텍스트 절약)

1. **결론 먼저** — 각 항목은 결정/규칙을 앞에, 근거를 뒤에.
2. **버전 태그 인라인 금지** — 변경 이력은 각 문서 맨 아래 Changelog 한 곳(또는 이 지도).
3. **한 사실 한 곳(DRY)** — 위 소유표. 재기술 대신 링크.
4. **원자적 + 안정 ID** — DECISIONS는 `D-xx`, SCREEN-FLOW는 `Pn`. 다른 문서가 부분만 로드 가능.
