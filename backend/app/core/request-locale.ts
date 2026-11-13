import type { HttpContext } from '@adonisjs/core/http'
import i18nManager from '@adonisjs/i18n/services/main'

import { BASE_LOCALE } from '@maiyu/shared'

/**
 * The language of a request, negotiated once for the whole API: the language middleware and the
 * exception handler (which answers before the middleware on a nonexistent route) both read it
 * here, so one request never gets two languages.
 *
 * It reads the raw `Accept-Language`, with its qualities and regional variants (`en-US` serves
 * `en`). `request.languages()` is already sorted and has lost the `q`, so a negotiation over it
 * tied `fr;q=0.9, en-US;q=0.8, es;q=0.5` and preferred the exact `es` over the variant `en-US`
 * (_doc-lib/adonisjs.md#guides/digging-deeper/i18n, which hands the detection to the
 * `Accept-Language` header; `@adonisjs/i18n` negotiates it with `negotiator`).
 */
export class RequestLocale {
  /** The supported language of the request, the base language when the header names none. */
  static of(ctx: Pick<HttpContext, 'request'>): string {
    const header = ctx.request.header('accept-language')
    if (!header) return BASE_LOCALE

    return i18nManager.getSupportedLocaleFor(header) ?? BASE_LOCALE
  }
}
