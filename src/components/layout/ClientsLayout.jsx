import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  ROUTES,
  isClientFormRoute,
  isClientHistoryRoute,
  isClientListRoute,
} from '../../lib/routes'
import { ClientList } from '../clients/ClientList'

function DesktopCreatePanel({ title, hint, to, label }) {
  return (
    <section className="panel desktop-only">
      <div className="panel-head">
        <h2>{title}</h2>
        <p>{hint}</p>
      </div>
      <Link to={to} className="btn-primary">
        {label}
      </Link>
    </section>
  )
}

export function ClientsLayout() {
  const { pathname } = useLocation()

  if (isClientHistoryRoute(pathname)) {
    return <Outlet />
  }

  if (isClientListRoute(pathname)) {
    return (
      <div className="workspace workspace-list-only">
        <DesktopCreatePanel
          title="Nuevo cliente"
          hint="Agrega un cliente a tu cartera."
          to={ROUTES.clientsNew}
          label="Crear cliente"
        />
        <ClientList showCreateButton />
      </div>
    )
  }

  if (isClientFormRoute(pathname)) {
    return (
      <div className="workspace">
        <Outlet />
        <div className="desktop-only">
          <ClientList />
        </div>
      </div>
    )
  }

  return <Outlet />
}
