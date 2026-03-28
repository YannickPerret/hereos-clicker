import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    locale: string
  }
}

const SUPPORTED_LOCALES = ['fr', 'en'] as const

export default class LocaleMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const header = ctx.request.header('accept-language') || 'fr'
    const raw = header.split(',')[0].split('-')[0].toLowerCase()
    ctx.locale = SUPPORTED_LOCALES.includes(raw as any) ? raw : 'fr'
    return next()
  }
}
