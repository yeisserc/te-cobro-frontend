import { Link, useLocation } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { ROUTES } from '../../lib/routes'
import { IconBank, IconClients, IconCollections, IconHome } from '../icons/NavIcons'

function useCollectionsNavRefresh() {
  const { pathname } = useLocation()
  const { loadCollections, setError } = useAppData()

  return async function refreshCollectionsIfActive() {
    if (!pathname.startsWith(ROUTES.collections)) return

    try {
      await loadCollections()
    } catch (requestError) {
      setError(requestError.message)
    }
  }
}

export function TopNav() {
  const { pathname } = useLocation()
  const refreshCollections = useCollectionsNavRefresh()

  return (
    <nav className="top-nav" aria-label="Navegacion principal">
      <Link
        to={ROUTES.home}
        className={`nav-pill ${pathname === ROUTES.home ? 'active' : ''}`}
      >
        <IconHome className="nav-icon" />
        Inicio
      </Link>
      <Link
        to={ROUTES.clients}
        className={`nav-pill ${pathname.startsWith(ROUTES.clients) ? 'active' : ''}`}
      >
        <IconClients className="nav-icon" />
        Clientes
      </Link>
      <Link
        to={ROUTES.collections}
        className={`nav-pill ${pathname.startsWith(ROUTES.collections) ? 'active' : ''}`}
        onClick={refreshCollections}
      >
        <IconCollections className="nav-icon" />
        Cobranza
      </Link>
      <Link
        to={ROUTES.bank}
        className={`nav-pill ${pathname.startsWith(ROUTES.bank) ? 'active' : ''}`}
      >
        <IconBank className="nav-icon" />
        Banco
      </Link>
    </nav>
  )
}

export function BottomNav() {
  const { pathname } = useLocation()
  const refreshCollections = useCollectionsNavRefresh()

  return (
    <nav className="bottom-nav" aria-label="Navegacion movil">
      <Link
        to={ROUTES.home}
        className={`bottom-nav-item ${pathname === ROUTES.home ? 'active' : ''}`}
      >
        <IconHome className="bottom-nav-icon" />
        <span>Inicio</span>
      </Link>
      <Link
        to={ROUTES.clients}
        className={`bottom-nav-item ${pathname.startsWith(ROUTES.clients) ? 'active' : ''}`}
      >
        <IconClients className="bottom-nav-icon" />
        <span>Clientes</span>
      </Link>
      <Link
        to={ROUTES.collections}
        className={`bottom-nav-item ${pathname.startsWith(ROUTES.collections) ? 'active' : ''}`}
        onClick={refreshCollections}
      >
        <IconCollections className="bottom-nav-icon" />
        <span>Cobranza</span>
      </Link>
      <Link
        to={ROUTES.bank}
        className={`bottom-nav-item ${pathname.startsWith(ROUTES.bank) ? 'active' : ''}`}
      >
        <IconBank className="bottom-nav-icon" />
        <span>Banco</span>
      </Link>
    </nav>
  )
}
