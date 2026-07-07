const KEY = 'compace:activeBlockId'

/**
 * 세션 복구(PH-06)용 최소 포인터 — Storage 인터페이스(findByDate/findById만) 확장 없이
 * "재기동 시 어떤 블록을 findById로 찾아야 하나"만 기억한다. IndexedDB 엔티티가 아니다.
 */
export const activeSessionPointer = {
  set(blockId: string): void {
    localStorage.setItem(KEY, blockId)
  },
  clear(): void {
    localStorage.removeItem(KEY)
  },
  get(): string | null {
    return localStorage.getItem(KEY)
  },
}
