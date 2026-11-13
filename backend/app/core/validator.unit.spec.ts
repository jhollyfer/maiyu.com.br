import { readdir } from 'node:fs/promises'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { KIT_FIELD_LABELS, LOCALE, LOCALES } from '@maiyu/shared'
import type { Locale } from '@maiyu/shared'

import * as core from '#core/validator'
import { readValidatorLang } from '#tests/lang-fixtures'

/**
 * The static audits of the validators, all through `toJSONSchema()`.
 *
 * The field list comes from the validators themselves, not from a second list
 * to keep up to date - a new mismatched field is born red.
 *
 * It lives next to `app/core/validator.ts`, and not in an action folder, because
 * it checks all validators at once: what is tested is a limit that the database
 * or the API response imposes and the application must anticipate. The messages of the
 * validation provider, at the end of the file, are the same meta-spec seen from the
 * other side - the message text, not the schema. The 422 of a real route, which
 * proves the provider was installed, is `validator.e2e.spec.ts`.
 */

type Introspectable = { toJSONSchema: () => unknown }

function isValidator(value: unknown): value is Introspectable {
  if (typeof value !== 'object' || value === null) return false
  if (!('toJSONSchema' in value)) return false

  return typeof value.toJSONSchema === 'function'
}

/** The child of `node` at `key`, always as a list, so the recursion does not branch. */
function branch(node: unknown, key: string): Array<unknown> {
  if (typeof node !== 'object' || node === null) return []

  // `Reflect.get` and not an index: `key in node` narrows `node`, but does not make it
  // valid to index it by an arbitrary `string` - and the assertion that solved
  // this is rule 3 of `code-pattern`. A missing key returns `undefined`,
  // which here means the same as an empty branch.
  const value: unknown = Reflect.get(node, key)

  if (value === undefined) return []

  if (Array.isArray(value)) return value

  return [value]
}

/**
 * Every backend validator: the globals of `#core/validator` and those of each
 * `app/validators/<module>/<resource>.validator.ts`. The list comes from disk, not from an
 * import per file, so that a new validator enters the audit without
 * anyone remembering to register it here.
 */
const listing = await readdir(app.makePath('app/validators'), {
  recursive: true,
})
const files = listing.filter((file) => file.endsWith('.validator.ts'))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function load(file: string): Promise<Record<string, unknown>> {
  const loaded: unknown = await import(
    `#validators/${file.replace(/\.ts$/, '')}`
  )

  if (!isRecord(loaded)) throw new TypeError(`${file} does not export a module`)

  return loaded
}

const modules: Array<Record<string, unknown>> = [
  core,
  ...(await Promise.all(files.map((file) => load(file)))),
]

// Only the `*Validator` export (`backend.md` §4.4): whatever else the file exports
// (the `UPLOAD_MAX_SIZE` ceiling, the types) is not an input schema.
const validators = modules
  .flatMap((moduleExports) => Object.entries(moduleExports))
  .filter(([name]) => name.endsWith('Validator'))
  .map(([, validator]) => validator)
  .filter(isValidator)

/** Every path whose node is `type: 'string'`, with the node alongside. */
function strings(schema: unknown, prefix = ''): Array<[string, unknown]> {
  const found: Array<[string, unknown]> = []

  for (const each of branch(schema, 'anyOf'))
    found.push(...strings(each, prefix))
  for (const each of branch(schema, 'items'))
    found.push(...strings(each, `${prefix}[]`))

  for (const properties of branch(schema, 'properties')) {
    if (typeof properties !== 'object' || properties === null) continue

    for (const [name, child] of Object.entries(properties)) {
      const path = [prefix, name].filter(Boolean).join('.')

      if (branch(child, 'type').includes('string')) found.push([path, child])

      found.push(...strings(child, path))
    }
  }

  return found
}

/**
 * The size ceiling of every text field.
 *
 * Text columns are `varchar(255)` - which is what Knex's `table.string()`
 * creates - when the migration does not say another size. A field with no ceiling in the validator
 * lets the large value cross validation and blow up in Postgres: what
 * should be a 422 pointing at the field becomes a 500 with "internal error" on screen, and the
 * server log is the only place where what happened shows up.
 */
