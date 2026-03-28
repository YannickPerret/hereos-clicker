import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Render Inertia error pages when available, fallback to plain text
   * when request did not pass through Inertia middleware (ex: static 404).
   */
  private renderErrorPage(ctx: HttpContext, page: string, status: number, fallbackMessage: string) {
    if (ctx.inertia) {
      return ctx.inertia.render(page)
    }

    return ctx.response.status(status).send(fallbackMessage)
  }

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, ctx) => this.renderErrorPage(ctx, 'errors/not_found', 404, 'Not found'),
    '500..599': (_, ctx) => this.renderErrorPage(ctx, 'errors/server_error', 500, 'Server error'),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    if (error instanceof Error && error.message === 'Invalid or expired CSRF token') {
      logger.warn(
        {
          request_id: ctx.request.id(),
          method: ctx.request.method(),
          url: ctx.request.url(true),
          path: ctx.request.url(),
          referer: ctx.request.header('referer'),
          origin: ctx.request.header('origin'),
          inertia: ctx.request.header('x-inertia'),
          user_id: (ctx as any).auth?.user?.id ?? null,
        },
        'CSRF mismatch details'
      )
    }

    return super.report(error, ctx)
  }
}
