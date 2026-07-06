# 컴페이스 — 기술 스펙 (TECH-SPEC)

> **역할:** 플랫폼 결정(D-26)의 후속 — 프레임워크·상태관리·저장소·데이터 모델·배포 등 **구현 스택 명세(HOW-it-runs)**.
> **정본 경계:** 배포 모델·이유(WHY) = `DECISIONS.md D-26` · 확정 스코프 = `SPEC.md` · 디자인 토큰 값 = `DESIGN-TOKENS.md`.
> **위계:** 본 문서는 D-26의 제약(계정·백엔드·푸시 없음, 얇은 저장 모듈, YAGNI)을 못 깬다.

---

## 0. 결론 요약

| 레이어 | 선택 |
|---|---|
| 프레임워크 | React + Vite + TypeScript |
| PWA | vite-plugin-pwa (Workbox) |
| 상태관리 | Zustand (서버 상태 없음 — TanStack Query 등 불필요) |
| 저장소 | IndexedDB + `idb`, 단일 저장소 모듈(Repository 패턴) |
| 암호화 | MVP 미적용 (post-MVP 재검토, §10) |
| 라우팅 | React Router |
| 스타일링 | CSS Modules + Style Dictionary 산출 CSS 변수 |
| 테스트 | Vitest + React Testing Library + Playwright |
| 배포 | Vercel (정적 빌드, 서버리스 함수 불필요) |

---

## 1. 프레임워크 & 빌드

- **Vite + React 18 + TypeScript.** SSR 불필요(백엔드 없음, D-26) — 순수 클라이언트 SPA.
- 코드 스플리팅: 화면(feature) 단위 lazy import. 집중 타이머 화면은 최소 번들로 우선 로드(배터리 5% K 대응, `web/performance.md` 번들 예산 준수).
- 린트/포맷: ESLint + Prettier, `web/hooks.md` PostToolUse 훅 그대로 적용.

## 2. 상태관리

- **Zustand** 단일 스토어, feature별 slice로 분리(`taskSlice`, `timerSlice`, `energySlice` 등).
- 서버 상태 개념 없음 — 로컬 상태와 저장소(§3) 사이만 동기화.
- 타이머는 초당 리렌더가 필요하므로 별도 slice로 분리해 다른 화면 리렌더 오염 방지.

## 3. 저장소 (D-26 "얇은 저장 모듈" 구현)

- **IndexedDB + `idb`**(Promise 래퍼). 어댑터 프레임워크 없음 — 아래 인터페이스 하나만 앱 전역이 참조.

```ts
interface Storage {
  create<T>(store: StoreName, entity: T): Promise<T>
  update<T>(store: StoreName, id: string, patch: Partial<T>): Promise<T>
  findByDate<T>(store: StoreName, date: string): Promise<T[]>
  findById<T>(store: StoreName, id: string): Promise<T | null>
}
```

- 앱 시작 시 `navigator.storage.persist()` 호출(Android 영속화, D-26 K=Android 정합).
- **암호화 없음(§10 참조)** — 저장소 모듈이 이 결정을 캡슐화하고 있어, 나중에 필요해지면 이 파일 하나만 바꾸면 됨(그래서 "얇은 경계"가 중요).

## 4. 데이터 모델 (5종 — SPEC §0 데이터 4층 + 세션 로그)

```
Task        { id, title, createdAt, splitDone }
Block       { id, taskId, verbLabel, status, startedAt, endedAt }
Prediction  { blockId, guess, actual }
EnergyCell  { id, date, blockId, litAt }   // evidence.fill 단일성(DESIGN-TOKENS §5-1)과 정합 — 상태 필드로 색 분기하지 않는다
Session     { id, date, startedTimerAt, dischargeMode }  // 내부 지표(SPEC §10), 로깅만 — 사용자 비노출
```

## 5. 라우팅

