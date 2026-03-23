export const extractAdminApiError = (error, fallback = 'Request failed.') => {
  const apiData = error?.response?.data
  if (apiData?.message) return apiData.message
  if (apiData?.errors) return Object.values(apiData.errors).flat().join(' ')
  return fallback
}
