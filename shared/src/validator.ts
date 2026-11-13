import * as z from 'zod'

import { ACTIVE_STATUSES } from './enums/active-status.js'
import type { ActiveStatus } from './enums/active-status.js'
import { LOCALE, LOCALES } from './enums/locale.js'
import type { Locale } from './enums/locale.js'
import { SORT_DIRECTIONS } from './enums/sort-direction.js'
import type { SortDirection } from './enums/sort-direction.js'
import { TRASHED_MODES } from './enums/trashed-mode.js'
import type { TrashedMode } from './enums/trashed-mode.js'
import { PROJECT_FIELD_LABELS } from './records/field-labels.js'
import { PROJECT_RULE_MESSAGES } from './records/rule-messages.js'

/**
 * The configured Zod, the rules that more than one resource uses, the rule messages
 * in pt-BR, es and en and the global validators (`_standards/architecture.md`
 * §9). Each resource's validators live in
 * `validators/<module>/<resource>.validator.ts` and import from here.
 *
 * The `z` comes re-exported from this module for the same reason as the frontend's former
 * `vine`: the configuration below (`z.config`) is global, and whoever reads a schema
 * from here has already loaded this file. Every resource validator imports `Rule` or
 * `z` from this module, so `z.config` runs before the first parse.
 */
export { z }

// ---------------------------------------------------------------------------
// Messages - one per rule, in the three languages
// ---------------------------------------------------------------------------

/**
 * The messages per rule, in pt-BR. The lookup goes from the most specific to the most
 * generic - `field.rule`, then `rule` -, like VineJS's provider did,
 * so the generic rule covers the common case and only what deviates gets its own
 * line.
 *
 * `{{ field }}` is replaced by the label from `FIELD_LABELS`, and only appears where
 * the sentence starts with a verb; in the other rules the name is omitted, because the error is
 * rendered under the already labeled field.
 */
const PT_BR_MESSAGES = {
  required: 'Informe {{ field }}',
  string: 'Informe {{ field }}',
  enum: 'Selecione {{ field }}',
  email: 'Informe um e-mail válido',
  number: 'Informe um número válido',
  boolean: 'Marque se {{ field }} vale ou não',
  array: 'Informe uma lista',
  object: 'Informe um objeto',
  richText: 'Informe um texto formatado válido',
  uuid: 'Selecione uma opção válida',
  url: 'Informe um link válido',
  minLength: 'Informe ao menos {{ min }} caracteres',
  maxLength: 'Informe no máximo {{ max }} caracteres',
  min: 'Informe um valor maior ou igual a {{ min }}',
  max: 'Informe um valor menor ou igual a {{ max }}',
  positive: 'Informe um valor maior que zero',
  withoutDecimals: 'Informe um número inteiro',
  'array.minLength': 'Informe ao menos {{ min }} itens',
  'array.maxLength': 'Informe no máximo {{ max }} itens',
  // The four `.regex()`es of `Rule.password()` stop at the first that fails on the
  // same key, so the message lists the four requirements at once.
  'password.regex':
    'A senha precisa de letra minúscula, maiúscula, número e caractere especial',
  'password.minLength': 'A senha deve ter ao menos {{ min }} caracteres',
  'password.maxLength': 'A senha deve ter no máximo {{ max }} caracteres',
  // The refinement runs on the object and points at the confirmation, which is where the error
  // needs to appear.
  'passwordConfirmation.confirmed': 'As senhas não são iguais',
  // The label must not carry C0, DEL or C1 characters (CWE-150).
  'fileName.regex': 'O nome do arquivo não pode ter caracteres de controle',
  // A pattern the project gives without a message of its own.
  regex: 'Informe {{ field }} no formato válido',
  // A slug is a URL segment: lowercase, digits and hyphen, and never a word the router already
  // reads there (a language prefix, DECISIONS.md #390).
  'slug.regex': 'Use só letras minúsculas, números e hífen no slug',
  'slug.notIn': 'Este slug é reservado, escolha outro',
  'state.regex': 'Informe a UF com duas letras maiúsculas',
  timeZone: 'Selecione um fuso horário válido',
  phone: 'Informe um celular válido, com DDD',
  anyPhone: 'Informe um telefone válido, com DDD',
} as const

type RuleMessages = Record<keyof typeof PT_BR_MESSAGES, string>

/**
 * Each language's messages. `satisfies` demands the same list of keys in all
 * three: a new rule in pt-BR without translation does not compile.
 */
