import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'
import { APP_NAME, PHONE_CODES } from '../lib/constants'
import { ROUTES } from '../lib/routes'
import { ErrorBanner } from '../components/ui/Banners'
import { AsyncButton } from '../components/ui/AsyncButton'
import { PasswordInput } from '../components/ui/PasswordInput'
import { useAsyncAction } from '../components/ui/useAsyncAction'

const emptyAuthForm = { email: '', password: '', phoneCode: '', phoneNumber: '' }

export default function LoginPage() {
  const { currentUser, persistUser } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuthForm)
  const [authLoading, runAuth] = useAsyncAction()
  const [error, setError] = useState('')

  if (currentUser) {
    return <Navigate to={ROUTES.home} replace />
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError('')

    const payload =
      authMode === 'register'
        ? {
            email: authForm.email.trim(),
            password: authForm.password,
            phoneCode: authForm.phoneCode.trim(),
            phoneNumber: authForm.phoneNumber.trim(),
          }
        : {
            email: authForm.email.trim(),
            password: authForm.password,
          }

    await runAuth(async () => {
      try {
        const path = authMode === 'register' ? 'users/register' : 'users/login'
        const user = await apiRequest(path, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        persistUser(user)
        setAuthForm(emptyAuthForm)
      } catch (requestError) {
        setError(requestError.message)
      }
    })
  }

  return (
    <div className="app-root auth-root">
      <main className="auth-shell">
        <div className="auth-brand">
          <p className="brand-mark">{APP_NAME}</p>
          <p className="brand-tagline">Gestor de clientes y cobranza</p>
        </div>

        <section className="auth-panel">
          <h1>{authMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
          <p>
            {authMode === 'register'
              ? 'Regístrate con tu correo, teléfono y una contraseña para empezar.'
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

            {authMode === 'register' && (
              <div className="field">
                <span>Teléfono</span>
                <div className="phone-row">
                  <select
                    required
                    className="phone-code"
                    value={authForm.phoneCode}
                    onChange={(event) =>
                      setAuthForm((prev) => ({ ...prev, phoneCode: event.target.value }))
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
                    autoComplete="tel-national"
                    placeholder="Número"
                    value={authForm.phoneNumber}
                    onChange={(event) =>
                      setAuthForm((prev) => ({ ...prev, phoneNumber: event.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            <label className="field">
              <span>Contraseña</span>
              <PasswordInput
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

            <AsyncButton className="btn-primary" type="submit" loading={authLoading}>
              {authMode === 'register' ? 'Registrarme' : 'Entrar'}
            </AsyncButton>
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
