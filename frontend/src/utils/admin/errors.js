import { extractApiErrorMessage } from '../api/errors'

export const extractAdminApiError = (error, fallback = 'Request failed.') =>
  extractApiErrorMessage(error, fallback)
