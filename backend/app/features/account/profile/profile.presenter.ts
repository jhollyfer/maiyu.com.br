import type { AccountProfileShowResponse } from '@maiyu/shared'

import type { User } from '#domain/user/user.entity'

/**
 * The owner's account in the shape of the `shared/` response (`_standards/architecture.md`
 * §10): an allowlist, one field at a time. The password and its hash are on the entity and
 * never leave, because they are not in this list. `GET` and `PUT /account/profile` answer
 * with the same shape.
 */
export class ProfilePresenter {
  static show(user: User): AccountProfileShowResponse {
    const props = user.snapshot()

    return {
      id: props.id,
      name: props.name,
      email: props.email,
      phone: props.phone,
      platformRole: props.platformRole,
    }
  }
}
