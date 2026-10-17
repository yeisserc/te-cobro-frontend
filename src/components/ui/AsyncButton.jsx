export function AsyncButton({
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      type={type}
      className={['async-btn', className].filter(Boolean).join(' ')}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : null}
      <span className="async-btn-label">{children}</span>
    </button>
  )
}
