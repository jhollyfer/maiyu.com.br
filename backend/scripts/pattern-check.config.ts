/**
 * The exceptions the project owns (`_standards/architecture.md` §6): `pattern:check` reads
 * `PATTERN_EXCEPTIONS`, and `depcruise.config.ts` reads `configuration.temporaryExceptions`.
 * Every entry carries the reason, and one that no longer matches a finding fails.
 *
 * Extension point (KIT.md §3.4): a new project starts with both lists empty.
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
