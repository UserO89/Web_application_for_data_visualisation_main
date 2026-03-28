const joinValidationMessages = (errors) => {
  if (!errors || typeof errors !== 'object') return ''

  const values = Object.values(errors)
    .flat()
    .map((message) => String(message || '').trim())
    .filter(Boolean)

  return values.join(' ')
}

export const extractApiErrorMessage = (error, fallback = 'Request failed.') => {
  const apiData = error?.response?.data

  if (typeof apiData?.message === 'string' && apiData.message.trim()) {
    return apiData.message.trim()
  }

  const validationMessage = joinValidationMessages(apiData?.errors)
  if (validationMessage) return validationMessage

  if (Number(error?.response?.status || 0) === 419) {
    return 'Session expired or CSRF token is invalid. Please try again.'
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot connect to API. Please check your network and backend server.'
  }

  return String(fallback || 'Request failed.')
}
