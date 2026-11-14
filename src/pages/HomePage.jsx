import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { PaymentStatus } from '../components/clients/PaymentStatus'
import { AsyncButton } from '../components/ui/AsyncButton'
import { useAsyncAction } from '../components/ui/useAsyncAction'
import { WhatsappDeliveryStatus } from '../components/whatsapp/WhatsappDeliveryStatus'
import { apiRequest } from '../lib/api'
import { money, formatTime } from '../lib/format'
import { ROUTES } from '../lib/routes'

const AVATAR_COLORS = ['#ddd6fe', '#bfdbfe', '#bbf7d0', '#fde68a', '#fecdd3', '#bae6fd']

function parseDateKey(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function shortMonth(value) {
  return parseDateKey(value)
    .toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

function upcomingLabel(value) {
  const date = parseDateKey(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const dayMonth = shortMonth(value)

  if (date.getTime() === tomorrow.getTime()) return `Mañana · ${dayMonth}`

  const weekday = date.toLocaleDateString('es-VE', { weekday: 'long' })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${dayMonth}`
}

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

function greetingText(period) {
  if (period === 'afternoon') return 'Buenas tardes'
  if (period === 'evening') return 'Buenas noches'
  return 'Buenos días'
}

function HomeSkeleton() {
  return (
    <div className="home-page home-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando inicio...</span>
      <header className="home-greeting">
        <span className="skeleton-block skeleton-title" />
        <span className="skeleton-block skeleton-line" />
      </header>
      <section className="home-card">
        <span className="skeleton-block skeleton-banner" />
      </section>
      <section className="home-metrics">
        <span className="skeleton-block skeleton-stat" />
        <span className="skeleton-block skeleton-stat" />
        <span className="skeleton-block skeleton-stat" />
        <span className="skeleton-block skeleton-stat" />
      </section>
      <section className="home-card">
        <span className="skeleton-block skeleton-heading" />
        <span className="skeleton-row">
          <span className="skeleton-block skeleton-avatar" />
          <span className="skeleton-copy">
            <span className="skeleton-block skeleton-line" />
            <span className="skeleton-block skeleton-line short" />
          </span>
        </span>
        <span className="skeleton-row">
          <span className="skeleton-block skeleton-avatar" />
          <span className="skeleton-copy">
            <span className="skeleton-block skeleton-line" />
            <span className="skeleton-block skeleton-line short" />
          </span>
        </span>
      </section>
    </div>
  )
}

function HomeAvatar({ name }) {
  return (
    <span className="home-avatar" style={{ background: avatarColor(name) }}>
      {initials(name)}
    </span>
  )
}

export default function HomePage() {
  const { currentUser } = useAuth()
  const { setError, setSuccess } = useAppData()
  const navigate = useNavigate()
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, runSend] = useAsyncAction()
  const [menuOpen, setMenuOpen] = useState(false)

  async function loadHome() {
    if (!currentUser?.id) return
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest(`dashboard?userId=${currentUser.id}`)
      setHome(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHome()
    // The dashboard is loaded for the signed-in user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  async function handleSendNow(collectionId) {
    setError('')
    setSuccess('')
    await runSend(async () => {
      try {
        const result = await apiRequest(`collections/${collectionId}/send-charge`, { method: 'POST' })
        setSuccess(
          `Cobro enviado por WhatsApp (cuota ${result.installmentNumber}: ${money.format(result.amountUsd)}).`,
        )
        await loadHome()
      } catch (requestError) {
        setError(requestError.message)
      }
    })
  }

  if (loading && !home) {
    return <HomeSkeleton />
  }

  if (!home) return null

  const onboarding = !home.hasClients && !home.hasCollections
  const active = home.hasActivity
  const nextStep = home.setup.steps.find((step) => !step.done)
  const progress = Math.round((home.setup.completed / home.setup.total) * 100)

  return (
    <div className="home-page">
      <header className="home-greeting">
        <h2>
          {onboarding ? '¡Hola' : `¡${greetingText(home.greetingPeriod)}`}, {home.userName}!
          <span aria-hidden="true"> 👋</span>
        </h2>
        <p>
          {onboarding
            ? 'Comencemos a configurar tu cuenta para empezar a cobrar.'
            : active
              ? 'Aquí tienes el resumen de tus cobranzas.'
              : 'Tu cuenta ya está lista para empezar a cobrar.'}
        </p>
      </header>

      {onboarding ? (
        <Onboarding home={home} nextStep={nextStep} progress={progress} />
      ) : active ? (
        <ActiveHome home={home} onOpenMenu={() => setMenuOpen((open) => !open)} menuOpen={menuOpen} />
      ) : (
        <ReadyHome home={home} sending={sending} onSend={handleSendNow} navigate={navigate} />
      )}
    </div>
  )
}

function StatusBanner({ home }) {
  const ready = home.status.ready
  return (
    <div className={`home-status ${ready ? 'ready' : 'pending'}`}>
      <span className="home-status-icon" aria-hidden="true">
        {ready ? '✓' : '!'}
      </span>
      <span>
        <strong>{ready ? (home.hasActivity ? 'Todo funcionando correctamente' : 'Todo está listo') : 'Falta completar la configuración'}</strong>
        <small>
          WhatsApp {home.status.whatsappActive ? 'activo' : 'pendiente'} · Banco{' '}
          {home.status.bankConnected ? 'conectado' : 'sin conectar'}
        </small>
      </span>
      <span className="home-chevron" aria-hidden="true">›</span>
    </div>
  )
}

function ReadyHome({ home, sending, onSend, navigate }) {
  const next = home.nextCharge

  return (
    <>
      <Link to={ROUTES.bank} className="home-link-card">
        <StatusBanner home={home} />
      </Link>

      {next ? (
        <section className="home-card">
          <h3>Próximo cobro</h3>
          <div className="home-person">
            <HomeAvatar name={next.clientName} />
            <div>
              <strong>{next.clientName}</strong>
              <p>
                Cuota #{next.installmentNumber} · {money.format(next.amountUsd)}
              </p>
            </div>
          </div>
          {next.chargeSkipped ? (
            <p className="home-schedule">
              La cuota {next.installmentNumber} no se cobra. Ese día la deuda baja sola y no se envía WhatsApp.
            </p>
          ) : (
            <>
              <p className="home-schedule">
                <span aria-hidden="true">📅</span>
                Se enviará el {shortMonth(next.chargeDate)} a las {next.sendTimeLabel}
              </p>
              <div className="home-schedule-row">
                <span>Recordatorio: {shortMonth(next.reminderDate)}</span>
                <span>Cobro: {shortMonth(next.chargeDate)}</span>
              </div>
            </>
          )}
          <div className="home-actions">
            <button type="button" className="home-btn primary" onClick={() => navigate(ROUTES.collectionEdit(next.collectionId))}>
              Ver cobranza
            </button>
            {next.chargeSkipped ? null : (
              <AsyncButton className="home-btn secondary" loading={sending} onClick={() => onSend(next.collectionId)}>
                Enviar ahora
              </AsyncButton>
            )}
          </div>
        </section>
      ) : null}

      <section className="home-stats">
        <article>
          <strong>{home.summary.activeCollections}</strong>
          <span>cobranza activa</span>
        </article>
        <article>
          <strong>{home.summary.pendingToSend}</strong>
          <span>pendiente de enviar</span>
        </article>
        <article>
          <strong>{home.summary.paymentsReceived}</strong>
          <span>pagos recibidos</span>
        </article>
      </section>

      <UpcomingList items={next ? home.upcoming.concat(home.upcoming.some((item) => item.collectionId === next.collectionId) ? [] : [next]).sort((a, b) => a.chargeDate.localeCompare(b.chargeDate)) : home.upcoming} />
      <EmptyActivity text="Cuando se envíe el primer cobro, aquí verás mensajes, pagos recibidos y verificaciones." />
      <QuickActions />
    </>
  )
}

function ActiveHome({ home, menuOpen, onOpenMenu }) {
  const rejectedAttention = home.attention.filter((item) => item.status === 'rejected')

  return (
    <>
      <Link to={ROUTES.bank} className="home-link-card">
        <StatusBanner home={home} />
      </Link>

      <section className="home-metrics">
        <article>
          <span>Hoy</span>
          <strong>{home.summary.todaySends}</strong>
        </article>
        <article>
          <span>Verificados</span>
          <strong>{home.summary.verifiedToday}</strong>
        </article>
        <article>
          <span>Pendientes</span>
          <strong>{home.summary.pendingPayments}</strong>
        </article>
        <article>
          <span>Recibido hoy</span>
          <strong>{money.format(home.summary.receivedTodayUsd)}</strong>
        </article>
      </section>

      <section className="home-card">
        <div className="home-card-head">
          <h3>Requieren tu atención</h3>
          {rejectedAttention.length ? <span className="home-count">{rejectedAttention.length}</span> : null}
        </div>
        {rejectedAttention.length === 0 ? (
          <p className="home-muted">No hay pagos rechazados.</p>
        ) : (
          <ul className="home-rows">
            {rejectedAttention.map((item) => (
              <li key={item.id}>
                <Link to={ROUTES.clientHistory(item.clientId)}>
                  <span className="home-attention-icon rejected" aria-hidden="true">
                    ×
                  </span>
                  <span className="home-row-copy">
                    <strong>{item.clientName}</strong>
                    <small>
                      {item.detail} · {money.format(item.amountUsd)}
                    </small>
                  </span>
                  <em className="rejected">Pago rechazado</em>
                  <span className="home-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-card">
        <div className="home-card-head">
          <h3>Cobros de hoy ({home.summary.todaySends})</h3>
          <Link to={ROUTES.collections}>Ver todos</Link>
        </div>
        {home.todayCharges.length === 0 ? (
          <p className="home-muted">Hoy todavía no se ha enviado ningún cobro.</p>
        ) : (
          <ul className="home-rows">
            {home.todayCharges.map((item) => (
              <li key={item.id}>
                <Link to={ROUTES.clientHistory(item.clientId)}>
                  <HomeAvatar name={item.clientName} />
                  <span className="home-row-copy">
                    <strong>{item.clientName}</strong>
                    <small>
                      Cuota #{item.installmentNumber} · {money.format(item.amountUsd)}
                    </small>
                  </span>
                  <span className="home-today-status">
                    <PaymentStatus status={item.status} />
                    <span className="home-today-time">
                      {formatTime(item.sentAt)}
                      <WhatsappDeliveryStatus
                        status={item.whatsappStatus}
                        error={item.whatsappError}
                        sentAt={item.sentAt}
                        ticksOnly
                      />
                    </span>
                  </span>
                  <span className="home-chevron">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <UpcomingList items={home.upcoming} />

      <div className={`home-fab-wrap ${menuOpen ? 'open' : ''}`}>
        {menuOpen ? (
          <div className="home-fab-menu">
            <Link to={ROUTES.clientsNew} className="home-btn secondary">
              Nuevo cliente
            </Link>
            <Link to={ROUTES.collectionsNew} className="home-btn primary">
              Nueva cobranza
            </Link>
          </div>
        ) : null}
        <button type="button" className="home-fab" aria-label="Crear" onClick={onOpenMenu}>
          +
        </button>
      </div>
    </>
  )
}

function Onboarding({ home, nextStep, progress }) {
  return (
    <>
      <section className="home-card home-setup">
        <div className="home-setup-intro">
          <span aria-hidden="true">▣</span>
          <div>
            <h3>Configura tu cuenta</h3>
            <p>Completa los pasos iniciales para activar tus cobros.</p>
          </div>
        </div>
        <div className="home-progress">
          <span>
            {home.setup.completed} de {home.setup.total} completados
          </span>
          <span>{progress}%</span>
          <div>
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        <ul className="home-steps">
          {home.setup.steps.map((step) => (
            <li key={step.id}>
              <Link to={step.path}>
                <span className={step.done ? 'done' : ''} aria-hidden="true">
                  {step.done ? '✓' : ''}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </span>
                <span className="home-chevron">›</span>
              </Link>
            </li>
          ))}
        </ul>
        {nextStep ? (
          <Link to={nextStep.path} className="home-btn primary home-btn-block">
            Comenzar configuración
          </Link>
        ) : (
          <p className="home-muted">La configuración inicial ya está completa.</p>
        )}
        <a href="#home-how" className="home-btn ghost home-btn-block">
          Ver cómo funciona
        </a>
      </section>

      <section className="home-card" id="home-how">
        <h3>Así funciona Cobro Fácil</h3>
        <ol className="home-how">
          <li>1. Agrega un cliente</li>
          <li>2. Crea una cobranza</li>
          <li>3. Cobro Fácil envía el recordatorio</li>
          <li>4. Recibes y verificas el pago</li>
        </ol>
      </section>
      <EmptyActivity text="Cuando completes la configuración, aquí verás tus cobros, mensajes y pagos recibidos." />
    </>
  )
}

function UpcomingList({ items }) {
  return (
    <section className="home-card home-span" id="home-upcoming">
      <div className="home-card-head">
        <h3>Próximos cobros</h3>
      </div>
      {items.length === 0 ? (
        <p className="home-muted">No hay cobros programados.</p>
      ) : (
        <ul className="home-rows">
          {items.slice(0, 5).map((item) => (
            <li key={`${item.collectionId}-${item.chargeDate}`}>
              <Link to={ROUTES.collectionEdit(item.collectionId)}>
                <span className="home-date-pill">{upcomingLabel(item.chargeDate)}</span>
                <HomeAvatar name={item.clientName} />
                <span className="home-row-copy">
                  <strong>{item.clientName}</strong>
                </span>
                <em>{money.format(item.amountUsd)}</em>
                <span className="home-chevron">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EmptyActivity({ text }) {
  return (
    <section className="home-card home-empty home-span">
      <h3>Actividad reciente</h3>
      <strong>Aún no hay actividad</strong>
      <p>{text}</p>
    </section>
  )
}

function QuickActions() {
  return (
    <section className="home-card home-span">
      <h3>Acciones rápidas</h3>
      <div className="home-quick">
        <Link to={ROUTES.clientsNew} className="home-btn secondary">
          Nuevo cliente
        </Link>
        <Link to={ROUTES.collectionsNew} className="home-btn primary">
          Nueva cobranza
        </Link>
      </div>
    </section>
  )
}
