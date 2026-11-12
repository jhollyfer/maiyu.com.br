import { readdir, readFile } from 'node:fs/promises'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { FIELD_LABELS, LOCALE, LOCALES, RULE_MESSAGES } from '@maiyu/shared'

import {
  icuVariables,
  langFiles,
  readLang,
  readValidatorLang,
  sharedMessage,
} from '#tests/lang-fixtures'

/**
 * The translations in `resources/lang/`, seen from outside (`_standards/i18n.md` §4).
 *
 * What the text says belongs to the translator; this spec checks the shape: the three
 * languages have the same files and the same keys, no value is empty, the
 * same key uses the same ICU variables in all three, and the house text rule
 * (§5) holds: no em dash and no `...`. The content of `errors.json` and
 * `validator.json` is checked against the code in their own specs.
 */

const files = await langFiles(LOCALE.PT_BR)

test.group('lang > languages', () => {
  test('when the folder is listed, has one directory per supported language, and only those', async ({
    assert,
  }) => {
    const listing = await readdir(app.makePath('resources/lang'), {
      withFileTypes: true,
    })
    const directories = listing
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

    assert.deepEqual(directories, [...LOCALES].sort())
  })

  test('when the languages are compared, the three have the same files', async ({
    assert,
  }) => {
    for (const locale of LOCALES) {
      assert.deepEqual(await langFiles(locale), files, locale)
    }
  })
})

for (const file of files) {
  test.group(`lang > ${file}.json`, () => {
    test('when a key is read, exists in the three languages, with none left over', async ({
      assert,
    }) => {
      const entries = await readLang(LOCALE.PT_BR, file)
      const base = [...entries.keys()].sort()

      for (const locale of LOCALES) {
        const translated = await readLang(locale, file)
        const keys = [...translated.keys()].sort()

        assert.deepEqual(keys, base, locale)
      }
    })

    test('when a value is read, is not empty', async ({ assert }) => {
      for (const locale of LOCALES) {
        const empty = [...(await readLang(locale, file))]
          .filter(([, message]) => message.trim() === '')
          .map(([key]) => key)

        assert.deepEqual(empty, [], locale)
      }
    })

    test('when a key is read, uses the same ICU variables in the three languages', async ({
      assert,
    }) => {
      const base = await readLang(LOCALE.PT_BR, file)

      for (const locale of LOCALES) {
        const entries = await readLang(locale, file)
        const diverging = [...base]
          .filter(
            ([key, message]) =>
              icuVariables(entries.get(key) ?? '').join() !==
              icuVariables(message).join(),
          )
          .map(([key]) => key)

        assert.deepEqual(diverging, [], locale)
      }
    })

    test('when a text is read, has no em dash or three dots', async ({
      assert,
    }) => {
      for (const locale of LOCALES) {
        const offenders = [...(await readLang(locale, file))]
          .filter(([, message]) => /[—–]|\.\.\./.test(message))
          .map(([key]) => key)

        assert.deepEqual(offenders, [], locale)
      }
    })
  })
}

/**
 * The same rule says the same thing on both sides. VineJS here and Zod in
 * `shared/` validate the same form (`validators:check` enforces rule
 * parity), and the message the screen shows before submitting is the one the 422
 * would return afterwards. Without this the two copies diverged: the Spanish here
 * used "tú" and the one in `shared/` used "usted". `shared/` is the source; here the
 * text only swaps Zod's `{{ x }}` for ICU's `{ x }`.
 */
