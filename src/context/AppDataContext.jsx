import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useAuth } from './AuthContext'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const { currentUser } = useAuth()
  const [clients, setClients] = useState([])
  const [collections, setCollections] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const loadClients = useCallback(async () => {
    if (!currentUser?.id) return []
    const data = await apiRequest(`clients?userId=${currentUser.id}`)
    setClients(data)
    return data
  }, [currentUser?.id])

  const loadCollections = useCallback(async () => {
    if (!currentUser?.id) return []
    const data = await apiRequest(`collections?userId=${currentUser.id}`)
    setCollections(data)
    return data
  }, [currentUser?.id])

  const reloadData = useCallback(async () => {
    if (!currentUser?.id) return
    setError('')
    setLoading(true)
    try {
      await Promise.all([loadClients(), loadCollections()])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, loadClients, loadCollections])

  useEffect(() => {
    if (!currentUser?.id) {
      setClients([])
      setCollections([])
      return
    }
    reloadData()
  }, [currentUser?.id, reloadData])

  const clientNameById = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.id] = `${client.firstName} ${client.lastName}`.trim()
      return acc
    }, {})
  }, [clients])

  const totalCurrentDebt = useMemo(() => {
    return collections.reduce((sum, item) => sum + Number(item.currentDebt || 0), 0)
  }, [collections])

  const value = useMemo(
    () => ({
      clients,
      collections,
      clientNameById,
      totalCurrentDebt,
      error,
      success,
      loading,
      setError,
      setSuccess,
      loadClients,
      loadCollections,
      reloadData,
    }),
    [
      clients,
      collections,
      clientNameById,
      totalCurrentDebt,
      error,
      success,
      loading,
      loadClients,
      loadCollections,
      reloadData,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData debe usarse dentro de AppDataProvider')
  }
  return context
}
