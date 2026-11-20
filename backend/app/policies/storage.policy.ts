import type { AuthorizationResponse } from '@adonisjs/bouncer'

import type { Actor } from '@maiyu/shared'

import type { Storage } from '#domain/storage/storage.entity'
import SessionScopedPolicy from '#policies/session-scoped-policy.base'

/**
 * Who reaches which file: the download route, the detail (`GET /storages/:id`), the removal
 * (`DELETE /storages/:id`) and the upload routes (`GET /storages/:id/parts`, `POST
 * /storages/:id/complete`). One policy, four actions, the same denial.
 *
 * The download route exists because the `download` attribute of an `<a>` is ignored across
 * origins; it is not an alternative read path. What the site shows comes out through a signed
 * `url`, derived on reading the resource that contains it - and whoever reaches that resource has
 * already passed its authorization.
 *
 * `download`: the administrator downloads every file of the tenants it reads (its own and its
 * children, DECISIONS.md #390). The end customer downloads the file it uploaded (`customer_id`, a
 * payment proof, DECISIONS.md #397). The other roles reach only what is theirs - today, their own
 * avatar, which the `actor` already carries, without a query (the policy does not go to the
 * database beyond the target, _standards/architecture.md §2). Closed by default.
 *
 * `show`, `delete` and `upload` (`parts`, `complete`; DECISIONS.md #803): the detail hands out a signed URL and the removal
 * destroys the binary, so both are narrower than the tenant's shared library. They reach a file
 * that the `actor` uploaded itself (`uploaded_by`: the pending photo, the orphan it discards, the
 * avatar it swaps) and, for the tenant's own files (`customer_id` null), the staff of the tenant.
 * A plain member never reaches another member's file. A file an end customer owns is the
 * customer's alone, in these two actions: the staff reads the proof through `download`. The
 * removal also needs the tenant to be one the `actor` writes in: a parent tenant reads its
 * children's files and never removes them. The listing (`GET /storages`) is not a policy
 * call, it is the same rule written as a `where` (`StorageRepository.paginate`, like the tenant
 * scope): the staff of the tenant lists every file it reads, any other account lists only what it
 * uploaded itself, so the list never shows what the detail refuses.
 *
 * It receives `(actor, file | null)`. The denial is `404` and not `403`, the same
 * response as a nonexistent file: a 403 would confirm to whoever probes that this
 * uuid exists (_standards/backend.md §4.6). It passes the key and the code; the handler
 * translates (DECISIONS.md #346).
 *
 * Authorization: _doc-lib/adonisjs.md#guides/auth/authorization,
 * https://docs.adonisjs.com/guides/auth/authorization.
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

  show(actor: Actor, storage: Storage | null): true | AuthorizationResponse {
    return this.reach(actor, storage, 'read')
  }

  delete(actor: Actor, storage: Storage | null): true | AuthorizationResponse {
    return this.reach(actor, storage, 'write')
  }

  /**
   * `parts` (signed PUT URLs and the signed `url` of the file) and `complete` (closing the upload):
   * whoever writes the file, the same rule as `delete`. Without it, a member would hijack another
   * member's pending upload by sending its own bytes to the signed URLs.
   */
  upload(actor: Actor, storage: Storage | null): true | AuthorizationResponse {
    return this.reach(actor, storage, 'write')
  }

  private reach(
    actor: Actor,
    storage: Storage | null,
    access: 'read' | 'write',
  ): true | AuthorizationResponse {
    if (!storage) return this.hidden('STORAGE_NOT_FOUND', 'files.not_found')
    const { tenantId, customerId, uploadedBy } = storage.snapshot()
    if (actor.avatarId === storage.id) return true
    // A customer's file is the customer's alone: the tenant staff downloads it, never browses it.
    if (customerId !== null) {
      if (this.ownsRow(actor, customerId)) return true

      return this.hidden('STORAGE_NOT_FOUND', 'files.not_found')
    }
    if (!this.reachesTenant(actor, tenantId, access))
      return this.hidden('STORAGE_NOT_FOUND', 'files.not_found')
    if (uploadedBy !== null && uploadedBy === actor.id) return true
    if (this.isStaffOf(actor, tenantId)) return true

    return this.hidden('STORAGE_NOT_FOUND', 'files.not_found')
  }

  /** The tenant of the row is one the `actor` reads, or writes when the action removes. */
  private reachesTenant(
    actor: Actor,
    tenantId: string | null,
    access: 'read' | 'write',
  ): boolean {
    if (access === 'write') return this.writesTenant(actor, tenantId)

    return this.readsTenant(actor, tenantId)
  }
}
