// SPEC §2/§3 "행동 동사 칩" — 고정 목록, AI 자동 분할 없음(CLAUDE §2 불변 규칙).
// 동사는 과제를 정확히 서술하기 위함이 아니라(그건 자유 입력 조각이 담당),
// "지금 손을 움직일 수 있는 조작 유형"만 범주화한다(OT task analysis / OST 근거, DECISIONS.md D-08).
// 각 그룹의 마지막 '범용'은 어떤 조각에도 항상 들어맞는 캐치올 — 매칭 실패로 인한 막힘을 구조적으로 없앤다.
export const VERB_CHIP_GROUPS = [
  { category: '인지/확인', verbs: ['확인하기', '읽기'] },
  { category: '탐색/접근', verbs: ['찾기', '열기'] },
  { category: '생성/기록', verbs: ['쓰기'] },
  { category: '소통', verbs: ['보내기', '말하기'] },
  { category: '마무리', verbs: ['정리하기'] },
  { category: '범용', verbs: ['시작하기'] },
] as const

export const VERB_CHIPS = VERB_CHIP_GROUPS.flatMap((group) => group.verbs)
