import type { AuthorizationResponse } from '@adonisjs/bouncer'

import { STAFF_USER_ROLES, type Actor } from '@maiyu/shared'

import type { Storage } from '#domain/storage/storage.entity'
import SessionScopedPolicy from '#policies/session-scoped-policy.base'

/**
 * Who downloads which file through the download route.
 *
 * The route exists because the `download` attribute of an `<a>` is ignored across
 * origins; it is not an alternative read path. What the site shows comes out
 * through a signed `url`, derived on reading the resource that contains it - and whoever
 * reaches that resource has already passed its authorization.
 *
 * The administrator downloads everything. The other roles reach only what is theirs - today,
 * their own avatar, which the `actor` already carries, without a query (the policy does not go to
 * the database beyond the target, _standards/architecture.md §2). Closed by default.
 *
 * It receives `(actor, file | null)`. The denial is `404` and not `403`, the same
 * response as a nonexistent file: a 403 would confirm to whoever probes that this
 * uuid exists (_standards/backend.md §4.6). It passes the key and the code; the handler
 * translates (DECISIONS.md #346).
 */
export default class StoragePolicy extends SessionScopedPolicy {
  download(
    actor: Actor,
    storage: Storage | null,
  ): true | AuthorizationResponse {
    if (storage && STAFF_USER_ROLES.includes(actor.role)) return true
    if (storage && actor.avatarId === storage.id) return true

    return this.hidden('STORAGE_NOT_FOUND', 'files.not_found')
  }
}