const KIT_RULE_MESSAGES = {
  'pt-BR': PT_BR_MESSAGES,
  es: {
    required: 'Ingrese {{ field }}',
    string: 'Ingrese {{ field }}',
    enum: 'Seleccione {{ field }}',
    email: 'Ingrese un correo electrónico válido',
    number: 'Ingrese un número válido',
    boolean: 'Indica si {{ field }} aplica o no',
    array: 'Ingrese una lista',
    object: 'Ingrese un objeto',
    richText: 'Ingrese un texto con formato válido',
    uuid: 'Seleccione una opción válida',
    url: 'Ingrese un enlace válido',
    minLength: 'Ingrese al menos {{ min }} caracteres',
    maxLength: 'Ingrese como máximo {{ max }} caracteres',
    min: 'Ingrese un valor mayor o igual a {{ min }}',
    max: 'Ingrese un valor menor o igual a {{ max }}',
    positive: 'Ingrese un valor mayor que cero',
    withoutDecimals: 'Ingrese un número entero',
    'array.minLength': 'Ingrese al menos {{ min }} elementos',
    'array.maxLength': 'Ingrese como máximo {{ max }} elementos',
    'password.regex':
      'La contraseña necesita minúscula, mayúscula, número y carácter especial',
    'password.minLength':
      'La contraseña debe tener al menos {{ min }} caracteres',
    'password.maxLength':
      'La contraseña debe tener como máximo {{ max }} caracteres',
    'passwordConfirmation.confirmed': 'Las contraseñas no coinciden',
    'fileName.regex':
      'El nombre del archivo no puede tener caracteres de control',
    regex: 'Ingrese {{ field }} en un formato válido',
    'slug.regex': 'Use solo minúsculas, números y guion en el slug',
    'slug.notIn': 'Este slug está reservado, elija otro',
    'state.regex': 'Ingrese la UF con dos letras mayúsculas',
    timeZone: 'Seleccione una zona horaria válida',
    phone: 'Ingrese un celular válido, con código de área',
    anyPhone: 'Ingrese un teléfono válido, con código de área',
  },
  en: {
    required: 'Enter {{ field }}',
    string: 'Enter {{ field }}',
    enum: 'Select {{ field }}',
    email: 'Enter a valid email',
    number: 'Enter a valid number',
    boolean: 'Choose whether {{ field }} applies',
    array: 'Enter a list',
    object: 'Enter an object',
    richText: 'Enter valid formatted text',
    uuid: 'Select a valid option',
    url: 'Enter a valid link',
    minLength: 'Enter at least {{ min }} characters',
    maxLength: 'Enter at most {{ max }} characters',
    min: 'Enter a value greater than or equal to {{ min }}',
    max: 'Enter a value less than or equal to {{ max }}',
    positive: 'Enter a value greater than zero',
    withoutDecimals: 'Enter a whole number',
    'array.minLength': 'Enter at least {{ min }} items',
    'array.maxLength': 'Enter at most {{ max }} items',
    'password.regex':
      'The password needs a lowercase letter, an uppercase letter, a number and a special character',
    'password.minLength':
      'The password must have at least {{ min }} characters',
    'password.maxLength': 'The password must have at most {{ max }} characters',
    'passwordConfirmation.confirmed': 'The passwords do not match',
    'fileName.regex': 'The file name cannot have control characters',
    regex: 'Enter {{ field }} in a valid format',
    'slug.regex': 'Use only lowercase letters, numbers and hyphens in the slug',
    'slug.notIn': 'This slug is reserved, choose another',
    'state.regex': 'Enter the state as two uppercase letters',
    timeZone: 'Select a valid time zone',
    phone: 'Enter a valid mobile number, with area code',
    anyPhone: 'Enter a valid phone number, with area code',
  },
} as const satisfies Record<Locale, RuleMessages>

/**
 * The kit's rule messages plus the project's (`records/rule-messages.ts`, KIT.md §3.4), in the
 * same order as `FIELD_LABELS`: the project spreads last, so a repeated key is a deliberate
 * rewording and the three locales must carry it (`validator.test.ts`).
 */
export const RULE_MESSAGES = {
  'pt-BR': {
    ...KIT_RULE_MESSAGES['pt-BR'],
    ...PROJECT_RULE_MESSAGES['pt-BR'],
  },
  es: { ...KIT_RULE_MESSAGES.es, ...PROJECT_RULE_MESSAGES.es },
  en: { ...KIT_RULE_MESSAGES.en, ...PROJECT_RULE_MESSAGES.en },
} as const satisfies Record<Locale, Readonly<Record<string, string>>>

/**
 * The friendly name of each field the kit itself validates (session, storage, user,
 * listing), in pt-BR, in the form that fits well after "Informe". A field outside the
 * map appears with its raw name; the backend's `validator.unit.spec.ts` walks the
 * validators and demands the whole list.
 *
 * Only the kit's fields live here: this file is overwritten by the sync, so a
 * resource's label (title, gallery, presenters) would be one project's domain leaking
 * into every other. The project adds its own in `records/field-labels.ts`
 * (`PROJECT_FIELD_LABELS`, KIT.md §3.4).
 *
 * The key is the field path and nothing more: the message is global and does not know which
 * validator is running. The label swaps only the **displayed** text; the error
 * path remains the field name, and it is what the form uses to mark
 * the right input.
 */
