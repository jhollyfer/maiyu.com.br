import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type AccountProfileShowResponse,
  type Actor,
  type Either,
} from '@maiyu/shared'

import { ProfilePresenter } from '../profile.presenter.ts'

import HTTPException from '#exceptions/http.exception'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { UserRepository } from '#repositories/user/user.repository'
import { StorageContract } from '#services/storage/storage.contract'

/** Who asks: the session account (`_standards/backend.md` §4.3). */
type Payload = { readonly actor: Actor }
type Response = Either<HTTPException, AccountProfileShowResponse>

/**
 * Reads the account of the session. The `id` comes from the `actor` and never from the
 * request: there is no identifier in the path, and the scope is the token's. The photo is read
 * through the repository, so a file the request does not reach reads as no photo, and signed here.
 */
@inject()
export default class AccountProfileShowUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storages: StorageRepository,
    private readonly bucket: StorageContract,
    private readonly i18n: I18n,
  ) {}

  async execute({ actor }: Payload): Promise<Response> {
    try {
      const user = await this.users.findById(actor.id)

      // The guard read this account a moment ago; one that vanished in between is a session
      // that no longer has an owner, which is a 401 and not a 404 or a 500.
      if (!user)
        return left(
          HTTPException.Unauthorized(
            this.i18n.t('sessions.missing'),
            'AUTHENTICATION_REQUIRED',
          ),
        )

      const { avatarId } = user.snapshot()
      const [file = null] = await this.storages.detailsOf(
        [avatarId].filter((id) => id !== null),
      )

      return right(
        ProfilePresenter.show(user, await this.bucket.withOptionalUrl(file)),
      )
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[account/profile > show][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ACCOUNT_PROFILE_SHOW_ERROR',
        ),
      )
    }
  }
}
