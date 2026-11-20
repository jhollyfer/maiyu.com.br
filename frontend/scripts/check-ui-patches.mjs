/**
 * Refuses a `src/components/ui/` that lost a required `// casa:` patch.
 *
 * `ui/` is the shadcn registry's output and stays the project's file, so `shadcn add <name> --diff`
 * keeps comparing it with the registry (_standards/frontend.md §6, DECISIONS.md #391). The house
 * patches on top of it were written rule only, and a project that reinstalled the registry, or never
 * applied them, shipped 28px controls on the phone. The required patches are data, in
 * `ui-patches.json` next to this script, and the rule text points there instead of repeating them.
 *
 * Each entry names a file, an anchor (a regex over one class token) and the tokens to add: every
 * string literal of that file holding a class token that matches the anchor must hold the tokens too,
 * with a `// casa:` comment on its line or in the comment lines right above it. An entry whose anchor matches nothing
 * fails as well, so a registry that changed shape is reported instead of passing silently. A file
 * the project does not have is skipped: there is nothing to patch.
 *
 * A second kind of entry, `element` + `attribute` + `value`, requires a JSX attribute and not a class:
 * every `<element>` of the file must carry `attribute={value}` before its `{...props}` spread (so a
 * prop of the caller still wins) with the `// casa:` mark. It exists for what a class cannot say, the
 * accessible name of `Radio`/`Checkbox`/`Switch`: Base UI links the label to the `<span role=...>` only
 * after hydration, so the server HTML has no name unless the attribute is there. `--fix` inserts it
 * right after the tag name (or rewrites a different value), idempotent. DECISIONS.md #800.
 *
 * Usage: `node scripts/check-ui-patches.mjs [--fix] [dir]` - `dir` defaults to `../src/components/ui` from this file, so it runs from any cwd; a missing dir fails.
 * `--fix` adds the missing tokens right after the anchor token and the missing `// casa:` comment,
 * then runs Prettier on the files it touched; running it again changes nothing.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

/** @typedef {{ file: string, anchor: string, add: string[], reason: string }} ClassPatch */
/** @typedef {{ file: string, element: string, attribute: string, value: string, reason: string }} AttributePatch */
/** @typedef {ClassPatch | AttributePatch} UiPatch */
/** @typedef {{ file: string, line: number, missing: string[], comment: boolean, reason: string }} UiPatchProblem */

const RULE = 'frontend.md §6 e §10.2, DECISIONS.md #461'

/** @returns {UiPatch[]} */
export function loadPatches() {
  const path = fileURLToPath(new URL('./ui-patches.json', import.meta.url))
  return JSON.parse(readFileSync(path, 'utf8')).patches
}

/**
 * Every string literal of a TSX source with its position: class strings sit in `cva(...)`,
 * `cn(...)` and JSX attributes, and the compiler's parser is the only reader that does not trip on
 * an apostrophe in JSX text or a quote inside `[class*='size-']`.
 *
 * @param {string} source
 * @returns {{ start: number, end: number, text: string }[]}
 */
