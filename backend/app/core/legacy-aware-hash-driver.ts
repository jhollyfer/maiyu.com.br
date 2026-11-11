import { Hash } from '@adonisjs/core/hash'
import hash from '@adonisjs/core/services/hash'
import type { HashDriverContract } from '@adonisjs/core/types/hash'

/**
 * The hasher while old hashes still exist (DECISIONS.md #370). `hash.verify` always uses the
 * default driver and does not detect the algorithm, so a scrypt hash checked by argon refuses
 * the right password; and `withAuthFinder` takes a single hasher. This driver checks with the
 * driver the stored hash declares (`isValidHash`, the form of "Migrating between algorithms"
 * in _doc-lib/adonisjs.md#guides/security/hashing,
 * https://docs.adonisjs.com/guides/security/hashing), always writes with the current one, and
 * says a legacy hash needs a rehash. Drop it, and `scrypt` from `config/hash.ts`, once the
 * last legacy hash is redone (`_standards/backend.md` §5.6 item 6).
 */
export default class LegacyAwareHashDriver implements HashDriverContract {
  constructor(
    private readonly current: HashDriverContract,
    private readonly legacy: HashDriverContract,
  ) {}

  /** The model's `withAuthFinder` and the sign-in share this one, so both read hashes alike. */
  static hasher(): Hash {
    return new Hash(new LegacyAwareHashDriver(hash.use(), hash.use('scrypt')))
  }

  isValidHash(value: string): boolean {
    return this.current.isValidHash(value) || this.legacy.isValidHash(value)
  }

  make(value: string): Promise<string> {
    return this.current.make(value)
  }

  verify(hashedValue: string, plainValue: string): Promise<boolean> {
    return this.driverOf(hashedValue).verify(hashedValue, plainValue)
  }

  needsReHash(hashedValue: string): boolean {
    if (this.legacy.isValidHash(hashedValue)) return true

    return this.current.needsReHash(hashedValue)
  }

  private driverOf(hashedValue: string): HashDriverContract {
    if (this.legacy.isValidHash(hashedValue)) return this.legacy

    return this.current
  }
}
