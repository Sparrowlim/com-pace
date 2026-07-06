# PH-00 — 프로젝트 스캐폴딩 & 품질 자동화 훅

> **의존:** 없음 (진짜 최초 위상 — PH-01보다 앞선다)
> **SSOT:** [TECH-SPEC.md §0 결론 요약](../TECH-SPEC.md#0-결론-요약) · [TECH-SPEC.md §8 테스트 스택](../TECH-SPEC.md#8-테스트-스택) · `web/hooks.md` · `common/code-review.md`
> **전역 규칙:** [phases/README.md §0](README.md#0-전역-규칙)
> **참고 스킬:** `frontend-patterns`

## Goal

이 위상이 끝나면 **PH-01부터는 코딩 컨벤션이 "지시 없이도" 유지된다** — 파일을 쓰거나 고칠 때마다 포맷·린트·타입체크가 자동 실행되고, 800줄 넘는 파일은 저장 자체가 막히며, 세션 종료 시 빌드가 자동 검증된다.

## In-Scope

- [ ] `npm create vite@latest . -- --template react-ts` 기반 프로젝트 초기화 (TECH-SPEC §1, 패키지 매니저는 `npm` — 기존 `.claude/settings.local.json` 허용 목록이 `npm run`/`npx` 전제라 그대로 따름)
- [ ] `package.json` scripts: `dev`/`build`/`preview`/`test`/`test:coverage`/`lint`/`typecheck`
- [ ] `tsconfig.json` strict 모드 (`strict: true`, `noUncheckedIndexedAccess: true`)
- [ ] ESLint 설정(`eslint.config.js`) — React + TypeScript 규칙, `common/coding-style.md` 네이밍/함수길이 규칙에 대응하는 규칙(예: `max-lines-per-function`, `max-lines` 800)
- [ ] Prettier 설정(`.prettierrc`) — 팀 컨벤션(세미콜론·따옴표 등) 1회 확정
- [ ] Vitest 설정(`vitest.config.ts`) — `fake-indexeddb`, coverage provider(v8), 임계값 80%(`common/testing.md`)
- [ ] Playwright 설정(`playwright.config.ts`) — 320/768/1024/1440 프로젝트 정의(`web/testing.md`)
- [ ] `.claude/settings.local.json`에 `hooks` 블록 추가:
  - [ ] PostToolUse(`Write|Edit`) → `npx prettier --write "$FILE_PATH"`
  - [ ] PostToolUse(`Write|Edit`) → `npx eslint --fix "$FILE_PATH"`
  - [ ] PostToolUse(`Write|Edit`) → `npx tsc --noEmit --pretty false --incremental --tsBuildInfoFile node_modules/.cache/tsc-hook.tsbuildinfo` (Windows이므로 `timeout` 대신 Node 기반 타임아웃 래퍼 또는 생략 — `web/hooks.md` 주석대로 GNU coreutils 없는 환경 처리)
  - [ ] PreToolUse(`Write`) → 800줄 초과 시 차단 스크립트(`web/hooks.md` 예시 그대로, Node 인라인 스크립트)
  - [ ] Stop → `npm run build` (최종 빌드 검증)
- [ ] 훅 동작 검증: 일부러 800줄 초과 더미 파일 write 시도 → 차단되는지 확인 후 더미 파일 제거
- [ ] 훅 동작 검증: 포맷 깨진 더미 코드 write → 자동 정렬되는지 확인 후 제거
- [ ] `README.md`(레포 루트, 없으면 최소 생성) — 개발 서버 실행법 1줄
- [ ] `.gitignore` 보강 — `node_modules`, `dist`, `.vercel`, `*.tsbuildinfo`, `coverage`

## DO NOT CHANGE (국소)

- 없음(최초 위상). 단 이 위상이 확정하는 lint/format 규칙은 이후 전체 위상의 전역 컨벤션으로 승격.

## Positive Non-Goals

- 실제 기능 코드 없음(타입·저장소는 PH-01)
- CI/CD 파이프라인(GitHub Actions 등) 구성 없음 — 로컬 훅만 우선, 필요해지면 별도 위상
- Style Dictionary 토큰 빌드 스크립트 없음(PH-04에서 다룸, TECH-SPEC §12 미결 사항 그대로 유예)

## 수용 기준 (기계 검증만)

- [ ] `npm run build` exit 0
- [ ] `npm run lint` exit 0
- [ ] `npm run typecheck` exit 0
- [ ] 800줄 초과 더미 파일 write 시도가 실제로 차단됨(수동 1회 검증 로그로 확인)
- [ ] `.claude/settings.local.json`이 유효한 JSON (`node -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8'))"`)

## Runnable-State 커맨드

```
npm run build && npm run lint && npm run typecheck
```

## Changelog

- **v0.1** — 최초 작성. "코드 품질 지시 없이 유지" 요구를 반영해 PH-01 이전 위상으로 신설.
