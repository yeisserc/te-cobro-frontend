export const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
})

/** Muestra el código local con 0 (412 → 0412) para el UI. */
export function formatPhoneCode(code) {
  if (!code) return ''
  return code.startsWith('0') ? code : `0${code}`
}

export function formatClientPhone(client) {
  if (!client?.phoneCode || !client?.phoneNumber) return '-'
  return `${formatPhoneCode(client.phoneCode)} ${client.phoneNumber}`
}

/** Parsea fechas ISO de la API (UTC) para mostrarlas en hora local del navegador. */
export function parseApiDate(value) {
  if (!value) return null
  if (value instanceof Date) return value

  const str = String(value).trim()
  if (!str) return null

  const isoWithoutTz = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/
  const hasTz = /(?:Z|[+-]\d{2}:\d{2})$/i.test(str)
  if (isoWithoutTz.test(str) && !hasTz) {
    return new Date(str.replace(' ', 'T') + (str.includes('T') ? 'Z' : ''))
  }

  return new Date(str)
}

export function formatDateTime(value) {
  const date = parseApiDate(value)
  if (!date || Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function paymentStatusLabel(status) {
  if (status === 'verified') return 'Verificado'
  if (status === 'rejected') return 'Rechazado'
  if (status === 'pending') return 'Pendiente'
  return status || 'Sin pago'
}

export function sendStatus(send) {
  const latest = send.payments?.[0]
  return latest?.status || 'sent'
}

export function sendStatusLabel(send) {
  const latest = send.payments?.[0]
  return latest ? paymentStatusLabel(latest.status) : 'Enviado'
}
