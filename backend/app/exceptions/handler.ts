import { errors as authErrors } from '@adonisjs/auth'
import { errors as bouncerErrors } from '@adonisjs/bouncer'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import i18nManager from '@adonisjs/i18n/services/main'
import { errors as limiterErrors } from '@adonisjs/limiter'

import { BASE_LOCALE } from '@maiyu/shared'

import { errors as vineErrors } from '#core/validator'
import HTTPException from '#exceptions/http.exception'
import type { HTTPExceptionPayload } from '#exceptions/http.exception'

type ThrottleError = InstanceType<typeof limiterErrors.E_TOO_MANY_REQUESTS>

type FieldMessage = {
  readonly field: string
  readonly message: string
}

type ClientErrorEntry = {
  readonly key: string
  readonly code: string
}

/**
 * The single global handler (_standards/backend.md §5.5).
 *
 * Only `HTTPException` and validation errors come out with their own message. Third-party
 * errors that reach the client in their own format (VineJS, guard, bouncer,
 * limiter) become the API `{ message, status, code }` envelope, framework 4xx
 * errors keep their status with a fixed translated message, and any
 * other 5xx error becomes the generic 500: Adonis' default renderer
 * passes `error.message` through raw, and a driver message carries table, column and
 * constraint (_doc-lib/adonisjs.md#guides/basics/exception-handling,
 * https://docs.adonisjs.com/guides/basics/exception-handling).
 */
