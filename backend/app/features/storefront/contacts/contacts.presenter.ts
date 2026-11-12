import type { StorefrontContactCreateResponse } from '@maiyu/shared'

import type { Contact } from '#domain/contact/contact.entity'

/**
 * The receipt the visitor gets after sending a contact (`_standards/architecture.md` §10), by
 * allowlist: the data they typed is not echoed back, and nothing of the panel leaves here.
 */
export class ContactPresenter {
  static receipt(contact: Contact): StorefrontContactCreateResponse {
    const props = contact.snapshot()

    return { id: props.id, createdAt: props.createdAt.toISOString() }
  }
}
