import { io } from 'socket.io-client'
import { API_URL } from './constants'

function apiOrigin() {
  if (!API_URL) return ''
  try {
    return new URL(API_URL).origin
  } catch {
    return String(API_URL).replace(/\/$/, '')
  }
}

export function subscribeWhatsappStatus(userId, onStatus) {
  const origin = apiOrigin()
  if (!origin || !userId) {
    return () => {}
  }

  const socket = io(origin, {
    auth: { userId },
    transports: ['websocket', 'polling'],
  })

  socket.on('whatsapp-status', onStatus)

  return () => {
    socket.off('whatsapp-status', onStatus)
    socket.disconnect()
  }
}
