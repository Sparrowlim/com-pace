const KEY = 'compace:focusGestureHintShown'

export function isFocusGestureHintShown(): boolean {
  return localStorage.getItem(KEY) === 'true'
}

export function markFocusGestureHintShown(): void {
  localStorage.setItem(KEY, 'true')
}
