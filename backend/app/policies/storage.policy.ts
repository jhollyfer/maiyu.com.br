import type { AuthorizationResponse } from '@adonisjs/bouncer'

import type { Actor } from '@maiyu/shared'

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
 * The administrator downloads every file of the tenants it reads (its own and its children,
 * DECISIONS.md #390). The end customer downloads the file it uploaded (`customer_id`, a payment
 * proof, DECISIONS.md #397). The other roles reach only what is theirs - today,
 * their own avatar, which the `actor` already carries, without a query (the policy does not go to
 * the database beyond the target, _standards/architecture.md §2). Closed by default.
 *
 * The library (`GET /storages`) and the detail (`GET /storages/:id`) are not behind this policy on
 * purpose: inside one tenant the files are shared by its members. The owner the kit keeps per file is
 * the end customer's (`customer_id`), not the member's, so there is no member's "own file" to
 * narrow to, and the upload flow of every role reads
 * `GET /storages/:id` after confirming (`use-multipart-upload.ts`). What closes the door is the
 * tenant: another tenant's file, or any file for an account without a membership, is simply not
 * found (`TenantScoped`). A project whose files are private inside a tenant adds the owner and the
 * rule here.
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
    if (!storage) return this.hidden('STORAGE_NOT_FOUND', 'files.not_found')
    const { tenantId, customerId } = storage.snapshot()
    if (actor.avatarId === storage.id) return true
    if (this.reachesCustomerRow(actor, tenantId, customerId)) return true

    return this.hidden('STORAGE_NOT_FOUND', 'files.not_found')
  }
}
