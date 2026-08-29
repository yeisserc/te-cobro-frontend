export const API_URL = import.meta.env.VITE_API_URL

export const SESSION_KEY = 'te-cobro-user'

export const PHONE_CODES = ['0412', '0414', '0416', '0422', '0424', '0426']

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
