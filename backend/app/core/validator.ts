import { HttpContext } from '@adonisjs/core/http'
import type { I18nManager } from '@adonisjs/i18n'
import vine, { SimpleMessagesProvider, VineDate, errors } from '@vinejs/vine'
import type {
  FieldContext,
  Infer,
  MessagesProviderContact,
  SchemaTypes,
} from '@vinejs/vine/types'
import { DateTime } from 'luxon'

import {
  ACTIVE_STATUSES,
  Rule as SharedRule,
  SORT_DIRECTIONS,
  TRASHED_MODES,
} from '@maiyu/shared'

import { COLUMN_LIMITS } from '#core/column-limits'

/**
 * The application's configured VineJS, and what every validator shares.
 *
 * Each resource has its `<resource>.validator.ts` in the resource folder
 * (`_standards/architecture.md` §3); only what belongs to all lives here: the `vine` with the
 * date transform and the translated messages, the rules used by more than one
 * resource (`Rule`, methods, not constants) and the global validators for identifier and
 * pagination. A list's item ceiling is a domain number: it comes from the project's
 * `LIST_LIMITS` in `@maiyu/shared` (`records/list-limits.ts`, KIT.md §3.4), one copy
 * read by both sides. Nobody imports `@vinejs/vine` directly: it is through this
 * module that the house messages and rules hold in every schema.
 *
 * The OpenAPI generator resolves validators through the controllers' AST, reading
 * the import specifier and re-importing the module. Renaming an export without
 * updating the controller does not break the build: the operation silently vanishes from the document,
 * and `node ace openapi:generate --check` is what catches it.
 */

export { vine, errors }
export type { Infer }

declare module '@vinejs/vine/types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging requires `interface`
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/*
|--------------------------------------------------------------------------
| Validation messages
|--------------------------------------------------------------------------
|
| The text of each rule and the name of each field live in
| `resources/lang/{pt-BR,es,en}/validator.json` (`shared.messages` and
| `shared.fields`), in ICU format: `{ field }`, `{ min }`, `{ max }`. Without it
| VineJS answers with its English default, and the 422 comes out bilingual: the envelope of
| `app/exceptions/handler.ts` is translated and the values of `errors` would not be.
|
| Two traps, if you touch this:
|
| - `shared.fields` swaps only the **displayed** `{ field }`. The error key remains
|   the field name (`avatarId`), and it is what the frontend uses to mark
|   the right input. Renaming the key breaks the form.
| - Do not configure `vine.errorReporter`. The handler depends on the array format
|   `{ field, rule, message }` of `SimpleErrorReporter`.
|
*/

/**
 * The messages provider VineJS uses in every `validate()`.
 *
 * **Why a global provider and not the guide's `RequestValidator.messagesProvider`.**
 * That hook only applies to `request.validateUsing()`, and a direct
 * `Validator.validate(data)` (ace command, seeder, test) would go untranslated.
 * `vine.create()` also captures the provider at the moment the
 * validator is created, so it must be a stable object. This object picks the
 * language on each call: the `ctx.i18n` of the request in progress (via
 * `HttpContext.get()`, which requires `useAsyncLocalStorage` in `config/app.ts`) and,
 * outside HTTP (ace command, seeder), the default language, pt-BR.
 * (_doc-lib/adonisjs.md#guides/digging-deeper/i18n, section "Using translations
 * with VineJS directly": https://docs.adonisjs.com/guides/digging-deeper/i18n;
 * https://docs.adonisjs.com/guides/concepts/async-local-storage)
 *
 * `I18nManager` comes in through `bind()` in `start/validator.ts`, not through
 * import: the `@adonisjs/i18n/services/main` service requires the application to be up, and
 * this module is also loaded by scripts that do not boot it (`validators:check`).
 */
export class RequestMessagesProvider implements MessagesProviderContact {
  readonly #english = new SimpleMessagesProvider({})
  #manager: I18nManager | undefined

  bind(manager: I18nManager) {
    this.#manager = manager
  }

  getMessage(
    rawMessage: string,
    rule: string,
    field: FieldContext,
    args?: Record<string, unknown>,
  ) {
    const i18n =
      HttpContext.get()?.i18n ??
      this.#manager?.locale(this.#manager.defaultLocale)

    // Without i18n (module loaded outside boot): VineJS's English default.
    if (!i18n) {
      return this.#english.getMessage(rawMessage, rule, field, args)
    }

    return i18n
      .createMessagesProvider()
      .getMessage(rawMessage, rule, field, args)
  }
}

