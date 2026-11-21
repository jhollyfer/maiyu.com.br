/**
 * Refuses a project that does not carry every component of the shadcn registry in `src/components/ui/`.
 *
 * The rule is strict shadcn over Base UI, on every screen (_standards/frontend.md §6, DECISIONS.md
 * #366): a piece that is not installed is a piece the screen writes by hand. `shadcn add --all` is
 * the way to install the whole registry (https://ui.shadcn.com/docs/cli, `-a, --all`), but nothing
 * ran it, and projects kept 38 of 64. The list of what the registry ships is data, in
 * `ui-components.json` next to this script (the `registry:ui` items of the `base-nova` style that have
 * a file, plus the hooks and the lib the registry installs with them), and the rule text points
 * there instead of repeating it. DECISIONS.md #806.
 *
 * Every name of `components` must exist as `components/ui/<name>.tsx`, and every `support` file under
 * `src/`. `ui/` stays the registry's output, so `shadcn add <name> --diff` keeps comparing it with the
 * registry (DECISIONS.md #391): `--fix` runs `shadcn add <missing names> --yes --overwrite` and puts
 * back, byte for byte, every file of `components/ui/`, `hooks/` and `lib/` the project had (the CLI
 * asks "already exists, overwrite?" for each registry dependency it finds, even with `--yes`, and
 * stops when nobody answers: `-o` is the only non-interactive way, and the snapshot keeps the
 * `// casa:` lines safe). What came in is then brought to the house, the steps of frontend.md §6
 * "Reinstalar o registry": `import { cn } from "cn"` back to `#/lib/cn`, an unused `import * as React` out, the `cn` package out of
 * `package.json`, kit versions pinned, Prettier, and the `// casa:` patches (`check-ui-patches.mjs`).
 *
 * `--registry` compares `components` with the live registry and fails when the registry ships a
 * component the list lacks, or the list names one the registry dropped: it is how the upstream keeps
 * the list current, and it needs the network, so the unit gate does not run it.
 *
 * Usage: `node scripts/check-ui-components.mjs [--fix | --registry] [dir]` - `dir` is `src/`, and
 * defaults to `../src` from this file, so it runs from any cwd; a missing dir fails.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkDir, fixDir, loadPatches } from './check-ui-patches.mjs'

/** @typedef {{ file: string, item: string }} SupportFile */
/** @typedef {{ registry: string, source: string, components: string[], support: SupportFile[], excluded: Record<string, string> }} UiManifest */
/** @typedef {{ file: string, item: string }} MissingFile */

const RULE = 'frontend.md §6, DECISIONS.md #366 e #806'

/** @returns {UiManifest} */
export function loadManifest() {
  const path = fileURLToPath(new URL('./ui-components.json', import.meta.url))
  return JSON.parse(readFileSync(path, 'utf8'))
}

/**
 * What `src` lacks of the manifest: a `components/ui/<name>.tsx` per component and each support file.
 *
 * @param {string} src
 * @param {UiManifest} manifest
 * @returns {MissingFile[]}
 */
export function missingFiles(src, manifest) {
  const components = manifest.components.map((name) => ({
    file: `components/ui/${name}.tsx`,
    item: name,
  }))
  return [...components, ...manifest.support].filter(
    (each) => !existsSync(join(src, each.file)),
  )
}

/**
 * The registry names `shadcn add` takes for what is missing, without repeats.
 *
 * @param {MissingFile[]} missing
 */
export function installNames(missing) {
  return [...new Set(missing.map((each) => each.item))]
}

/**
 * Registry names the list and the live registry disagree on.
 *
 * @param {UiManifest} manifest
 * @param {{ name: string, type: string, files?: unknown[] }[]} items the `items` of the registry index
 */
export function registryDrift(manifest, items) {
  const live = items
    .filter((each) => each.type === 'registry:ui')
    .filter((each) => (each.files ?? []).length > 0)
    .map((each) => each.name)
  return {
    // `excluded` names what the registry lists without a file, so it is not a new component.
    missingInList: live.filter((name) => !manifest.components.includes(name)),
    goneFromRegistry: manifest.components.filter(
      (name) => !live.includes(name),
    ),
  }
}

