import { router } from '@inertiajs/react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
] as const

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div className="flex gap-1">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => {
            i18n.changeLanguage(lang.code)
            axios.defaults.headers.common['Accept-Language'] = lang.code
            router.reload()
          }}
          className={`px-2 py-1 text-[10px] uppercase tracking-widest border rounded transition-all ${
            i18n.language === lang.code
              ? 'border-cyber-blue/50 bg-cyber-blue/10 text-cyber-blue'
              : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-white'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
