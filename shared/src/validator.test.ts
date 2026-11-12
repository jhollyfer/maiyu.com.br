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
const schemas = Object.entries(shared).flatMap(([name, schema]) => {
  if (!(schema instanceof z.ZodType)) return []
  return [{ name, schema }]
})

const validators = schemas.filter(
  ({ name }) => name.endsWith('Validator') && !name.startsWith('Client'),
)

/**
 * The schemas whose fields a label may name: the validators above plus the ones that never show a
 * message but still name a field the interface labels. `Client*Validator` (what the client keeps
 * in `localStorage`) and `*Params` (the segments of a route, `city` and `store`, which the
 * backend validates and the frontend reads from the URL). A label is an orphan only when none of
 * them has the field.
 */
const labelOwners = schemas.filter(
  ({ name }) => name.endsWith('Validator') || name.endsWith('Params'),
)

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

const labelFields = labelOwners.flatMap(({ schema }) =>
  fieldsOf(jsonSchemaOf(schema)).map(([path]) => path),
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

/**
 * The message network (`_standards/i18n.md` §4): what the label and message tables say must match
 * what the validators ask for, in both directions. Each mistake breaks nothing and is therefore
 * never noticed: a label left behind by a removed field, a message for a rule nobody calls, a
 * rule that fails and falls to Zod's generic English text.
 */
describe('validators > message network', () => {
  it('a label may name a field of a Client validator or of a *Params schema', () => {
    const owners = labelOwners.map(({ name }) => name)

    expect(owners).toContain('ClientTableLayoutValidator')
    expect(owners).not.toContain('Rule')
    expect(validators.some(({ name }) => name.startsWith('Client'))).toBe(false)
  })

  it('when a label exists, some validator has the field', () => {
    const known = new Set(labelFields.flatMap((path) => [path, leaf(path)]))

    for (const locale of LOCALES) {
      const orphans = Object.keys(PROJECT_FIELD_LABELS[locale]).filter(
        (key) => !known.has(key),
      )

      expect(orphans, locale).toEqual([])
    }
  })

  it('when a project message names a field, some validator has the field', () => {
    // The rule half of the key is checked in the backend's `lang.unit.spec.ts`, which can read
    // the source: `shared/` has no Node types on purpose.
    const known = new Set(fields.map(({ path }) => leaf(path)))

    for (const locale of LOCALES) {
      const orphans = Object.keys(PROJECT_RULE_MESSAGES[locale]).filter(
        (key) =>
          key.includes('.') && !known.has(key.slice(0, key.indexOf('.'))),
      )

      expect(orphans, locale).toEqual([])
    }
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

describe('Rule.optionalText', () => {
  const schema = z.object({ note: Rule.optionalText(10) })

  it('when the text is blank or only spaces, it is null; absent stays absent', () => {
    expect(schema.parse({ note: '' })).toEqual({ note: null })
    expect(schema.parse({ note: '   ' })).toEqual({ note: null })
    expect(schema.parse({ note: null })).toEqual({ note: null })
    expect(schema.parse({})).toEqual({})
  })

  it('when the text has a value, it is trimmed and keeps the ceiling', () => {
    expect(schema.parse({ note: ' oi ' })).toEqual({ note: 'oi' })
    expect(schema.safeParse({ note: 'x'.repeat(11) }).success).toBe(false)
  })
})

describe('Rule.email', () => {
  it('when the address comes in capitals, it is stored in lowercase', () => {
    expect(Rule.email().parse('Ana@Maiyu.COM.br')).toBe('ana@maiyu.com.br')
  })
})

describe('Rule.anyPhone', () => {
  const MOBILE = '+5597991234567'
  const LANDLINE = '+559734123456'

  it('when it is a mobile or a landline, in any mask, it gives the same E.164', () => {
    for (const raw of ['(97) 99123-4567', '+55 97 99123-4567', '97991234567'])
      expect(Rule.anyPhone().parse(raw)).toBe(MOBILE)
    for (const raw of ['(97) 3412-3456', '9734123456', '+55 97 3412-3456'])
      expect(Rule.anyPhone().parse(raw)).toBe(LANDLINE)
  })

  it('when it is neither, refuses it with the anyPhone message', () => {
    const Schema = z.object({ phone: Rule.anyPhone() })

    for (const raw of [
      'abc',
      '979912345',
      '(97) 1234-5678',
      '+1 202 555 0100',
      'ligue 97991234567',
      '(97) 3412-3456 ramal',
    ]) {
      expect(
        ValidationFixture.messages(Schema.safeParse({ phone: raw })),
      ).toEqual([
        { field: 'phone', message: 'Informe um telefone válido, com DDD' },
      ])
    }
  })
})

describe('Rule.phone', () => {
  const MOBILE = '+5597991234567'

  it('when the text is longer than a formatted number, refuses it by the ceiling', () => {
    for (const rule of [Rule.phone(), Rule.anyPhone()])
      expect(
        ValidationFixture.messages(
          z.object({ phone: rule }).safeParse({ phone: '9'.repeat(30) }),
        ),
      ).toEqual([
        { field: 'phone', message: 'Informe no máximo 20 caracteres' },
      ])
  })

  it('when the number has a mask, spaces or the +55, it gives the same E.164', () => {
    for (const raw of [
      '(97) 99123-4567',
      '97991234567',
      '+55 97 99123-4567',
      '55 (97) 99123-4567',
      ' +5597991234567 ',
    ])
      expect(Rule.phone().parse(raw)).toBe(MOBILE)
  })

  it('when the area code is 55, the country code is not read twice', () => {
    expect(Rule.phone().parse('55991234567')).toBe('+5555991234567')
  })

  it('when it is not a Brazilian mobile, refuses it with the phone message', () => {
    const Schema = z.object({ phone: Rule.phone() })

    for (const raw of [
      'abc',
      '9799123456',
      '(97) 3412-3456',
      '+1 202 555 0100',
      'ligue 97991234567',
      '97991234567x',
    ])
      expect(
        ValidationFixture.messages(Schema.safeParse({ phone: raw })),
      ).toEqual([
        { field: 'phone', message: 'Informe um celular válido, com DDD' },
      ])
  })

  it('when the phone is blank, it is the required message, like every field', () => {
    const Schema = z.object({ phone: Rule.phone() })

    expect(ValidationFixture.messages(Schema.safeParse({ phone: '' }))).toEqual(
      [{ field: 'phone', message: 'Informe o celular' }],
    )
  })

  it('when read by Rule.normalizePhone, it leaves the invalid text as it came', () => {
    expect(Rule.normalizePhone('abc')).toBe('abc')
    expect(Rule.normalizePhone('tel 97991234567')).toBe('tel 97991234567')
    expect(Rule.normalizePhone('(97) 99123-4567')).toBe(MOBILE)
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

  it.each([
    [LOCALE.PT_BR, 'Informe ao menos 1 itens'],
    [LOCALE.EN, 'Enter at least 1 items'],
    [LOCALE.ES, 'Ingrese al menos 1 elementos'],
  ])(
    'when a list has fewer items than the minimum, %s says so (array.minLength)',
    (locale, message) => {
      ValidationMessage.setLocale(locale)

      expect(
        ValidationFixture.messages(
          z
            .object({ tags: z.array(z.string()).min(1) })
            .safeParse({ tags: [] }),
        ).map((each) => each.message),
      ).toEqual([message])
    },
  )

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
