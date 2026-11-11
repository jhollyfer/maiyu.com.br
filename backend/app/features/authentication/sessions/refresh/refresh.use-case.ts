import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type Either } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import {
  SessionRepository,
  type SessionTokens,
} from '#repositories/session/session.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UserRepository } from '#repositories/user/user.repository'

type Payload = {
  readonly refreshToken?: string
}

type Response = Either<HTTPException, SessionTokens>

/**
 * Swaps the used refresh for a new pair (rotation): the used one dies here, and a used one
 * that comes back drops every session of the account (reuse detection, RFC 6819,
 * `DECISIONS.md` #363). Two simultaneous refreshes with the same token are not reuse: one
 * wins, the other gets 401 and the family stays (`_standards/backend.md` §4.10).
 */
@inject()
export default class AuthenticationSessionRefreshUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    if (!payload.refreshToken) {
      return left(
        HTTPException.Unauthorized(
          this.i18n.t('sessions.missing'),
          'AUTHENTICATION_REQUIRED',
        ),
      )
    }

    // The global `try` starts before the first trip to the database (_standards/backend.md §4.2).
    try {
      const grant = await this.sessions.readRefresh(payload.refreshToken)

      if (!grant) {
        // A consumed refresh that comes back is reuse: someone holds a copy of it, so every
        // session of the account goes, the pair issued from it included. The mark is read
        // only after the live row is gone: the `DELETE` and the mark commit together, so a
        // rotation that committed between the two reads is never missed.
        const reusedBy = await this.sessions.findReused(payload.refreshToken)

        // One `DELETE`, atomic on its own: no unit of work to hold.
        if (reusedBy) await this.sessions.revokeAll(reusedBy)

        return left(this.invalid())
      }

      // The same question as the guard, not just reading the account: refreshing without the
      // filter would extend in writing a session that was already ended.
      const user = await this.users.findById(grant.userId)

      if (!user || !user.canSignIn()) return left(this.invalid())

      // Consume, mark and issue share one unit of work (`_standards/domain.md` §6) on one
      // connection, so the row lock lasts until the new pair is committed and a parallel
      // request with the same token only learns it lost after that. Losing the `DELETE` is
      // not reuse: the token was live when read, the winner holds the new pair, and dropping
      // the family would end the session the winner just rotated (`_standards/backend.md`
      // §4.10, "um ganha, o outro recebe 401").
      return await this.unitOfWork.run(async (): Promise<Response> => {
        if (!(await this.sessions.consume(grant))) return left(this.invalid())

        const tokens = await this.sessions.issue(user.id)
        if (!tokens) return left(this.internal())

        return right(tokens)
      })
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[authentication/sessions > refresh][error]',
      )

      return left(this.internal())
    }
  }

  /** The same 401 for garbage, expired, revoked and reused: the answer does not tell them apart. */
  private invalid(): HTTPException {
    return HTTPException.Unauthorized(
      this.i18n.t('sessions.invalid'),
      'AUTHENTICATION_REQUIRED',
    )
  }

  private internal(): HTTPException {
    return HTTPException.InternalServerError(
      this.i18n.t('errors.internal'),
      'AUTHENTICATION_SESSION_REFRESH_ERROR',
    )
  }
}
