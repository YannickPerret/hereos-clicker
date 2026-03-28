/**
 * Returns the current locale from localStorage.
 */
export function getLocale(): string {
  return localStorage.getItem('hereos-lang') || 'fr'
}

/**
 * Returns headers with Accept-Language set to the current locale.
 * Merge with your existing headers for fetch() calls.
 */
export function localeHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Accept-Language': getLocale(),
    ...extra,
  }
}
