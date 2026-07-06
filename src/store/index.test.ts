import { describe, expect, test } from 'vitest'
import { useAppStore } from './index'

describe('useAppStore', () => {
  test('combines all five slices with independent initial state', () => {
    const state = useAppStore.getState()

    expect(state.tasks).toEqual([])
    expect(state.activeBlock).toBeNull()
    expect(state.elapsedSeconds).toBe(0)
    expect(state.energyCells).toEqual([])
    expect(state.predictions).toEqual([])
    expect(state.sessions).toEqual([])
  })

  test('acting on one slice does not affect the others', async () => {
    await useAppStore.getState().addTask('통합 테스트 과제')

    const state = useAppStore.getState()
    expect(state.tasks).toHaveLength(1)
    expect(state.activeBlock).toBeNull()
    expect(state.energyCells).toEqual([])
    expect(state.predictions).toEqual([])
    expect(state.sessions).toEqual([])
  })
})
