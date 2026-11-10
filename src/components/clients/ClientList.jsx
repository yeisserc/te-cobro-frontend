import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { formatClientPhone, money } from '../../lib/format'
import { ROUTES } from '../../lib/routes'
import { IconClients, IconCollections } from '../icons/NavIcons'
import { ConfirmDialog } from '../ui/ConfirmDialog'

const AVATAR_COLORS = ['#ddd6fe', '#bfdbfe', '#bbf7d0', '#fde68a', '#fecdd3', '#bae6fd']

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function avatarColor(name) {
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

function isActiveCollection(collection) {
  return (
    Number(collection.currentDebt) > 0 &&
    Number(collection.currentInstallment) <= Number(collection.installments)
  )
}

function clientName(client) {
  return `${client.firstName} ${client.lastName ?? ''}`.trim()
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.2 5.5h2.1l1.1 2.6-1.3 1.1a11 11 0 0 0 4.7 4.7l1.1-1.3 2.6 1.1v2.1c0 .7-.5 1.3-1.2 1.4A13.2 13.2 0 0 1 6.8 6.7c.1-.7.7-1.2 1.4-1.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 9.2v5.6M10.2 10.4c.3-.6.8-.9 1.8-.9 1.2 0 1.9.5 1.9 1.3s-.7 1.2-1.9 1.4-1.9.5-1.9 1.4.8 1.3 2 .3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function ClientList({ showCreateButton = false }) {
  const navigate = useNavigate()
  const { clients, collections, totalCurrentDebt, setError, reloadData } = useAppData()
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [query, setQuery] = useState('')
  const deletingRef = useRef(false)

  const summaries = useMemo(() => {
    return clients.map((client) => {
      const own = collections.filter((collection) => collection.clientId === client.id)
      const activeCount = own.filter(isActiveCollection).length
      const pendingAmount = own.reduce((sum, collection) => sum + Number(collection.currentDebt || 0), 0)
      return {
        client,
        activeCount,
        pendingAmount,
        pendingPayments: Number(client.pendingPayments || 0),
      }
    })
  }, [clients, collections])

  const activeCollections = collections.filter(isActiveCollection).length
  const normalizedQuery = query.trim().toLowerCase()
  const visible = summaries.filter(({ client }) => {
    if (!normalizedQuery) return true
    const haystack = `${clientName(client)} ${client.nickname || ''} ${formatClientPhone(client)}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  async function handleDeleteClient() {
    const clientId = pendingDelete?.id
    if (!clientId || deletingRef.current) return
    deletingRef.current = true
    setDeletingId(clientId)
    setError('')
    try {
      await apiRequest(`clients/${clientId}`, { method: 'DELETE' })
      await reloadData()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      deletingRef.current = false
      setDeletingId(null)
      setPendingDelete(null)
    }
  }

  return (
    <div className="client-directory">
      {showCreateButton ? (
        <section className="client-stats">
          <article className="home-card client-stat">
            <span className="client-stat-icon" aria-hidden="true">
              <IconClients />
            </span>
            <span>
              <small>Clientes</small>
              <strong>{clients.length}</strong>
            </span>
          </article>
          <article className="home-card client-stat">
            <span className="client-stat-icon" aria-hidden="true">
              <IconCollections />
            </span>
            <span>
              <small>Cobranzas activas</small>
              <strong>{activeCollections}</strong>
            </span>
          </article>
          <article className="home-card client-stat">
            <span className="client-stat-icon" aria-hidden="true">
              <IconMoney />
            </span>
            <span>
              <small>Pendiente total</small>
              <strong>{money.format(totalCurrentDebt)}</strong>
            </span>
          </article>
        </section>
      ) : null}

      <section className="home-card client-list-card">
        <div className="client-list-head">
          <div>
            <h3>Listado</h3>
            <p>
              {clients.length === 0
                ? 'Todavía no hay clientes cargados.'
                : `${clients.length} cliente${clients.length === 1 ? '' : 's'} registrado${clients.length === 1 ? '' : 's'}.`}
            </p>
          </div>
          {showCreateButton ? (
            <Link to={ROUTES.clientsNew} className="home-btn primary client-create">
              + Crear cliente
            </Link>
          ) : null}
        </div>

        <label className="client-search">
          <span className="sr-only">Buscar cliente</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            placeholder="Buscar cliente..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {visible.length === 0 ? (
          <p className="home-muted client-empty">
            {clients.length === 0 ? 'Agrega el primer cliente para empezar a cobrar.' : 'Ningún cliente coincide con la búsqueda.'}
          </p>
        ) : (
          <ul className="client-rows">
            {visible.map(({ client, activeCount, pendingAmount, pendingPayments }) => {
              const name = clientName(client)
              const upToDate = pendingPayments === 0
              return (
                <li key={client.id}>
                  <article className="client-row">
                    <button
                      type="button"
                      className="client-row-main"
                      onClick={() => navigate(ROUTES.clientHistory(client.id))}
                    >
                      <span className="home-avatar" style={{ background: avatarColor(name) }}>
                        {initials(name)}
                      </span>
                      <span className="home-row-copy">
                        <strong>{name}</strong>
                        <small>
                          <IconPhone />
                          {formatClientPhone(client)}
                        </small>
                      </span>
                      <em className={upToDate ? 'ok' : 'due'}>
                        {upToDate ? '✓ Al día' : `◷ ${pendingPayments} pago${pendingPayments === 1 ? '' : 's'} pendiente${pendingPayments === 1 ? '' : 's'}`}
                      </em>
                      <span className="home-chevron" aria-hidden="true">›</span>
                    </button>
                    <div className="client-row-meta">
                      <span>
                        <IconCollections />
                        {activeCount} cobranza{activeCount === 1 ? '' : 's'} activa{activeCount === 1 ? '' : 's'}
                      </span>
                      <span>
                        <IconMoney />
                        Pendiente: {money.format(pendingAmount)}
                      </span>
                    </div>
                    <div className="client-row-actions">
                      <button type="button" className="home-btn secondary" onClick={() => navigate(ROUTES.clientEdit(client.id))}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="home-btn client-delete"
                        disabled={Boolean(deletingId)}
                        onClick={() => setPendingDelete(client)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar cliente"
        message={
          pendingDelete
            ? `Se eliminará a ${clientName(pendingDelete)}. Esta acción no se puede deshacer.`
            : ''
        }
        loading={Boolean(deletingId)}
        onConfirm={handleDeleteClient}
        onCancel={() => {
          if (!deletingRef.current) setPendingDelete(null)
        }}
      />
    </div>
  )
}
