export const ROUTES = {
  login: '/login',
  home: '/clients',
  clients: '/clients',
  clientsNew: '/clients/new',
  clientEdit: (clientId) => `/clients/${clientId}/edit`,
  clientHistory: (clientId) => `/clients/${clientId}/history`,
  collections: '/collections',
  collectionsNew: '/collections/new',
  collectionEdit: (collectionId) => `/collections/${collectionId}/edit`,
  bank: '/bank',
}

export function isClientListRoute(pathname) {
  return pathname === ROUTES.clients
}

export function isClientFormRoute(pathname) {
  return pathname.endsWith('/new') || pathname.includes('/edit')
}

export function isClientHistoryRoute(pathname) {
  return pathname.includes('/history')
}

export function isCollectionListRoute(pathname) {
  return pathname === ROUTES.collections
}

export function isCollectionFormRoute(pathname) {
  return pathname.endsWith('/new') || pathname.includes('/edit')
}
