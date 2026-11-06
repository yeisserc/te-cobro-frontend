import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import {
  isCollectionFormRoute,
  isCollectionListRoute,
} from '../../lib/routes'
import { CollectionList } from '../collections/CollectionList'

export function CollectionsLayout() {
  const { pathname } = useLocation()
  const { loadCollections, setError } = useAppData()

  useEffect(() => {
    let cancelled = false

    async function refreshCollections() {
      try {
        await loadCollections()
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message)
        }
      }
    }

    refreshCollections()

    return () => {
      cancelled = true
    }
  }, [pathname, loadCollections, setError])

  if (isCollectionListRoute(pathname)) {
    return (
      <div className="workspace workspace-stack">
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