export function stringLiterals(source) {
  const file = ts.createSourceFile(
    'ui.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  /** @type {{ start: number, end: number, text: string }[]} */
  const found = []
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // `getStart` skips leading trivia; the quote is one character on each side.
      found.push({
        start: node.getStart(file) + 1,
        end: node.getEnd() - 1,
        text: node.text,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

/** @param {UiPatch} patch @returns {patch is AttributePatch} */
const isAttributePatch = (patch) => 'element' in patch

/** @param {string} text */
const squash = (text) => text.replace(/\s+/g, ' ').trim()

/**
 * The JSX tags named `patch.element`, each with the state of `patch.attribute`: absent, a different
 * value, after a spread (the caller's prop would lose) or right.
 *
 * @param {string} source
 * @param {AttributePatch} patch
 */
export function matchAttribute(source, patch) {
  const file = ts.createSourceFile(
    'ui.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  /** @type {{ tagEnd: number, line: number, ok: boolean, comment: boolean, attribute: ts.JsxAttribute | undefined }[]} */
  const found = []
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(file) === patch.element
    ) {
      const properties = node.attributes.properties
      const attribute = properties
        .filter((each) => ts.isJsxAttribute(each))
        .find((each) => each.name.getText(file) === patch.attribute)
      const spread = properties.findIndex((each) =>
        ts.isJsxSpreadAttribute(each),
      )
      const before =
        spread < 0 || properties.indexOf(attribute ?? node) < spread
      const initializer = attribute?.initializer
      const same =
        initializer !== undefined &&
        ts.isJsxExpression(initializer) &&
        initializer.expression !== undefined &&
        squash(initializer.expression.getText(file)) === squash(patch.value)
      const line = lineOf(source, (attribute ?? node.tagName).getStart(file))
      found.push({
        tagEnd: node.tagName.getEnd(),
        line,
        ok: same && before,
        // An absent attribute has nothing to mark: the message must not ask for the mark twice.
        comment: attribute === undefined || hasCasaComment(source, line),
        attribute,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

/** @param {string} source @param {number} offset */
const lineOf = (source, offset) => source.slice(0, offset).split('\n').length

const COMMENT_LINE = /^\s*(\/\/|\{?\/\*)/
// A property whose value Prettier moved to the next line (`default:`, `'icon-xs':`).
const KEY_LINE = /^\s*['"]?[\w-]+['"]?:\s*$/

/**
 * The mark belongs to the literal: on its own line, or in the comment lines right above it (or above
 * the key it is the value of). A mark further up belongs to another literal and does not count.
 *
 * @param {string} source
 * @param {number} line 1-based
 */
function hasCasaComment(source, line) {
  const lines = source.split('\n')
  if (lines[line - 1]?.includes('casa:')) return true
  for (let at = line - 2; at >= 0; at--) {
    const text = lines[at] ?? ''
    if (COMMENT_LINE.test(text)) {
      if (text.includes('casa:')) return true
      continue
    }
    if (KEY_LINE.test(text)) continue
    return false
  }
  return false
}

/**
 * The literals of `source` the patch reaches, each with the tokens it lacks.
 *
 * @param {string} source
 * @param {ClassPatch} patch
 */
export function matchPatch(source, patch) {
  const anchor = new RegExp(patch.anchor)
  return stringLiterals(source).flatMap((literal) => {
    const tokens = literal.text.split(/\s+/).filter(Boolean)
    const token = tokens.find((each) => anchor.test(each))
    if (token === undefined) return []
    const missing = patch.add.filter((each) => !tokens.includes(each))
    const line = lineOf(source, literal.start)
    return [
      { literal, token, missing, line, comment: hasCasaComment(source, line) },
    ]
  })
}

/**
 * @param {string} source
 * @param {string} file
 * @param {UiPatch[]} patches the entries for this file
 * @returns {UiPatchProblem[]}
 */
export function checkSource(source, file, patches) {
  return patches.flatMap((patch) => {
    if (isAttributePatch(patch)) return checkAttribute(source, file, patch)
    const matches = matchPatch(source, patch)
    if (matches.length === 0) {
      return [
        {
          file,
          line: 0,
          missing: patch.add,
          comment: true,
          reason: `${patch.reason}; nenhuma classe casa com ${patch.anchor}`,
        },
      ]
    }
    return matches
      .filter((each) => each.missing.length > 0 || !each.comment)
      .map((each) => ({
        file,
        line: each.line,
        missing: each.missing,
        comment: each.comment,
        reason: patch.reason,
      }))
  })
}

/**
 * @param {string} source
 * @param {string} file
 * @param {AttributePatch} patch
 * @returns {UiPatchProblem[]}
 */
function checkAttribute(source, file, patch) {
  const wanted = `${patch.attribute}={${patch.value}}`
  const matches = matchAttribute(source, patch)
  if (matches.length === 0) {
    return [
      {
        file,
        line: 0,
        missing: [wanted],
        comment: true,
        reason: `${patch.reason}; nenhum <${patch.element}> no arquivo`,
      },
    ]
  }
  return matches
    .filter((each) => !each.ok || !each.comment)
    .map((each) => ({
      file,
      line: each.line,
      missing: [wanted].filter(() => !each.ok),
      comment: each.comment,
      reason: patch.reason,
    }))
}

/**
 * Applies one attribute patch: a wrong or misplaced attribute is cut out, the right one goes right
 * after the tag name (before any spread) with the mark on the line above. Idempotent.
 *
 * @param {string} source
 * @param {AttributePatch} patch
 */
function fixAttribute(source, patch) {
  let out = source
  // Back to front, so the offsets of the earlier tags still hold.
  for (const match of matchAttribute(source, patch).reverse()) {
    if (match.ok && match.comment) continue
    if (match.attribute !== undefined) {
      // The leading comments go only when they are our own mark; another comment stays.
      const trivia = source.slice(
        match.attribute.getFullStart(),
        match.attribute.getStart(),
      )
      let from = match.attribute.getStart()
      if (trivia.includes('casa:')) from = match.attribute.getFullStart()
      out = out.slice(0, from) + out.slice(match.attribute.getEnd())
    }
    out = `${out.slice(0, match.tagEnd)}\n// casa: ${patch.reason}\n${patch.attribute}={${patch.value}}${out.slice(match.tagEnd)}`
  }
  return out
}

/**
 * Applies one patch: the missing tokens go right after the anchor token, and a `// casa:` comment
 * goes on its own line above the literal when none is in reach. Idempotent.
 *
 * @param {string} source
 * @param {UiPatch} patch
 */
export function fixSource(source, patch) {
  if (isAttributePatch(patch)) return fixAttribute(source, patch)
  let out = source
  // Back to front, so the offsets of the earlier literals still hold.
  for (const match of matchPatch(source, patch).reverse()) {
    if (match.missing.length === 0 && match.comment) continue
    const { literal, token, missing } = match
    let text = out.slice(literal.start, literal.end)
    if (missing.length > 0) {
      const at = new RegExp(
        `(^|\\s)${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`,
      )
      text = text.replace(at, (found) => `${found} ${missing.join(' ')}`)
    }
    out = out.slice(0, literal.start) + text + out.slice(literal.end)
    if (!match.comment) {
      const lineStart = out.lastIndexOf('\n', literal.start - 1) + 1
      const indent = /^\s*/.exec(out.slice(lineStart))?.[0] ?? ''
      out = `${out.slice(0, lineStart)}${indent}// casa: ${patch.reason}\n${out.slice(lineStart)}`
    }
  }
  return out
}

/** @param {UiPatchProblem} problem */
export function describe(problem) {
  let where = problem.file
  if (problem.line > 0) where = `${problem.file}:${problem.line}`
  const parts = []
  if (problem.missing.length > 0)
    parts.push(`falta ${problem.missing.map((each) => `"${each}"`).join(', ')}`)
  if (!problem.comment) parts.push('falta a marca // casa:')
  return `ui-patch: ${where}: ${parts.join('; ')} (${problem.reason}). Régua: ${RULE}; lista em scripts/ui-patches.json; aplicar: node scripts/check-ui-patches.mjs --fix`
}

/**
 * @param {string} dir
 * @param {UiPatch[]} patches
 * @returns {UiPatchProblem[]}
 */
export function checkDir(dir, patches) {
  const files = [...new Set(patches.map((each) => each.file))]
  return files
    .filter((file) => existsSync(join(dir, file)))
    .flatMap((file) =>
      checkSource(
        readFileSync(join(dir, file), 'utf8'),
        join(dir, file),
        patches.filter((each) => each.file === file),
      ),
    )
}

/**
 * @param {string} dir
 * @param {UiPatch[]} patches
 * @returns {Promise<string[]>} the files it rewrote
 */
export async function fixDir(dir, patches) {
  const prettier = await import('prettier')
  const touched = []
  for (const file of new Set(patches.map((each) => each.file))) {
    const path = join(dir, file)
    if (!existsSync(path)) continue
    const before = readFileSync(path, 'utf8')
    const patched = patches
      .filter((each) => each.file === file)
      .reduce(fixSource, before)
    if (patched === before) continue
    const options = (await prettier.resolveConfig(path)) ?? {}
    writeFileSync(
      path,
      await prettier.format(patched, { ...options, filepath: path }),
    )
    touched.push(path)
  }
  return touched
}

// A CLI writes to the stream, never `console` (the lint's `no-console`, tooling.md §4.1).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const fix = args.includes('--fix')
  // The default comes from this file, not from the cwd: run from the repo root, a cwd-relative
  // `src/components/ui` matched nothing and the check passed in silence.
  const dir =
    args.find((each) => !each.startsWith('--')) ??
    fileURLToPath(new URL('../src/components/ui', import.meta.url))
  if (!existsSync(dir)) {
    process.stderr.write(`ui-patch: pasta não encontrada: ${dir}\n`)
    process.exit(1)
  }
  const patches = loadPatches()
  if (fix) {
    for (const file of await fixDir(dir, patches))
      process.stdout.write(`ui-patch: aplicado em ${file}\n`)
  }
  const problems = checkDir(dir, patches)
  for (const problem of problems) process.stderr.write(`${describe(problem)}\n`)
  if (problems.length > 0) process.exitCode = 1
}
