import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import {
  formatClientPhone,
  formatDateTime,
  money,
  sendStatus,
  sendStatusLabel,
} from '../../lib/format'
import { ROUTES } from '../../lib/routes'
import { IconBack } from '../icons/NavIcons'

export function ClientHistoryView() {
  const { clientId } = useParams()
  const { clients, setError } = useAppData()
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const historyClient = client || historyData?.client

  return (
    <div className="workspace">
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
                {collection.collectionDay ? ` · Día ${collection.collectionDay}` : ''}
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
                <dt>Cuotas</dt>
                <dd>
                  {collection.currentInstallment} / {collection.installments}
                </dd>
              </div>
              <div>
                <dt>Envíos</dt>
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
                            <p className="data-card-concept">{formatDateTime(send.sentAt)}</p>
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
                      </tr>
                    </thead>
                    <tbody>
                      {collection.sends.map((send) => {
                        const latestPayment = send.payments?.[0]
                        return (
                          <tr key={send.id}>
                            <td>{send.installmentNumber}</td>
                            <td>{formatDateTime(send.sentAt)}</td>
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
    </div>
  )
}
