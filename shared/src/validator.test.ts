import { afterEach, describe, expect, it } from 'vitest'

import { LOCALE, LOCALES } from './enums/locale.js'
import * as shared from './index.js'
import { PROJECT_FIELD_LABELS } from './records/field-labels.js'
import { PROJECT_RULE_MESSAGES } from './records/rule-messages.js'
import { ValidationFixture } from './validation-fixtures.js'
import {
  FIELD_LABELS,
  KIT_FIELD_LABELS,
  PageValidator,
  PaginationValidator,
  Rule,
  RULE_MESSAGES,
  ValidationMessage,
  z,
} from './validator.js'

/**
 * Every request validator the package exports (`*Validator`), read from `index.ts`, the
 * package's public surface (`_standards/architecture.md` §9): a new validator enters the audit
 * without anyone registering it here. `Client*Validator` is left out: it proves data the client
 * keeps in `localStorage`, which never shows a message to anyone.
 */
const validators = Object.entries(shared)
  .filter(([name]) => name.endsWith('Validator') && !name.startsWith('Client'))
  .flatMap(([name, schema]) => {
    if (!(schema instanceof z.ZodType)) return []
    return [{ name, schema }]
  })

/**
 * The JSON Schema of a validator, on the output side: a preprocess (`Rule.optional`) is read by
 * the schema it feeds, and what JSON Schema cannot say (a transform) becomes `{}`
 * (_doc-lib/zod.md#json-schema, https://zod.dev/json-schema).
 */
function jsonSchemaOf(schema: z.ZodType): unknown {
  return z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' })
}

/** The child of `node` at `key`, always as a list, so the walk does not branch. */
function branch(node: unknown, key: string): Array<unknown> {
  if (typeof node !== 'object' || node === null) return []

  const value: unknown = Reflect.get(node, key)

  if (value === undefined) return []
  if (Array.isArray(value)) return value

  return [value]
}

/** Every field path of the schema (`parts.etag`), with its node. */
function fieldsOf(schema: unknown, prefix = ''): Array<[string, unknown]> {
  const found: Array<[string, unknown]> = []

  for (const each of branch(schema, 'anyOf'))
    found.push(...fieldsOf(each, prefix))
  for (const each of branch(schema, 'items'))
    found.push(...fieldsOf(each, prefix))

  for (const properties of branch(schema, 'properties')) {
    if (typeof properties !== 'object' || properties === null) continue

    for (const [name, child] of Object.entries(properties)) {
      const path = [prefix, name].filter(Boolean).join('.')

      found.push([path, child], ...fieldsOf(child, path))
    }
  }

  return found
}

const fields = validators.flatMap(({ name, schema }) =>
  fieldsOf(jsonSchemaOf(schema)).map(([path, node]) => ({ name, path, node })),
)

/** The last segment of a path: `parts.etag` is `etag`. */
function leaf(path: string): string {
  return path.slice(path.lastIndexOf('.') + 1)
}

afterEach(() => {
  ValidationMessage.setLocale(LOCALE.PT_BR)
})

/**
 * The project's field labels (`records/field-labels.ts`) against the kit's. Neither
 * mistake breaks a build: a label missing in one language only shows the raw name
 * in that language, and a project key that repeats a kit key is silently dropped by
 * the merge, so the project believes it renamed a field it did not.
 */
