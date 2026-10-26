import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { useAuth } from '../../context/AuthContext'
import { apiRequest, resolveAssetUrl } from '../../lib/api'
import { subscribeWhatsappStatus } from '../../lib/whatsappStatusSocket'
import {
  formatClientPhone,
  formatCollectionDay,
  formatDateTime,
  money,
  sendStatus,
  sendStatusLabel,
} from '../../lib/format'
import { ROUTES } from '../../lib/routes'
import { IconBack } from '../icons/NavIcons'
import { WhatsappDeliveryStatus } from '../whatsapp/WhatsappDeliveryStatus'

function sendScreenshots(send) {
  return (send.payments ?? [])
    .map((payment) => ({
      id: payment.id,
      src: resolveAssetUrl(payment.screenshotUrl),
      alt: `Comprobante de la cuota ${send.installmentNumber}`,
    }))
    .filter((item) => item.src)
}

function ScreenshotThumb({ src, alt, onOpen }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span className="screenshot-empty">No se pudo cargar</span>
  }

  return (
    <button type="button" className="screenshot-thumb" onClick={() => onOpen({ src, alt })}>
      <img src={src} alt={alt} onError={() => setFailed(true)} />
    </button>
  )
}

function ScreenshotList({ send, onOpen }) {
  const screenshots = sendScreenshots(send)

  if (screenshots.length === 0) {
    return <span className="screenshot-empty">Sin comprobante</span>
  }

  return (
    <div className="screenshot-list">
      {screenshots.map((screenshot) => (
        <ScreenshotThumb
          key={screenshot.id}
          src={screenshot.src}
          alt={screenshot.alt}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}

function applyWhatsappStatus(history, update) {
  if (!history?.collections) return history

  let changed = false
  const collections = history.collections.map((collection) => {
    if (collection.id !== update.collectionId) return collection

    const sends = collection.sends.map((send) => {
      if (send.id !== update.collectionSendId) return send
      changed = true
      return {
        ...send,
        whatsappStatus: update.whatsappStatus,
        whatsappStatusAt: update.whatsappStatusAt,
        whatsappError: update.whatsappError,
      }
    })

    return changed ? { ...collection, sends } : collection
  })

  return changed ? { ...history, collections } : history
}

export function ClientHistoryView() {
  const { clientId } = useParams()
  const { currentUser } = useAuth()
  const { clients, setError } = useAppData()
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  const client = clients.find((item) => item.id === clientId)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setError('')
      setLoading(true)
      try {
        const data = await apiRequest(`clients/${clientId}/payment-history`)
        if (!cancelled) {
          setHistoryData(data)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [clientId, setError])

  useEffect(() => {
    if (!currentUser?.id || !clientId) return undefined

    return subscribeWhatsappStatus(currentUser.id, (update) => {
      if (update?.clientId !== clientId) return
      setHistoryData((current) => applyWhatsappStatus(current, update))
    })
  }, [clientId, currentUser?.id])

  useEffect(() => {
    if (!preview) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setPreview(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [preview])

  const historyClient = client || historyData?.client

  return (
    <div className="workspace workspace-stack">
      <section className="panel">
        <div className="panel-head panel-head-with-back">
          <Link to={ROUTES.clients} className="back-link" aria-label="Volver a clientes">
            <IconBack className="back-icon" />
          </Link>
          <div>
            <h2>Historial de pagos</h2>
            <p>
              {historyClient
                ? `${formatClientPhone(historyClient)}${historyClient.nickname ? ` · ${historyClient.nickname}` : ''}`
                : 'Cargando cliente...'}
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="panel">
          <p className="empty-hint">Cargando historial...</p>
        </section>
      ) : !historyData?.collections?.length ? (
        <section className="panel">
          <p className="empty-hint">Este cliente todavía no tiene cobranzas.</p>
        </section>
      ) : (
        historyData.collections.map((collection) => (
          <section key={collection.id} className="panel history-collection">
            <div className="panel-head">
              <h2>{collection.concept}</h2>
              <p>
                {collection.frequency}
                {collection.collectionDay
                  ? collection.collectionDay.trim().toLowerCase() === 'ultimo'
                    ? ' · Último del mes'
                    : ` · Día ${formatCollectionDay(collection.collectionDay)}`
                  : ''}
              </p>
            </div>
            <dl className="data-card-fields data-card-fields-grid history-summary">
              <div>
                <dt>Deuda total</dt>
                <dd>{money.format(collection.totalDebt)}</dd>
              </div>
              <div>
                <dt>Deuda actual</dt>
                <dd className="accent-value">{money.format(collection.currentDebt)}</dd>
              </div>
              <div>
                <dt>Cuotas Pagadas</dt>
                <dd>
                  {collection.currentInstallment - 1} / {collection.installments}
                </dd>
              </div>
              <div>
                <dt>Cobros Enviados</dt>
                <dd>{collection.sends.length}</dd>
              </div>
            </dl>

            {collection.sends.length === 0 ? (
              <p className="empty-hint">Aún no se ha enviado ninguna cuota de esta cobranza.</p>
            ) : (
              <>
                <div className="mobile-list">
                  {collection.sends.map((send) => {
                    const latestPayment = send.payments?.[0]
                    return (
                      <article key={send.id} className="data-card">
                        <div className="data-card-header">
                          <div className="data-card-title">
                            <h3>Cuota {send.installmentNumber}</h3>
                            <p className="data-card-concept send-when">
                              {formatDateTime(send.sentAt)}
                              <WhatsappDeliveryStatus
                                status={send.whatsappStatus}
                                error={send.whatsappError}
                              />
                            </p>
                          </div>
                          <span className={`status-chip status-${sendStatus(send)}`}>
                            {sendStatusLabel(send)}
                          </span>
                        </div>
                        <dl className="data-card-fields data-card-fields-grid">
                          <div>
                            <dt>Monto USD</dt>
                            <dd>{money.format(send.amountUsd)}</dd>
                          </div>
                          <div>
                            <dt>Monto Bs</dt>
                            <dd>{Number(send.amountBs).toFixed(2)}</dd>
                          </div>
                          <div>
                            <dt>Referencia</dt>
                            <dd>{latestPayment?.referenceNumber || '-'}</dd>
                          </div>
                          <div>
                            <dt>Pago</dt>
                            <dd>
                              {latestPayment
                                ? `${money.format(latestPayment.amount)} · ${formatDateTime(latestPayment.createdAt)}`
                                : 'Sin pago registrado'}
                            </dd>
                          </div>
                          <div className="history-proof">
                            <dt>Comprobante</dt>
                            <dd>
                              <ScreenshotList send={send} onOpen={setPreview} />
                            </dd>
                          </div>
                        </dl>
                      </article>
                    )
                  })}
                </div>

                <div className="table-wrap desktop-only">
                  <table>
                    <thead>
                      <tr>
                        <th>Cuota</th>
                        <th>Enviado</th>
                        <th>Monto USD</th>
                        <th>Monto Bs</th>
                        <th>Estado</th>
                        <th>Referencia</th>
                        <th>Pago</th>
                        <th>Comprobante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collection.sends.map((send) => {
                        const latestPayment = send.payments?.[0]
                        return (
                          <tr key={send.id}>
                            <td>{send.installmentNumber}</td>
                            <td>
                              <span className="send-when">
                                {formatDateTime(send.sentAt)}
                                <WhatsappDeliveryStatus
                                  status={send.whatsappStatus}
                                  error={send.whatsappError}
                                />
                              </span>
                            </td>
                            <td>{money.format(send.amountUsd)}</td>
                            <td>{Number(send.amountBs).toFixed(2)}</td>
                            <td>
                              <span className={`status-chip status-${sendStatus(send)}`}>
                                {sendStatusLabel(send)}
                              </span>
                            </td>
                            <td>{latestPayment?.referenceNumber || '-'}</td>
                            <td>
                              {latestPayment
                                ? `${money.format(latestPayment.amount)} · ${formatDateTime(latestPayment.createdAt)}`
                                : 'Sin pago'}
                            </td>
                            <td className="screenshot-cell">
                              <ScreenshotList send={send} onOpen={setPreview} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        ))
      )}

      {preview
        ? createPortal(
            <div
              className="screenshot-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={preview.alt}
              onClick={() => setPreview(null)}
            >
              <button
                type="button"
                className="screenshot-lightbox-close"
                aria-label="Cerrar comprobante"
                onClick={() => setPreview(null)}
              >
                ×
              </button>
              <img src={preview.src} alt={preview.alt} onClick={(event) => event.stopPropagation()} />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
