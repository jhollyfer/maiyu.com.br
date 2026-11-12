import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  LoginIdentity,
  right,
  type Either,
  type LoginIdentityValue,
} from '@maiyu/shared'

import LegacyAwareHashDriver from '#core/legacy-aware-hash-driver'
import type { User } from '#domain/user/user.entity'
import HTTPException from '#exceptions/http.exception'
import {
  SessionRepository,
  type SessionTokens,
} from '#repositories/session/session.repository'
import { UserRepository } from '#repositories/user/user.repository'
import type { AuthenticationSessionSignInPayload } from '#validators/authentication/sessions.validator'

type Payload = AuthenticationSessionSignInPayload
type Response = Either<HTTPException, SessionTokens>

/**
 * Opens the session. Nonexistent account, wrong password and inactive account get the
 * same `401`: the response does not confirm that the account existed
 * nor why it was refused.
 *
 * Nothing from the payload is logged here: `backend-old` printed the received
 * password in the sign-in use case's `console.log`.
 */
@inject()
export default class AuthenticationSessionSignInUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // Whether it gets in is decided by the account (`canSignIn`), after the password is
      // checked.
      const user = await this.find(LoginIdentity.of(payload.login))

      // A nonexistent account also spends the time of a hash, so the response
      // does not reveal by the clock that the login is not registered.
      if (!user) {
        await hash.make(payload.password)

        return left(this.invalidCredentials())
      }

      const hasher = LegacyAwareHashDriver.hasher()
      const stored = user.snapshot().password
      const passwordMatches = await hasher.verify(stored, payload.password)

      if (!passwordMatches || !user.canSignIn())
        return left(this.invalidCredentials())

      // Sign-in is the only moment the plain password is at hand, so an old hash (scrypt, or
      // argon with weaker parameters) is redone here (DECISIONS.md #314, #370).
      if (hasher.needsReHash(stored))
        await this.rehash(user.id, stored, payload.password)

      const tokens = await this.sessions.issue(user.id)
      if (!tokens)
        return left(
          HTTPException.InternalServerError(
            this.i18n.t('errors.internal'),
            'AUTHENTICATION_SESSION_SIGN_IN_ERROR',
          ),
        )

      return right(tokens)
    } catch (error) {
      // Only a wrong credential becomes 401. Any other failure (database down, for
      // example) remains a server error - it is not worth lying with 401.
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[authentication/sessions > sign-in][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'AUTHENTICATION_SESSION_SIGN_IN_ERROR',
        ),
      )
    }
  }

  /** The login is an e-mail or a phone (DECISIONS.md #396); each has its own unique column. */
  private find(identity: LoginIdentityValue): Promise<User | null> {
    if (identity.kind === 'email') return this.users.findByEmail(identity.value)

    return this.users.findByPhone(identity.value)
  }

  /**
   * A failed rehash must not refuse a right password: the next sign-in tries again, so the
   * failure is caught here and only logged (`_standards/backend.md` §5.6 item 6, named
   * exception to §4.2: the repository lets the I/O error rise, as in `DECISIONS.md` #352).
   */
  private async rehash(
    userId: string,
    stored: string,
    password: string,
  ): Promise<void> {
    try {
      await this.users.rehashPassword(userId, stored, password)
    } catch (error) {
      HttpContext.getOrFail().logger.warn(
        { err: error },
        '[authentication/sessions > sign-in][rehash-error]',
      )
    }
  }

  private invalidCredentials(): HTTPException {
    return HTTPException.Unauthorized(
      this.i18n.t('sessions.invalid_credentials'),
      'INVALID_CREDENTIALS',
      { root: this.i18n.t('sessions.invalid_credentials_field') },
    )
  }
}
