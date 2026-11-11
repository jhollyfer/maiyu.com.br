import type { DateTime } from 'luxon'

/**
 * What the application asks of the clock: the current instant.
 *
 * The clock is boundary I/O, like the bucket and email (`solid.md` §2, "when to
 * create a contract"): whoever calls `DateTime.now()` directly cannot be tested
 * at a chosen instant, and an assertion that recomputes now is the test that
 * fails at midnight (`domain.md` §10). The use-case declares this contract in
 * the constructor, and `ClockProvider` binds the implementation.
 *
 * `abstract class` and not `type`: the container resolves by a token that
 * exists at runtime (_doc-lib/adonisjs.md#guides/concepts/dependency-injection,
 * https://docs.adonisjs.com/guides/concepts/dependency-injection, "Abstract
 * classes as interfaces").
 *
 * It returns Luxon's `DateTime` because that is the type of the date columns of
 * the models; whoever needs milliseconds asks for `.toMillis()`.
 */
export abstract class ClockContract {
  abstract now(): DateTime
}
