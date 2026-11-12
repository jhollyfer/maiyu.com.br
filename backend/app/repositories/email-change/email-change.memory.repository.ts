import {
  EmailChangeRepository,
  type PendingEmailChange,
} from '#repositories/email-change/email-change.repository'

/** The second real implementation, for the use case unit test (`_standards/domain.md` §5.3). */
export class EmailChangeMemoryRepository extends EmailChangeRepository {
  private readonly rows = new Map<string, PendingEmailChange>()

  async replace(change: PendingEmailChange): Promise<void> {
    this.rows.set(change.userId, { ...change })
  }

  async claim(
    userId: string,
    tokenHash: string,
    now: Date,
  ): Promise<PendingEmailChange | null> {
    const row = this.rows.get(userId)
    if (!row || row.tokenHash !== tokenHash || row.expiresAt <= now) return null

    this.rows.delete(userId)

    return row
  }
}