test.group('validator > text ceilings', () => {
  test('when a validator has a text field, has a size limit', ({ assert }) => {
    // `format` and `pattern` cover whoever already limits by another path - `Rule.email()`,
    // `uuid()` -, and `enum` is not free text.
    const unbounded = validators
      .flatMap((each) => strings(each.toJSONSchema()))
      .filter(([, node]) => {
        if (typeof node !== 'object' || node === null) return false

        return !['maxLength', 'format', 'pattern', 'enum'].some(
          (key) => key in node,
        )
      })
      .map(([path]) => path)

    assert.deepEqual([...new Set(unbounded)].sort(), [])
  })
})

/** Every field path of the schema, including nested ones (`parts.etag`). */
function walk(schema: unknown, prefix = ''): Array<string> {
  const paths: Array<string> = []

  // `anyOf` is what an object's `.optional()` produces: the object and null.
  for (const each of branch(schema, 'anyOf')) paths.push(...walk(each, prefix))
  for (const each of branch(schema, 'items')) paths.push(...walk(each, prefix))

  for (const properties of branch(schema, 'properties')) {
    if (typeof properties !== 'object' || properties === null) continue

    for (const [name, child] of Object.entries(properties)) {
      const path = [prefix, name].filter(Boolean).join('.')

      paths.push(path)
      paths.push(...walk(child, path))
    }
  }

  return paths
}

const fields = new Set(validators.flatMap((each) => walk(each.toJSONSchema())))

/**
 * The entries of `resources/lang/<locale>/validator.json` and of the project's
 * `validator/shared/fields.json` under a prefix, without it: `shared.fields.name`
 * becomes `name`.
 */
async function entriesOf(
  locale: Locale,
  prefix: 'shared.fields.' | 'shared.messages.',
): Promise<Map<string, string>> {
  const entries = await readValidatorLang(locale)

  return new Map(
    [...entries]
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, message]) => [key.slice(prefix.length), message]),
  )
}

/**
 * The friendly name of every field, in both directions and in the three languages.
 *
 * A field without a label breaks nothing - it only makes the response ask "Informe avatarId"
 * instead of "Informe o avatar". Because it breaks nothing, it goes unnoticed, and it is
 * exactly for this reason that enforcement must be automatic.
 */
test.group('validator > labels', () => {
  test('when a validator has a field, has a name in the three languages', async ({
    assert,
  }) => {
    // The raw name serves as VineJS's fallback, so it is enough for the last segment to have
    // a label - `parts.etag` falls back to `etag` if the full path is not
    // listed. Both hold, and the full path wins when it exists.
    for (const locale of LOCALES) {
      const labels = await entriesOf(locale, 'shared.fields.')
      const unlabeled = [...fields].filter((path) => {
        if (labels.has(path)) return false

        return !labels.has(path.slice(path.lastIndexOf('.') + 1))
      })

      assert.deepEqual(unlabeled.sort(), [], locale)
    }
  })

  test('when a label exists, the field still exists so no label is left over', async ({
    assert,
  }) => {
    // The opposite of the test above: a label for a field that already left the validator does not
    // warn that it is dead, and keeps being copied to the next resource. The kit's labels
    // are left out: they come from the sync, the project cannot delete them, and a
    // project that has not built the user screens yet would be red for nothing.
    const leaves = new Set(
      [...fields].map((path) => path.slice(path.lastIndexOf('.') + 1)),
    )

    for (const locale of LOCALES) {
      const labels = await entriesOf(locale, 'shared.fields.')
      const orphans = [...labels.keys()].filter((key) => {
        // Also covers `passwordConfirmation`, which `toJSONSchema()` never shows: it is
        // born from `.confirmed({ as: 'passwordConfirmation' })` in `Rule.password()`.
        if (key in KIT_FIELD_LABELS[locale]) return false

        return !fields.has(key) && !leaves.has(key)
      })

      assert.deepEqual(orphans.sort(), [], locale)
    }
  })
})

/**
 * The phrase of each rule, in the three languages.
 *
 * The backend messages are what the API returns to any client, and it is the
 * unguarded side: a new rule in `#core/validator` with no entry in
 * `validator.json` falls back to VineJS's default and the 422 comes out hybrid - the label in
 * Portuguese inside the English phrase, "The o link field must be a valid URL".
 */

