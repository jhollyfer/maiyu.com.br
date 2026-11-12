import type { AdministratorContactShowResponse } from '@maiyu/shared'

import type { Contact } from '#domain/contact/contact.entity'

/**
 * The contact in the shape of the `shared/` response (`_standards/architecture.md` §10): an
 * allowlist, one field at a time, with the dates as ISO text.
 */
export class ContactPresenter {
  static show(contact: Contact): AdministratorContactShowResponse {
    const props = contact.snapshot()

    return {
      id: props.id,
      name: props.name,
      email: props.email,
      message: props.message,
      locale: props.locale,
      answeredAt: props.answeredAt?.toISOString() ?? null,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt?.toISOString() ?? null,
    }
  }
}
