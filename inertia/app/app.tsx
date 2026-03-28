import '../css/app.css'
import '../i18n'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { getCsrfToken } from '~/lib/csrf'

axios.defaults.headers.common['Accept-Language'] = localStorage.getItem('hereos-lang') || 'fr'
axios.defaults.withCredentials = true

// Patch global fetch to include Accept-Language header
const originalFetch = window.fetch.bind(window)
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const locale = localStorage.getItem('hereos-lang') || 'fr'
  const request = input instanceof Request ? input : null
  const headers = new Headers(request?.headers || undefined)
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value)
    })
  }

  const method = (init?.method || request?.method || 'GET').toUpperCase()
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', locale)
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken && !headers.has('X-XSRF-TOKEN')) {
      headers.set('X-XSRF-TOKEN', csrfToken)
    }
  }
  return originalFetch(input, {
    ...init,
    headers,
    credentials: init?.credentials || request?.credentials || 'same-origin',
  })
}

createInertiaApp({
  progress: { color: '#00f0ff' },

  resolve: (name) => {
    return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
