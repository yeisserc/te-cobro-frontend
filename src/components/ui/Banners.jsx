export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <p className="error-banner" role="alert">
      {message}
    </p>
  )
}

export function SuccessBanner({ message }) {
  if (!message) return null
  return (
    <p className="success-banner" role="status">
      {message}
    </p>
  )
}
