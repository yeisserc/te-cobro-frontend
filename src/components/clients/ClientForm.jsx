import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { PHONE_CODES, clientInitialForm } from '../../lib/constants'
import { formatPhoneCode } from '../../lib/format'
import { ROUTES } from '../../lib/routes'
import { IconBack } from '../icons/NavIcons'

export function ClientForm() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const isEditing = Boolean(clientId)
  const { currentUser } = useAuth()
  const { clients, setError, reloadData } = useAppData()
  const [form, setForm] = useState(clientInitialForm)

  useEffect(() => {
    if (!isEditing) {
      setForm(clientInitialForm)
      return
    }

    const client = clients.find((item) => item.id === clientId)
    if (!client) return

    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      nickname: client.nickname || '',
      phoneCode: formatPhoneCode(client.phoneCode),
      phoneNumber: client.phoneNumber || '',
    })
  }, [clientId, clients, isEditing])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const payload = {
      userId: currentUser.id,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      nickname: form.nickname.trim(),
      phoneCode: form.phoneCode.trim(),
      phoneNumber: form.phoneNumber.trim(),
    }

    try {
      if (isEditing) {
        await apiRequest(`clients/${clientId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('clients', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      await reloadData()
      navigate(ROUTES.clients)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head panel-head-with-back">
        <Link to={ROUTES.clients} className="back-link mobile-only" aria-label="Volver a clientes">
          <IconBack className="back-icon" />
        </Link>
        <div>
          <h2>{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <p>
            {isEditing
              ? 'Actualiza los datos del cliente seleccionado.'
              : 'Completa los datos para agregar un cliente.'}
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-row-2">
          <label className="field">
            <span>Nombre</span>
            <input
              required
              placeholder="Nombre"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>Apellido</span>
            <input
              required
              placeholder="Apellido"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            />
          </label>
        </div>
        <label className="field">
          <span>Apodo</span>
          <input
            placeholder="Opcional"
            value={form.nickname}
            onChange={(event) => setForm((prev) => ({ ...prev, nickname: event.target.value }))}
          />
        </label>
        <div className="field">
          <span>Teléfono</span>
          <div className="phone-row">
            <select
              required
              className="phone-code"
              value={form.phoneCode}
              onChange={(event) => setForm((prev) => ({ ...prev, phoneCode: event.target.value }))}
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
              value={form.phoneNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
            />
          </div>
        </div>
        <div className="actions-row">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Guardar cambios' : 'Agregar cliente'}
          </button>
          <Link to={ROUTES.clients} className="btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
