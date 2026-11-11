import type { Locale } from '../enums/locale.js'

/**
 * The friendly name of each field of the project's own resources (title, gallery,
 * presenters), in the form that fits well after "Informe", merged with the kit's in
 * `FIELD_LABELS`. It is the project's file (KIT.md §3.4): the sync creates this empty
 * skeleton when it is missing and never overwrites it, so `validator.ts` always has
 * something to import. Each key needs the three languages and the same text in
 * `resources/lang/<l>/validator/shared/fields.json` of the backend.
 */
export const PROJECT_FIELD_LABELS = {
  'pt-BR': {},
  es: {},
  en: {},
} as const satisfies Record<Locale, Readonly<Record<string, string>>>
