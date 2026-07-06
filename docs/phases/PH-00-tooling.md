# PH-00 — 프로젝트 스캐폴딩 & 품질 자동화 훅

> **의존:** 없음 (진짜 최초 위상 — PH-01보다 앞선다)
> **SSOT:** [TECH-SPEC.md §0 결론 요약](../TECH-SPEC.md#0-결론-요약) · [TECH-SPEC.md §8 테스트 스택](../TECH-SPEC.md#8-테스트-스택) · `web/hooks.md` · `common/code-review.md`
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙)
> **참고 스킬:** `frontend-patterns`

## Goal

이 위상이 끝나면 **PH-01부터는 코딩 컨벤션이 "지시 없이도" 유지된다** — 파일을 쓰거나 고칠 때마다 포맷·린트·타입체크가 자동 실행되고, 800줄 넘는 파일은 저장 자체가 막히며, 세션 종료 시 빌드가 자동 검증된다.

## In-Scope

- [x] `npm create vite@latest . -- --template react-ts` 기반 프로젝트 초기화 (TECH-SPEC §1, 패키지 매니저는 `npm` — 기존 `.claude/settings.local.json` 허용 목록이 `npm run`/`npx` 전제라 그대로 따름). React 18 고정(TECH-SPEC §1), 스캐폴딩 데모 콘텐츠(카운터·svg 링크)는 제거하고 최소 placeholder로 교체.
- [x] `package.json` scripts: `dev`/`build`/`preview`/`test`/`test:coverage`/`lint`/`typecheck`
- [x] `tsconfig.json` strict 모드 (`strict: true`, `noUncheckedIndexedAccess: true`)
- [x] ESLint 설정(`eslint.config.js`) — React + TypeScript 규칙, `common/coding-style.md` 네이밍/함수길이 규칙에 대응하는 규칙(예: `max-lines-per-function`, `max-lines` 800)
- [x] Prettier 설정(`.prettierrc`) — 팀 컨벤션(세미콜론·따옴표 등) 1회 확정
- [x] Vitest 설정(`vitest.config.ts`) — `fake-indexeddb`, coverage provider(v8), 임계값 80%(`common/testing.md`). vitest 4.x로 vite 6 peer 정합 확보(2.x는 vite 5 고정이라 타입 충돌 발생).
- [x] Playwright 설정(`playwright.config.ts`) — 320/768/1024/1440 프로젝트 정의(`web/testing.md`)
- [x] `.claude/settings.json`(커밋 대상 — 팀 공유 자동화)에 `hooks` 블록 추가, Node 스크립트는 `.claude/hooks/*.cjs`로 분리:
  - [x] PostToolUse(`Write|Edit`) → `format-on-write.cjs` (`prettier --write --ignore-unknown`)
  - [x] PostToolUse(`Write|Edit`) → `lint-on-write.cjs` (`eslint --fix`, ts/tsx만)
  - [x] PostToolUse(`Write|Edit`) → `typecheck-on-write.cjs` (`tsc -b --noEmit`, ts/tsx만; 에러 시 `decision:block`으로 컨텍스트에 피드백)
  - [x] PreToolUse(`Write`) → `guard-file-size.cjs` (800줄 초과 시 `permissionDecision:deny`, 파싱 실패 시 fail-open)
  - [x] Stop → `build-on-stop.cjs` (`npm run build` 실패 시 `decision:block`)
  - [x] 각 바이너리(prettier/eslint/tsc)는 `resolve-bin.cjs`로 `package.json`의 `bin` 필드를 직접 resolve해 `process.execPath`로 spawn — `shell:true`+문자열 보간을 피해 Windows 커맨드 인젝션 벡터 제거(code-reviewer 지적 반영, CRITICAL)
  - [x] `settings.local.json`(개인·gitignore)에는 permissions만 남기고 hooks는 공유 `settings.json`으로 이동(code-reviewer 지적 반영, HIGH)
- [x] 훅 동작 검증: 800줄 초과 더미 payload로 guard-file-size.cjs가 deny를 반환함을 파이프 테스트로 확인(실제 Write 트리거는 프롬프트 처리 중 내용이 638줄로 줄어들어 재현 실패 — deny 로직 자체는 검증 완료)
- [x] 훅 동작 검증: 포맷 깨진 더미 코드를 실제 Write 도구로 생성 → PostToolUse 훅이 라이브로 발동해 prettier가 자동 정렬함을 확인 후 더미 파일 제거
- [x] `README.md`(레포 루트) — 개발 서버 실행법 1줄 + 문서 링크
- [x] `.gitignore` 보강 — `node_modules`, `dist`, `.vercel`, `*.tsbuildinfo`, `coverage`, `.claude/settings.local.json`

## DO NOT CHANGE (국소)

- 없음(최초 위상). 단 이 위상이 확정하는 lint/format 규칙은 이후 전체 위상의 전역 컨벤션으로 승격.

## Positive Non-Goals

- 실제 기능 코드 없음(타입·저장소는 PH-01)
- CI/CD 파이프라인(GitHub Actions 등) 구성 없음 — 로컬 훅만 우선, 필요해지면 별도 위상
- Style Dictionary 토큰 빌드 스크립트 없음(PH-04에서 다룸, TECH-SPEC §12 미결 사항 그대로 유예)

## 수용 기준 (기계 검증만)

- [x] `npm run build` exit 0
- [x] `npm run lint` exit 0
- [x] `npm run typecheck` exit 0
- [x] 800줄 초과 dummy payload에 대해 guard-file-size.cjs가 deny를 반환함(파이프 테스트로 확인)
- [x] `.claude/settings.json`, `.claude/settings.local.json` 둘 다 유효한 JSON

## Runnable-State 커맨드

```
npm run build && npm run lint && npm run typecheck
```

## Changelog

- **v0.1** — 최초 작성. "코드 품질 지시 없이 유지" 요구를 반영해 PH-01 이전 위상으로 신설.
- **v0.2** — 구현 완료 + code-reviewer 리뷰 반영: (CRITICAL) 훅 스크립트의 `shell:true` 커맨드 인젝션 벡터 제거, (HIGH) hooks 등록을 gitignore되는 `settings.local.json`에서 커밋되는 `settings.json`으로 이전, (MEDIUM) 훅 스크립트의 `JSON.parse` 예외 안전 처리(fail-open), (LOW) `tsconfig.node.json`에 `e2e/` 포함.
