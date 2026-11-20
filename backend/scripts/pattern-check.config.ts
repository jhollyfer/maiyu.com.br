/**
 * The exceptions the project owns (`_standards/architecture.md` §6): `pattern:check` reads
 * `PATTERN_EXCEPTIONS`, and `depcruise.config.ts` reads `configuration.temporaryExceptions`.
 * Every entry carries the reason, and one that no longer matches a finding fails.
 *
 * Extension point (KIT.md §3.4): a new project starts with the three lists empty.
 */
import type { PatternException } from './pattern-check.ts'

/** A layer import the conformity work has not fixed yet, with the batch that resolves it. */
export type TemporaryException = {
  readonly check: 'depcruise'
  readonly rule: string
  readonly file: string
  readonly target?: string
  readonly reason: string
}

export const PATTERN_EXCEPTIONS: ReadonlyArray<PatternException> = []

export const configuration: {
  readonly temporaryExceptions: ReadonlyArray<TemporaryException>
} = {
  temporaryExceptions: [],
}

/**
 * The validators of the public sign-ups, by exported name (DECISIONS.md #799): every route without a
 * login that creates an account or a business (`AuthenticationSignUpValidator`). `pattern:check`
 * refuses a document, phone, address, Pix key, bank or birth field in them (rule
 * `public-signup-minimum`): the sign-up asks only for the minimum, and the rest is completed after
 * the login. `phone` is the one exception, alone or next to `email` (the login is e-mail and/or phone,
 * DECISIONS.md #396). The check does not guess which route is a sign-up, so the project lists them; a name
 * that no validator declares fails too. Empty when the project has no public sign-up.
 */
export const PUBLIC_SIGNUP_VALIDATORS: ReadonlyArray<string> = []
