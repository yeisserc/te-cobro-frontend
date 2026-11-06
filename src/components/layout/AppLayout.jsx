import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'
import { money } from '../../lib/format'
import { APP_NAME } from '../../lib/constants'
import {
  ROUTES,
  isClientHistoryRoute,
  isClientListRoute,
  isCollectionFormRoute,
  isCollectionListRoute,
} from '../../lib/routes'
import { ErrorBanner, SuccessBanner } from '../ui/Banners'
import { IconClients, IconCollections } from '../icons/NavIcons'
import { BottomNav, TopNav } from './Navigation'

function getSectionMeta(pathname, clientsCount, collectionsCount, totalCurrentDebt, hasBankAccount) {
  if (pathname.startsWith(ROUTES.clients)) {
    if (isClientHistoryRoute(pathname)) {
      return {
        title: 'Historial',
        hint: 'Historial de envíos y pagos agrupado por cobranza.',
        stats: null,
      }
    }
    if (pathname.endsWith('/new')) {
      return {
        title: 'Nuevo cliente',
        hint: 'Completa los datos para agregar un cliente.',
        stats: [{ label: 'Clientes', value: clientsCount }],
      }
    }
    if (pathname.includes('/edit')) {
      return {
        title: 'Editar cliente',
        hint: 'Actualiza los datos del cliente seleccionado.',
        stats: [{ label: 'Clientes', value: clientsCount }],
      }
    }
    return {
      title: 'Clientes',
      hint: 'Registra y administra tu cartera de clientes.',
      stats: [{ label: 'Clientes', value: clientsCount }],
    }
  }

  if (pathname.startsWith(ROUTES.collections)) {
    if (isCollectionFormRoute(pathname) && pathname.endsWith('/new')) {
      return {
        title: 'Nueva cobranza',
        hint: 'Asigna una deuda y define cómo se cobrará.',
        stats: [
          { label: 'Cobranzas', value: collectionsCount },
          { label: 'Deuda activa', value: money.format(totalCurrentDebt), accent: true },
        ],
      }
    }
    if (pathname.includes('/edit')) {
      return {
        title: 'Editar cobranza',
        hint: 'Ajusta montos, cuotas o frecuencia de cobro.',
        stats: [
          { label: 'Cobranzas', value: collectionsCount },
          { label: 'Deuda activa', value: money.format(totalCurrentDebt), accent: true },
        ],
      }
    }
    return {
        title: 'Cobranzas',
      hint: 'Controla deudas, cuotas y frecuencias de cobro.',
      stats: [
        { label: 'Cobranzas', value: collectionsCount },
        { label: 'Deuda activa', value: money.format(totalCurrentDebt), accent: true },
      ],
    }
  }

  return {
    title: 'Cuenta bancaria',
    hint: 'Configura el usuario y clave de tu banca en línea para verificar pagos.',
    stats: [{ label: 'Estado', value: hasBankAccount ? 'Configurada' : 'Pendiente' }],
  }
}

export function ProtectedRoute() {
  const { currentUser } = useAuth()
  if (!currentUser) {
    return <Navigate to={ROUTES.login} replace />
  }
  return <AppLayout />
}

function AppLayout() {
  const { currentUser, logout } = useAuth()
  const { clients, collections, totalCurrentDebt, error, success } = useAppData()
  const { pathname } = useLocation()

  const isHome = pathname === ROUTES.home
  const isClientList = isClientListRoute(pathname)
  const isCollectionList = isCollectionListRoute(pathname)

  const { title, hint, stats } = getSectionMeta(
    pathname,
    clients.length,
    collections.length,
    totalCurrentDebt,
    currentUser.hasBankAccount,
  )

  return (
    <div className="app-root">
      <main className="app-shell">
        <header className="header">
          <div className="header-brand">
            <p className="brand-mark">{APP_NAME}</p>
            <p className="brand-tagline">Gestor de clientes y cobranza</p>
          </div>

          <div className="header-actions">
            <TopNav />
            <button type="button" className="btn-ghost header-logout" onClick={logout}>
              Salir
            </button>
          </div>
        </header>

        {isHome ? null : (
          <section className="page-intro">
            <div>
              <h1 className={isClientList || isCollectionList ? 'page-title-with-icon' : undefined}>
                {isClientList ? (
                  <span className="page-title-icon" aria-hidden="true">
                    <IconClients className="nav-icon" />
                  </span>
                ) : null}
                {isCollectionList ? (
                  <span className="page-title-icon blue" aria-hidden="true">
                    <IconCollections className="nav-icon" />
                  </span>
                ) : null}
                {title}
              </h1>
              <p>{hint}</p>
            </div>
            {stats && !isClientList && !isCollectionList ? (
              <div className="intro-meta">
                {stats.map((stat) => (
                  <div key={stat.label} className="meta-stat">
                    <span className="meta-label">{stat.label}</span>
                    <strong className={stat.accent ? 'accent-value' : undefined}>{stat.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )}

        <ErrorBanner message={error} />
        <SuccessBanner message={success} />

        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