const PT_BR_LABELS = {
  // Identity and account
  name: 'o nome',
  email: 'o e-mail',
  phone: 'o celular',
  login: 'o e-mail ou o celular',
  password: 'a senha',
  passwordConfirmation: 'a confirmação da senha',
  currentPassword: 'a senha atual',
  token: 'o código',
  role: 'o papel',
  status: 'o status',
  avatarId: 'o avatar',
  id: 'o identificador',
  slug: 'o slug',

  // File
  fileName: 'o nome do arquivo',
  mimetype: 'o tipo do arquivo',
  size: 'o tamanho',
  parts: 'as partes',
  partNumber: 'o número da parte',
  etag: 'o ETag',

  // Listing
  page: 'a página',
  perPage: 'o total por página',
  search: 'a busca',
  sort: 'a ordenação',
  direction: 'a direção da ordenação',
  trashed: 'o filtro de arquivados',

  // City and tenant (DECISIONS.md #390)
  state: 'a UF',
  timeZone: 'o fuso horário',
  latitude: 'a latitude',
  longitude: 'a longitude',
  south: 'o limite sul',
  west: 'o limite oeste',
  north: 'o limite norte',
  east: 'o limite leste',
  tenantId: 'o cliente',
  type: 'o tipo',
  cityId: 'a cidade',
  parentId: 'o cliente pai',
  userId: 'a conta',

  // Receipt and its review (labels the kit's upload and review fields share)
  storageId: 'o comprovante',
  receiptId: 'o comprovante conferido',
  reason: 'o motivo',
} as const

type FieldLabels = Record<keyof typeof PT_BR_LABELS, string>

/** The kit's labels alone, so a spec can tell them apart from the project's. */
export const KIT_FIELD_LABELS = {
  'pt-BR': PT_BR_LABELS,
  es: {
    name: 'el nombre',
    email: 'el correo electrónico',
    phone: 'el celular',
    login: 'el correo electrónico o el celular',
    password: 'la contraseña',
    passwordConfirmation: 'la confirmación de la contraseña',
    currentPassword: 'la contraseña actual',
    token: 'el código',
    role: 'el rol',
    status: 'el estado',
    avatarId: 'el avatar',
    id: 'el identificador',
    slug: 'el slug',
    fileName: 'el nombre del archivo',
    mimetype: 'el tipo del archivo',
    size: 'el tamaño',
    parts: 'las partes',
    partNumber: 'el número de la parte',
    etag: 'el ETag',
    page: 'la página',
    perPage: 'el total por página',
    search: 'la búsqueda',
    sort: 'el orden',
    direction: 'la dirección del orden',
    trashed: 'el filtro de archivados',
    state: 'la UF',
    timeZone: 'la zona horaria',
    latitude: 'la latitud',
    longitude: 'la longitud',
    south: 'el límite sur',
    west: 'el límite oeste',
    north: 'el límite norte',
    east: 'el límite este',
    tenantId: 'el cliente',
    type: 'el tipo',
    cityId: 'la ciudad',
    parentId: 'el cliente padre',
    userId: 'la cuenta',
    storageId: 'el comprobante',
    receiptId: 'el comprobante verificado',
    reason: 'el motivo',
  },
  en: {
    name: 'the name',
    email: 'the email',
    phone: 'the mobile number',
    login: 'the email or the mobile number',
    password: 'the password',
    passwordConfirmation: 'the password confirmation',
    currentPassword: 'the current password',
    token: 'the code',
    role: 'the role',
    status: 'the status',
    avatarId: 'the avatar',
    id: 'the identifier',
    slug: 'the slug',
    fileName: 'the file name',
    mimetype: 'the file type',
    size: 'the size',
    parts: 'the parts',
    partNumber: 'the part number',
    etag: 'the ETag',
    page: 'the page',
    perPage: 'the page size',
    search: 'the search',
    sort: 'the sort order',
    direction: 'the sort direction',
    trashed: 'the archived filter',
    state: 'the state',
    timeZone: 'the time zone',
    latitude: 'the latitude',
    longitude: 'the longitude',
    south: 'the south limit',
    west: 'the west limit',
    north: 'the north limit',
    east: 'the east limit',
    tenantId: 'the client',
    type: 'the type',
    cityId: 'the city',
    parentId: 'the parent client',
    userId: 'the account',
    storageId: 'the receipt',
    receiptId: 'the checked receipt',
    reason: 'the reason',
  },
} as const satisfies Record<Locale, FieldLabels>

/**
 * The kit's labels plus the project's. The project spreads last: a project key that
 * repeats a kit key renames that field in every form, on purpose, because the word the user
 * reads is the product's (an ad's address, not "slug"). The repetition is deliberate and
 * the three locales must carry it (`validator.test.ts`).
 */
export const FIELD_LABELS = {
  'pt-BR': {
    ...KIT_FIELD_LABELS['pt-BR'],
    ...PROJECT_FIELD_LABELS['pt-BR'],
  },
  es: { ...KIT_FIELD_LABELS.es, ...PROJECT_FIELD_LABELS.es },
  en: { ...KIT_FIELD_LABELS.en, ...PROJECT_FIELD_LABELS.en },
} as const satisfies Record<Locale, Readonly<Record<string, string>>>

/**
 * Zod's locale for each language: it is the fallback for what `RULE_MESSAGES` does not
 * cover (unknown key, invalid union), in the docs' order of precedence -
 * global message (`customError`) first, locale after
 * (_doc-lib/zod.md#error-customization, https://zod.dev/error-customization).
 */
