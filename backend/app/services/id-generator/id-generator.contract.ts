/**
 * What the application asks of the id generator: a new uuid.
 *
 * Randomness is a boundary like the clock (`solid.md` §2, "when to create a
 * contract"; `domain.md` §10): the test that needs to know the id about to be
 * born swaps the implementation, instead of reading back what `crypto` drew.
 * `IdGeneratorProvider` binds the implementation
 * (_doc-lib/adonisjs.md#guides/concepts/dependency-injection,
 * https://docs.adonisjs.com/guides/concepts/dependency-injection).
 */
export abstract class IdGeneratorContract {
  abstract uuid(): string
}
