import type { NorthStar } from '../types/north-star'

const ASPIRATION_KEY = 'compace:northStar:aspiration'
const OBLIGATION_KEY = 'compace:northStar:obligation'

export function getNorthStar(): NorthStar {
  return {
    aspiration: localStorage.getItem(ASPIRATION_KEY) ?? '',
    obligation: localStorage.getItem(OBLIGATION_KEY) ?? '',
  }
}

export function saveNorthStar(next: NorthStar): void {
  localStorage.setItem(ASPIRATION_KEY, next.aspiration)
  localStorage.setItem(OBLIGATION_KEY, next.obligation)
}
