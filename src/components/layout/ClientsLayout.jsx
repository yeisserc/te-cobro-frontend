import { Outlet, useLocation } from 'react-router-dom'
import {
  isClientFormRoute,
  isClientHistoryRoute,
  isClientListRoute,
} from '../../lib/routes'
import { ClientList } from '../clients/ClientList'

export function ClientsLayout() {
  const { pathname } = useLocation()

  if (isClientHistoryRoute(pathname)) {
    return <Outlet />
  }

  if (isClientListRoute(pathname)) {
    return (
      <div className="workspace workspace-stack">
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
