import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/cors'

import env from '#start/env'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */

/**
 * The allowlist comes from `CORS_ORIGINS`, comma-separated, read once here and
 * exported: the origin middleware reads the same list instead of parsing again.
 *
 * It must be explicit: with `credentials: true` below, the protocol refuses
 * `*` - the browser does not send a cookie to a wildcard origin. So either the
 * frontend origin is listed, or there is no session between the two.
 */
export const corsOrigins: ReadonlyArray<string> = (
  env.get('CORS_ORIGINS') ?? ''
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

/**
 * In production the list is required: empty, the origin barrier refuses every
 * write and the frontend does not get in. Starting like that is a configuration error, and the boot
 * stops instead of waiting for the first user (_standards/backend.md §4.10).
 */
if (app.inProduction && corsOrigins.length === 0) {
  throw new Error(
    'CORS_ORIGINS is required in production: list the frontend origins',
  )
}

const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * The same allowlist in every environment, development included
   * (_standards/backend.md §6, `CORS_ORIGINS`: "sim, em todo ambiente"). There it
   * lists the frontend on `localhost` (`.env.example`), and an origin off the list
   * gets no CORS header, as in production. The default `origin: true` reflects
   * every origin, and the page says to replace it before deploying
   * (_doc-lib/adonisjs.md#guides/security/cors,
   * https://docs.adonisjs.com/guides/security/cors).
   */
  origin: [...corsOrigins],

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * The headers the preflight allows, not `true`.
   *
   * `true` reflects back whatever the browser asked for. The
   * explicit list is what makes a new header enter by decision and not by accident.
   *
   * `content-type` and `accept` are the minimum of any JSON request;
   * `x-request-id` is what the log correlates.
   */
  headers: ['content-type', 'accept', 'x-request-id'],

  /**
   * Response headers exposed to the browser.
   *
   * `content-disposition` is not among the simple response headers, so
   * without this line the page JavaScript reads `null` when looking for it - even with the
   * API sending the header, and even in development. It is how the
   * CSV export finds out the file name to save.
   *
   * `retry-after` is not a simple response header either. The exception handler
   * keeps it on the 429 (`DECISIONS.md` #293), and without it here the client
   * cannot tell the user when to try again.
   */
  exposeHeaders: ['content-disposition', 'retry-after'],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
