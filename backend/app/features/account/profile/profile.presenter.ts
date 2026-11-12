import type {
  AccountProfileShowResponse,
  AccountProfileUpdateResponse,
  Actor,
} from '@maiyu/shared'

import type { User } from '#domain/user/user.entity'

/**
 * The owner's account in the shape of the `shared/` response (`_standards/architecture.md`
 * §10): an allowlist, one field at a time. The password and its hash are on the entity and
 * never leave, because they are not in this list. `GET` and `PUT /account/profile` answer
 * with the same shape, the second one with the e-mail that waits for its confirmation.
 *
 * `tenant` is the active membership of the `actor`, cut down to `{ id, role }`: with
 * `platformRole` it is what the panel's route guard reads (DECISIONS.md #491).
 *
 * The photo arrives already signed (`StorageContract.withOptionalUrl`): signing is the use
 * case's, the presenter only places it.
 */
export class ProfilePresenter {
  static show(
    user: User,
    avatar: AccountProfileShowResponse['avatar'],
    tenant: Actor['tenant'],
  ): AccountProfileShowResponse {
    const props = user.snapshot()

    return {
      id: props.id,
      name: props.name,
      email: props.email,
      phone: props.phone,
      platformRole: props.platformRole,
      avatar,
      tenant: tenant && { id: tenant.id, role: tenant.role },
    }
  }

  static update(
    user: User,
    avatar: AccountProfileShowResponse['avatar'],
    tenant: Actor['tenant'],
    pendingEmail: string | null,
  ): AccountProfileUpdateResponse {
    return { ...ProfilePresenter.show(user, avatar, tenant), pendingEmail }
  }
}
