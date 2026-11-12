import type { ContactStatus, Merge, Paginated } from '@maiyu/shared'

import type { PageCriteria } from '#core/page-criteria'
import type { Contact } from '#domain/contact/contact.entity'

/**
 * The panel listing: the page, the text search over name and e-mail, and the `status` cut.
 * The order is always newest first, so the column is closed to `createdAt`.
 */
export type ContactListCriteria = Merge<
  PageCriteria<'createdAt'>,
  { readonly status?: ContactStatus }
>

/**
 * The contact persistence, by intent (`_standards/domain.md` §5.1). The single writer of the
 * `contacts` table. There is no trash: `delete` and `deleteCreatedBefore` remove the row for
 * good, which is what the owner's deletion request and the 12 months sweep ask for.
 */
export abstract class ContactRepository {
  abstract findById(id: string): Promise<Contact | null>
  abstract create(contact: Contact): Promise<void>
  /** The listing, newest first, with the `id` tie-break that keeps the pages stable. */
  abstract paginate(criteria: ContactListCriteria): Promise<Paginated<Contact>>
  /**
   * Writes the answered state only while the row is still pending, in a single conditional
   * write (`UPDATE ... WHERE answered_at IS NULL`). Of two concurrent answers one gets `true`
   * and the other `false`, and the first instant is never overwritten.
   */
  abstract claimAnswer(contact: Contact): Promise<boolean>
  /** Deletes the row for good. */
  abstract delete(contact: Contact): Promise<void>
  /** Deletes every contact created before `cutoff`, answered or not; returns how many went. */
  abstract deleteCreatedBefore(cutoff: Date): Promise<number>
  /** How many contacts `deleteCreatedBefore` would delete, for the `--dry-run` of the sweep. */
  abstract countCreatedBefore(cutoff: Date): Promise<number>
}