describe('FIELD_LABELS', () => {
  it('when the project adds a label, it has the label in the three languages', () => {
    const base = Object.keys(PROJECT_FIELD_LABELS[LOCALE.PT_BR]).sort()

    for (const locale of LOCALES) {
      expect(Object.keys(PROJECT_FIELD_LABELS[locale]).sort(), locale).toEqual(
        base,
      )
    }
  })

  it('when the project repeats a kit key, the project word wins', () => {
    for (const locale of LOCALES) {
      const projectLabels: Readonly<Record<string, string>> =
        PROJECT_FIELD_LABELS[locale]
      const merged: Readonly<Record<string, string>> = FIELD_LABELS[locale]
      for (const [key, label] of Object.entries(projectLabels)) {
        expect(merged[key], `${locale}.${key}`).toBe(label)
      }
    }
  })

  it('when the labels are merged, every kit and project key is present', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(FIELD_LABELS[locale]).sort(), locale).toEqual(
        [
          ...new Set([
            ...Object.keys(KIT_FIELD_LABELS[locale]),
            ...Object.keys(PROJECT_FIELD_LABELS[locale]),
          ]),
        ].sort(),
      )
    }
  })
})

/** The project's rule messages (`records/rule-messages.ts`), with the same two traps. */
describe('RULE_MESSAGES', () => {
  it('when the project adds a message, it has the message in the three languages', () => {
    const base = Object.keys(PROJECT_RULE_MESSAGES[LOCALE.PT_BR]).sort()

    for (const locale of LOCALES) {
      expect(Object.keys(PROJECT_RULE_MESSAGES[locale]).sort(), locale).toEqual(
        base,
      )
    }
  })

  it('when the project repeats a kit rule, the project text wins', () => {
    for (const locale of LOCALES) {
      const project: Readonly<Record<string, string>> =
        PROJECT_RULE_MESSAGES[locale]
      const merged: Readonly<Record<string, string>> = RULE_MESSAGES[locale]
      for (const [key, text] of Object.entries(project)) {
        expect(merged[key], `${locale}.${key}`).toBe(text)
      }
    }
  })
})

/**
 * The friendly name of every field the package validates, in the three languages. A missing
 * label breaks nothing: the form only reads "Informe avatarId" instead of "Informe o avatar",
 * and because it breaks nothing it goes unnoticed. The full path or its last segment is enough,
 * the same reading `ValidationMessage` does.
 */
describe('validators > labels', () => {
  it('when a validator has a field, has a label in the three languages', () => {
    expect(validators.length).toBeGreaterThan(0)

    for (const locale of LOCALES) {
      const labels: Readonly<Record<string, string>> = FIELD_LABELS[locale]
      const unlabeled = fields
        .filter(({ path }) => !(path in labels) && !(leaf(path) in labels))
        .map(({ name, path }) => `${name}.${path}`)

      expect([...new Set(unlabeled)].sort(), locale).toEqual([])
    }
  })
})

/**
 * The size ceiling of every text field. A text without `max` crosses the form and reaches the
 * API, where the `varchar` column turns it into a 422 the user did not see coming, or a 500.
 */
describe('validators > text ceilings', () => {
  it('when a validator has a text field, has a size limit', () => {
    // `format` and `pattern` cover whoever already limits by another path (`Rule.email()`,
    // `z.uuid()`), and `enum` is not free text.
    const unbounded = fields
      .filter(({ node }) => {
        if (!branch(node, 'type').includes('string')) return false
        if (typeof node !== 'object' || node === null) return false

        return !['maxLength', 'format', 'pattern', 'enum', 'const'].some(
          (key) => key in node,
        )
      })
      .map(({ name, path }) => `${name}.${path}`)

    expect([...new Set(unbounded)].sort()).toEqual([])
  })
})

describe('Rule.optional', () => {
  it("when the field is left blank, '' counts as absent, as on the API", () => {
    const schema = z.object({ email: Rule.optional(Rule.email()) })

    expect(schema.safeParse({ email: '' })).toEqual({
      success: true,
      data: { email: undefined },
    })
  })

  it('when the field has a value, the rule still holds', () => {
    const schema = z.object({ email: Rule.optional(Rule.email()) })

    expect(
      ValidationFixture.messages(schema.safeParse({ email: 'x' })),
    ).toEqual([{ field: 'email', message: 'Informe um e-mail válido' }])
  })
})

