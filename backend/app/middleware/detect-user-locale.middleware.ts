import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { I18n } from '@adonisjs/i18n'
import i18nManager from '@adonisjs/i18n/services/main'

import { RequestLocale } from '#core/request-locale'

/**
 * The request language, read from `Accept-Language` and restricted to pt-BR, es and en,
 * with a pt-BR fallback (`_standards/i18n.md` §3,
 * _doc-lib/adonisjs.md#guides/digging-deeper/i18n).
 *
 * It puts in `ctx.i18n` the translator for that language and binds it as `I18n` in the
 * request container: the use case receives it by injection, and the VineJS messages
 * provider of `app/core/validator.ts` reads it from the request context. The 422 and the
 * business error come out in the language of whoever asked; the envelope `code` is never
 * translated.
 */
export default class DetectUserLocaleMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.i18n = i18nManager.locale(RequestLocale.of(ctx))
    // Whoever injects `I18n` through the container receives the request's.
    ctx.containerResolver.bindValue(I18n, ctx.i18n)

    await next()
  }
}
