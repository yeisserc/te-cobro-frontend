function StatusIcon({ status }) {
  if (status === 'verified') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M6.2 10.2 8.7 12.6 13.8 7.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (status === 'pending') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 6.2V10l2.4 1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (status === 'rejected') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M7.4 7.4 12.6 12.6M12.6 7.4 7.4 12.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M3.2 9.6 16.4 3.8a.6.6 0 0 1 .8.7l-2.2 11.2a.6.6 0 0 1-.9.4L10 13.4l-2.4 2.1a.6.6 0 0 1-1-.4l.3-3.1L3.1 10.6a.6.6 0 0 1 .1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const LABELS = {
  verified: 'Pago verificado',
  pending: 'Pago recibido',
  rejected: 'Pago rechazado',
  sent: 'Cobro enviado',
}

export function PaymentStatus({ status }) {
  const normalized =
    status === 'verified' || status === 'pending' || status === 'rejected' ? status : 'sent'

  return (
    <span className={`pay-status pay-status-${normalized}`}>
      <StatusIcon status={normalized} />
      <span className="pay-status-copy">
        <span className="pay-status-label">{LABELS[normalized]}</span>
        {normalized === 'pending' ? (
          <span className="pay-status-hint">Pendiente de verificación</span>
        ) : null}
      </span>
    </span>
  )
}