test.group('messages > validation provider', () => {
  test('when a validator uses a rule, has a phrase in the three languages', async ({
    assert,
  }) => {
    // The list is written by hand, and that is what lets a new rule slip through: it is only
    // enforced here after someone adds it. A new rule in
    // `app/core/validator.ts` enters this list in the same commit.
    //
    // `regex` and `confirmed` are left out on purpose: their only uses
    // are in `Rule.password()`, and both already have a `field.rule` key. Enforcing
    // the generic one would be enforcing dead code.
    const required = [
      'required',
      'string',
      'enum',
      'email',
      'number',
      'array',
      'object',
      'uuid',
      'url',
      'minLength',
      'maxLength',
      'min',
      'max',
      'positive',
      'withoutDecimals',
      'array.minLength',
      'array.maxLength',
      'password.regex',
      'password.minLength',
      'password.maxLength',
      'passwordConfirmation.confirmed',
      'fileName.regex',
      'phone',
      'anyPhone',
    ]

    for (const locale of LOCALES) {
      const messages = await entriesOf(locale, 'shared.messages.')
      const missing = required.filter((rule) => !messages.has(rule))

      assert.deepEqual(missing, [], locale)
    }
  })

  test('when a pt-BR message is read, none escaped in English', async ({
    assert,
  }) => {
    // `{ field }` is the ICU variable, not displayed text - it leaves before the search,
    // otherwise every message naming the field would be flagged as English. Holds only
    // for pt-BR: in `en` the phrase is English on purpose.
    const suspects = [
      ...(await entriesOf(LOCALE.PT_BR, 'shared.messages.')),
    ].filter(([, message]) =>
      /\b(the|must|field|should|at least|at most|invalid|value)\b/i.test(
        message.replace(/\{.*?\}/g, ''),
      ),
    )

    assert.deepEqual(suspects, [])
  })
})

/**
 * The update and listing blocks of `Rule` (`backend.md` §4.4). VineJS's `.optional()` takes
 * `null` as missing, and the bodyparser turns `''` into `null` before it: without
 * `Rule.notNull()` an update with `{ name: null }` passes and erases a required column.
 */
test.group('validator > Rule', () => {
  const fields = () => ({
    name: core.vine.string().trim().maxLength(160),
    avatarId: core.vine.string().uuid().nullable(),
  })
  const UpdateValidator = core.vine.create(core.Rule.partial(fields()))

  test('when the update leaves a field out, it is valid', async ({
    assert,
  }) => {
    assert.deepEqual(await UpdateValidator.validate({}), {})
  })

  test('when the update sends null to a required field, it is `required`', async ({
    assert,
  }) => {
    const error = await UpdateValidator.validate({ name: null }).catch(
      (caught: unknown) => caught,
    )

    assert.instanceOf(error, core.errors.E_VALIDATION_ERROR)
    if (!(error instanceof core.errors.E_VALIDATION_ERROR)) return
    // `messages` is `any` in the error's type: read as `unknown`, compared by shape.
    const messages: unknown = error.messages
    assert.containSubset(messages, [{ field: 'name', rule: 'required' }])
    assert.isTrue(Array.isArray(messages) && messages.length === 1)
  })

  test('when the field was declared `.nullable()`, null still erases it', async ({
    assert,
  }) => {
    assert.deepEqual(await UpdateValidator.validate({ avatarId: null }), {
      avatarId: null,
    })
  })

  test('when a listing has no search, it does not accept `search`', ({
    assert,
  }) => {
    assert.deepEqual(Object.keys(core.Rule.pageFields()).sort(), [
      'page',
      'perPage',
    ])
    assert.deepEqual(Object.keys(core.Rule.paginationFields()).sort(), [
      'page',
      'perPage',
      'search',
    ])
  })
})

test.group('validator > Rule.optionalText', () => {
  const validator = core.vine.create({ note: core.Rule.optionalText(10) })

  test('when the text is blank or only spaces, it is null; absent stays absent', async ({
    assert,
  }) => {
    assert.deepEqual(await validator.validate({ note: '   ' }), { note: null })
    assert.deepEqual(await validator.validate({ note: '' }), { note: null })
    assert.deepEqual(await validator.validate({ note: null }), { note: null })
    assert.deepEqual(await validator.validate({}), {})
  })

  test('when the text has a value, it is trimmed and keeps the ceiling', async ({
    assert,
  }) => {
    assert.deepEqual(await validator.validate({ note: ' oi ' }), { note: 'oi' })
    await assert.rejects(() => validator.validate({ note: 'x'.repeat(11) }))
  })
})

