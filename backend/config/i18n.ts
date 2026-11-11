import app from '@adonisjs/core/services/app'
import { defineConfig, formatters } from '@adonisjs/i18n'
import type { I18n } from '@adonisjs/i18n'

import { BASE_LOCALE, LOCALES } from '@maiyu/shared'

import ProjectLabelsLoader from '#core/project-labels-loader'

/**
 * The product languages come from `shared/` (`_standards/i18n.md` §1): a new language
 * goes in there, not here. The business messages live in
 * `resources/lang/{pt-BR,es,en}/` in ICU format
 * (_doc-lib/adonisjs.md#guides/digging-deeper/i18n). The project's field labels and rule
 * messages win over the kit's in a fixed order (`core/project-labels-loader.ts`).
 */
const i18nConfig = defineConfig({
  defaultLocale: BASE_LOCALE,
  supportedLocales: [...LOCALES],
  formatter: formatters.icu(),
  loaders: ProjectLabelsLoader.layered(app.languageFilesPath()),
})

export default i18nConfig

/**
 * The request translator in `ctx.i18n`, set by
 * `detect-user-locale.middleware.ts`. Here, in a type-and-config-only file, and
 * not in the middleware: augmenting `HttpContext` in the same module that imports
 * `I18n` as a value breaks the whole context type in TypeScript 7.
 */
declare module '@adonisjs/core/http' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging requires `interface`
  export interface HttpContext {
    i18n: I18n
  }
}
