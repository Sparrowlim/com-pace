# 살아있는 갤러리 (비주얼 검증 표면)

> 상위: [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) 허브.
> **왜:** 규약(이 디렉터리의 모듈)만으로는 사람이 "어떻게 생겼는지" 가늠할 수 없다. 갤러리는 규약이 실제로 렌더된 형태를 **눈으로/스냅샷으로** 확인하는 표면이다(디자인 시스템 개편 4대 원칙 중 #2).

## 무엇을 보여주나

- **Foundations** — surface/text/signal 색 스와치, 여백(`space.*`) 스케일, 타이포 위계(≤3단계), 라운드·elevation 서열.
- **컴포넌트 카탈로그** — `Button`·`Chip`·`TaskCard`·`EnergyBar`(0/3/6칸)·`OptionRow`·`TextInput`·`TimerDisplay`·`BonusCard`·`NorthStarBadge`. (`BottomSheet`·`StateChip`은 각 화면 맥락에서만 — 오버레이·회고 로컬 격리.)
- **화면 구성(CMP)** — "바벨 공허 vs 프레임된 여백" before/after로 초점 밴드(CMP-3)·공백 프레이밍(CMP-4)·앵커 가시성(CMP-5)을 시연.

## 어디에 있나

- 화면: [`src/styleguide/StyleGuidePage.tsx`](../../src/styleguide/StyleGuidePage.tsx)
- 라우트: `/styleguide` — **앱 내비게이션에서 링크되지 않는 dev/QA 전용.** lazy 청크라 메인 번들 예산 무영향, 어떤 플로우도 이 URL로 가지 않으므로 페르소나 K는 도달 경로가 없다(CLAUDE §1 K 비노출 정합).
- 스냅샷 스펙: [`e2e/design-system-gallery.spec.ts`](../../e2e/design-system-gallery.spec.ts)

## 어떻게 보나

```bash
# 라이브(개발 중 브라우저로)
npm run dev            # → http://localhost:5173/styleguide

# 스냅샷(320/768/1024/1440 전 뷰포트, 커밋된 PNG와 대조)
npm run test:e2e -- design-system-gallery
npm run test:e2e:update -- design-system-gallery   # 의도된 변경 후 재생성
```

> 스냅샷 재생성 후에는 **320/375px 실렌더를 반드시 육안 확인**한다(jsdom·유닛만으론 위상 편차를 못 잡는다).

## 트레이드오프 (기록)

`/styleguide`는 프로덕션 빌드에도 lazy 청크로 존재한다(Playwright가 `npm run preview` = 프로덕션 빌드를 스냅샷하기 때문). 링크가 없어 K는 도달 못 하지만, 프로덕션에서 URL 직접 입력 시 렌더된다. 완전한 prod 배제가 필요해지면 `import.meta.env` 플래그 게이팅 + Playwright 전용 빌드로 전환한다(현재는 KISS 우선).
