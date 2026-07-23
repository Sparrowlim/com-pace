---
name: repo-structure
description: 컴페이스 src/docs 코드 구조 지도. 새 모듈 작업 시작 전, 파일 위치를 모를 때, 또는 넓은 Glob으로 트리를 재탐색하려는 순간에 먼저 읽는다.
---

# 컴페이스 코드 구조 지도

전체 파일 목록은 **손으로 유지하지 않는다** — `.Codex/hooks/update-repo-map.cjs`가 `src/`·`docs/` 아래 Write 시마다 `GENERATED.md`를 재생성한다. 이 파일은 목적/컨벤션만 담당하고 재기술하지 않는다(DRY).

## src/ 디렉터리별 목적

| 디렉터리             | 목적                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `types/`             | 도메인 타입 정의(Task/Block/Prediction/Session/EnergyCell/NorthStar)                        |
| `storage/`           | IndexedDB 얇은 저장 모듈(`TECH-SPEC.md §3` 시그니처가 정본)                                 |
| `lib/`               | 순수 함수·셀렉터(id/time/contrast/verb-chips/core-loop-selectors 등), 슬라이스에 종속 안 됨 |
| `store/slices/`      | Zustand 슬라이스(1슬라이스 1도메인)                                                         |
| `store/index.ts`     | 슬라이스 조합 진입점                                                                        |
| `components/<Name>/` | 프레젠테이셔널 컴포넌트, 4파일 co-location(아래 참조)                                       |
| `pages/`             | 라우트 화면(컨테이너), 대응 `.module.css` + `.test.tsx` 동반                                |
| `hooks/`             | 커스텀 훅(`useFocusTimer`·`useLongPress`·`useSessionRecovery`)                              |
| `app/`               | 라우팅·앱 셸(`AppShell`·`router`)                                                           |
| `routes/`            | 라우트 경로 상수                                                                            |
| `styles/`            | Style Dictionary 생성 토큰(`tokens.generated.css`, 직접 편집 금지)                          |
| `test/`              | 전역 테스트 셋업(`setup.ts`·`axe.ts`)                                                       |

## 컴포넌트 co-location 컨벤션

`components/<Name>/`는 항상 4파일 세트:

```
<Name>.tsx          — 컴포넌트 본체
<Name>.module.css   — 스코프 스타일
<Name>.test.tsx     — 단위 테스트
index.ts            — re-export
```

`pages/`도 동일 패턴(단 `index.ts` 없이 라우터가 직접 import).

## docs/ 구조 — 정본은 `docs/README.md`

문서별 역할·위계·정본 소유표는 `docs/README.md`에 이미 정의되어 있다 — 여기서 재기술하지 않는다. 위상별 구현 순서는 `docs/phases/README.md`.

## 전체 파일 목록

→ `.Codex/skills/repo-structure/GENERATED.md` (자동 생성, Write 훅이 항상 최신 유지)
