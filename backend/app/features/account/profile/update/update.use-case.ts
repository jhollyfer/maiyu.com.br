import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type AccountProfileShowResponse,
  type Actor,
  type Either,
  type Merge,
} from '@maiyu/shared'

import { ProfileRefusal } from '../_shared.profile-refusal.ts'
import { ProfilePresenter } from '../profile.presenter.ts'

import LegacyAwareHashDriver from '#core/legacy-aware-hash-driver'
import HTTPException from '#exceptions/http.exception'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UserRepository } from '#repositories/user/user.repository'
import { ClockContract } from '#services/clock/clock.contract'
import type { AccountProfileUpdatePayload } from '#validators/account/profile.validator'

/** The session account: the guard already read it, excluding archived and inactive. */
type Payload = Merge<AccountProfileUpdatePayload, { readonly actor: Actor }>

type Result = {
  readonly profile: AccountProfileShowResponse
  /** Whether every session of the account ended, so the controller clears the cookies. */
  readonly sessionsRevoked: boolean
}

type Response = Either<HTTPException, Result>

/**
 * Changes the owner's e-mail or password. The current password comes first: the cookie
 * proves the session, not the person, and a stolen cookie must not be able to lock the owner
 * out. Changing either one ends every session of the account, the one that made this request
 * included: the entity asks for it, and the repository writes the row and the revocation on
 * the same unit of work, so a failed save keeps the old credential and its sessions.
 *
 * A new password equal to the current one is `422 PASSWORD_SAME_AS_CURRENT` on `password`.
 *
 * An e-mail equal to the current one is not a change: `200` and the sessions stay.
 */
@inject()
export default class AccountProfileUpdateUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: ClockContract,
    private readonly i18n: I18n,
  ) {}

  async execute({
    actor,
    currentPassword,
    ...patch
  }: Payload): Promise<Response> {
    try {
      const user = await this.users.findById(actor.id)

      // The guard read this account a moment ago; one that vanished in between is a session
      // that no longer has an owner: 401, not 404 or 500.
      if (!user)
        return left(
          HTTPException.Unauthorized(
            this.i18n.t('sessions.missing'),
            'AUTHENTICATION_REQUIRED',
          ),
        )

      const proven =
        currentPassword !== undefined &&
        (await LegacyAwareHashDriver.hasher().verify(
          user.snapshot().password,
          currentPassword,
        ))
      if (!proven) return left(this.wrongCurrentPassword())

      // Same password is not a change, yet it would end every session: refused before the entity
      // is touched. The entity only holds the hash, so the comparison is a verify against it.
      if (await this.isSamePassword(user.snapshot().password, patch.password))
        return left(
          ProfileRefusal.http({ code: 'PASSWORD_SAME_AS_CURRENT' }, this.i18n),
        )

      user.update(patch, this.clock.now().toJSDate())

      const saved = await this.unitOfWork.run(() => this.users.save(user))

      if (saved.isLeft()) {
        // `UNIQUE_CONFLICT` is the e-mail `UNIQUE` index; the other left is the database.
        if (saved.value.code === 'UNIQUE_CONFLICT')
          return left(ProfileRefusal.http({ code: 'EMAIL_IN_USE' }, this.i18n))

        return left(this.failure(saved.value.cause))
      }

      return right({
        profile: ProfilePresenter.show(user),
        sessionsRevoked: user.credentials().revokeSessions,
      })
    } catch (error) {
      return left(this.failure(error))
    }
  }

  private async isSamePassword(
    stored: string,
    candidate: string | undefined,
  ): Promise<boolean> {
    if (candidate === undefined) return false

    return LegacyAwareHashDriver.hasher().verify(stored, candidate)
  }

  private wrongCurrentPassword(): HTTPException {
    return HTTPException.UnprocessableEntity(
      this.i18n.t('account.current_password_invalid'),
      'CURRENT_PASSWORD_INVALID',
      {
        currentPassword: this.i18n.t('account.current_password_invalid_field'),
      },
    )
  }

  private failure(cause: unknown): HTTPException {
    HttpContext.getOrFail().logger.error(
      { err: cause },
      '[account/profile > update][error]',
    )

    return HTTPException.InternalServerError(
      this.i18n.t('errors.internal'),
      'ACCOUNT_PROFILE_UPDATE_ERROR',
    )
  }
}
