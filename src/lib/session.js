import { SESSION_KEY } from './constants'

export function loadStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function persistUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  localStorage.removeItem(SESSION_KEY)
}