const ZOD_LOCALES = {
  'pt-BR': z.locales.ptBR,
  es: z.locales.es,
  en: z.locales.en,
} satisfies Record<Locale, () => { localeError: z.core.$ZodErrorMap }>

/**
 * The translation of a Zod issue into the house message.
 *
 * It lives in a class because it holds the active language, which is module state. The
 * language starts as pt-BR; the browser switches it with `ValidationMessage.setLocale(getLocale())`
 * (`frontend/src/router.tsx`), and the server keeps pt-BR because the state is shared by
 * parallel requests.
 */
export class ValidationMessage {
  private static locale: Locale = LOCALE.PT_BR

  /** Switches the messages' language and Zod's fallback locale. */
  static setLocale(locale: Locale): void {
    ValidationMessage.locale = locale
    z.config(ZOD_LOCALES[locale]())
  }

  /**
   * The issue's message, or `undefined` to yield to Zod's locale -
   * the `customError` contract (_doc-lib/zod.md#error-customization).
   */
  static resolve(issue: z.core.$ZodRawIssue): string | undefined {
    const rule = ValidationMessage.rule(issue)
    if (!rule) return undefined

    const field = ValidationMessage.field(issue.path)
    const messages: Readonly<Record<string, string>> =
      RULE_MESSAGES[ValidationMessage.locale]
    // From specific to generic, like VineJS's provider: the chain is the
    // rule, and not a fallback that hides a missing key.
    const template = messages[`${field}.${rule}`] ?? messages[rule]
    if (!template) return undefined

    const labels: Readonly<Record<string, string>> =
      FIELD_LABELS[ValidationMessage.locale]
    const values: Readonly<Record<string, string>> = {
      field: labels[field] ?? field,
      min: String(ValidationMessage.bound(issue, 'minimum')),
      max: String(ValidationMessage.bound(issue, 'maximum')),
    }

    return template.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (_match, key: string) => values[key] ?? '',
    )
  }

  /** The `RULE_MESSAGES` rule that the issue represents. */
  private static rule(issue: z.core.$ZodRawIssue): string | undefined {
    // An empty field is "required", whatever the rule that failed it: it is the
    // reading of the backend bodyparser's `convertEmptyStringsToNull`, where
    // `''` becomes `null` before validating.
    if (issue.input === undefined || issue.input === null) return 'required'
    if (issue.input === '') return 'required'

    switch (issue.code) {
      case 'invalid_type':
        if (issue.expected === 'int') return 'withoutDecimals'
        return issue.expected
      case 'too_small':
        return ValidationMessage.tooSmall(issue.origin, issue)
      case 'too_big':
        if (issue.origin === 'string') return 'maxLength'
        if (issue.origin === 'array') return 'array.maxLength'
        return 'max'
      case 'invalid_format':
        return issue.format
      case 'invalid_value':
        return 'enum'
      case 'custom':
        return ValidationMessage.customRule(issue.params)
      default:
        return undefined
    }
  }

  private static tooSmall(
    origin: string,
    issue: { readonly minimum: number | bigint; readonly inclusive?: boolean },
  ): string {
    if (origin === 'string') return 'minLength'
    if (origin === 'array') return 'array.minLength'
    if (issue.minimum === 0 && issue.inclusive === false) return 'positive'
    return 'min'
  }

  /** The house refinement names the rule in `params.rule`. */
  private static customRule(
    params: Readonly<Record<string, unknown>> | undefined,
  ): string | undefined {
    const rule = params?.rule
    if (typeof rule !== 'string') return undefined
    return rule
  }

  /** The last text segment of the path: `tags[0]` is `tags`. */
  private static field(path: ReadonlyArray<PropertyKey> | undefined): string {
    const segment = path?.filter((each) => typeof each === 'string').at(-1)
    if (typeof segment !== 'string') return ''
    return segment
  }

  private static bound(
    issue: z.core.$ZodRawIssue,
    key: 'minimum' | 'maximum',
  ): unknown {
    if (!(key in issue)) return ''
    return Reflect.get(issue, key)
  }
}

// No `new Function`: Zod probes eval once to speed up objects, and the kit's CSP has no
// `unsafe-eval`, so every page would report a violation (_doc-lib/zod.md, `jitless`).
z.config({ jitless: true })
z.config(ZOD_LOCALES[LOCALE.PT_BR]())
z.config({ customError: (issue) => ValidationMessage.resolve(issue) })

// ---------------------------------------------------------------------------
// Shared rules
// ---------------------------------------------------------------------------

/** The Postgres `integer` ceiling: above it the column overflows and becomes a 500. */
export const INTEGER_MAX = 2_147_483_647

/**
 * A mark of the editor's JSON (`bold`, `link`...). Only the shape is checked here; which marks
 * exist is the extension list of `rich-text-schema.ts`, checked by the server.
 */
const RichTextMarkSchema = z.object({
  type: z.string(),
  attrs: z.record(z.string(), z.unknown()).optional(),
})

/** A node of the editor's JSON (ProseMirror): `type`, and what each kind of node may carry. */
export type RichTextNode = {
  type: string
  attrs?: Record<string, unknown> | undefined
  content?: Array<RichTextNode> | undefined
  marks?:
    | Array<{ type: string; attrs?: Record<string, unknown> | undefined }>
    | undefined
  text?: string | undefined
}

