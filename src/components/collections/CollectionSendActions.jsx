import { useAppData } from '../../context/AppDataContext'
import { apiRequest } from '../../lib/api'
import { money } from '../../lib/format'
import { AsyncButton } from '../ui/AsyncButton'
import { useAsyncAction } from '../ui/useAsyncAction'

function canSendCollection(collection) {
  return (
    Number(collection.currentDebt) > 0 &&
    Number(collection.currentInstallment) <= Number(collection.installments)
  )
}

export function CollectionSendActions({ collection }) {
  const { setError, setSuccess } = useAppData()
  const [sending, runSend] = useAsyncAction()
  const canSend = canSendCollection(collection)

  async function handleSendCharge() {
    setError('')
    setSuccess('')

    await runSend(async () => {
      try {
        const result = await apiRequest(`collections/${collection.id}/send-charge`, {
          method: 'POST',
        })

        setSuccess(
          `Cobro enviado por WhatsApp (cuota ${result.installmentNumber}: ${money.format(result.amountUsd)} / ${Number(result.amountBs).toFixed(2)} Bs).`,
        )
      } catch (requestError) {
        setError(requestError.message)
      }
    })
  }

  return (
    <div className="collection-send-actions">
      <AsyncButton
        type="button"
        className="table-btn accent"
        disabled={!canSend}
        loading={sending}
        onClick={handleSendCharge}
      >
        Enviar cobro
      </AsyncButton>
    </div>
  )
}

export { canSendCollection }
