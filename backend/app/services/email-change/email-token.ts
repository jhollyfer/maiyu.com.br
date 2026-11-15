import { createHash, randomBytes } from 'node:crypto'

/**
 * The one-use token of the e-mail change (DECISIONS.md #442): 32 random bytes in hex, so 256 bits
 * that nobody guesses, and only its sha256 is stored. The plain value travels once, in the e-mail
 * sent to the new address; a leaked table cannot confirm anything.
 */
export default class EmailToken {
  /** How long the token lives, in minutes. */
  static readonly EXPIRES_IN_MINUTES = 60

  static generate(): string {
    return randomBytes(32).toString('hex')
  }

  /** sha256 in hex: 64 characters, the width of `email_changes.token_hash`. */
  static hash(plain: string): string {
    return createHash('sha256').update(plain).digest('hex')
  }
}
