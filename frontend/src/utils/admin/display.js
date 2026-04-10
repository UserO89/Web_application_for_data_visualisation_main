import { getLocale } from '../../i18n'
import { getInitials } from '../display'

export const getAdminInitials = (name) => getInitials(name, 'U')

export const formatAdminDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString(getLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
