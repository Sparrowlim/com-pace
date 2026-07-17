# 조립 레시피 (Recipes) — `RC`

> 상위: [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) 허브 · 프리미티브: [`components.md`](components.md) · 세로 배치: [`composition.md`](composition.md) · 화면 원형 판단: [`decision-guide.md`](decision-guide.md)
> **규칙:** 이 표에 없는 화면 = 카탈로그 커버리지 게이트 위반. 새 화면을 추가할 때 이 표에 먼저 한 행을 채우고, 기존 11종으로 설명이 안 될 때만 [`components.md`](components.md)에 12번째를 신설한다(신설 전 "기존 조합으로 충분한가"부터 검토).

## RC-1. 화면별 프리미티브 조합 (SCREEN-FLOW §1)

| 화면 ID(SCREEN-FLOW §1) | 화면                               | 조립 = 프리미티브 조합                                                                                                     | 원형([`decision-guide.md`](decision-guide.md)) |
| ----------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1                       | 면죄부 3화면                       | `TaskCard` + `Button`                                                                                                      | 카드형                                         |
| 1-A / 2z / 3-A          | 아무거나 입력(신규·소진 후 재진입) | `TextInput` + `Button`                                                                                                     | 입력형                                         |
| 1-B                     | 북극성(선택)                       | `TextInput`×2 + `Button`×2                                                                                                 | 입력형                                         |
| 3                       | 과제 쪼개기                        | `TaskCard` + `TextInput` + `Chip`(동사칩 반복) + `Button`                                                                  | 카드형                                         |
| 2                       | 대시보드(홈)                       | `NorthStarBadge`(선택) + `TaskCard`류(진행중/CTA/조각선택 변형) + `OptionRow`(조각 2개↑ 자기선택) + `Button` + `EnergyBar` | 카드형(허브)                                   |
| 4                       | 사전 예측                          | `OptionRow`×2                                                                                                              | 선택형                                         |
| 5                       | 집중 화면                          | `TimerDisplay`                                                                                                             | 타이머형                                       |
| 5-A                     | 딴생각 포착                        | `BottomSheet` + `TextInput`(multiline) + `Button`                                                                          | 시트형                                         |
| 5-B                     | 일시정지                           | `BottomSheet` + `Button`×2                                                                                                 | 시트형                                         |
| 6 / 6′ / 7 / 7′         | 회고 4조합                         | `StateChip` + `OptionRow`×3(영점조절) + `BonusCard`(적중 시만) + `EnergyBar` + `Button`                                    | 회고형                                         |
| 6-A                     | 휴식                               | `Button`×2(다음 블록/오늘은 그만)                                                                                          | 선택형                                         |
| 방전 진입               | 방전 진입                          | `Button`×2(primary+secondary)                                                                                              | 선택형                                         |
| 방전 대시보드           | 방전 대시보드                      | `TaskCard` + `Button`×2                                                                                                    | 카드형                                         |
| 9                       | 설정                               | `OptionRow`×2(알림 on/off) + `NorthStarBadge`(있을 때만) + `Button`×2                                                      | 목록형                                         |

## RC-2. 기각된 신규 primitive (기존 조합으로 충분했던 사례)

새 컴포넌트를 만들기 전 "기존 조합으로 충분한가"를 먼저 물어야 한다는 근거:

- **딴생각 포착·일시정지(5-A/5-B):** 새 모달 primitive 대신 기존 `BottomSheet` 재사용(학습 비용 최소화).
- **휴식(6-A):** `DischargeEntryPage`와 동일 조립 패턴 재사용 → 카탈로그 신규 등재 불요.
- **방전 대시보드:** "QuietLink" 신규 primitive 기각, `[data-mode="discharge"]` ambient 오버레이만 얹음.

---

이력·소급 감사 기록(휴식 행 드리프트 정정 등)은 [`CHANGELOG.md`](CHANGELOG.md).
