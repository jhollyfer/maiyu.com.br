import type { Locale } from '../enums/locale.js'

/**
 * The messages of the project's own rules (a CPF check digit, a phone, a date after another
 * field), keyed like the kit's (`<rule>` or `<field>.<rule>`), merged with the kit's in
 * `RULE_MESSAGES`. It is the project's file (KIT.md §3.4): the sync creates this empty
 * skeleton when it is missing and never overwrites it, so `validator.ts` always has something
 * to import. Each key needs the three languages and the same text in
 * `resources/lang/<l>/validator.json` (`shared.messages.<rule>`) of the backend.
 */
export const PROJECT_RULE_MESSAGES = {
  'pt-BR': {},
  es: {},
  en: {},
} as const satisfies Record<Locale, Readonly<Record<string, string>>>
