import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'
import { ROUTES } from '../lib/routes'
import { ErrorBanner } from '../components/ui/Banners'

export default function LoginPage() {
  const { currentUser, persistUser } = useAuth()
  const [authMode, setAuthMode] = useState('register')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')

  if (currentUser) {
    return <Navigate to={ROUTES.home} replace />
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

          <ErrorBanner message={error} />

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
