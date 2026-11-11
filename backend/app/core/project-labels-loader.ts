import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { ConfigProvider } from '@adonisjs/core/types'
import { loaders } from '@adonisjs/i18n'
import type {
  LoaderFactory,
  Translations,
  TranslationsLoaderContract,
} from '@adonisjs/i18n/types'

/**
 * The project's validator texts win over the kit's, every time (`_standards/i18n.md` §3, the same
 * rule as `PROJECT_FIELD_LABELS` over `KIT_FIELD_LABELS` in `shared/`).
 *
 * The kit ships `validator.json` (`validator.shared.fields.*`) and the project adds
 * `validator/shared/fields.json` and `validator/shared/messages.json`, keyed by the same
 * loader into the same keys. The FS loader reads every file in a `Promise.all` and the one that
 * finishes last wins, so a label both declare (`slug`) changed between boots (measured 40 out of
 * 160). A custom loader is the extension point the doc gives
 * (_doc-lib/adonisjs.md#guides/digging-deeper/i18n, https://docs.adonisjs.com/guides/digging-deeper/i18n,
 * "Creating a custom translation loader"), and `I18nManager.reloadTranslations` merges the
 * results in the order of the `loaders` array (the page does not say it; `@adonisjs/i18n` 3.0.1
 * does it with `Object.assign`, and `project-labels-loader.unit.spec.ts` holds it): this loader
 * runs after the FS one and lays the project files over it once more, in a fixed order.
 */
export default class ProjectLabelsLoader implements TranslationsLoaderContract {
  /** The nested files the project owns, relative to each language folder, without `.json`. */
  static readonly FILES = [
    'validator/shared/fields',
    'validator/shared/messages',
  ] as const

  constructor(private readonly location: string) {}

  /** The loaders of `config/i18n.ts`: the FS loader first, the project layer last. */
  static layered(
    location: string,
  ): Array<ConfigProvider<LoaderFactory> | LoaderFactory> {
    return [loaders.fs({ location }), () => new ProjectLabelsLoader(location)]
  }

  async load(): Promise<Translations> {
    const translations: Translations = {}
    const languages = await readdir(this.location, { withFileTypes: true })

    for (const language of languages.filter((entry) => entry.isDirectory())) {
      const messages: Record<string, string> = {}

      for (const file of ProjectLabelsLoader.FILES) {
        const path = join(this.location, language.name, `${file}.json`)
        if (!existsSync(path)) continue

        const content: unknown = JSON.parse(await readFile(path, 'utf8'))
        const prefix = file.replaceAll('/', '.')

        for (const [key, value] of Object.entries(
          ProjectLabelsLoader.flat(content, path),
        ))
          messages[`${prefix}.${key}`] = value
      }

      translations[language.name] = messages
    }

    return translations
  }

  /** The file is flat (`{ "slug": "o slug" }`); anything else is a mistake worth a boot error. */
  private static flat(content: unknown, path: string): Record<string, string> {
    if (
      typeof content !== 'object' ||
      content === null ||
      Array.isArray(content)
    )
      throw new Error(`${path}: expected an object of texts`)

    const entries: Record<string, string> = {}

    for (const [key, value] of Object.entries(content)) {
      if (typeof value !== 'string')
        throw new Error(`${path}: "${key}" is not a text`)
      entries[key] = value
    }

    return entries
  }
}