/** @param {MissingFile} problem */
export function describe(problem) {
  return `ui-components: falta ${problem.file} (shadcn add ${problem.item}). Régua: ${RULE}; lista em scripts/ui-components.json; instalar: node scripts/check-ui-components.mjs --fix`
}

// Where the registry writes (`components.json` aliases `ui`, `hooks`, `lib`), relative to `src/`.
const REGISTRY_DIRS = ['components/ui', 'hooks', 'lib']

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return walk(join(dir, entry.name))
    return [join(dir, entry.name)]
  })
}

/**
 * Every file the registry could rewrite, with its text.
 *
 * @param {string} src
 * @returns {Map<string, string>}
 */
export function snapshot(src) {
  const files = REGISTRY_DIRS.flatMap((dir) => walk(join(src, dir)))
  return new Map(files.map((file) => [file, readFileSync(file, 'utf8')]))
}

/**
 * Puts the snapshot back: the project's files win over the registry's.
 *
 * @param {Map<string, string>} before
 */
export function restore(before) {
  for (const [file, text] of before) writeFileSync(file, text)
}

/**
 * The registry writes `import { cn } from "cn"` and the house keeps its own `lib/cn.ts`
 * (frontend.md §6, DECISIONS.md #451).
 *
 * @param {string} source
 */
