import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AsyncButton } from './AsyncButton'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    if (!open) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape' && !loading) onCancelRef.current()
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, loading])

  if (!open) return null

  return createPortal(
    <div
      className="confirm-modal"
      role="presentation"
      onClick={() => {
        if (!loading) onCancelRef.current()
      }}
    >
      <div
        className="confirm-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-modal-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn-ghost"
            onClick={() => onCancelRef.current()}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <AsyncButton type="button" className="btn-danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </AsyncButton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
