import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * `components/ui/` is the shadcn registry's output and is not rewritten for the house style
 * (_standards/frontend.md §6, DECISIONS.md #391): the whole `no-unsafe-*` family is off there, or the
 * registry's own `slider.tsx` fails the lint with the `any` that `Array.isArray` narrows to
 * (DECISIONS.md #821).
 */
const Rules = z.object({ rules: z.record(z.string(), z.unknown()) })

const eslint = new ESLint({ overrideConfigFile: 'eslint.config.js' })

const severityOf = async (path: string, rule: string) => {
  const config: unknown = await eslint.calculateConfigForFile(path)
  const [severity] = z
    .tuple([z.union([z.string(), z.number()])])
    .rest(z.unknown())
    .or(z.union([z.string(), z.number()]).transform((one) => [one] as const))
    .parse(Rules.parse(config).rules[rule])

  return severity
}

describe('eslint: the registry output in components/ui', () => {
  it.each([
    '@typescript-eslint/no-unsafe-assignment',
    '@typescript-eslint/no-unsafe-member-access',
    '@typescript-eslint/no-unsafe-argument',
    '@typescript-eslint/no-unsafe-return',
  ])('%s is off in ui/ and on outside it', async (rule) => {
    expect([0, 'off']).toContain(
      await severityOf('src/components/ui/slider.tsx', rule),
    )
    expect([0, 'off']).not.toContain(
      await severityOf('src/components/common/field/field-text.tsx', rule),
    )
  })
})
