const KEY = 'compace:notificationOptIn'

export function isNotificationOptIn(): boolean {
  return localStorage.getItem(KEY) === 'true'
}

export function setNotificationOptIn(value: boolean): void {
  localStorage.setItem(KEY, String(value))
}
