import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import { left, right, type Actor, type Either } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'
import { EmailChangeRepository } from '#repositories/email-change/email-change.repository'
import {
  SessionRepository,
  type SessionTokens,
} from '#repositories/session/session.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UserRepository } from '#repositories/user/user.repository'
import { ClockContract } from '#services/clock/clock.contract'
import EmailToken from '#services/email-change/email-token'

/** The session account and the token the e-mail carried. */
type Payload = { readonly actor: Actor; readonly token: string }
type Response = Either<HTTPException, SessionTokens>

/**
 * Proves the one-use token of the e-mail change and changes the e-mail (DECISIONS.md #442). The
 * token is claimed with a single conditional `DELETE` of the signed-in account's own row, so a
 * token of another account, a used one, an expired one and a made-up one are the same `422` on
 * `token`, and of two simultaneous confirmations one wins.
 *
 * The claim, the e-mail write and the new session share one unit of work. `UserRepository.save`
 * ends every session of the account when the e-mail changes, the one that made this request
 * included, so this session is given a new pair in the same transaction: the other sessions are
 * gone, this one carries on. An address another account took meanwhile is `422 EMAIL_TAKEN` and
 * the claim is undone, so the token still works for a retry.
 */
@inject()
export default class AccountEmailConfirmUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly changes: EmailChangeRepository,
    private readonly sessions: SessionRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: ClockContract,
    private readonly i18n: I18n,
  ) {}

  async execute({ actor, token }: Payload): Promise<Response> {
    try {
      const user = await this.users.findById(actor.id)
      if (!user)
        return left(
          HTTPException.Unauthorized(
            this.i18n.t('sessions.missing'),
            'AUTHENTICATION_REQUIRED',
          ),
        )

      const now = this.clock.now().toJSDate()

      return await this.unitOfWork.run(async (): Promise<Response> => {
        const change = await this.changes.claim(
          user.id,
          EmailToken.hash(token),
          now,
        )
        if (!change) return left(this.invalidToken())

        const owner = await this.users.findByEmail(change.email)
        if (owner && owner.id !== user.id) return left(this.emailTaken())

        user.update({ email: change.email }, now)
        const saved = await this.users.save(user)
        if (saved.isLeft()) return left(this.emailTaken())

        const tokens = await this.sessions.issue(user.id)
        if (!tokens) return left(this.internal())

        return right(tokens)
      })
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[account/email > confirm][error]',
      )

      return left(this.internal())
    }
  }

  private invalidToken(): HTTPException {
    return HTTPException.UnprocessableEntity(
      this.i18n.t('email.token_invalid'),
      'EMAIL_TOKEN_INVALID',
      { token: this.i18n.t('email.token_invalid_field') },
    )
  }

  private emailTaken(): HTTPException {
    return HTTPException.UnprocessableEntity(
      this.i18n.t('account.email_taken'),
      'EMAIL_TAKEN',
      { token: this.i18n.t('account.email_taken_field') },
    )
  }

  private internal(): HTTPException {
    return HTTPException.InternalServerError(
      this.i18n.t('errors.internal'),
      'ACCOUNT_EMAIL_CONFIRM_ERROR',
    )
  }
}
