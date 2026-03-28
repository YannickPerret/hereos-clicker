export function getCsrfToken() {
  if (typeof document === 'undefined') return ''

  const tokenEntry = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='))

  if (!tokenEntry) return ''

  const rawValue = tokenEntry.slice('XSRF-TOKEN='.length)
  const decoded = decodeURIComponent(rawValue)

  if (decoded.startsWith('"') && decoded.endsWith('"')) {
    return decoded.slice(1, -1)
  }

  return decoded
}
