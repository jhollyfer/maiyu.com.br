/**
 * The project's side of the `scripts/` guard-rails (extension point, KIT.md §3.4;
 * `_standards/backend.md` §10): every exception lives here, each with its reason, and an
 * exception that no longer matches anything fails the check.
 *
 * The backend is the kit with no domain of its own yet, so both lists start empty. A new
 * entry needs the rule, the file and why the deviation is legitimate; "will fix later" is
 * not a reason, it is a task in `docs/TASKS.md`.
 */
import type { PatternException } from './pattern-check.ts'

/** Pairs (rule, file) exempt from `pnpm pattern:check`. */
export const PATTERN_EXCEPTIONS: ReadonlyArray<PatternException> = []

/**
 * A known layer deviation that the conformity work will still fix, read by
 * `depcruise.config.ts` (importing file and imported file pair).
 */
export type TemporaryException = {
  readonly check: 'pattern-check' | 'depcruise'
  readonly rule: string
  readonly file: string
  /** `depcruise` only: the imported file. */
  readonly target?: string
  readonly reason: string
}

export type PatternCheckConfiguration = {
  readonly temporaryExceptions: ReadonlyArray<TemporaryException>
}

export const configuration: PatternCheckConfiguration = {
  temporaryExceptions: [],
}