export const requestMessagesProvider = new RequestMessagesProvider()

vine.messagesProvider = requestMessagesProvider

// ---------------------------------------------------------------------------
// Shared rules
// ---------------------------------------------------------------------------

/**
 * The rule behind `Rule.notNull()`; a module value, created once like a validator. Implicit,
 * because VineJS skips every other rule when the value is `null` or `undefined`
 * (_doc-lib/vinejs.md#extend/custom_rules, https://vinejs.dev/docs/extend/custom_rules,
 * "Creating an implicit rule"): only an implicit rule sees the `null` it must refuse.
 */
const notNullRule = vine.createRule(
  (value: unknown, _options: undefined, field: FieldContext) => {
    if (value === null)
      field.report('The {{ field }} field must be defined', 'required', field)
  },
  { implicit: true },
)

/**
 * The rule behind `Rule.timeZone()`: the zone must be one the runtime knows, the same test as the
 * shared `Rule.isTimeZone`, so the form and the API refuse the same names.
 */
const timeZoneRule = vine.createRule(
  (value: unknown, _options: undefined, field: FieldContext) => {
    if (typeof value !== 'string') return
    if (!SharedRule.isTimeZone(value))
      field.report(
        'The {{ field }} field must be a time zone',
        'timeZone',
        field,
      )
  },
)

/** The rule behind `Rule.phone()`: the E.164 pattern is the shared one, so form and API agree. */
const phoneRule = vine.createRule(
  (value: unknown, _options: undefined, field: FieldContext) => {
    if (typeof value !== 'string') return
    if (!SharedRule.PHONE.test(value))
      field.report(
        'The {{ field }} field must be a Brazilian mobile number',
        'phone',
        field,
      )
  },
)

/** The rule behind `Rule.anyPhone()`: a landline or a mobile, by the shared pattern. */
const anyPhoneRule = vine.createRule(
  (value: unknown, _options: undefined, field: FieldContext) => {
    if (typeof value !== 'string') return
    if (!SharedRule.ANY_PHONE.test(value))
      field.report(
        'The {{ field }} field must be a Brazilian phone number',
        'anyPhone',
        field,
      )
  },
)

/** A field that `Rule.partial()` can mark with `Rule.notNull()`: the types that carry `use()`. */
type MarkableField = SchemaTypes & {
  use(validation: ReturnType<typeof notNullRule>): unknown
}

/**
 * Rules reused by more than one resource: the pair of `Rule` in `@maiyu/shared`, with the
 * same method names, so a VineJS validator and its Zod pair read the same
 * (`_standards/typescript.md` §6: every function has a home).
 *
 * They are methods, not constants: reusing the same schema node in two
 * validators would share options between them - the `optional()` of one
 * would show up in the other.
 */
export class Rule {
  static email() {
    // Lowercase, like the shared pair: `A@x.com` and `a@x.com` are one account, for the
    // login, the unique column and the sessions an e-mail change revokes.
    return vine.string().trim().toLowerCase().email().maxLength(254)
  }

  /**
   * A slug that is a URL segment after the language (DECISIONS.md #390): the pair of `Rule.slug()`
   * in `@maiyu/shared`, which holds the pattern and the reserved words.
   */
  static slug() {
    return vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(80)
      .regex(SharedRule.SLUG)
      .notIn([...SharedRule.RESERVED_SLUGS])
  }

  /** An IANA zone name the runtime knows, the pair of the shared `Rule.timeZone()`. */
  static timeZone() {
    return vine.string().trim().minLength(1).maxLength(64).use(timeZoneRule())
  }

  /**
   * The label of an uploaded file: no control characters (the pair of `Rule.fileName()`
   * in `@maiyu/shared`, which holds the pattern). The name is client input that later
   * reaches terminals and logs (CWE-150).
   */
  static fileName() {
    return vine
      .string()
      .trim()
      .minLength(1)
      .maxLength(255)
      .regex(SharedRule.NO_CONTROL_CHARACTERS)
  }

