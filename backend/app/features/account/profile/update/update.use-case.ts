import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type AccountProfileUpdateResponse,
  type Actor,
  type Either,
  type Merge,
} from '@maiyu/shared'

import { ProfileRefusal } from '../_shared.profile-refusal.ts'
import { ProfilePresenter } from '../profile.presenter.ts'

import LegacyAwareHashDriver from '#core/legacy-aware-hash-driver'
import HTTPException from '#exceptions/http.exception'
import { EmailChangeRepository } from '#repositories/email-change/email-change.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { UserRepository } from '#repositories/user/user.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { EmailChangeContract } from '#services/email-change/email-change.contract'
import EmailToken from '#services/email-change/email-token'
import { StorageContract } from '#services/storage/storage.contract'
import type { AccountProfileUpdatePayload } from '#validators/account/profile.validator'

/** The session account: the guard already read it, excluding archived and inactive. */
type Payload = Merge<AccountProfileUpdatePayload, { readonly actor: Actor }>

type Result = {
  readonly profile: AccountProfileUpdateResponse
  /** Whether every session of the account ended, so the controller clears the cookies. */
  readonly sessionsRevoked: boolean
}

type Response = Either<HTTPException, Result>

/**
 * Changes the owner's name, password or phone. The current password comes first: the cookie
 * proves the session, not the person, and a stolen cookie must not be able to lock the owner
 * out. Changing the password or the phone (what the account signs in with) ends every session of
 * the account, the one that made this request included: `UserRepository.save` writes the row and
 * the revocation in one transaction, so a failed save keeps the old credentials and its sessions.
 *
 * A new password equal to the current one is `422 PASSWORD_SAME_AS_CURRENT` on `password`; a phone
 * another account holds is `422 PHONE_TAKEN` on `phone`.
 *
 * A name or a photo alone is not a credential: `200` and the sessions stay. The photo (`avatarId`)
 * must be a live, confirmed file the request owns, else `422 AVATAR_INVALID`.
 *
 * The e-mail does not change here (DECISIONS.md #442): the request keeps a pending change
 * (`EmailChangeRepository`) and sends a one-use token to the new address (`EmailChangeContract`), the answer carries it in
 * `pendingEmail`, and the e-mail only changes in `account/email/confirm`. Where the contract is
 * unavailable (no e-mail block or no SMTP) it is `422 EMAIL_CHANGE_UNAVAILABLE`; the same address
 * the account has is `422 EMAIL_SAME_AS_CURRENT`, another account's is `422 EMAIL_TAKEN`.
 */
@inject()
export default class AccountProfileUpdateUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storages: StorageRepository,
    private readonly bucket: StorageContract,
    private readonly emailChange: EmailChangeContract,
    private readonly emailChanges: EmailChangeRepository,
    private readonly clock: ClockContract,
    private readonly i18n: I18n,
  ) {}

  async execute({
    actor,
    currentPassword,
    email,
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

      const hasher = LegacyAwareHashDriver.hasher()
      const stored = user.snapshot().password
      const proven =
        currentPassword !== undefined &&
        (await hasher.verify(stored, currentPassword))
      if (!proven) return left(this.wrongCurrentPassword())

      if (
        patch.avatarId &&
        !(await this.storages.areAttachable([patch.avatarId], actor.id))
      )
        return left(ProfileRefusal.avatarInvalid(this.i18n))

      if (email !== undefined) {
        const refused = await this.refuseEmail(user.snapshot().email, email)
        if (refused) return left(refused)
      }

      // Same password is not a change, yet it would end every session: refused before the entity
      // is touched. The entity only holds the hash, so the comparison is a verify against it.
      if (
        patch.password !== undefined &&
        (await hasher.verify(stored, patch.password))
      )
        return left(
          ProfileRefusal.http({ code: 'PASSWORD_SAME_AS_CURRENT' }, this.i18n),
        )

      const phoneChanged =
        patch.phone !== undefined && patch.phone !== user.snapshot().phone

      // An e-mail alone writes nothing in the account: the row only changes on confirmation.
      const changesAccount = [
        patch.name,
        patch.phone,
        patch.password,
        patch.avatarId,
      ].some((value) => value !== undefined)
      if (changesAccount) {
        user.update(patch, this.clock.now().toJSDate())
        const saved = await this.users.save(user)
        if (saved.isLeft())
          return left(ProfileRefusal.http(saved.value, this.i18n))
      }

      if (email !== undefined) await this.requestEmailChange(user.id, email)

      const { avatarId } = user.snapshot()
      const [file = null] = await this.storages.detailsOf(
        [avatarId].filter((id) => id !== null),
      )

      return right({
        profile: ProfilePresenter.update(
          user,
          await this.bucket.withOptionalUrl(file),
          email ?? null,
        ),
        sessionsRevoked: patch.password !== undefined || phoneChanged,
      })
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[account/profile > update][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ACCOUNT_PROFILE_UPDATE_ERROR',
        ),
      )
    }
  }

  /** Keeps the pending change, with the hash of a new token, and mails the token to the new address. */
  private async requestEmailChange(
    userId: string,
    email: string,
  ): Promise<void> {
    const token = EmailToken.generate()
    await this.emailChanges.replace({
      userId,
      email,
      tokenHash: EmailToken.hash(token),
      expiresAt: this.clock
        .now()
        .plus({ minutes: EmailToken.EXPIRES_IN_MINUTES })
        .toJSDate(),
    })
    await this.emailChange.deliver({ to: email, token }, this.i18n)
  }

  /** The refusal of the requested e-mail, or `null` when the request may go on. */
  private async refuseEmail(
    current: string | null,
    email: string,
  ): Promise<HTTPException | null> {
    if (!this.emailChange.isAvailable())
      return ProfileRefusal.emailChangeUnavailable(this.i18n)
    if (current?.toLowerCase() === email)
      return ProfileRefusal.emailSameAsCurrent(this.i18n)
    if (await this.users.findByEmail(email))
      return ProfileRefusal.http({ code: 'USER_EMAIL_TAKEN' }, this.i18n)

    return null
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
}
