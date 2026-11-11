import {
  SessionRepository,
  type RefreshGrant,
  type SessionTokens,
} from '#repositories/session/session.repository'

/**
 * The session tokens in memory, for the unit test. It honors the contract of
 * `SessionLucidRepository`: the issued token is read back, revocation removes it, a
 * consumed refresh leaves its reuse mark, and the test reads what was issued and revoked.
 */
export class SessionMemoryRepository extends SessionRepository {
  readonly issued: string[] = []
  readonly revokedAll: string[] = []
  private readonly refresh = new Map<string, RefreshGrant>()
  /** Reuse marks, by fingerprint (here the plain value itself): the owner. */
  private readonly consumed = new Map<string, string>()
  private sequence = 0

  /** Test arrangement: a valid refresh token for the account. */
  withRefresh(
    value: string,
    grant: Pick<RefreshGrant, 'userId' | 'identifier'>,
  ): this {
    this.refresh.set(value, { ...grant, fingerprint: value, expiresAt: null })
    return this
  }

  /** The account's live refresh tokens: what reuse must leave at zero. */
  liveRefresh(userId: string): number {
    let count = 0
    for (const grant of this.refresh.values())
      if (grant.userId === userId) count += 1

    return count
  }

  async issue(userId: string): Promise<SessionTokens | null> {
    this.issued.push(userId)
    this.sequence += 1
    const refreshToken = `refresh-${userId}-${this.sequence}`
    this.withRefresh(refreshToken, {
      userId,
      identifier: String(this.sequence),
    })

    return { accessToken: `access-${userId}-${this.sequence}`, refreshToken }
  }

  async revokeAll(userId: string): Promise<void> {
    this.revokedAll.push(userId)

    for (const [value, grant] of this.refresh) {
      if (grant.userId === userId) this.refresh.delete(value)
    }
  }

  async revoke(userId: string, identifier: string): Promise<boolean> {
    for (const [value, grant] of this.refresh) {
      if (grant.userId !== userId || grant.identifier !== identifier) continue

      this.refresh.delete(value)

      return true
    }

    return false
  }

  async readRefresh(value: string): Promise<RefreshGrant | null> {
    return this.refresh.get(value) ?? null
  }

  async consume(grant: RefreshGrant): Promise<boolean> {
    if (!(await this.revoke(grant.userId, grant.identifier))) return false

    this.consumed.set(grant.fingerprint, grant.userId)

    return true
  }

  async findReused(value: string): Promise<string | null> {
    return this.consumed.get(value) ?? null
  }
}
