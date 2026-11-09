import { IdGeneratorContract } from '#services/id-generator/id-generator.contract'

/**
 * The predictable generator, for the test that needs to know the id before it
 * is born.
 *
 * It returns valid uuids in sequence (`…0001`, `…0002`), in the same shape as
 * the real one: whoever writes the value into a `uuid` column cannot tell them
 * apart.
 */
export class IdGeneratorFake extends IdGeneratorContract {
  private issued = 0

  uuid(): string {
    this.issued++

    return `00000000-0000-4000-8000-${String(this.issued).padStart(12, '0')}`
  }
}
