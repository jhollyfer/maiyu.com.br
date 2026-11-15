import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

import { z } from '@maiyu/shared'

import { TransactionContext } from '#core/transaction-context'
import {
  EmailChangeRepository,
  type PendingEmailChange,
} from '#repositories/email-change/email-change.repository'

/** The table of the `create_email_changes_table` migration. */
const TABLE = 'email_changes'

/** What `DELETE ... RETURNING` hands back; `expires_at` is a `Date` from the driver. */
const ClaimedRows = z.array(
  z.object({
    user_id: z.string(),
    new_email: z.string(),
    token_hash: z.string(),
  }),
)

/**
 * The pending e-mail change in the database. Every query goes through the client of the
 * transaction in progress, so the claim and the e-mail write of the confirmation can share one unit
 * of work.
 */
@inject()
export class EmailChangeLucidRepository extends EmailChangeRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async replace(change: PendingEmailChange): Promise<void> {
    await this.transaction.atomic(async () => {
      const client = this.transaction.client()
      await client.from(TABLE).where('user_id', change.userId).delete()
      await client.insertQuery().table(TABLE).insert({
        user_id: change.userId,
        new_email: change.email,
        token_hash: change.tokenHash,
        expires_at: change.expiresAt,
        created_at: DateTime.now().toJSDate(),
      })
    })
  }

  /**
   * One `DELETE ... RETURNING` is the whole critical section: the row is read and gone in a single
   * statement, so of two simultaneous confirmations one gets it and the other gets nothing
   * (_doc-lib/lucid.md#update-and-delete-queries,
   * https://lucid.adonisjs.com/docs/update-and-delete-queries, "Read back affected rows with
   * `returning`").
   */
  async claim(
    userId: string,
    tokenHash: string,
    now: Date,
  ): Promise<PendingEmailChange | null> {
    const rows: unknown = await this.transaction
      .client()
      .from(TABLE)
      .where('user_id', userId)
      .where('token_hash', tokenHash)
      .where('expires_at', '>', now)
      .delete()
      .returning(['user_id', 'new_email', 'token_hash'])

    const [row] = ClaimedRows.parse(rows)
    if (!row) return null

    return {
      userId: row.user_id,
      email: row.new_email,
      tokenHash: row.token_hash,
      // The row is gone and the caller only needs the address; the expiry already held.
      expiresAt: now,
    }
  }
}
