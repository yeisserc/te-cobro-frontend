import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import { apiRequest } from '../lib/api'

export default function BankPage() {
  const { currentUser, persistUser } = useAuth()
  const { setError, setSuccess } = useAppData()
  const [bankForm, setBankForm] = useState({ bankUsername: '', bankPassword: '' })
  const [bankLoading, setBankLoading] = useState(false)

  useEffect(() => {
    setBankForm({
      bankUsername: currentUser?.bankUsername || '',
      bankPassword: '',
    })
  }, [currentUser?.bankUsername, currentUser?.id])

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

  return (
    <div className="workspace">
      <section className="panel">
        <div className="panel-head">
          <h2>Banca en línea</h2>
          <p>
            Guarda el usuario y la contraseña del banco para validar automáticamente los pagos
            recibidos.
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
  )
}