const RichTextNodeSchema: z.ZodType<RichTextNode, RichTextNode> = z
  .lazy(() =>
    z.object({
      type: z.string(),
      attrs: z.record(z.string(), z.unknown()).optional(),
      content: z.array(RichTextNodeSchema).optional(),
      marks: z.array(RichTextMarkSchema).optional(),
      text: z.string().optional(),
    }),
  )
  .meta({ id: 'RichTextNode' })

/**
 * The ceiling of the rich text, in characters of its serialized JSON. Editorial, like the 50
 * thousand characters the Markdown column had: the JSON carries the same text plus its structure.
 */
export const RICH_TEXT_MAX_LENGTH = 200_000

/**
 * The document the editor writes (`editor.getJSON()`): the shape of the Tiptap JSON, stored in a
 * `jsonb` column and read by the static renderer (`_standards/frontend.md` §8). Which nodes and
 * marks are allowed is `RICH_TEXT_EXTENSIONS` (`rich-text-schema.ts`); the server checks it.
 */
export const RichTextDocumentSchema = z
  .object({
    type: z.literal('doc'),
    content: z.array(RichTextNodeSchema).optional(),
  })
  .meta({ id: 'RichTextDocument' })

export type RichTextDocument = z.infer<typeof RichTextDocumentSchema>

/**
 * What `Rule.optional` returns: the field that may be missing, and for which `''` means missing
 * (the bodyparser's `convertEmptyStringsToNull` does the same on the API).
 */
type BlankableField<T extends z.ZodType> = z.ZodOptional<
  z.ZodPreprocess<z.ZodOptional<T>, z.input<T> | undefined>
>

/** What `Rule.nullable` returns: like `BlankableField`, and `''` becomes an explicit `null`. */
type NullableField<T extends z.ZodType> = z.ZodOptional<
  z.ZodPreprocess<z.ZodNullable<T>, z.input<T> | null | undefined>
>

/**
 * What `Rule.notNull` returns: a field that may be missing, but never `null` nor `''` (both become
 * the `required` message), the pair of `.optional().use(Rule.notNull())` on the API.
 */
type NotNullField<T extends z.ZodType> = z.ZodOptional<
  z.ZodPreprocess<T, z.input<T> | null | undefined>
>

/** The fields of `Rule.partial`: each one of the create, now optional. */
type PartialShape<TShape extends z.ZodRawShape> = {
  -readonly [K in keyof TShape]: z.ZodOptional<TShape[K]>
}

/** What `Rule.partial` returns: the update object, with `''` read as `null` before the fields. */
type PartialObject<TShape extends z.ZodRawShape> = z.ZodPreprocess<
  z.ZodObject<PartialShape<TShape>, z.core.$strip>,
  z.input<z.ZodObject<PartialShape<TShape>, z.core.$strip>>
>

/** The two fields that `Rule.confirmed()` compares. */
type PasswordPair = {
  readonly password?: string | undefined
  readonly passwordConfirmation?: string | undefined
}

/**
 * The rules that more than one resource uses (`_standards/typescript.md` §6).
 *
 * They are methods, not constants: reusing the same schema node in two
 * validators would share the node between them, and each call returns a new one.
 */
export class Rule {
  /** Whole string without a control character; the source of truth of both validator sides. */
  static readonly NO_CONTROL_CHARACTERS = /^\P{Cc}*$/u

  /**
   * An optional field with the backend's semantics: `''` counts as absent, as the
   * bodyparser's `convertEmptyStringsToNull` does before VineJS's `.optional()`.
   * Without this an optional email left blank would be refused as an invalid
   * email, and the API would accept it.
   *
   * The preprocessor's parameter is annotated so the schema's input stays
   * typed (`z.input`), which is where the `zodResolver` takes the form type from
   * (_doc-lib/zod.md#api, https://zod.dev/api#preprocess).
   */
  static optional<T extends z.ZodType>(schema: T): BlankableField<T> {
    return z
      .preprocess(
        (value: z.input<T> | undefined) => Rule.blankAs(value, undefined),
        schema.optional(),
      )
      .optional()
  }

  /**
   * A field that accepts an explicit `null` (removing the cover without replacing it) and may be missing
   * (do not touch). `''` becomes `null`, as in the bodyparser.
   */
  static nullable<T extends z.ZodType>(schema: T): NullableField<T> {
    return z
      .preprocess(
        (value: z.input<T> | null | undefined) => Rule.blankAs(value, null),
        schema.nullable(),
      )
      .optional()
  }

  /**
   * Optional free text (DECISIONS.md #402): absent stays absent, and blank or only spaces is an
   * explicit `null`, never `''`. The pair of `Rule.optionalText()` in the backend's `#core/validator`,
   * so a project does not repeat `trim`, the ceiling and the blank-to-null by field.
   */
  static optionalText(maxLength: number): NullableField<z.ZodString> {
    return Rule.nullable(z.string().trim().max(maxLength))
  }