  /**
   * The Brazilian mobile, the account's identity (DECISIONS.md #396): it arrives however the
   * person typed it (mask, spaces, with or without `+55`) and is stored as E.164. The pair of
   * `Rule.phone()` in `@maiyu/shared`, which holds the pattern and the normalization.
   * `parse` runs before the rules and receives `unknown`
   * (_doc-lib/vinejs.md#schema_101, https://vinejs.dev/docs/schema_101), so anything that is
   * not text goes through untouched and the `string` rule refuses it.
   */
  static phone() {
    return vine
      .string()
      .parse((value: unknown) => {
        if (typeof value !== 'string') return value
        return SharedRule.normalizePhone(value.trim())
      })
      .maxLength(SharedRule.PHONE_INPUT_MAX_LENGTH)
      .use(phoneRule())
  }

  /**
   * The Brazilian landline or mobile in E.164, for the form that accepts either. The pair of
   * `Rule.anyPhone()` in `@maiyu/shared`; it reads the input like `Rule.phone()`.
   */
  static anyPhone() {
    return vine
      .string()
      .parse((value: unknown) => {
        if (typeof value !== 'string') return value
        return SharedRule.normalizePhone(value.trim())
      })
      .maxLength(SharedRule.PHONE_INPUT_MAX_LENGTH)
      .use(anyPhoneRule())
  }

  /**
   * Password strength: one `regex` per character class, so the message points at
   * exactly what is missing instead of a "weak password" that does not say what to do.
   *
   * `confirmed` requires `passwordConfirmation` with the same value, read from the raw
   * input. No schema here declares it, and that alone is why it does not show up in the
   * validated payload - there is nothing to discard before `merge()`/`create()` in the
   * use-case. What VineJS delivers is what the schema declares.
   */
  static password() {
    return vine
      .string()
      .minLength(8)
      .maxLength(32)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^a-zA-Z0-9]/)
      .confirmed({ as: 'passwordConfirmation' })
  }

  /**
   * Account status. Canonical in English: the value is an identifier, and the Portuguese
   * label belongs to the frontend.
   */
  static activeStatus() {
    return vine.enum(ACTIVE_STATUSES)
  }

  /**
   * The three fields every listing accepts. Spread
   * (`...Rule.paginationFields()`) by validators that still add a filter
   * of their own, so the `perPage` ceiling lives in one place - repeated by hand in
   * each resource, it is a divergence waiting to happen.
   */
  static paginationFields() {
    return {
      ...Rule.pageFields(),
      search: vine.string().trim().maxLength(100).optional(),
    }
  }

  /**
   * The page of a listing that has no text search: `paginationFields()` without `search`. A
   * listing that does not filter by `search` does not accept it, or the parameter would be
   * accepted, silently ignored and promised in the OpenAPI document (`_standards/backend.md` §4.4).
   */
  static pageFields() {
    return {
      // Whole numbers with a ceiling: `page=1.5` or `page=1e308` would reach the offset (#382).
      page: vine.number().withoutDecimals().min(1).max(10_000).optional(),
      perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
    }
  }

  /**
   * Optional free text (DECISIONS.md #402): trimmed, with a ceiling; absent stays absent, and blank,
   * only spaces or an explicit `null` (what the frontend sends for a blank field) is `null`, never
   * `''` (the bodyparser no longer trims, and the `trim()` of the field leaves `''` behind). Vine's
   * `optional()` alone drops `null`, so `nullable()` comes first. The pair of `Rule.optionalText()`
   * in `@maiyu/shared`.
   */
  static optionalText(maxLength: number) {
    return vine
      .string()
      .trim()
      .maxLength(maxLength)
      .nullable()
      .optional()
      .transform((value): string | null | undefined => {
        if (value === '') return null
        return value
      })
  }

  /**
   * The field of an update that may be missing (do not touch) but never `null`. VineJS's
   * `.optional()` takes `null` as missing, and the bodyparser's `convertEmptyStringsToNull`
   * turns `''` into `null` before it: without this rule `{ title: null }` or a title left blank
   * passes the validator and reaches the database as an erased required column. Goes on the
   * field: `vine.string().optional().use(Rule.notNull())` (`_standards/backend.md` §4.4).
   */
  static notNull() {
    return notNullRule()
  }

  /**
   * The update of a resource from the same fields as its create (`postFields()`): every field
   * becomes optional through VineJS's own `.partial()` (which keeps the types), and every field
   * that does not accept `null` on purpose (`.nullable()`) gets `Rule.notNull()`. The pair of
   * `Rule.partial()` in `@maiyu/shared`.
   *
   * It marks the fields it receives, so it takes them from the resource function, fresh on each
   * call, never a shared constant (a VineJS node reused between validators leaks its rules).
   */
  static partial<TFields extends Record<string, SchemaTypes>>(fields: TFields) {
    for (const [key, field] of Object.entries(fields)) {
      if (field.allowNull) continue
      // Every VineJS type but the `.nullable()` modifier carries `use()`; one that does not
      // would accept `null` in silence, so it fails when the validator is built.
      if (!Rule.#isMarkable(field)) {
        throw new TypeError(
          `Rule.partial(): ${key} does not take Rule.notNull()`,
        )
      }
      field.use(notNullRule())
    }

    return vine.object(fields).partial()
  }

  static #isMarkable(field: SchemaTypes): field is MarkableField {
    return 'use' in field && typeof field.use === 'function'
  }

  /**
   * The trash cut, for listings that have something to restore.
   *
   * Outside `Rule.paginationFields()` on purpose: if it were there, it would also show up
   * in the storefront listings, which never see an archived record. The parameter
   * would be accepted, silently ignored, and the OpenAPI document would start promising
   * a filter that does not exist.
   */
  static trashedField() {
    return { trashed: vine.enum(TRASHED_MODES).optional() }
  }

  /**
   * The order of a listing, in two fields: `sort` (the column) and `direction`.
   *
   * **A pair, and not an `order-<column>` per column.** Two order parameters at the
   * same time do not express precedence - `?order-title=asc&order-date=desc`
   * does not say which wins -, and the query orders by a single column.
   *
   * **The column comes from a closed list, declared per resource.** The value goes
   * straight into `orderBy`, which composes it into SQL: accepting free text from the URL would be
   * handing the clause to the client. A column outside the list is a 422 pointing at the field,
   * not a database 500 complaining about a nonexistent column.
   *
   * Outside `Rule.paginationFields()` for the same reason as `Rule.trashedField()`: each
   * resource orders by what it has, and a global set would promise in OpenAPI
   * columns that half the listings do not know.
   */
  static sortFields<const TColumns extends readonly [string, ...string[]]>(
    columns: TColumns,
  ) {
    return {
      sort: vine.enum(columns).optional(),
      direction: vine.enum(SORT_DIRECTIONS).optional(),
    }
  }

  /**
   * The `:id` of the URL, as the `params` block of a schema. Holds for every resource: the
   * PK is a uuid in every table.
   *
   * It exists so a malformed `:id` is a 422 pointing at `params.id`, not a Postgres 500
   * refusing the literal in the `where` clause. It is a method so a body validator of an
   * action with `:id` spreads it (`...Rule.identifierParams()`) and the action reads both in a
   * single `validateUsing`: `validateUsing` fills `params` from the route by itself
   * (_doc-lib/adonisjs.md#guides/basics/validation, "Validating query strings, params,
   * headers, and cookies"), and the Tuyau generator only reads the route parameter from
   * that key (`DECISIONS.md` #375).
   */
  static identifierParams() {
    return { params: vine.object({ id: vine.string().uuid() }) }
  }
}

