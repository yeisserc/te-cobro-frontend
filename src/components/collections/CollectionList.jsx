import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { money } from '../../lib/format'
import { ROUTES } from '../../lib/routes'

export function CollectionList({ showCreateButton = false }) {
  const navigate = useNavigate()
  const { collections, clientNameById, setError, reloadData } = useAppData()

  async function handleDeleteCollection(collectionId) {
    setError('')
    try {
      await apiRequest(`collections/${collectionId}`, { method: 'DELETE' })
      await reloadData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="panel panel-list">
      <div className="panel-head">
        <h2>Listado</h2>
        <p>
          {collections.length === 0
            ? 'Todavía no hay cobranzas cargadas.'
            : `${collections.length} cobranza${collections.length === 1 ? '' : 's'} activas.`}
        </p>
      </div>

      {showCreateButton ? (
        <div className="page-actions">
          <Link to={ROUTES.collectionsNew} className="btn-primary">
            Crear cobranza
          </Link>
        </div>
      ) : null}

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
                onClick={() => navigate(ROUTES.collectionEdit(item.id))}
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
                      onClick={() => navigate(ROUTES.collectionEdit(item.id))}
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
  )
}
