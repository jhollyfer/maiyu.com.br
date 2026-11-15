/**
 * Refuses a Paraglide compile that came out without messages.
 *
 * `paraglide-js compile` exits 0 even when the inlang plugin fails to load: it prints
 * `PluginImportError: fetch failed` as a warning and writes an empty catalog. Everything after it
 * stays green (`inlang check`, the build), the container passes `/health-check` and the site ships
 * with every `m.*` undefined (`DECISIONS.md` #780). The compiler gives no exit code for it, so
 * this script is the exit code (_doc-lib/paraglide.md#/compiling-messages,
 * https://paraglidejs.com/compiling-messages).
 *
 * Two checks, both on files, no network:
 *
 * 1. every entry of `modules` in `project.inlang/settings.json` is a local file that exists. An
 *    `http(s)` entry is refused: it puts the CDN back in the build path. The plugins are
 *    devDependencies (`./node_modules/@inlang/<plugin>/dist/index.js`), because the inlang SDK
 *    reads a path that does not start with `http` straight from disk
 *    (_doc-lib/paraglide.md#/file-formats).
 * 2. every key of the base locale file has a function in the compiled `src/paraglide/messages.js`.
 *
 * Usage: `node scripts/check-i18n-compile.mjs [project.inlang] [src/paraglide]`, run by
 * `i18n:compile` right after the compiler.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * @param {{
 *   modules: readonly string[]
 *   entryExists: (entry: string) => boolean
 *   baseKeys: readonly string[]
 *   compiledKeys: ReadonlySet<string>
 * }} input
 * @returns {string[]} one line per defect; empty when the compile is sound
 */
export function inspectCompile({
  modules,
  entryExists,
  baseKeys,
  compiledKeys,
}) {
  /** @type {string[]} */
  const problems = []

  for (const entry of modules) {
    if (/^https?:/i.test(entry)) {
      problems.push(
        `module "${entry}" comes from the network; install the plugin as a devDependency and point to ./node_modules/...`,
      )
      continue
    }
    if (!entryExists(entry))
      problems.push(`module "${entry}" does not exist; run pnpm install`)
  }

  const missing = baseKeys.filter((key) => !compiledKeys.has(key))
  if (missing.length > 0) {
    const sample = missing.slice(0, 5).join(', ')
    problems.push(
      `${missing.length} of ${baseKeys.length} messages were not compiled (${sample}); the inlang plugin did not load`,
    )
  }

  return problems
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @param {string} file @returns {Record<string, unknown>} */
function readJson(file) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'))
  if (!isRecord(parsed)) throw new Error(`${file} is not a JSON object`)
  return parsed
}

/** @param {unknown} value @returns {string[]} */
function stringList(value) {
  if (!Array.isArray(value)) return []
  return value.filter((item) => typeof item === 'string')
}

/** @param {Record<string, unknown>} settings @returns {string} */
function messagePathPattern(settings) {
  const plugin = settings['plugin.inlang.messageFormat']
  if (isRecord(plugin) && typeof plugin.pathPattern === 'string')
    return plugin.pathPattern
  return './messages/{locale}.json'
}

/** @param {string} file @returns {Promise<Set<string>>} the names `m` exposes */
async function readCompiledKeys(file) {
  const compiled = await import(pathToFileURL(file).href)
  if (!isRecord(compiled.m)) return new Set()
  return new Set(Object.keys(compiled.m))
}

async function main() {
  const project = resolve(process.argv[2] ?? 'project.inlang')
  const outdir = resolve(process.argv[3] ?? 'src/paraglide')
  const root = dirname(project)

  const settings = readJson(join(project, 'settings.json'))
  const modules = stringList(settings.modules)
  const baseLocale = String(settings.baseLocale)
  const baseFile = messagePathPattern(settings).replace('{locale}', baseLocale)

  const baseKeys = Object.keys(readJson(resolve(root, baseFile))).filter(
    (key) => !key.startsWith('$'),
  )

  const problems = inspectCompile({
    modules,
    entryExists: (entry) => existsSync(resolve(root, entry)),
    baseKeys,
    compiledKeys: await readCompiledKeys(join(outdir, 'messages.js')),
  })

  if (problems.length === 0) {
    process.stdout.write(
      `i18n compile: ${baseKeys.length} messages, ${modules.length} local plugin(s).\n`,
    )
    return
  }

  process.stderr.write(
    `i18n compile failed:\n${problems.map((line) => `  ${line}`).join('\n')}\n`,
  )
  process.exit(1)
}

if (import.meta.main) await main()
