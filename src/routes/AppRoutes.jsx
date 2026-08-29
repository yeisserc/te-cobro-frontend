import { Navigate, Route, Routes } from 'react-router-dom'
import { AppDataProvider } from '../context/AppDataContext'
import { ROUTES } from '../lib/routes'
import { ProtectedRoute } from '../components/layout/AppLayout'
import { ClientsLayout } from '../components/layout/ClientsLayout'
import { CollectionsLayout } from '../components/layout/CollectionsLayout'
import BankPage from '../pages/BankPage'
import ClientFormPage from '../pages/ClientFormPage'
import ClientHistoryPage from '../pages/ClientHistoryPage'
import CollectionFormPage from '../pages/CollectionFormPage'
import LoginPage from '../pages/LoginPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />

      <Route
        element={
          <AppDataProvider>
            <ProtectedRoute />
          </AppDataProvider>
        }
      >
        <Route path="/" element={<Navigate to={ROUTES.home} replace />} />

        <Route path={ROUTES.clients} element={<ClientsLayout />}>
          <Route path="new" element={<ClientFormPage />} />
          <Route path=":clientId/edit" element={<ClientFormPage />} />
          <Route path=":clientId/history" element={<ClientHistoryPage />} />
        </Route>

        <Route path={ROUTES.collections} element={<CollectionsLayout />}>
          <Route path="new" element={<CollectionFormPage />} />
          <Route path=":collectionId/edit" element={<CollectionFormPage />} />
        </Route>

        <Route path={ROUTES.bank} element={<BankPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
