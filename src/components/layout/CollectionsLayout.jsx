import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  ROUTES,
  isCollectionFormRoute,
  isCollectionListRoute,
} from '../../lib/routes'
import { CollectionList } from '../collections/CollectionList'

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

export function CollectionsLayout() {
  const { pathname } = useLocation()

  if (isCollectionListRoute(pathname)) {
    return (
      <div className="workspace workspace-list-only">
        <DesktopCreatePanel
          title="Nueva cobranza"
          hint="Asigna una deuda y define cómo se cobrará."
          to={ROUTES.collectionsNew}
          label="Crear cobranza"
        />
        <CollectionList showCreateButton />
      </div>
    )
  }

  if (isCollectionFormRoute(pathname)) {
    return (
      <div className="workspace">
        <Outlet />
        <div className="desktop-only">
          <CollectionList />
        </div>
      </div>
    )
  }

  return <Outlet />
}
