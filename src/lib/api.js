import { API_URL } from './constants'

const ENGLISH_ERROR_MAP = {
  'Validation failed (uuid is expected)': 'El identificador no es válido.',
  'Validation failed (uuid v4 is expected)': 'El identificador no es válido.',
  'Bad Request Exception': 'Solicitud incorrecta.',
  'Unauthorized': 'No autorizado.',
  'Forbidden': 'Acceso denegado.',
  'Not Found': 'No encontrado.',
  'Internal Server Error': 'Error interno del servidor.',
}

function translateErrorMessage(message) {
  if (!message) return 'No se pudo completar la solicitud.'

  if (Array.isArray(message)) {
    return message.map(translateErrorMessage).join(', ')
  }

  const text = String(message).trim()
  if (!text) return 'No se pudo completar la solicitud.'

  if (ENGLISH_ERROR_MAP[text]) {
    return ENGLISH_ERROR_MAP[text]
  }

  // Mensajes típicos de Meta / Graph API al enviar WhatsApp
  if (/^(Unsupported post request|Invalid OAuth|Error validating access token|(#\d+))/i.test(text)) {
    return 'No se pudo enviar el mensaje de WhatsApp. Inténtalo de nuevo.'
  }

  if (/uuid is expected/i.test(text)) {
    return 'El identificador no es válido.'
  }

  return text
}

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
    const rawMessage =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' ? data : null) ||
      'No se pudo completar la solicitud.'
    throw new Error(translateErrorMessage(rawMessage))
  }

  return data
}
