import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { apiRequest } from '../lib/api'
import { PAYMENT_BANKS } from '../lib/constants'

export default function BankPage() {
  const { currentUser, persistUser, refreshUser } = useAuth()
  const { setError, setSuccess } = useAppData()
  const [bankForm, setBankForm] = useState({ bankUsername: '', bankPassword: '' })
  const [paymentForm, setPaymentForm] = useState({
    companyName: '',
    paymentDocument: '',
    paymentPhoneNumber: '',
    paymentBank: '',
  })
  const [bankLoading, setBankLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadBankCredentials() {
      if (!currentUser?.id) return

      setLoadingUser(true)
      setError('')

      try {
        const user = await refreshUser(currentUser.id)
        if (cancelled) return

        setBankForm({
          bankUsername: user.bankUsername || '',
          bankPassword: '',
        })
        setPaymentForm({
          companyName: user.companyName || '',
          paymentDocument: user.paymentDocument || '',
          paymentPhoneNumber: user.paymentPhoneNumber || '',
          paymentBank: user.paymentBank || '',
        })
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message)
          setBankForm({
            bankUsername: currentUser.bankUsername || '',
            bankPassword: '',
          })
          setPaymentForm({
            companyName: currentUser.companyName || '',
            paymentDocument: currentUser.paymentDocument || '',
            paymentPhoneNumber: currentUser.paymentPhoneNumber || '',
            paymentBank: currentUser.paymentBank || '',
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false)
        }
      }
    }

    loadBankCredentials()

    return () => {
      cancelled = true
    }
  }, [currentUser?.id, refreshUser, setError])

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

  async function handleSubmitPaymentDetails(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setPaymentLoading(true)

    try {
      const updatedUser = await apiRequest(`users/${currentUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          companyName: paymentForm.companyName.trim(),
          paymentDocument: paymentForm.paymentDocument.trim(),
          paymentPhoneNumber: paymentForm.paymentPhoneNumber.trim(),
          paymentBank: paymentForm.paymentBank,
        }),
      })
      persistUser(updatedUser)
      setPaymentForm({
        companyName: updatedUser.companyName || '',
        paymentDocument: updatedUser.paymentDocument || '',
        paymentPhoneNumber: updatedUser.paymentPhoneNumber || '',
        paymentBank: updatedUser.paymentBank || '',
      })
      setSuccess('Datos de cobro guardados correctamente.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <div className="workspace workspace-stack">
      <section className="panel">
        <div className="panel-head">
          <h2>Banca en línea</h2>
          <p>
            Guarda el usuario y la contraseña del banco para validar automáticamente los pagos
            recibidos.
          </p>
        </div>

        {loadingUser ? (
          <p className="empty-hint">Cargando datos bancarios...</p>
        ) : (
          <>
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
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Datos para recibir pagos</h2>
          <p>Información que tus clientes usarán para pagarte.</p>
        </div>

        {loadingUser ? (
          <p className="empty-hint">Cargando datos de cobro...</p>
        ) : (
          <form className="form-grid" onSubmit={handleSubmitPaymentDetails}>
            <label className="field">
              <span>Nombre de la empresa</span>
              <input
                value={paymentForm.companyName}
                onChange={(event) =>
                  setPaymentForm((prev) => ({ ...prev, companyName: event.target.value }))
                }
                placeholder="Nombre comercial"
              />
            </label>

            <label className="field">
              <span>Documento</span>
              <input
                value={paymentForm.paymentDocument}
                onChange={(event) =>
                  setPaymentForm((prev) => ({ ...prev, paymentDocument: event.target.value }))
                }
                placeholder="Cédula o RIF"
              />
            </label>

            <label className="field">
              <span>Teléfono</span>
              <input
                value={paymentForm.paymentPhoneNumber}
                onChange={(event) =>
                  setPaymentForm((prev) => ({ ...prev, paymentPhoneNumber: event.target.value }))
                }
                placeholder="04121234567"
              />
            </label>

            <label className="field">
              <span>Banco</span>
              <select
                value={paymentForm.paymentBank}
                onChange={(event) =>
                  setPaymentForm((prev) => ({ ...prev, paymentBank: event.target.value }))
                }
              >
                <option value="">Selecciona un banco</option>
                {PAYMENT_BANKS.map((bank) => (
                  <option key={bank.value} value={bank.value}>
                    {bank.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="btn-primary" type="submit" disabled={paymentLoading}>
              {paymentLoading ? 'Guardando...' : 'Guardar datos de cobro'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