  /**
   * A field of an update that may be missing (do not touch) but never `null` nor `''`: on the API
   * the bodyparser turns `''` into `null`, and `Rule.notNull()` refuses it with the `required`
   * message, so `{ title: null }` does not erase a required column (`_standards/backend.md` §4.4).
   * A field that accepts `null` on purpose is `Rule.nullable` instead.
   */
  static notNull<T extends z.ZodType>(schema: T): NotNullField<T> {
    return z
      .preprocess(
        (value: z.input<T> | null | undefined) => Rule.blankAs(value, null),
        schema,
      )
      .optional()
  }

  /**
   * The update of a resource from the same fields as its create (`postFields()`): every field
   * becomes optional, and `''` becomes `null` before them, so a required field left blank is the
   * `required` message and not an empty string that the API refuses later. A field built with
   * `Rule.nullable` keeps accepting `null`. The pair of `Rule.partial()` on the API, which does
   * the same with `.partial()` and `Rule.notNull()` (`_standards/backend.md` §4.4,
   * _doc-lib/zod.md#api, https://zod.dev/api#partial).
   */
  static partial<TShape extends z.ZodRawShape>(
    fields: TShape,
  ): PartialObject<TShape> {
    return z.preprocess(
      (value: z.input<z.ZodObject<PartialShape<TShape>, z.core.$strip>>) =>
        Rule.blankFieldsAsNull(value),
      z.object(fields).partial(),
    )
  }

  /**
   * A key-to-value map in which an invalid entry vanishes, instead of failing
   * the whole map. It is for outside data that the product can discard without warning
   * (a layout saved in `localStorage`): a corrupted width cannot erase the
   * user's other columns.
   */
  static lenientRecord<T extends z.ZodType>(
    item: T,
  ): z.ZodPipe<
    z.ZodRecord<z.ZodString, z.ZodUnknown>,
    z.ZodTransform<Record<string, z.output<T>>, Record<string, unknown>>
  > {
    return z.record(z.string(), z.unknown()).transform((entries) => {
      const kept: Record<string, z.output<T>> = {}

      for (const [key, value] of Object.entries(entries)) {
        const parsed = item.safeParse(value)
        if (parsed.success) kept[key] = parsed.data
      }

      return kept
    })
  }

  /**
   * The date as the API exchanges it: `YYYY-MM-DD`, the text that the `DatePicker`
   * keeps and that the body carries. The 40-character ceiling keeps the field from becoming
   * free text; the real format is checked on the server.
   */
  static wireDate(): z.ZodString {
    return z.string().trim().min(1).max(40)
  }

  /**
   * The editor's JSON document, within the editorial ceiling. The content of the nodes is the
   * server's to check (it holds the extension list); here the form refuses what is not a
   * document or is too big, with the same `richText` message the API answers.
   */
  static richText(): typeof RichTextDocumentSchema {
    return RichTextDocumentSchema.refine(
      (document) => JSON.stringify(document).length <= RICH_TEXT_MAX_LENGTH,
      { params: { rule: 'richText' } },
    )
  }

  static email(): z.ZodEmail {
    // Lowercase, like the backend pair: `A@x.com` and `a@x.com` are one account.
    return z.email().toLowerCase().max(254)
  }

  /**
   * A Brazilian mobile in E.164, the account's identity (DECISIONS.md #396): `+55`, the area code
   * (11 to 99), the leading 9 and eight digits. The only form stored, so the unique column and the
   * sign-in lookup compare one text.
   */
  static readonly PHONE = /^\+55[1-9][1-9]9\d{8}$/

  /**
   * A Brazilian landline or mobile in E.164 (`+55`, area code 11 to 99, then 9 and eight digits for
   * a mobile or 2 to 5 and seven digits for a landline), for the form that accepts either, such
   * as a registration where the contact may be a landline. The identity stays `PHONE`.
   */
  static readonly ANY_PHONE = /^\+55[1-9][1-9](?:9\d{8}|[2-5]\d{7})$/

  /**
   * The ceiling of what is typed, before the normalization: the longest mask (`+55 (97) 99123-4567`,
   * 19 characters) fits and a pasted text does not reach the pattern (CWE-400).
   */
  static readonly PHONE_INPUT_MAX_LENGTH = 20

