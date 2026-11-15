/**
 * The bundler log that stops `pnpm build` instead of printing a warning.
 *
 * `IMPORT_IS_UNDEFINED` is Rolldown saying that a module imports a name the target does not
 * export. In this app the case that matters is Paraglide: when the compiler loses its inlang
 * plugin (`PluginImportError`, which it only warns about), the catalog comes out empty and every
 * `m.*` import turns into this warning, hundreds of them. The build used to finish green, the
 * container passed `/health-check` and the site shipped without a single message
 * (`DECISIONS.md` #780; the plugins come from `node_modules` and `scripts/check-i18n-compile.mjs`
 * guards the compile, `_standards/frontend.md` §9.11).
 *
 * The handler goes in `build.rolldownOptions.onLog` (the legacy `onwarn` is the same hook;
 * _doc-lib/vitejs.md#build, https://vite.dev/config/build-options#build-rolldownoptions;
 * https://rolldown.rs/reference/InputOptions.onLog). It **throws**: Rolldown documents
 * `defaultHandler('error', log)` as the way to fail, but Vite hands the handler its own logger
 * (`viteLog`, vite/dist/node/chunks/node.js), whose `error` level only prints a red line and lets
 * the build finish green (checked on Vite 8.3.8).
 */

/** The codes that are a defect of the bundle, never noise. */
const FATAL_CODES: ReadonlySet<string> = new Set(['IMPORT_IS_UNDEFINED'])

type BuildLogLevel = 'debug' | 'info' | 'warn' | 'error'

type BuildLog = Readonly<{ code?: string | undefined; message: string }>

type BuildLogHandler = (level: BuildLogLevel, log: BuildLog) => void

/**
 * `onLog` of `build.rolldownOptions`: a log with a fatal code throws, which stops the build; any
 * other log keeps the level and the destination Vite gave it.
 */
export function failOnUndefinedImport(
  level: BuildLogLevel,
  log: BuildLog,
  defaultHandler: BuildLogHandler,
): void {
  if (log.code !== undefined && FATAL_CODES.has(log.code)) {
    throw new Error(`${log.code}: ${log.message}`)
  }

  defaultHandler(level, log)
}
