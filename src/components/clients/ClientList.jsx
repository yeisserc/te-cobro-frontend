import { Link, useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { formatClientPhone } from '../../lib/format'
import { ROUTES } from '../../lib/routes'

export function ClientList({ showCreateButton = false }) {
  const navigate = useNavigate()
  const { clients, setError, reloadData } = useAppData()

  async function handleDeleteClient(clientId) {
    setError('')
    try {
      await apiRequest(`clients/${clientId}`, { method: 'DELETE' })
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
          {clients.length === 0
            ? 'Todavía no hay clientes cargados.'
            : `${clients.length} cliente${clients.length === 1 ? '' : 's'} registrados.`}
        </p>
      </div>

      {showCreateButton ? (
        <div className="page-actions">
          <Link to={ROUTES.clientsNew} className="btn-primary">
            Crear cliente
          </Link>
        </div>
      ) : null}

      <div className="mobile-list">
        {clients.map((client) => (
          <article
            key={client.id}
            className="data-card data-card-clickable"
            onClick={() => navigate(ROUTES.clientHistory(client.id))}
          >
            <div className="data-card-header">
              <div className="avatar" aria-hidden="true">
                {(client.firstName?.[0] || '?').toUpperCase()}
                {(client.lastName?.[0] || '').toUpperCase()}
              </div>
              <div className="data-card-title">
                <h3>
                  {client.firstName} {client.lastName}
                </h3>
                {client.nickname ? <span className="data-chip">{client.nickname}</span> : null}
              </div>
            </div>
            <dl className="data-card-fields">
              <div>
                <dt>Teléfono</dt>
                <dd>{formatClientPhone(client)}</dd>
              </div>
            </dl>
            <div className="table-actions" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="table-btn"
                onClick={() => navigate(ROUTES.clientEdit(client.id))}
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
              <tr
                key={client.id}
                className="clickable-row"
                onClick={() => navigate(ROUTES.clientHistory(client.id))}
              >
                <td>{client.firstName}</td>
                <td>{client.lastName}</td>
                <td>{client.nickname || '-'}</td>
                <td>{formatClientPhone(client)}</td>
                <td>
                  <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="table-btn"
                      onClick={() => navigate(ROUTES.clientEdit(client.id))}
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
  )
}
