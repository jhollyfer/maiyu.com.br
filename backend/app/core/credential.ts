import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * What a public credential points to (DECISIONS.md #583): the tenant it belongs to and the row it
 * opens (the class, the invite, the enrollment), for the project to read as it knows its tables.
 */
export type CredentialRecord = {
  readonly tenantId: string
  readonly targetId: string
  /** `null` never expires. */
  readonly expiresAt: Date | null
  /**
   * SHA-256 of the secret, only for a kind whose credential is a secret (the invite token): the
   * secret itself is never stored. `null` for a code a person types.
   */
  readonly secretHash: string | null
}

/** What the middleware hands the route once the credential resolved. */
export type CredentialMatch = {
  readonly tenantId: string
  readonly targetId: string
}

/**
 * The extension point of a kind of credential: the project declares each one (the class code, the live
 * room code, the invite token, the enrollment protocol) as a class that extends this one, reads its own
 * table and is named on the route (`middleware.credentialTenant({ source: ClassCodeSource, ... })`).
 * An `abstract class` and not a `type`, so it is the container token and the type at once
 * (`_standards/architecture.md` §2).
 */
export abstract class CredentialSource {
  /**
   * The row the public part of the credential names: the normalized code or protocol, or the
   * token's locator. `null` when there is none. No tenant scope applies: the credential is how the
   * request finds out which tenant it is in. Give back the row whatever its state (expired, of an
   * inactive tenant): the middleware answers the same 404 for all of them.
   */
  abstract find(locator: string): Promise<CredentialRecord | null>
}

/** The code a person types: a class code, a room code, a protocol. */
export class Credential {
  /** More than this is never a credential: it is not looked up. */
  static readonly MAX = 200

  /**
   * Trimmed and upper-cased, so how it was typed does not matter; the project stores its codes in
   * upper case. Empty (never looked up) when it is too long.
   */
  static normalize(raw: string): string {
    if (raw.length > Credential.MAX) return ''

    return raw.trim().toUpperCase()
  }
}

const DIGEST_BYTES = 32
/** What a miss compares against, so a credential that does not exist costs the same comparison. */
const PLACEHOLDER = createHash('sha256').update('no credential').digest()

/**
 * A credential that is a secret (the invite token, `<locator>.<secret>`): the locator is stored in
 * clear and finds the row, the secret is stored only as its SHA-256 and compared in constant time.
 * A fast hash is right here: the secret is long and random, so there is nothing to brute-force that
 * a slow hash would protect (that is for passwords).
 */
export class CredentialSecret {
  static digest(secret: string): string {
    return createHash('sha256').update(secret).digest('hex')
  }

  /** `null` unless the token has exactly a locator and a secret. */
  static split(raw: string): { locator: string; secret: string } | null {
    if (raw.length > Credential.MAX) return null

    const parts = raw.split('.')
    const [locator, secret] = parts
    if (parts.length !== 2 || !locator?.trim() || !secret?.trim()) return null

    return { locator, secret }
  }

  /**
   * Whether `secret` is the one `storedHash` hashes, in constant time. With no stored hash (or one
   * that is not a digest) it still compares, against a placeholder, and answers `false`: the miss
   * takes as long as the hit.
   */
  static matches(secret: string, storedHash: string | null): boolean {
    const stored = Buffer.from(storedHash ?? '', 'hex')
    const actual = Buffer.from(CredentialSecret.digest(secret), 'hex')
    if (stored.length !== DIGEST_BYTES) {
      timingSafeEqual(actual, PLACEHOLDER)

      return false
    }

    return timingSafeEqual(actual, stored)
  }
}