- **React Router.** 라우트 얕음(온보딩 → 대시보드 → 쪼개기 → 예측 → 집중 → 회고, 방전 분기).
- 방전 모드 상시 링크 = 인앱 라우트(딥링크), D-26 "→ ROUTES" 항목 여기서 소화.

## 6. 디자인 토큰 파이프라인

- 소스: `DESIGN-TOKENS.md §9` DTCG JSON → `design-tokens.json` 분리.
- Style Dictionary → CSS custom properties (`:root{--surface-base:…}`), `mode-focus`/`mode-discharge`는 `[data-mode=focus]` 스코프 셀렉터로 오버레이.
- `action`/`evidence.fill`는 모드 셀렉터에서 절대 재정의하지 않음(가드레일 §5-1/5-3 그대로 CSS 레벨 강제).

## 7. 스타일링

- CSS Modules + 위 CSS 변수 참조. Tailwind 미채택(토큰이 이미 semantic 레이어로 설계돼 유틸리티 이점이 적음).
- 애니메이션은 `transform`/`opacity`만(`web/performance.md`), `prefers-reduced-motion` 시 `duration.cell` 트랜지션을 즉시 상태변화로 대체(DESIGN-TOKENS §2-8 그대로).

## 8. 테스트 스택

- **Vitest + React Testing Library** — 유닛/통합 (저장소 모듈, 타이머 훅, 훅 단위 우선).
- **Playwright** — E2E + 시각 회귀(320/768/1024/1440), 우선순위는 `web/testing.md` 순서(시각 회귀 → 접근성 → 성능 → 크로스브라우저) 그대로.
- 커버리지 80% 목표(`common/testing.md`).

## 9. 배포 (Vercel)

- 정적 빌드(`vite build`) 산출물 배포, 서버리스 함수 없음(백엔드 없음, D-26).
- Vercel은 HTTPS 자동 제공 — PWA 설치 요건(HTTPS 필수) 별도 설정 없이 충족.
- `vercel.json`은 서비스워커/manifest 캐시 헤더 조정 정도만 필요(과설정 지양).

## 10. 암호화 — MVP 보류 (결정 및 리스크)

- **결정:** MVP는 저장 시 암호화하지 않는다. IndexedDB 평문 저장.
- **근거:** 로컬 전용·서버 전송 없음(D-26) → 외부 유출 경로 없음. WebCrypto 암복호화 계층은 지금 구현 복잡도 대비 이득이 낮음(YAGNI).
- **남는 리스크:** 기기 분실·공유 기기 사용 시 평문 노출 가능. 부록A "의료 준하는 암호화" 권고와 정면 배치 — 웰니스 포지션(치료 클레임 없음, D-01)이라 임상 데이터 수준 규제 의무는 아니지만, 완전히 무시하는 결정은 아님.
- **재검토 시점:** 계정/동기화 기능 도입 시, 또는 post-MVP "증거 앨범" export 설계 시 필수 재논의.
- **→ SPEC 반영 제안:** 리스크 레지스터에 R5로 등재 권장(사용자 승인 필요).

## 11. iOS 확장 경로 (유예, D-26 그대로)

- 진입 시 **Capacitor 래핑**만. 전면 재작성 금지.
- 웹 표준 API(Vibration, Wake Lock, IndexedDB) 우선 사용, 네이티브 전용 플러그인 의존 최소화 — 지금 스택 선택 자체가 이 유예를 이미 지키고 있음.

## 12. 미결 사항

- [ ] `SPEC.md` 리스크 레지스터에 R5(암호화 보류) 등재 여부
- [ ] Style Dictionary 빌드 스크립트 도입 시점(컴포넌트 토큰 단계, DESIGN-TOKENS §10-5)
- [ ] `idb` 스키마 마이그레이션 전략(버전업 시)

---

## Changelog

- **v0.1** — 최초 산출. React+Vite+TS·Zustand·IndexedDB(`idb`)·Vercel 확정. 암호화 MVP 보류 결정 및 리스크 명시.