test.group('lang > validator.json matches shared', () => {
  test('when comparing with shared, rule messages and field labels match', async ({
    assert,
  }) => {
    for (const locale of LOCALES) {
      const entries = await readValidatorLang(locale)
      const diverging = [...entries]
        .filter(([key, message]) => {
          const shared = sharedMessage(locale, key)

          return shared !== undefined && shared !== message
        })
        .map(([key]) => key)

      assert.deepEqual(diverging, [], locale)
    }
  })

  test('when shared has a field label, the backend has the same key', async ({
    assert,
  }) => {
    // The test above only sees keys the backend has: a label added to
    // `PROJECT_FIELD_LABELS` and forgotten in `validator/shared/fields.json` would pass,
    // and the 422 would show the raw field name.
    for (const locale of LOCALES) {
      const entries = await readValidatorLang(locale)
      const missing = Object.keys(FIELD_LABELS[locale]).filter(
        (field) => !entries.has(`shared.fields.${field}`),
      )

      assert.deepEqual(missing, [], locale)
    }
  })

  test('when shared has a rule message, the backend has the same key', async ({
    assert,
  }) => {
    // The same trap as the labels, for the project's rules: a message added to
    // `PROJECT_RULE_MESSAGES` and forgotten in `validator.json` leaves the 422 in the VineJS
    // default text, in English.
    for (const locale of LOCALES) {
      const entries = await readValidatorLang(locale)
      const missing = Object.keys(RULE_MESSAGES[locale]).filter(
        (rule) => !entries.has(`shared.messages.${rule}`),
      )

      assert.deepEqual(missing, [], locale)
    }
  })

  test('when the backend has a shared label or message, shared still has it', async ({
    assert,
  }) => {
    // The orphans, the other way round: a key left in the lang files after the field or the
    // rule left `shared/` is text nobody reads. `params` is the backend's own: the label of the
    // route-parameters block of a VineJS validator, which no Zod schema has.
    for (const locale of LOCALES) {
      const entries = await readValidatorLang(locale)
      const orphans = [...entries.keys()].filter(
        (key) =>
          key !== 'shared.fields.params' &&
          key.startsWith('shared.') &&
          sharedMessage(locale, key) === undefined,
      )

      assert.deepEqual(orphans, [], locale)
    }
  })

  /** The rules Zod itself raises, which `ValidationMessage.rule` maps to a key. */
  const BUILT_IN_RULES = new Set([
    'required',
    'string',
    'number',
    'boolean',
    'array',
    'object',
    'enum',
    'minLength',
    'maxLength',
    'min',
    'max',
    'positive',
    'withoutDecimals',
    'array.minLength',
    'array.maxLength',
    'email',
    'uuid',
    'url',
    'regex',
  ])

  /** The rules the house refinements name (`params: { rule: '...' }`) in `shared/src`. */
  async function customRules(): Promise<Set<string>> {
    const files = await readdir(app.makePath('../shared/src'), {
      recursive: true,
    })
    const found = new Set<string>()

    for (const file of files.filter((name) => /(?<!\.test)\.ts$/.test(name))) {
      const source = await readFile(app.makePath('../shared/src', file), 'utf8')

      for (const match of source.matchAll(/rule:\s*'(\w+)'/g)) {
        if (match[1] !== undefined) found.add(match[1])
      }
    }

    return found
  }

  test('when shared has a message, some validator can raise its rule', async ({
    assert,
  }) => {
    const custom = await customRules()

    for (const locale of LOCALES) {
      const orphans = Object.keys(RULE_MESSAGES[locale]).filter((key) => {
        const rule = key.slice(key.lastIndexOf('.') + 1)

        return (
          !BUILT_IN_RULES.has(key) &&
          !BUILT_IN_RULES.has(rule) &&
          !custom.has(rule)
        )
      })

      assert.deepEqual(orphans, [], locale)
    }
  })

  test('when a house rule is named in shared, it has a message in the three languages', async ({
    assert,
  }) => {
    const custom = await customRules()

    for (const locale of LOCALES) {
      const keys = Object.keys(RULE_MESSAGES[locale])
      const silent = [...custom].filter(
        (rule) => !keys.some((key) => key === rule || key.endsWith(`.${rule}`)),
      )

      assert.deepEqual(silent, [], locale)
    }
  })
})
