import { useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { money } from '../../lib/format'

function canSendCollection(collection) {
  return (
    Number(collection.currentDebt) > 0 &&
    Number(collection.currentInstallment) <= Number(collection.installments)
  )
}

export function CollectionSendActions({ collection }) {
  const { setError, setSuccess } = useAppData()
  const [sending, setSending] = useState(false)
  const canSend = canSendCollection(collection)

  async function handleSendCharge() {
    setError('')
    setSuccess('')
    setSending(true)

    try {
      const result = await apiRequest(`collections/${collection.id}/send-charge`, {
        method: 'POST',
      })

      setSuccess(
        `Cobro enviado por WhatsApp (cuota ${result.installmentNumber}: ${money.format(result.amountUsd)} / ${Number(result.amountBs).toFixed(2)} Bs).`,
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="collection-send-actions">
      <button
        type="button"
        className="table-btn accent"
        disabled={!canSend || sending}
        onClick={handleSendCharge}
      >
        {sending ? 'Enviando...' : 'Enviar cobro'}
      </button>
    </div>
  )
}

export { canSendCollection }
