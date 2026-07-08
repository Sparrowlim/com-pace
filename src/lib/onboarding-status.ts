const KEY = 'compace:onboardingComplete'

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(KEY) === 'true'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(KEY, 'true')
}