export function houseCn(source) {
  return source.replace(/from\s+(['"])cn\1/g, "from '#/lib/cn'")
}

/**
 * `import * as React from 'react'` that nothing reads: the registry writes it in files that only use
 * the JSX runtime, and the project's `tsc` (`noUnusedLocals`) refuses it.
 *
 * @param {string} source
 */
export function dropUnusedReact(source) {
  const line = /^import \* as React from ['"]react['"]\n/m
  const rest = source.replace(line, '')
  if (/\bReact\b/.test(rest)) return source
  return rest
}

/**
 * The `package.json` the CLI left, brought back to the house: every dependency the CLI added that
 * `kit.deps.json` does not carry goes out (`cn`, `date-fns`, `next-themes`: the registry names them
 * for a component whose code the house does not write with them, frontend.md §6), and the exact
 * version `kit.deps.json` asks replaces the range the CLI wrote (DECISIONS.md #323). A package a
 * component does import is not dropped by this: `undeclaredImports` reports it, and it goes into
 * `kit.deps.json` with an exact version.
 *
 * @param {string} text the package.json after the CLI
 * @param {string} before the package.json before the CLI
 * @param {Record<string, string>} kitDeps `dependencies` and `devDependencies` of `kit.deps.json`
 */
export function housePackage(text, before, kitDeps) {
  const json = JSON.parse(text)
  const had = JSON.parse(before)
  for (const field of ['dependencies', 'devDependencies']) {
    const deps = json[field]
    if (deps === undefined) continue
    for (const name of Object.keys(deps)) {
      if (name in kitDeps) deps[name] = kitDeps[name]
      else if (!(name in (had[field] ?? {}))) delete deps[name]
    }
  }
  return `${JSON.stringify(json, null, 2)}\n`
}

/**
 * Bare packages the registry files import and the `package.json` does not declare: what a
 * component needs and `kit.deps.json` lacks.
 *
 * @param {string} src
 * @param {string} packageText
 * @returns {string[]}
 */
export function undeclaredImports(src, packageText) {
  const json = JSON.parse(packageText)
  const declared = new Set([
    ...Object.keys(json.dependencies ?? {}),
    ...Object.keys(json.devDependencies ?? {}),
  ])
  const names = REGISTRY_DIRS.flatMap((dir) => walk(join(src, dir)))
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .flatMap((file) =>
      [
        ...readFileSync(file, 'utf8').matchAll(
          /from\s+['"]([^'".#/][^'"]*)['"]/g,
        ),
      ].map((each) => each[1] ?? ''),
    )
    .map((spec) =>
      spec
        .split('/')
        .slice(0, Number(spec.startsWith('@')) + 1)
        .join('/'),
    )
  return [...new Set(names)].filter((name) => !declared.has(name)).sort()
}

/**
 * Runs the CLI for what is missing, keeping what the project has. `run` is the process runner, so a
 * test never starts a package manager.
 *
 * @param {string} src
 * @param {MissingFile[]} missing
 * @param {(command: string, args: string[], cwd: string) => number} run
 * @returns {number} the CLI's exit code, 0 when there was nothing to install
 */
export function installMissing(src, missing, run) {
  if (missing.length === 0) return 0
  const before = snapshot(src)
  const code = run(
    'pnpm',
    [
      'dlx',
      'shadcn@latest',
      'add',
      ...installNames(missing),
      '--yes',
      '--overwrite',
    ],
    join(src, '..'),
  )
  restore(before)
  return code
}

/**
 * Brings the files the CLI created to the house: `cn` import and Prettier.
 *
 * @param {string} src
 * @param {Map<string, string>} before
 * @returns {Promise<string[]>} the new files
 */
async function houseNewFiles(src, before) {
  const prettier = await import('prettier')
  const created = REGISTRY_DIRS.flatMap((dir) => walk(join(src, dir))).filter(
    (file) => !before.has(file) && /\.tsx?$/.test(file),
  )
  for (const file of created) {
    const options = (await prettier.resolveConfig(file)) ?? {}
    const text = dropUnusedReact(houseCn(readFileSync(file, 'utf8')))
    writeFileSync(
      file,
      await prettier.format(text, { ...options, filepath: file }),
    )
  }
  return created
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
function runProcess(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  return result.status ?? 1
}

/** @param {string[]} args */
async function main(args) {
  const src =
    args.find((each) => !each.startsWith('--')) ??
    fileURLToPath(new URL('../src', import.meta.url))
  if (!existsSync(src)) {
    process.stderr.write(`ui-components: pasta não encontrada: ${src}\n`)
    return 1
  }
  const manifest = loadManifest()
  if (args.includes('--registry')) {
    const response = await fetch(manifest.source)
    const index = await response.json()
    const drift = registryDrift(manifest, index.items)
    for (const name of drift.missingInList)
      process.stderr.write(
        `ui-components: o registro tem "${name}" e scripts/ui-components.json não\n`,
      )
    for (const name of drift.goneFromRegistry)
      process.stderr.write(
        `ui-components: scripts/ui-components.json tem "${name}" e o registro não\n`,
      )
    return Number(
      drift.missingInList.length + drift.goneFromRegistry.length > 0,
    )
  }
  if (args.includes('--fix')) {
    const missing = missingFiles(src, manifest)
    const before = snapshot(src)
    const frontend = join(src, '..')
    const packagePath = join(frontend, 'package.json')
    const packageBefore = readFileSync(packagePath, 'utf8')
    const code = installMissing(src, missing, runProcess)
    // The house steps run whatever the CLI answered: it may stop halfway, after it wrote files.
    for (const file of await houseNewFiles(src, before))
      process.stdout.write(`ui-components: instalado ${file}\n`)
    const kit = JSON.parse(
      readFileSync(join(frontend, 'kit.deps.json'), 'utf8'),
    )
    writeFileSync(
      packagePath,
      housePackage(readFileSync(packagePath, 'utf8'), packageBefore, {
        ...kit.dependencies,
        ...kit.devDependencies,
      }),
    )
    for (const name of undeclaredImports(
      src,
      readFileSync(packagePath, 'utf8'),
    ))
      process.stderr.write(
        `ui-components: um componente importa "${name}" e nem o package.json nem o kit.deps.json o têm: entra no kit.deps.json com versão exata\n`,
      )
    if (missing.length > 0)
      process.stdout.write(
        'ui-components: rode `pnpm install` (o package.json mudou)\n',
      )
    const ui = join(src, 'components/ui')
    // What came in has no `// casa:` patch yet: the same list the unit gate charges.
    for (const file of await fixDir(ui, loadPatches()))
      process.stdout.write(`ui-patch: aplicado em ${file}\n`)
    if (code !== 0) return code
    if (checkDir(ui, loadPatches()).length > 0) return 1
  }
  const problems = missingFiles(src, manifest)
  for (const problem of problems) process.stderr.write(`${describe(problem)}\n`)
  return Number(problems.length > 0)
}

// A CLI writes to the stream, never `console` (the lint's `no-console`, tooling.md §4.1).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2))
}
