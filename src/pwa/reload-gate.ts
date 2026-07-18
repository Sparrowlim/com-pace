import type { Block } from '../types/block'

// 활성/일시정지 블록이 있으면 리로드하지 않는다 — 15분 세션 중 조용한 새로고침은
// §2 "One Task"·§4 마찰 최소화 원칙을 정면으로 어긴다. 이 시점에 이미 새 SW가
// activate+clientsClaim까지 끝난 상태라 다음 안전한 새로고침/재오픈부터는 자동 반영된다.
export function shouldReloadForUpdate(activeBlock: Block | null): boolean {
  return activeBlock === null
}