// ---------------------------------------------------------------------------
// Global validators
// ---------------------------------------------------------------------------

/** The action whose only input is the `:id`. */
export const IdentifierValidator = vine.create(Rule.identifierParams())

/** The listing without text search (`Rule.pageFields()`). */
export const PageValidator = vine.create(vine.object(Rule.pageFields()))

export const PaginationValidator = vine.create(
  vine.object(Rule.paginationFields()),
)

/**
 * Pagination for resources that have a trash. It is the `PaginationValidator` plus
 * `trashed`, and exists as its own schema because the storefront listings
 * remain without it.
 */
export const TrashablePaginationValidator = vine.create({
  ...Rule.paginationFields(),
  ...Rule.trashedField(),
})

/** What the use case receives: the `id` already out of the `params` block. */
export type IdentifierPayload = Infer<typeof IdentifierValidator>['params']

export type PagePayload = Infer<typeof PageValidator>

export type PaginationPayload = Infer<typeof PaginationValidator>

export type TrashablePaginationPayload = Infer<
  typeof TrashablePaginationValidator
>

/**
 * The public identifier of a resource reached by `slug` instead of `id`. It lives in the
 * kit because the route parameter has the same shape in every project that has one. The
 * ceiling is the project's column (`COLUMN_LIMITS.SLUG`): without it, an absurdly long URL
 * would become a database query.
 */
export const SlugValidator = vine.create({
  params: vine.object({
    slug: vine.string().trim().minLength(1).maxLength(COLUMN_LIMITS.SLUG),
  }),
})

export type SlugPayload = Infer<typeof SlugValidator>['params']