  /**
   * Whatever the person typed, as E.164: the digits alone, with `+55` added when it is missing.
   * The length tells the shapes apart (10 or 11 national, 12 or 13 with the country), so an area
   * code 55 is not read as the country. What fits no shape (or has letters) returns as it came, and the pattern
   * (`PHONE` or `ANY_PHONE`) refuses it.
   */
  static normalizePhone(raw: string): string {
    // Only what a mask holds: digits, spaces, parentheses, hyphen and `+`. Letters around the
    // digits ("ligue 97991234567") are not a phone, and stripping them would accept the text.
    if (!/^[\d\s()+-]+$/.test(raw)) return raw
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`
    if (
      (digits.length === 12 || digits.length === 13) &&
      digits.startsWith('55')
    )
      return `+${digits}`

    return raw
  }

  /** The Brazilian mobile as E.164; the backend pair is `Rule.phone()`. */
  static phone(): z.ZodPipe<z.ZodString, z.ZodTransform<string, string>> {
    return z
      .string()
      .trim()
      .max(Rule.PHONE_INPUT_MAX_LENGTH)
      .transform((value) => Rule.normalizePhone(value))
      .refine((value) => Rule.PHONE.test(value), {
        params: { rule: 'phone' },
      })
  }

  /** A Brazilian landline or mobile as E.164; the backend pair is `Rule.anyPhone()`. */
  static anyPhone(): z.ZodPipe<z.ZodString, z.ZodTransform<string, string>> {
    return z
      .string()
      .trim()
      .max(Rule.PHONE_INPUT_MAX_LENGTH)
      .transform((value) => Rule.normalizePhone(value))
      .refine((value) => Rule.ANY_PHONE.test(value), {
        params: { rule: 'anyPhone' },
      })
  }

  /** What a URL segment may hold: lowercase words joined by a hyphen. */
  static readonly SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  /**
   * The first segment after the language that the frontend already owns (DECISIONS.md #399): a
   * city or tenant slug equal to one would be swallowed by the fixed route (`/pt-br/dashboard`
   * is the panel, never the city `dashboard`). The language prefixes are the lowercase locales of
   * the paraglide `urlPatterns`; the rest are the fixed routes of the kit (authentication,
   * account, panel, platform area) and the machine ones. The dotted names (`sitemap.xml`,
   * `robots.txt`, `.well-known`) already fail `Rule.SLUG`, and stay listed so the list is the whole
   * set of fixed segments. One list for both sides: `Rule.slug()` here and the VineJS pair.
   */
  static readonly RESERVED_SLUGS: ReadonlyArray<string> = [
    ...LOCALES.map((locale) => locale.toLowerCase()),
    'administrator',
    'sign-in',
    'sign-up',
    'dashboard',
    'platform',
    'account',
    'health-check',
    'sitemap.xml',
    'robots.txt',
    '.well-known',
  ]

  /** A slug that is a URL segment after the language. The backend pair is `Rule.slug()`. */
  static slug(): z.ZodString {
    return z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(Rule.SLUG)
      .refine((value) => !Rule.RESERVED_SLUGS.includes(value), {
        params: { rule: 'notIn' },
      })
  }

  /** A name of the IANA database the runtime knows (`America/Eirunepe`), never an offset. */
  static timeZone(): z.ZodString {
    return z
      .string()
      .trim()
      .min(1)
      .max(64)
      .refine((value) => Rule.isTimeZone(value), {
        params: { rule: 'timeZone' },
      })
  }

  /** Whether `Intl` accepts the zone: `supportedValuesOf` leaves out aliases the runtime still reads. */
  static isTimeZone(value: string): boolean {
    try {
      return (
        Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions()
          .timeZone !== ''
      )
    } catch {
      return false
    }
  }

  /**
   * The label of an uploaded file: no control characters (Unicode `Cc`: C0, DEL and C1).
   * The name is client input that later reaches terminals and logs, where an escape
   * sequence is obeyed instead of shown (CWE-150). The backend pair is `fileName()`.
   */
  static fileName(): z.ZodString {
    return z.string().trim().min(1).max(255).regex(Rule.NO_CONTROL_CHARACTERS)
  }

  /**
   * Password strength: one `regex` per character class. The confirmation does not live
   * here: it is a rule between two fields, and goes on the object through `Rule.confirmed()`.
   */
  static password(): z.ZodString {
    return z
      .string()
      .min(8)
      .max(32)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^a-zA-Z0-9]/)
  }

  /**
   * `passwordConfirmation` equal to `password`, with the error pointed at the
   * confirmation, which is where the message needs to appear (`path`). `when` makes the
   * refinement run even with another field invalid, as long as the two
   * password fields are well formed (_doc-lib/zod.md#api, https://zod.dev/api#when).
   */
  static confirmed(): [
    check: (payload: PasswordPair) => boolean,
    params: {
      path: Array<PropertyKey>
      params: { rule: string }
      when: (payload: z.core.ParsePayload) => boolean
    },
  ] {
    return [
      (payload) => payload.password === payload.passwordConfirmation,
      {
        path: ['passwordConfirmation'],
        params: { rule: 'confirmed' },
        when: (payload: z.core.ParsePayload) =>
          payload.issues.every(
            (issue) =>
              issue.path?.[0] !== 'password' &&
              issue.path?.[0] !== 'passwordConfirmation',
          ),
      },
    ]
  }

  static activeStatus(): z.ZodEnum<{ [K in ActiveStatus]: K }> {
    return z.enum(ACTIVE_STATUSES)
  }

  /**
   * The page of a listing that has no text search. The `perPage` ceiling lives here, and
   * `paginationFields()` spreads it: a listing that does not filter by `search` does not accept
   * it (`_standards/backend.md` §4.4).
   */
  static pageFields(): {
    page: BlankableField<z.ZodNumber>
    perPage: BlankableField<z.ZodNumber>
  } {
    return {
      // Whole numbers with a ceiling: `page=1.5` or `page=1e308` would reach the offset (#382).
      page: Rule.optional(z.number().int().min(1).max(10_000)),
      perPage: Rule.optional(z.number().int().min(1).max(100)),
    }
  }

  /** The page plus `search`, only for the listing that really reads `payload.search`. */
  static paginationFields(): {
    page: BlankableField<z.ZodNumber>
    perPage: BlankableField<z.ZodNumber>
    search: BlankableField<z.ZodString>
  } {
    return {
      ...Rule.pageFields(),
      search: Rule.optional(z.string().trim().max(100)),
    }
  }

  /**
   * The trash slice, only for the listings that have something to restore. Outside
   * `paginationFields()` on purpose: the storefront never sees archived records.
   */
  static trashedField(): {
    trashed: BlankableField<z.ZodEnum<{ [K in TrashedMode]: K }>>
  } {
    return { trashed: Rule.optional(z.enum(TRASHED_MODES)) }
  }

  /**
   * A listing's order in two fields: `sort` (the column, from a list
   * closed per resource) and `direction`. A pair, and not an `order-<column>` per
   * column: two order parameters do not express precedence.
   */
  static sortFields<const TColumns extends readonly [string, ...Array<string>]>(
    columns: TColumns,
  ): {
    sort: BlankableField<z.ZodEnum<{ [K in TColumns[number]]: K }>>
    direction: BlankableField<z.ZodEnum<{ [K in SortDirection]: K }>>
  } {
    return {
      sort: Rule.optional(z.enum(columns)),
      direction: Rule.optional(z.enum(SORT_DIRECTIONS)),
    }
  }

  /**
   * The spellings `vine.boolean()` turns into a boolean, the same list and the same case
   * (`helpers.isTrue`/`isFalse` of `@vinejs/vine` 4.4; _doc-lib/vinejs.md#types/boolean,
   * https://vinejs.dev/docs/types/boolean). Anything else stays as it came and fails `z.boolean()`.
   */
  static readonly BOOLEAN_SPELLINGS: ReadonlyMap<unknown, boolean> = new Map<
    unknown,
    boolean
  >([
    [true, true],
    [1, true],
    ['1', true],
    ['true', true],
    ['on', true],
    [false, false],
    [0, false],
    ['0', false],
    ['false', false],
  ])

  /**
   * A yes-or-no filter of a listing (`available`, `pinned`): the router may hand a boolean or
   * a number and the query string hands text, and the result is `boolean | undefined`. The pair
   * on the API is `vine.boolean().optional()` (DECISIONS.md #766).
   *
   * It accepts exactly what `vine.boolean()` accepts: `true`, `1`, `'1'`, `'true'`, `'on'` and
   * `false`, `0`, `'0'`, `'false'`, case-sensitive. Not `z.stringbool()`
   * (_doc-lib/zod.md#api, https://zod.dev/api#stringbool): its defaults also take `yes`, `no`,
   * `y`, `n`, `off`, `enabled`, `disabled` in any case and refuse the number, and the union with
   * `z.boolean()` fails as `invalid_union`, which has no house message. Here a wrong value fails
   * `z.boolean()` with the same `boolean` message as the API. The one difference from VineJS:
   * only spaces is absent here (`Rule.optional`), and VineJS, which turns only `''` into `null`,
   * refuses it.
   */
  static queryBoolean(): BlankableField<
    z.ZodPreprocess<z.ZodBoolean, boolean | number | string>
  > {
    return Rule.optional(
      z.preprocess(
        (value: boolean | number | string) =>
          Rule.BOOLEAN_SPELLINGS.get(value) ?? value,
        z.boolean(),
      ),
    )
  }

  /** The bodyparser's `convertEmptyStringsToNull` on the top fields of an object. */
  private static blankFieldsAsNull<TValue>(value: TValue): TValue | object {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      return value

    return Object.fromEntries(
      Object.entries(value).map(([key, field]) => [
        key,
        Rule.blankAs(field, null),
      ]),
    )
  }

  private static blankAs<TValue, TBlank extends null | undefined>(
    value: TValue,
    blank: TBlank,
  ): TValue | TBlank {
    // Only spaces counts as blank too: the API trims the field (`vine.string().trim()`, DECISIONS.md
    // #402) and the form must read the same text the API does.
    if (typeof value === 'string' && value.trim() === '') return blank
    return value
  }
}

// ---------------------------------------------------------------------------
// Global validators
// ---------------------------------------------------------------------------

/** The identifier in the URL. The PK is a uuid in every table. */
export const IdentifierValidator = z.object({ id: z.uuid() })

/** The listing without text search (`Rule.pageFields()`). */
export const PageValidator = z.object(Rule.pageFields())

export const PaginationValidator = z.object(Rule.paginationFields())

/**
 * The pagination of resources that have a trash: the `PaginationValidator` plus
 * `trashed`. A schema of its own because the storefront listings stay without it.
 */
export const TrashablePaginationValidator = z.object({
  ...Rule.paginationFields(),
  ...Rule.trashedField(),
})

export type IdentifierPayload = z.infer<typeof IdentifierValidator>
export type PagePayload = z.infer<typeof PageValidator>
export type PaginationPayload = z.infer<typeof PaginationValidator>
export type TrashablePaginationPayload = z.infer<
  typeof TrashablePaginationValidator
>
