const LABELS = {
  sent: 'Enviado',
  delivered: 'Recibido',
  read: 'Leído',
  failed: 'No enviado',
}

function SingleCheck() {
  return (
    <svg viewBox="0 0 16 15" width="16" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512z"
      />
    </svg>
  )
}

function DoubleCheck() {
  return (
    <svg viewBox="0 0 16 15" width="18" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
      />
    </svg>
  )
}

function FailedMark() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1.2a6.8 6.8 0 1 0 0 13.6A6.8 6.8 0 0 0 8 1.2zm.75 3.3v4.4a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 1.5 0zM8 11.9a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7z"
      />
    </svg>
  )
}

export function WhatsappDeliveryStatus({ status, error }) {
  const normalized =
    status === 'delivered' || status === 'read' || status === 'failed' ? status : 'sent'
  const label =
    normalized === 'failed' && error ? `${LABELS.failed}: ${error}` : LABELS[normalized]

  return (
    <span className={`wa-ticks wa-ticks-${normalized}`} title={label} aria-label={label}>
      {normalized === 'failed' ? <FailedMark /> : normalized === 'sent' ? <SingleCheck /> : <DoubleCheck />}
    </span>
  )
}