test.group('validator > Rule.anyPhone', () => {
  const AnyPhoneValidator = core.vine.create({ phone: core.Rule.anyPhone() })

  test('when it is a mobile or a landline, it gives the E.164', async ({
    assert,
  }) => {
    assert.deepEqual(
      await AnyPhoneValidator.validate({ phone: '(97) 99123-4567' }),
      { phone: '+5597991234567' },
    )
    assert.deepEqual(
      await AnyPhoneValidator.validate({ phone: '+55 97 3412-3456' }),
      { phone: '+559734123456' },
    )
  })

  test('when it is neither, is `anyPhone`', async ({ assert }) => {
    for (const raw of [
      'abc',
      '979912345',
      '(97) 1234-5678',
      'ligue 97991234567',
      12345,
    ]) {
      const error = await AnyPhoneValidator.validate({ phone: raw }).catch(
        (caught: unknown) => caught,
      )

      assert.instanceOf(error, core.errors.E_VALIDATION_ERROR)
      if (!(error instanceof core.errors.E_VALIDATION_ERROR)) return
      const messages: unknown = error.messages
      assert.containSubset(messages, [{ field: 'phone' }])
    }
  })
})

test.group('validator > Rule.phone', () => {
  test('when the text is longer than a formatted number, is `maxLength`', async ({
    assert,
  }) => {
    for (const rule of [core.Rule.phone(), core.Rule.anyPhone()]) {
      const error = await core.vine
        .create({ phone: rule })
        .validate({ phone: '9'.repeat(30) })
        .catch((caught: unknown) => caught)

      assert.instanceOf(error, core.errors.E_VALIDATION_ERROR)
      if (!(error instanceof core.errors.E_VALIDATION_ERROR)) return
      const messages: unknown = error.messages
      assert.containSubset(messages, [{ field: 'phone', rule: 'maxLength' }])
    }
  })

  const PhoneValidator = core.vine.create({ phone: core.Rule.phone() })

  test('when the number has a mask, spaces or the +55, it gives the same E.164', async ({
    assert,
  }) => {
    for (const raw of [
      '(97) 99123-4567',
      '97991234567',
      '+55 97 99123-4567',
      '55 (97) 99123-4567',
      ' +5597991234567 ',
    ])
      assert.deepEqual(await PhoneValidator.validate({ phone: raw }), {
        phone: '+5597991234567',
      })
  })

  test('when the area code is 55, the country code is not read twice', async ({
    assert,
  }) => {
    assert.deepEqual(await PhoneValidator.validate({ phone: '55991234567' }), {
      phone: '+5555991234567',
    })
  })

  test('when it is not a Brazilian mobile, is `phone`', async ({ assert }) => {
    for (const raw of [
      'abc',
      '9799123456',
      '(97) 3412-3456',
      '+1 202 555 0100',
      'ligue 97991234567',
      12345,
    ]) {
      const error = await PhoneValidator.validate({ phone: raw }).catch(
        (caught: unknown) => caught,
      )

      assert.instanceOf(error, core.errors.E_VALIDATION_ERROR)
      if (!(error instanceof core.errors.E_VALIDATION_ERROR)) return
      const messages: unknown = error.messages
      assert.containSubset(messages, [{ field: 'phone' }])
    }
  })
})

/**
 * `Rule.optionalText()` is absent-or-text-or-null: the key must stay optional in the type VineJS
 * infers. A `transform` that does not name `undefined` in its return makes the key required, and
 * every payload that leaves the field out stops compiling (the failure here is `tsc`, not Japa).
 */
test.group('Rule.optionalText', () => {
  test('when the field is left out, the inferred payload does not ask for it', async ({
    assert,
  }) => {
    const validator = core.vine.create({ note: core.Rule.optionalText(10) })
    const absent: core.Infer<typeof validator> = {}

    assert.deepEqual(await validator.validate({}), absent)
    assert.deepEqual(await validator.validate({ note: '  ' }), { note: null })
  })
})
