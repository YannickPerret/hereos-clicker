import '../css/app.css'
import '../i18n'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'

axios.defaults.headers.common['Accept-Language'] = localStorage.getItem('hereos-lang') || 'fr'

// Patch global fetch to include Accept-Language header
const originalFetch = window.fetch.bind(window)
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const locale = localStorage.getItem('hereos-lang') || 'fr'
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', locale)
  }
  return originalFetch(input, { ...init, headers })
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
