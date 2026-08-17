import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL;

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
})

const PHONE_CODES = ['0412', '0414', '0416', '0422', '0424', '0426']

/** Muestra el código local con 0 (412 → 0412) para el UI. */
function formatPhoneCode(code) {
  if (!code) return ''
  return code.startsWith('0') ? code : `0${code}`
}

function formatClientPhone(client) {
  if (!client?.phoneCode || !client?.phoneNumber) return '-'
  return `${formatPhoneCode(client.phoneCode)} ${client.phoneNumber}`
}

const clientInitialForm = {
  firstName: '',
  lastName: '',
  nickname: '',
  phoneCode: '',
  phoneNumber: '',
}

const collectionInitialForm = {
  clientId: '',
  totalDebt: '',
  installments: '',
  frequency: 'Semanal',
  collectionDay: '',
  collectionDay2: '',
  concept: '',
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' ? data : null) ||
      'No se pudo completar la solicitud.'
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }

  return data
}

const SESSION_KEY = 'te-cobro-user'

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function IconClients({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 19.2c1.4-2.6 3.9-4 7.5-4s6.1 1.4 7.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconCollections({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7.5h14v10.2a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 17.7V7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 7.5V6.2A2.2 2.2 0 0 1 10.2 4h3.6A2.2 2.2 0 0 1 16 6.2v1.3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M5 11.5h14" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconBank({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5h16v8.2a1.3 1.3 0 0 1-1.3 1.3H5.3A1.3 1.3 0 0 1 4 18.7v-8.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3 10.5 12 4.5l9 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14v3.2M12 14v3.2M16 14v3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => loadStoredUser())
  const [authMode, setAuthMode] = useState('register')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)

  const [activeView, setActiveView] = useState('clients')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [clients, setClients] = useState([])
  const [clientForm, setClientForm] = useState(clientInitialForm)
  const [clientEditId, setClientEditId] = useState(null)

  const [collections, setCollections] = useState([])
  const [collectionForm, setCollectionForm] = useState(collectionInitialForm)
  const [collectionEditId, setCollectionEditId] = useState(null)

  const [bankForm, setBankForm] = useState({ bankUsername: '', bankPassword: '' })
  const [bankLoading, setBankLoading] = useState(false)

  const clientNameById = useMemo(() => {
    return clients.reduce((acc, client) => {
      acc[client.id] = `${client.firstName} ${client.lastName}`.trim()
      return acc
    }, {})
  }, [clients])

  const totalCurrentDebt = useMemo(() => {
    return collections.reduce((sum, item) => sum + Number(item.currentDebt || 0), 0)
  }, [collections])

  async function loadClients() {
    if (!currentUser?.id) return
    const data = await apiRequest(`clients?userId=${currentUser.id}`)
    setClients(data)
  }

  async function loadCollections() {
    if (!currentUser?.id) return
    const data = await apiRequest(`collections?userId=${currentUser.id}`)
    setCollections(data)
  }

  async function reloadData() {
    setError('')
    try {
      await Promise.all([loadClients(), loadCollections()])
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  useEffect(() => {
    if (!currentUser?.id) return

    async function hydrateSession() {
      try {
        const user = await apiRequest(`users/${currentUser.id}`)
        persistUser(user)
        setBankForm({
          bankUsername: user.bankUsername || '',
          bankPassword: '',
        })
        await Promise.all([loadClients(), loadCollections()])
      } catch (requestError) {
        setError(requestError.message)
      }
    }

    hydrateSession()
  }, [currentUser?.id])

  function persistUser(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    setCurrentUser(user)
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
    setClients([])
    setCollections([])
    setError('')
    setSuccess('')
    setBankForm({ bankUsername: '', bankPassword: '' })
    setAuthForm({ email: '', password: '' })
    setAuthMode('login')
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError('')
    setAuthLoading(true)

    const payload = {
      email: authForm.email.trim(),
      password: authForm.password,
    }

    try {
      const path = authMode === 'register' ? 'users/register' : 'users/login'
      const user = await apiRequest(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      persistUser(user)
      setAuthForm({ email: '', password: '' })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setAuthLoading(false)
    }
  }

  function resetClientForm() {
    setClientForm(clientInitialForm)
    setClientEditId(null)
  }

  function resetCollectionForm() {
    setCollectionForm(collectionInitialForm)
    setCollectionEditId(null)
  }

  async function handleSubmitClient(event) {
    event.preventDefault()
    setError('')

    const payload = {
      userId: currentUser.id,
      firstName: clientForm.firstName.trim(),
      lastName: clientForm.lastName.trim(),
      nickname: clientForm.nickname.trim(),
      phoneCode: clientForm.phoneCode.trim(),
      phoneNumber: clientForm.phoneNumber.trim(),
    }

    try {
      if (clientEditId) {
        await apiRequest(`clients/${clientEditId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('clients', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      resetClientForm()
      await reloadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function handleEditClient(client) {
    setClientForm({
      firstName: client.firstName,
      lastName: client.lastName,
      nickname: client.nickname || '',
      phoneCode: formatPhoneCode(client.phoneCode),
      phoneNumber: client.phoneNumber || '',
    })
    setClientEditId(client.id)
    setActiveView('clients')
  }

  async function handleDeleteClient(clientId) {
    setError('')
    try {
      await apiRequest(`clients/${clientId}`, { method: 'DELETE' })

      if (clientEditId === clientId) {
        resetClientForm()
      }

      await reloadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleSubmitCollection(event) {
    event.preventDefault()
    setError('')

    const freq = collectionForm.frequency
    const collectionDay =
      freq === 'Manual'
        ? ''
        : freq === 'Quincenal'
          ? `${collectionForm.collectionDay},${collectionForm.collectionDay2}`
          : collectionForm.collectionDay

    const isEditing = Boolean(collectionEditId)
    const payload = isEditing
      ? {
          userId: currentUser.id,
          clientId: collectionForm.clientId,
          totalDebt: Number(collectionForm.totalDebt),
          currentDebt: Number(collectionForm.currentDebt),
          installments: Number(collectionForm.installments),
          currentInstallment: Number(collectionForm.currentInstallment),
          frequency: freq,
          collectionDay,
          concept: collectionForm.concept.trim(),
        }
      : {
          userId: currentUser.id,
          clientId: collectionForm.clientId,
          totalDebt: Number(collectionForm.totalDebt),
          installments: Number(collectionForm.installments),
          frequency: freq,
          collectionDay,
          concept: collectionForm.concept.trim(),
        }

    try {
      if (collectionEditId) {
        await apiRequest(`collections/${collectionEditId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('collections', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      resetCollectionForm()
      await reloadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function handleEditCollection(collection) {
    const parts = collection.collectionDay ? collection.collectionDay.split(',') : []
    setCollectionForm({
      clientId: collection.clientId,
      totalDebt: String(collection.totalDebt),
      currentDebt: String(collection.currentDebt),
      installments: String(collection.installments),
      currentInstallment: String(collection.currentInstallment),
      frequency: collection.frequency,
      collectionDay: parts[0] || '',
      collectionDay2: parts[1] || '',
      concept: collection.concept || '',
    })
    setCollectionEditId(collection.id)
    setActiveView('collections')
  }

  async function handleDeleteCollection(collectionId) {
    setError('')
    setSuccess('')
    try {
      await apiRequest(`collections/${collectionId}`, { method: 'DELETE' })

      if (collectionEditId === collectionId) {
        resetCollectionForm()
      }

      await reloadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleSubmitBankAccount(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setBankLoading(true)

    try {
      const updatedUser = await apiRequest(`users/${currentUser.id}/bank-account`, {
        method: 'PATCH',
        body: JSON.stringify({
          bankUsername: bankForm.bankUsername.trim(),
          bankPassword: bankForm.bankPassword,
        }),
      })
      persistUser(updatedUser)
      setBankForm({
        bankUsername: updatedUser.bankUsername || '',
        bankPassword: '',
      })
      setSuccess('Datos bancarios guardados correctamente.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBankLoading(false)
    }
  }

  const hasClients = clients.length > 0
  const sectionTitle =
    activeView === 'clients' ? 'Clientes' : activeView === 'collections' ? 'Cobranza' : 'Cuenta bancaria'
  const sectionHint =
    activeView === 'clients'
      ? 'Registra y administra tu cartera de clientes.'
      : activeView === 'collections'
        ? 'Controla deudas, cuotas y frecuencias de cobro.'
        : 'Configura el usuario y clave de tu banca en línea para verificar pagos.'

  if (!currentUser) {
    return (
      <div className="app-root auth-root">
        <main className="auth-shell">
          <div className="auth-brand">
            <p className="brand-mark">Te Cobro</p>
            <p className="brand-tagline">Gestor de clientes y cobranza</p>
          </div>

          <section className="auth-panel">
            <h1>{authMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
            <p>
              {authMode === 'register'
                ? 'Regístrate con tu correo y una contraseña para empezar.'
                : 'Ingresa con tu correo y contraseña.'}
            </p>

            {error ? (
              <p className="error-banner" role="alert">
                {error}
              </p>
            ) : null}

            <form className="form-grid auth-form" onSubmit={handleAuthSubmit}>
              <label className="field">
                <span>Correo</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="tu@correo.com"
                />
              </label>

              <label className="field">
                <span>Contraseña</span>
                <input
                  type="password"
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Mínimo 6 caracteres"
                />
              </label>

              <button className="btn-primary" type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Espera...'
                  : authMode === 'register'
                    ? 'Registrarme'
                    : 'Entrar'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'register' ? (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => {
                      setAuthMode('login')
                      setError('')
                    }}
                  >
                    Inicia sesión
                  </button>
                </>
              ) : (
                <>
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => {
                      setAuthMode('register')
                      setError('')
                    }}
                  >
                    Regístrate
                  </button>
                </>
              )}
            </p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app-root">
      <main className="app-shell">
        <header className="header">
          <div className="header-brand">
            <p className="brand-mark">Te Cobro</p>
            <p className="brand-tagline">Gestor de clientes y cobranza</p>
          </div>

          <div className="header-actions">
            <nav className="top-nav" aria-label="Navegacion principal">
              <button
                type="button"
                className={`nav-pill ${activeView === 'clients' ? 'active' : ''}`}
                onClick={() => setActiveView('clients')}
              >
                <IconClients className="nav-icon" />
                Clientes
              </button>
              <button
                type="button"
                className={`nav-pill ${activeView === 'collections' ? 'active' : ''}`}
                onClick={() => setActiveView('collections')}
              >
                <IconCollections className="nav-icon" />
                Cobranza
              </button>
              <button
                type="button"
                className={`nav-pill ${activeView === 'bank' ? 'active' : ''}`}
                onClick={() => setActiveView('bank')}
              >
                <IconBank className="nav-icon" />
                Banco
              </button>
            </nav>
            <button type="button" className="btn-ghost header-logout" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>

        <section className="page-intro" key={activeView}>
          <div>
            <h1>{sectionTitle}</h1>
            <p>{sectionHint}</p>
          </div>
          <div className="intro-meta">
            {activeView === 'clients' ? (
              <div className="meta-stat">
                <span className="meta-label">Clientes</span>
                <strong>{clients.length}</strong>
              </div>
            ) : activeView === 'collections' ? (
              <>
                <div className="meta-stat">
                  <span className="meta-label">Cobranzas</span>
                  <strong>{collections.length}</strong>
                </div>
                <div className="meta-stat">
                  <span className="meta-label">Deuda activa</span>
                  <strong>{money.format(totalCurrentDebt)}</strong>
                </div>
              </>
            ) : (
              <div className="meta-stat">
                <span className="meta-label">Estado</span>
                <strong>{currentUser.hasBankAccount ? 'Configurada' : 'Pendiente'}</strong>
              </div>
            )}
          </div>
        </section>

        {error ? (
          <p className="error-banner" role="alert">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="success-banner" role="status">
            {success}
          </p>
        ) : null}

        {activeView === 'clients' ? (
          <div className="workspace" key="clients-workspace">
            <section className="panel">
              <div className="panel-head">
                <h2>{clientEditId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
                <p>
                  {clientEditId
                    ? 'Actualiza los datos del cliente seleccionado.'
                    : 'Completa los datos para agregar un cliente.'}
                </p>
              </div>

              <form className="form-grid" onSubmit={handleSubmitClient}>
                <div className="form-row-2">
                  <label className="field">
                    <span>Nombre</span>
                    <input
                      required
                      placeholder="Nombre"
                      value={clientForm.firstName}
                      onChange={(event) =>
                        setClientForm((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Apellido</span>
                    <input
                      required
                      placeholder="Apellido"
                      value={clientForm.lastName}
                      onChange={(event) =>
                        setClientForm((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Apodo</span>
                  <input
                    placeholder="Opcional"
                    value={clientForm.nickname}
                    onChange={(event) =>
                      setClientForm((prev) => ({ ...prev, nickname: event.target.value }))
                    }
                  />
                </label>
                <div className="field">
                  <span>Teléfono</span>
                  <div className="phone-row">
                    <select
                      required
                      className="phone-code"
                      value={clientForm.phoneCode}
                      onChange={(event) =>
                        setClientForm((prev) => ({ ...prev, phoneCode: event.target.value }))
                      }
                    >
                      <option value="">Código</option>
                      {PHONE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="tel"
                      className="phone-number"
                      placeholder="Número"
                      value={clientForm.phoneNumber}
                      onChange={(event) =>
                        setClientForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="actions-row">
                  <button type="submit" className="btn-primary">
                    {clientEditId ? 'Guardar cambios' : 'Agregar cliente'}
                  </button>
                  {clientEditId ? (
                    <button type="button" className="btn-ghost" onClick={resetClientForm}>
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="panel panel-list">
              <div className="panel-head">
                <h2>Listado</h2>
                <p>
                  {clients.length === 0
                    ? 'Todavía no hay clientes cargados.'
                    : `${clients.length} cliente${clients.length === 1 ? '' : 's'} registrados.`}
                </p>
              </div>

              <div className="mobile-list">
                {clients.map((client) => (
                  <article key={client.id} className="data-card">
                    <div className="data-card-header">
                      <div className="avatar" aria-hidden="true">
                        {(client.firstName?.[0] || '?').toUpperCase()}
                        {(client.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div className="data-card-title">
                        <h3>
                          {client.firstName} {client.lastName}
                        </h3>
                        {client.nickname ? (
                          <span className="data-chip">{client.nickname}</span>
                        ) : null}
                      </div>
                    </div>
                    <dl className="data-card-fields">
                      <div>
                        <dt>Teléfono</dt>
                        <dd>{formatClientPhone(client)}</dd>
                      </div>
                    </dl>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-btn"
                        onClick={() => handleEditClient(client)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="table-btn danger"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="table-wrap desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Apodo</th>
                      <th>Teléfono</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td>{client.firstName}</td>
                        <td>{client.lastName}</td>
                        <td>{client.nickname || '-'}</td>
                        <td>
                          {formatClientPhone(client)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-btn"
                              onClick={() => handleEditClient(client)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="table-btn danger"
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : activeView === 'collections' ? (
          <div className="workspace" key="collections-workspace">
            <section className="panel">
              <div className="panel-head">
                <h2>{collectionEditId ? 'Editar cobranza' : 'Nueva cobranza'}</h2>
                <p>
                  {collectionEditId
                    ? 'Ajusta montos, cuotas o frecuencia de cobro.'
                    : 'Asigna una deuda y define cómo se cobrará.'}
                </p>
              </div>

              <form className="form-grid" onSubmit={handleSubmitCollection}>
                <label className="field">
                  <span>Cliente</span>
                  <select
                    required
                    value={collectionForm.clientId}
                    onChange={(event) =>
                      setCollectionForm((prev) => ({
                        ...prev,
                        clientId: event.target.value,
                      }))
                    }
                    disabled={!hasClients}
                  >
                    <option value="">
                      {hasClients ? 'Selecciona cliente' : 'No hay clientes disponibles'}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Concepto</span>
                  <input
                    required
                    placeholder="Ej. Préstamo, servicio..."
                    value={collectionForm.concept}
                    onChange={(event) =>
                      setCollectionForm((prev) => ({ ...prev, concept: event.target.value }))
                    }
                  />
                </label>
                <div className="form-row-2">
                  <label className="field">
                    <span>Deuda total</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={collectionForm.totalDebt}
                      onChange={(event) =>
                        setCollectionForm((prev) => ({
                          ...prev,
                          totalDebt: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Nro de cuotas</span>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      placeholder="1"
                      value={collectionForm.installments}
                      onChange={(event) =>
                        setCollectionForm((prev) => ({
                          ...prev,
                          installments: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                {collectionEditId ? (
                  <div className="form-row-2">
                    <label className="field">
                      <span>Deuda actual</span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={collectionForm.currentDebt}
                        onChange={(event) =>
                          setCollectionForm((prev) => ({
                            ...prev,
                            currentDebt: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Cuota actual</span>
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        placeholder="1"
                        value={collectionForm.currentInstallment}
                        onChange={(event) =>
                          setCollectionForm((prev) => ({
                            ...prev,
                            currentInstallment: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                ) : null}
                <label className="field">
                  <span>Frecuencia</span>
                  <select
                    required
                    value={collectionForm.frequency}
                    onChange={(event) =>
                      setCollectionForm((prev) => ({
                        ...prev,
                        frequency: event.target.value,
                        collectionDay: '',
                        collectionDay2: '',
                      }))
                    }
                  >
                    <option>Manual</option>
                    <option>Semanal</option>
                    <option>Quincenal</option>
                    <option>Mensual</option>
                  </select>
                </label>

                {collectionForm.frequency === 'Semanal' && (
                  <label className="field">
                    <span>Día de cobro</span>
                    <select
                      required
                      value={collectionForm.collectionDay}
                      onChange={(event) =>
                        setCollectionForm((prev) => ({
                          ...prev,
                          collectionDay: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona día</option>
                      {[
                        'Lunes',
                        'Martes',
                        'Miércoles',
                        'Jueves',
                        'Viernes',
                        'Sábado',
                        'Domingo',
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {collectionForm.frequency === 'Quincenal' && (
                  <div className="field">
                    <span>Días de cobro</span>
                    <div className="split-row">
                      <select
                        required
                        value={collectionForm.collectionDay}
                        onChange={(event) =>
                          setCollectionForm((prev) => ({
                            ...prev,
                            collectionDay: event.target.value,
                          }))
                        }
                      >
                        <option value="">1er día</option>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <select
                        required
                        value={collectionForm.collectionDay2}
                        onChange={(event) =>
                          setCollectionForm((prev) => ({
                            ...prev,
                            collectionDay2: event.target.value,
                          }))
                        }
                      >
                        <option value="">2do día</option>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {collectionForm.frequency === 'Mensual' && (
                  <label className="field">
                    <span>Día de cobro</span>
                    <select
                      required
                      value={collectionForm.collectionDay}
                      onChange={(event) =>
                        setCollectionForm((prev) => ({
                          ...prev,
                          collectionDay: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona día</option>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="actions-row">
                  <button type="submit" className="btn-primary" disabled={!hasClients}>
                    {collectionEditId ? 'Guardar cambios' : 'Agregar cobranza'}
                  </button>
                  {collectionEditId ? (
                    <button type="button" className="btn-ghost" onClick={resetCollectionForm}>
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="panel panel-list">
              <div className="panel-head">
                <h2>Listado</h2>
                <p>
                  {collections.length === 0
                    ? 'Todavía no hay cobranzas cargadas.'
                    : `${collections.length} cobranza${collections.length === 1 ? '' : 's'} activas.`}
                </p>
              </div>

              <div className="mobile-list">
                {collections.map((item) => (
                  <article key={item.id} className="data-card">
                    <div className="data-card-header">
                      <div className="data-card-title">
                        <h3>{clientNameById[item.clientId] || 'Cliente eliminado'}</h3>
                        <p className="data-card-concept">{item.concept || '-'}</p>
                      </div>
                      <span className="data-chip">{item.frequency}</span>
                    </div>
                    <dl className="data-card-fields data-card-fields-grid">
                      <div>
                        <dt>Deuda total</dt>
                        <dd>{money.format(item.totalDebt)}</dd>
                      </div>
                      <div>
                        <dt>Deuda actual</dt>
                        <dd className="accent-value">{money.format(item.currentDebt)}</dd>
                      </div>
                      <div>
                        <dt>Cuotas</dt>
                        <dd>
                          {item.currentInstallment}/{item.installments}
                        </dd>
                      </div>
                      <div>
                        <dt>Día(s)</dt>
                        <dd>{item.collectionDay || '-'}</dd>
                      </div>
                    </dl>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-btn"
                        onClick={() => handleEditCollection(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="table-btn danger"
                        onClick={() => handleDeleteCollection(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="table-wrap desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Concepto</th>
                      <th>Deuda total</th>
                      <th>Deuda actual</th>
                      <th>Nro de cuotas</th>
                      <th>Cuota actual</th>
                      <th>Frecuencia</th>
                      <th>Día(s)</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((item) => (
                      <tr key={item.id}>
                        <td>{clientNameById[item.clientId] || 'Cliente eliminado'}</td>
                        <td>{item.concept || '-'}</td>
                        <td>{money.format(item.totalDebt)}</td>
                        <td>{money.format(item.currentDebt)}</td>
                        <td>{item.installments}</td>
                        <td>{item.currentInstallment}</td>
                        <td>{item.frequency}</td>
                        <td>{item.collectionDay || '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-btn"
                              onClick={() => handleEditCollection(item)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="table-btn danger"
                              onClick={() => handleDeleteCollection(item.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div className="workspace" key="bank-workspace">
            <section className="panel">
              <div className="panel-head">
                <h2>Banca en línea</h2>
                <p>
                  Guarda el usuario y la contraseña del banco para validar automáticamente los
                  pagos recibidos.
                </p>
              </div>

              {currentUser.hasBankAccount ? (
                <p className="bank-status configured">Tu cuenta bancaria ya está configurada.</p>
              ) : (
                <p className="bank-status pending">Aún no has configurado tu cuenta bancaria.</p>
              )}

              <form className="form-grid" onSubmit={handleSubmitBankAccount}>
                <label className="field">
                  <span>Usuario del banco</span>
                  <input
                    required
                    autoComplete="username"
                    placeholder="Usuario de banca en línea"
                    value={bankForm.bankUsername}
                    onChange={(event) =>
                      setBankForm((prev) => ({ ...prev, bankUsername: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Contraseña del banco</span>
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    placeholder={
                      currentUser.hasBankAccount
                        ? 'Ingresa la contraseña para actualizarla'
                        : 'Contraseña de banca en línea'
                    }
                    value={bankForm.bankPassword}
                    onChange={(event) =>
                      setBankForm((prev) => ({ ...prev, bankPassword: event.target.value }))
                    }
                  />
                </label>

                <button className="btn-primary" type="submit" disabled={bankLoading}>
                  {bankLoading
                    ? 'Guardando...'
                    : currentUser.hasBankAccount
                      ? 'Actualizar datos bancarios'
                      : 'Guardar datos bancarios'}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navegacion movil">
        <button
          type="button"
          className={`bottom-nav-item ${activeView === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveView('clients')}
        >
          <IconClients className="bottom-nav-icon" />
          <span>Clientes</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activeView === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveView('collections')}
        >
          <IconCollections className="bottom-nav-icon" />
          <span>Cobranza</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-item ${activeView === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveView('bank')}
        >
          <IconBank className="bottom-nav-icon" />
          <span>Banco</span>
        </button>
      </nav>
    </div>
  )
}

export default App