export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected override debug = !app.inProduction

  /**
   * Expected failures of the normal flow are not incidents and stay out of the error
   * log (_doc-lib/adonisjs.md, "Decisões que a doc impõe";
   * https://docs.adonisjs.com/guides/basics/exception-handling).
   */
  protected override ignoreStatuses = [401, 403, 404, 422, 429]

  protected override ignoreCodes = [
    'E_VALIDATION_ERROR',
    'E_UNAUTHORIZED_ACCESS',
    'E_AUTHORIZATION_FAILURE',
    'E_TOO_MANY_REQUESTS',
    'E_ROUTE_NOT_FOUND',
    'E_ROW_NOT_FOUND',
  ]

  /**
   * Framework 4xx errors (route not found, Lucid row not found, body parser limits)
   * carry their own text, such as "Cannot GET:/admin/x", which echoes the path back.
   * The codes are the same ones the HTTPException factories pin for each status.
   */
  private static readonly CLIENT_ERRORS: Partial<
    Readonly<Record<number, ClientErrorEntry>>
  > = {
    404: { key: 'errors.not_found', code: 'RESOURCE_NOT_FOUND' },
    413: { key: 'errors.payload_too_large', code: 'PAYLOAD_TOO_LARGE' },
    415: {
      key: 'errors.unsupported_media_type',
      code: 'UNSUPPORTED_MEDIA_TYPE',
    },
  }

  private static readonly CLIENT_ERROR_FALLBACK: ClientErrorEntry = {
    key: 'errors.bad_request',
    code: 'INVALID_PARAMETERS',
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  override async handle(error: unknown, ctx: HttpContext) {
    // HTTPException resolves itself in its own `handle()`, with the message the
    // use case already translated.
    if (error instanceof HTTPException) {
      await super.handle(error, ctx)
      return
    }

    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return this.send(ctx, this.validationPayload(error.messages, ctx))
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      const exception = HTTPException.Unauthorized(
        this.translate(ctx, 'errors.unauthorized'),
      )

      return this.send(ctx, exception.toResponse())
    }

    /**
     * Policy denial through `ctx.bouncer` (_standards/backend.md §4.6). The policy
     * passes the key in `.t()` and the stable `code` in the message
     * (`policies/session-scoped-policy.base.ts`), and the translation happens here, in the
     * request language (DECISIONS.md #346). A policy that only returns `false` has
     * neither, and answers the generic 403.
     */
    if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
      const { message, status, translation } = error.response

      return this.send(ctx, {
        message: this.translate(
          ctx,
          translation?.identifier ?? 'errors.access_denied',
        ),
        status: status ?? 403,
        code: message ?? 'ACCESS_DENIED',
      })
    }

    if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
      return this.tooManyRequests(error, ctx)
    }

    const status = this.statusOf(error)

    if (status >= 500) {
      const exception = HTTPException.InternalServerError(
        this.translate(ctx, 'errors.internal'),
      )

      return this.send(ctx, exception.toResponse())
    }

    if (status >= 400) return this.clientError(ctx, status)

    // The base class types its return as `Promise<any>`; awaiting keeps `any` out of this method.
    await super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  override async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }

  private send(ctx: HttpContext, payload: HTTPExceptionPayload) {
    return ctx.response.status(payload.status).send(payload)
  }

  /**
   * The limiter's 429 in the API envelope, with a stable `code`. The block goes to the
   * log with the route tag and the limit numbers, without e-mail or body: the per-account
   * key carries the e-mail and does not leave here (_standards/backend.md §4.10 and
   * §5.5). A spike on this line is a sign of attack.
   */
  private tooManyRequests(error: ThrottleError, ctx: HttpContext) {
    ctx.logger.warn(
      {
        route: ctx.route?.pattern,
        method: ctx.request.method(),
        ip: ctx.request.ip(),
        limit: error.response.limit,
        retryAfter: error.response.availableIn,
      },
      '[security > rate_limited] attempt ceiling exceeded',
    )

    const exception = HTTPException.TooManyRequests(
      this.translate(ctx, 'errors.too_many_requests'),
    )

    ctx.response
      .header('X-RateLimit-Limit', String(error.response.limit))
      .header('X-RateLimit-Remaining', String(error.response.remaining))
      .header('Retry-After', String(error.response.availableIn))

    return this.send(ctx, exception.toResponse())
  }

  /**
   * VineJS delivers a list of messages (`{ field, rule, message }`). Here
   * it is flattened into field -> message, the same format the HTTPException `errors`
   * uses. The first message of each field wins: the screen shows one
   * error per field, and the first is that of the outermost rule.
   */
  private validationPayload(
    messages: unknown,
    ctx: HttpContext,
  ): HTTPExceptionPayload {
    return HTTPException.UnprocessableEntity(
      this.translate(ctx, 'errors.validation'),
      'VALIDATION_ERROR',
      this.toFieldErrors(messages),
    ).toResponse()
  }

  private toFieldErrors(messages: unknown): Record<string, string> {
    const errors: Record<string, string> = {}

    if (!Array.isArray(messages)) return errors

    const list: unknown[] = messages

    for (const item of list) {
      if (!this.isFieldMessage(item)) continue
      if (errors[item.field]) continue

      errors[item.field] = item.message
    }

    return errors
  }

  private isFieldMessage(value: unknown): value is FieldMessage {
    if (typeof value !== 'object' || value === null) return false
    if (!('field' in value) || !('message' in value)) return false

    return typeof value.field === 'string' && typeof value.message === 'string'
  }

  /** An error without status is 500, as Adonis treats it. */
  private statusOf(error: unknown): number {
    if (typeof error !== 'object' || error === null) return 500
    if (!('status' in error) || typeof error.status !== 'number') return 500

    return error.status
  }

  /** The status survives; the framework's own text never reaches the client. */
  private clientError(ctx: HttpContext, status: number) {
    const entry =
      HttpExceptionHandler.CLIENT_ERRORS[status] ??
      HttpExceptionHandler.CLIENT_ERROR_FALLBACK

    return this.send(ctx, {
      message: this.translate(ctx, entry.key),
      status,
      code: entry.code,
    })
  }

  /**
   * The language of whoever asked. The request translator only exists after the
   * language middleware; an error from before it (nonexistent route, server
   * middleware failure) falls here without `ctx.i18n`.
   */
  private translate(ctx: HttpContext, key: string): string {
    const language = i18nManager.getSupportedLocaleFor(ctx.request.languages())

    return i18nManager.locale(language ?? BASE_LOCALE).t(key)
  }
}
