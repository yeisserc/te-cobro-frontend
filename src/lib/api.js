import { API_URL } from './constants'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' ? data : null) ||
      'No se pudo completar la solicitud.'
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }

  return data
}