describe('Rule.email', () => {
  it('when the address comes in capitals, it is stored in lowercase', () => {
    expect(Rule.email().parse('Ana@Maiyu.COM.br')).toBe('ana@maiyu.com.br')
  })
})

describe('Rule.pageFields', () => {
  it('when a listing has no search, it does not accept `search`', () => {
    expect(Object.keys(PageValidator.shape).sort()).toEqual(['page', 'perPage'])
    expect(Object.keys(PaginationValidator.shape).sort()).toEqual([
      'page',
      'perPage',
      'search',
    ])
  })

  it('when the page size passes the ceiling, the page is refused', () => {
    expect(
      ValidationFixture.fields(PageValidator.safeParse({ perPage: 101 })),
    ).toEqual(['perPage'])
  })

  it('when the page is fractional or past the ceiling, it is refused before the offset', () => {
    for (const page of [1.5, 10_001, 1e308]) {
      expect(
        ValidationFixture.fields(PageValidator.safeParse({ page })),
        String(page),
      ).toEqual(['page'])
    }
  })
})

describe('Rule.notNull and Rule.partial', () => {
  const fields = () => ({
    name: z.string().trim().min(1).max(160),
    avatarId: Rule.nullable(z.uuid()),
  })

  it('when the update leaves a field out, it is valid', () => {
    expect(Rule.partial(fields()).safeParse({})).toEqual({
      success: true,
      data: {},
    })
  })

  it("when the update sends null or '' to a required field, it is `required`", () => {
    const schema = Rule.partial(fields())

    for (const name of [null, '']) {
      expect(
        ValidationFixture.messages(schema.safeParse({ name })),
        String(name),
      ).toEqual([{ field: 'name', message: 'Informe o nome' }])
    }
  })

  it('when the field was built with `Rule.nullable`, null still erases it', () => {
    expect(Rule.partial(fields()).safeParse({ avatarId: null })).toEqual({
      success: true,
      data: { avatarId: null },
    })
  })

  it("when a single field is `Rule.notNull`, null and '' are `required`", () => {
    const schema = z.object({ name: Rule.notNull(z.string().max(160)) })

    expect(schema.safeParse({}).success).toBe(true)
    for (const name of [null, '']) {
      expect(ValidationFixture.fields(schema.safeParse({ name }))).toEqual([
        'name',
      ])
    }
  })
})

/**
 * The language of the messages. The browser switches it with `ValidationMessage.setLocale`; a
 * rule `RULE_MESSAGES` does not cover yields to Zod's locale in the same language.
 */
describe('ValidationMessage', () => {
  const schema = z.strictObject({ name: z.string().max(160) })

  it('when the language changes, the rule message and the label change with it', () => {
    ValidationMessage.setLocale(LOCALE.EN)

    expect(ValidationFixture.messages(schema.safeParse({}))).toEqual([
      { field: 'name', message: 'Enter the name' },
    ])

    ValidationMessage.setLocale(LOCALE.ES)

    expect(ValidationFixture.messages(schema.safeParse({}))).toEqual([
      { field: 'name', message: 'Ingrese el nombre' },
    ])
  })

  it("when the rule has no house message, Zod's locale answers in the active language", () => {
    // An unknown key has no line in `RULE_MESSAGES`: `ValidationMessage.resolve` returns
    // `undefined` and the configured locale writes the message (`customError` contract,
    // _doc-lib/zod.md#error-customization, https://zod.dev/error-customization).
    const input = { name: 'Ana', extra: true }
    const portuguese = ValidationFixture.messages(schema.safeParse(input))

    ValidationMessage.setLocale(LOCALE.EN)
    const english = ValidationFixture.messages(schema.safeParse(input))

    expect(english).toEqual([
      { field: '', message: 'Unrecognized key: "extra"' },
    ])
    expect(portuguese).toEqual([
      { field: '', message: 'Chave inválida: "extra"' },
    ])
  })
})
