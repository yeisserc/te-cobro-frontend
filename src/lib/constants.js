export const API_URL = import.meta.env.VITE_API_URL

export const SESSION_KEY = 'cobrofacil-user'
export const APP_NAME = 'CobroFacil'

export const PHONE_CODES = ['0412', '0414', '0416', '0422', '0424', '0426']

export const PAYMENT_BANKS = [
  { value: 'banco_de_venezuela', label: 'Banco de Venezuela' },
]

export const LAST_MONTH_DAY = 'ultimo'
export const LAST_MONTH_DAY_LABEL = 'Último del mes'

export const clientInitialForm = {
  firstName: '',
  lastName: '',
  nickname: '',
  phoneCode: '',
  phoneNumber: '',
}

export const collectionInitialForm = {
  clientId: '',
  totalDebt: '',
  installments: '',
  frequency: 'Semanal',
  collectionDay: '',
  collectionDay2: '',
  concept: '',
}
