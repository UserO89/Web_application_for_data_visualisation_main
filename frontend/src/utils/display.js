export const getInitials = (name, fallback = 'U') => {
  const value = String(name || '').trim()
  if (!value) return String(fallback || 'U').trim() || 'U'

  const parts = value.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || ''
  const initials = (first + second).toUpperCase()
  return initials || (String(fallback || 'U').trim() || 'U')
}
