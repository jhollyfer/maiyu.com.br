/** The plain token pair, as it comes out of issuance - the only moment it exists. */
export type SessionTokens = {
  readonly accessToken: string
  readonly refreshToken: string
}

/**
 * What a valid refresh token says: whose it is, which row keeps it, the sha256 of the plain
 * value (what the reuse mark keeps) and its expiry (how long the mark is worth keeping).
 */
export type RefreshGrant = {
  readonly userId: string
  readonly identifier: string
  readonly fingerprint: string
  readonly expiresAt: Date | null
}

/**
 * The persistence of the session tokens, by intent (`_standards/domain.md` §5.1): issue,
 * read the refresh one, consume it and revoke. It is the single writer of
 * `auth_access_tokens` and `consumed_refresh_tokens`. Whoever writes the HTTP response is
 * `features/authentication/_shared.session-cookie.ts`; whoever decides when to issue or
 * revoke is the use case.
 *
 * Every write runs on the client of the transaction in progress when there is one, so the
 * refresh rotation (consume, issue and, on reuse, revoke) lands as one unit of work.
 *
 * `abstract class` and not `type`: it serves as a container token and as a type at the same
 * time. The concrete one is `SessionLucidRepository`, bound in `providers/repository.provider.ts`.
 */
export abstract class SessionRepository {
  /** The account's token pair; `null` when the provider did not return the plain value. */
  abstract issue(userId: string): Promise<SessionTokens | null>
  /**
   * Drops all the account's sessions, inside the transaction in progress when there is
   * one: the revocation must land together with the write that motivates it.
   */
  abstract revokeAll(userId: string): Promise<void>
  /** Deletes an account's token; `false` when it no longer existed. */
  abstract revoke(userId: string, identifier: string): Promise<boolean>
  /**
   * Reads a refresh token. `null` for the unreadable, the nonexistent, the expired and
   * the one that is not a refresh: to the caller they are the same thing.
   */
  abstract readRefresh(value: string): Promise<RefreshGrant | null>
  /**
   * Deletes the used refresh and records its reuse mark. `false` when nobody deleted it: it
   * is the critical section of the rotation, and only whoever deleted the row earns the new
   * pair. Inside a unit of work the `DELETE` holds the row until the commit, so a parallel
   * rotation with the same token only learns it lost once the winner's pair exists.
   */
  abstract consume(grant: RefreshGrant): Promise<boolean>
  /**
   * The account whose refresh, already consumed and not yet expired, the plain value
   * proves; `null` for any other value. A consumed refresh that comes back is reuse
   * (RFC 6819, `_standards/backend.md` §4.10, `DECISIONS.md` #363).
   */
  abstract findReused(value: string): Promise<string | null>
}
