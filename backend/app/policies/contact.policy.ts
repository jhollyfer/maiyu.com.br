import type { AuthorizationResponse } from '@adonisjs/bouncer'

import { STAFF_USER_ROLES, type Actor } from '@maiyu/shared'

import type { Contact } from '#domain/contact/contact.entity'
import SessionScopedPolicy from '#policies/session-scoped-policy.base'

/**
 * Who reads and handles a contact message. The route group already asks for a staff role, and
 * this is the second barrier, at the record: it holds even if a route is ever moved out of the
 * group.
 *
 * It receives `(actor, contact | null)`. A missing contact answers `404 CONTACT_NOT_FOUND`
 * with the same code and key as the use case's own not found, so the response is identical
 * whichever layer gives it. A non-staff actor is `403`: the record exists and is seen, but
 * not theirs to touch. It passes the key and the code; the handler translates
 * (DECISIONS.md #346).
 */
export default class ContactPolicy extends SessionScopedPolicy {
  manage(actor: Actor, contact: Contact | null): true | AuthorizationResponse {
    if (!STAFF_USER_ROLES.includes(actor.role))
      return this.forbidden('CONTACT_FORBIDDEN', 'contacts.forbidden')

    if (!contact) return this.hidden('CONTACT_NOT_FOUND', 'contacts.not_found')

    return true
  }
}
