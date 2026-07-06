export function nowIso(): string {
  return new Date().toISOString()
}

export function todayDateString(): string {
  return nowIso().slice(0, 10)
}
