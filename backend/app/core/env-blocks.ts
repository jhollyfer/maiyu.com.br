/**
 * The blocks of `.env.example` that a project switches on by value (DECISIONS.md #417). Every
 * project has every key of the catalog; a block it does not use stays with empty values. A block
 * is on when its trigger key has a value, and then the rest of its keys must have one too.
 *
 * Why here and not in the schema: the schema only knows each key alone, and every key of a block
 * is optional there, because empty is the right value of a block that is off. Checked at boot, a
 * half-filled block stops the application naming the empty key, instead of failing on the first
 * e-mail (`_standards/backend.md` §6.2).
 */
const BLOCKS = [
  {
    name: 'mail',
    trigger: 'SMTP_HOST',
    required: ['MAIL_FROM', 'SMTP_PORT'],
  },
] as const

type Block = (typeof BLOCKS)[number]

export type EnvBlockKey = Block['trigger'] | Block['required'][number]

export type EnvBlockReader = (key: EnvBlockKey) => string | number | undefined

export default class EnvBlocks {
  /** One line per empty key of a block that is on; empty list when the catalog is consistent. */
  static problems(read: EnvBlockReader): readonly string[] {
    return BLOCKS.flatMap((block) => {
      if (EnvBlocks.isEmpty(read(block.trigger))) {
        return []
      }

      return block.required
        .filter((key) => EnvBlocks.isEmpty(read(key)))
        .map(
          (key) =>
            `${block.name}: ${block.trigger} is set, so ${key} is required`,
        )
    })
  }

  static assert(read: EnvBlockReader): void {
    const problems = EnvBlocks.problems(read)

    if (problems.length > 0) {
      throw new Error(`Incomplete environment blocks:\n${problems.join('\n')}`)
    }
  }

  private static isEmpty(value: string | number | undefined): boolean {
    return value === undefined || String(value).trim() === ''
  }
}
