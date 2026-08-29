import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { collectionInitialForm } from '../../lib/constants'
import { ROUTES } from '../../lib/routes'
import { IconBack } from '../icons/NavIcons'

export function CollectionForm() {
  const navigate = useNavigate()
  const { collectionId } = useParams()
  const isEditing = Boolean(collectionId)
  const { currentUser } = useAuth()
  const { clients, collections, setError, reloadData } = useAppData()
  const [form, setForm] = useState(collectionInitialForm)

  const hasClients = clients.length > 0

  useEffect(() => {
    if (!isEditing) {
      setForm(collectionInitialForm)
      return
    }

    const collection = collections.find((item) => item.id === collectionId)
    if (!collection) return

    const parts = collection.collectionDay ? collection.collectionDay.split(',') : []
    setForm({
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
  }, [collectionId, collections, isEditing])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const freq = form.frequency
    const collectionDay =
      freq === 'Manual'
        ? ''
        : freq === 'Quincenal'
          ? `${form.collectionDay},${form.collectionDay2}`
          : form.collectionDay

    const payload = isEditing
      ? {
          userId: currentUser.id,
          clientId: form.clientId,
          totalDebt: Number(form.totalDebt),
          currentDebt: Number(form.currentDebt),
          installments: Number(form.installments),
          currentInstallment: Number(form.currentInstallment),
          frequency: freq,
          collectionDay,
          concept: form.concept.trim(),
        }
      : {
          userId: currentUser.id,
          clientId: form.clientId,
          totalDebt: Number(form.totalDebt),
          installments: Number(form.installments),
          frequency: freq,
          collectionDay,
          concept: form.concept.trim(),
        }

    try {
      if (isEditing) {
        await apiRequest(`collections/${collectionId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('collections', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      await reloadData()
      navigate(ROUTES.collections)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head panel-head-with-back">
        <Link to={ROUTES.collections} className="back-link mobile-only" aria-label="Volver a cobranzas">
          <IconBack className="back-icon" />
        </Link>
        <div>
          <h2>{isEditing ? 'Editar cobranza' : 'Nueva cobranza'}</h2>
          <p>
            {isEditing
              ? 'Ajusta montos, cuotas o frecuencia de cobro.'
              : 'Asigna una deuda y define cómo se cobrará.'}
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Cliente</span>
          <select
            required
            value={form.clientId}
            onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
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
            value={form.concept}
            onChange={(event) => setForm((prev) => ({ ...prev, concept: event.target.value }))}
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
              value={form.totalDebt}
              onChange={(event) => setForm((prev) => ({ ...prev, totalDebt: event.target.value }))}
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
              value={form.installments}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, installments: event.target.value }))
              }
            />
          </label>
        </div>
        {isEditing ? (
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
                value={form.currentDebt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currentDebt: event.target.value }))
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
                value={form.currentInstallment}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currentInstallment: event.target.value }))
                }
              />
            </label>
          </div>
        ) : null}
        <label className="field">
          <span>Frecuencia</span>
          <select
            required
            value={form.frequency}
            onChange={(event) =>
              setForm((prev) => ({
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

        {form.frequency === 'Semanal' && (
          <label className="field">
            <span>Día de cobro</span>
            <select
              required
              value={form.collectionDay}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, collectionDay: event.target.value }))
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

        {form.frequency === 'Quincenal' && (
          <div className="field">
            <span>Días de cobro</span>
            <div className="split-row">
              <select
                required
                value={form.collectionDay}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, collectionDay: event.target.value }))
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
                value={form.collectionDay2}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, collectionDay2: event.target.value }))
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

        {form.frequency === 'Mensual' && (
          <label className="field">
            <span>Día de cobro</span>
            <select
              required
              value={form.collectionDay}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, collectionDay: event.target.value }))
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
            {isEditing ? 'Guardar cambios' : 'Agregar cobranza'}
          </button>
          <Link to={ROUTES.collections} className="btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
