import { defineConfig } from '@adonisjs/auth'
import type {
  InferAuthenticators,
  InferAuthEvents,
  Authenticators,
} from '@adonisjs/auth/types'

import { cookieAccessTokensGuard } from '#guards/cookie-access-tokens.guard'

const authConfig = defineConfig({
  /**
   * Default guard used when no guard is explicitly specified.
   */
  default: 'api',

  guards: {
    /**
     * API session, carried in an `httpOnly` cookie. Reuses Adonis' native
     * machinery of opaque access tokens and swaps the
     * transport: no `Authorization` header.
     */
    api: cookieAccessTokensGuard(),
  },
})

export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<
    typeof authConfig
  > {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
