# 모션 / 피드백 일관성 (Motion) — `MO`

> 상위: [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) 허브 · 값 정본: [`../DESIGN-TOKENS.md §2-8`](../DESIGN-TOKENS.md) (`duration.*`·`easing.*`)
> `DESIGN-BRIEF DB-04`가 동결한 값의 재확인 — 신규 값은 추가하지 않는다.

## MO-1. 상태 변화 → duration/easing 고정

| 상태 변화                                        | duration                   | easing         | 적용 컴포넌트               |
| ------------------------------------------------ | -------------------------- | -------------- | --------------------------- |
| 일반 상호작용 전환(hover/press/포커스/선택 토글) | `duration.fast`(150ms)     | `easing.quiet` | `Button`·`Chip`·`OptionRow` |
| 에너지 칸 점등                                   | `duration.cell`(260ms)     | `easing.quiet` | `EnergyCell`                |
| 바텀시트 진입/퇴장                               | `duration.fast`(150ms)     | `easing.quiet` | `BottomSheet`               |
| `prefers-reduced-motion: reduce`                 | `0s`(즉시 상태변화로 대체) | —              | 전체                        |

## MO-2. anti-motion

`motion.bounce`·`sparkle`·`confetti`·파티클·반짝임은 **정의·사용 금지**(`DESIGN-TOKENS §6` anti-token · CLAUDE §3 도파민 슬롯머신 anti-goal). 점등은 "종료 즉시·짧게·조용히"만.

정적 컨테이너(`TaskCard` 등 상호작용 상태가 없는 요소)에 모션 미적용은 편차가 아니라 규칙 밖(N/A)이다.

---

이력·소급 감사 기록은 [`CHANGELOG.md`](CHANGELOG.md).
