import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { formatCollectionDay, money, skippedInstallmentList } from '../../lib/format'
import { ROUTES } from '../../lib/routes'
import { IconCollections } from '../icons/NavIcons'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { CollectionSendActions } from './CollectionSendActions'

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

function paidInstallments(collection) {
  return Math.max(Number(collection.currentInstallment) - 1, 0)
}

function IconMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 9.2v5.6M10.2 10.4c.3-.6.8-.9 1.8-.9 1.2 0 1.9.5 1.9 1.3s-.7 1.2-1.9 1.4-1.9.5-1.9 1.4.8 1.3 2 .3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 4.5v3M16 4.5v3M4 10h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconBars() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 16.5v-4M12 16.5V8M18 16.5v-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function CollectionList({ showCreateButton = false }) {
  const navigate = useNavigate()
  const { collections, clientNameById, totalCurrentDebt, setError, reloadData } = useAppData()
  const [deletingId, setDeletingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [query, setQuery] = useState('')
  const deletingRef = useRef(false)

  const activeCollections = useMemo(() => collections.filter(isActiveCollection), [collections])
  const normalizedQuery = query.trim().toLowerCase()
  const visible = collections.filter((collection) => {
    if (!normalizedQuery) return true
    const name = clientNameById[collection.clientId] || ''
    const haystack = `${name} ${collection.concept || ''} ${collection.frequency || ''}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  async function handleDeleteCollection() {
    const collectionId = pendingDelete?.id
    if (!collectionId || deletingRef.current) return
    deletingRef.current = true
    setDeletingId(collectionId)
    setError('')
    try {
      await apiRequest(`collections/${collectionId}`, { method: 'DELETE' })
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
        <section className="client-stats client-stats-pair">
          <article className="home-card client-stat">
            <span className="client-stat-icon blue" aria-hidden="true">
              <IconCollections />
            </span>
            <span>
              <small>Cobranzas</small>
              <strong>{activeCollections.length}</strong>
            </span>
          </article>
          <article className="home-card client-stat">
            <span className="client-stat-icon" aria-hidden="true">
              <IconMoney />
            </span>
            <span>
              <small>Deuda activa</small>
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
              {activeCollections.length === 0
                ? 'Todavía no hay cobranzas activas.'
                : `${activeCollections.length} cobranza${activeCollections.length === 1 ? '' : 's'} activa${activeCollections.length === 1 ? '' : 's'}.`}
            </p>
          </div>
          {showCreateButton ? (
            <Link to={ROUTES.collectionsNew} className="home-btn primary client-create">
              + Crear cobranza
            </Link>
          ) : null}
        </div>

        <label className="client-search">
          <span className="sr-only">Buscar cobranza</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            placeholder="Buscar cobranza..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {visible.length === 0 ? (
          <p className="home-muted client-empty">
            {collections.length === 0
              ? 'Crea la primera cobranza para empezar a cobrar.'
              : 'Ninguna cobranza coincide con la búsqueda.'}
          </p>
        ) : (
          <ul className="client-rows">
            {visible.map((collection) => {
              const name = clientNameById[collection.clientId] || 'Cliente eliminado'
              const paid = paidInstallments(collection)
              const skipped = skippedInstallmentList(collection.skippedInstallments)
              return (
                <li key={collection.id}>
                  <article className="client-row">
                    <button
                      type="button"
                      className="client-row-main"
                      onClick={() => navigate(ROUTES.collectionEdit(collection.id))}
                    >
                      <span className="home-avatar" style={{ background: avatarColor(name) }}>
                        {initials(name)}
                      </span>
                      <span className="home-row-copy">
                        <strong>{name}</strong>
                        <small>
                          {collection.concept || '-'}
                          {skipped.length > 0 ? ` · Sin cobro: ${skipped.join(', ')}` : ''}
                        </small>
                      </span>
                      <em className="frequency">{collection.frequency}</em>
                      <span className="home-chevron" aria-hidden="true">›</span>
                    </button>
                    <div className="client-row-meta">
                      <span>
                        <IconMoney />
                        Total: {money.format(collection.totalDebt)}
                      </span>
                      <span>
                        <IconCollections />
                        Actual: {money.format(collection.currentDebt)}
                      </span>
                      <span>
                        <IconBars />
                        Cuotas: {paid}/{collection.installments}
                      </span>
                      <span>
                        <IconCalendar />
                        Día(s): {formatCollectionDay(collection.collectionDay) || '-'}
                      </span>
                    </div>
                    <div className="client-row-actions">
                      <CollectionSendActions collection={collection} />
                      <button
                        type="button"
                        className="home-btn secondary"
                        onClick={() => navigate(ROUTES.collectionEdit(collection.id))}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="home-btn client-delete"
                        disabled={Boolean(deletingId)}
                        onClick={() => setPendingDelete(collection)}
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
        title="Eliminar cobranza"
        message={
          pendingDelete
            ? `Se eliminará la cobranza ${pendingDelete.concept || 'sin concepto'} de ${clientNameById[pendingDelete.clientId] || 'este cliente'}. Esta acción no se puede deshacer.`
            : ''
        }
        loading={Boolean(deletingId)}
        onConfirm={handleDeleteCollection}
        onCancel={() => {
          if (!deletingRef.current) setPendingDelete(null)
        }}
      />
    </div>
  )
}
