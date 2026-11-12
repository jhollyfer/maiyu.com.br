/** The e-mail change waiting for its token: the new address and the hash of the token that confirms it. */
export type PendingEmailChange = {
  readonly userId: string
  /** Lowercase. */
  readonly email: string
  /** sha256 in hex of the plain token, which only exists in the e-mail that was sent. */
  readonly tokenHash: string
  readonly expiresAt: Date
}

/**
 * The persistence of the pending e-mail change, by intent (`_standards/domain.md` §5.1), part of
 * the e-mail block (DECISIONS.md #442). One row per account: `replace` swaps it, `claim` takes it.
 */
export abstract class EmailChangeRepository {
  /** Keeps `change` as the only pending change of the account; an earlier one and its token are gone. */
  abstract replace(change: PendingEmailChange): Promise<void>
  /**
   * Takes the pending change of the account when `tokenHash` is its token and it has not expired
   * at `now`, in a single conditional `DELETE`: of two simultaneous confirmations one gets the
   * change and the other gets `null`, and a token never works twice. `null` for any other case
   * (no request, another token, expired): to the caller they are the same thing.
   */
  abstract claim(
    userId: string,
    tokenHash: string,
    now: Date,
  ): Promise<PendingEmailChange | null>
}
