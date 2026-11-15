/**
 * The `pattern:check` rule catalog (DECISIONS.md #359, KIT.md §5): each `rule` points at the
 * section of the standard it applies, so a finding says which decision was broken. What ESLint
 * does not reach because it depends on *where* the file is lives here; the project never edits this
 * file, it only lists exceptions in `scripts/pattern-check.config.ts`.
 *
 * Paths are relative to the repository root (`backend/...`, `frontend/...`, `shared/...`), with
 * the `/` separator. Rules work over text already read: the spec builds files in memory.
 */

export type SourceFile = {
  readonly path: string
  readonly text: string
}

export type Rule = {
  readonly id: string
  readonly section: string
  readonly message: string
  /** Files the rule reads. */
  readonly scope: RegExp
  readonly exclude?: RegExp
  /** Lines (1-based) that break the rule; a file-level rule answers `[1]`. */
  readonly lines: (file: SourceFile) => ReadonlyArray<number>
}

const SPEC = /\.(unit|e2e)\.spec\.ts$|\.test\.tsx?$/

export class PatternRules {
  /** The lines whose text matches `pattern`. */
  static matching(text: string, pattern: RegExp): ReadonlyArray<number> {
    const out: number[] = []
    text.split('\n').forEach((line, index) => {
      if (pattern.test(line)) out.push(index + 1)
    })
    return out
  }

  /** `[1]` when the whole file breaks the rule, `[]` otherwise. */
  static whole(broken: boolean): ReadonlyArray<number> {
    if (broken) return [1]
    return []
  }

  static basename(path: string): string {
    return path.slice(path.lastIndexOf('/') + 1)
  }

  /**
   * Lines that open a native interactive element the shadcn registry already has. Comments are
   * blanked first (line count kept) because the kit's JSDoc names `<button>` in prose; the line
   * right after `eslint-disable-next-line no-restricted-syntax` is skipped, so the exception ESLint
   * accepts with a reason is the same one this rule accepts.
   */
  static rawInteractive(text: string): ReadonlyArray<number> {
    const blank = (comment: string) => comment.replace(/[^\n]/g, ' ')
    const code = text
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/\/\/[^\n]*/g, blank)
    const lines = text.split('\n')
    const out: number[] = []
    // shortcut: `<input` looks ahead to the next `/>` for `type="file"`; an input whose attributes
    // hold JSX escapes, upgrade to the TSX AST when one does.
    for (const match of code.matchAll(
      /<(button|select|textarea|label|table|dialog|form|progress|hr|input)(?=[\s/>])/g,
    )) {
      const index = match.index
      // The element given to a Base UI `render` prop is the tag the `ui/` component renders
      // (`nativeButton`), not a raw one: the same exception as the frontend ESLint selector.
      if (/render=\{\s*$/.test(code.slice(0, index))) continue
      if (
        match[1] === 'input' &&
        code.slice(index, code.indexOf('/>', index) + 1).includes('type="file"')
      )
        continue
      const line = code.slice(0, index).split('\n').length
      if (
        /eslint-disable-next-line no-restricted-syntax/.test(
          lines[line - 2] ?? '',
        )
      )
        continue
      out.push(line)
    }
    return out
  }

  /**
   * Lines where a `Button` is given a router `Link` (or a plain `<a>`) in its `render` prop, which
   * is how a link gets the look of a button: `<Button render={<Link to="/x" />}>`. Base UI's `Button`
   * forces `role="button"` on what it renders and erases the link, or warns about `nativeButton`
   * (_doc-lib/shadcn.md#button). A link that looks like a button is the `Link` itself with
   * `buttonVariants`. Only the exact `Button`: another component may take a `Link` in `render` on
   * purpose (`SheetClose nativeButton={false} render={<Link />}`, `SidebarMenuButton`).
   *
   * The owner of the `render` is the nearest `<Tag` before it that is not inside a `{...}` (an
   * attribute such as `icon={<X />}` holds JSX of its own). Comments are blanked first (line count
   * kept), because the kit's JSDoc names the pattern it forbids; the line after an
   * `eslint-disable-next-line no-restricted-syntax` is skipped, the same exception the other rules take.
   * shortcut: a backward brace scan, not the TSX AST; a `render` string holding `{` escapes, upgrade
   * to the AST when one does.
   */
  static linkAsButton(text: string): ReadonlyArray<number> {
    const blank = (comment: string) => comment.replace(/[^\n]/g, ' ')
    const code = text
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/\/\/[^\n]*/g, blank)
    const lines = text.split('\n')
    const out: number[] = []
    for (const match of code.matchAll(/\brender=\{\s*<(Link|a)(?=[\s/>])/g)) {
      if (PatternRules.openingTag(code, match.index) !== 'Button') continue
      const line = code.slice(0, match.index).split('\n').length
      if (
        /eslint-disable-next-line no-restricted-syntax/.test(
          lines[line - 2] ?? '',
        )
      )
        continue
      out.push(line)
    }
    return out
  }

  /** The name of the JSX tag whose attribute list holds `index`, or `''`. */
  private static openingTag(code: string, index: number): string {
    let depth = 0
    for (let at = index - 1; at >= 0; at -= 1) {
      const char = code.charAt(at)
      if (char === '}') depth += 1
      else if (char === '{' && depth > 0) depth -= 1
      else if (
        char === '<' &&
        depth === 0 &&
        /[A-Za-z]/.test(code.charAt(at + 1))
      )
        return /^[\w.]+/.exec(code.slice(at + 1))?.[0] ?? ''
    }
    return ''
  }

  /**
   * Lines with a `vine.string()` whose chain has no `.trim()`. The body parser does not trim
   * (DECISIONS.md #402), so the text field trims in its own rule. Exempt by design: the password
   * (key or method named `password`, `passwordConfirmation`, `currentPassword`), which reaches the
   * hash as typed, and a `.uuid()` field, whose format already refuses an edge space. The rich text
   * document has no `vine.string()` (`Rule.richText()` is an object rule) and its text nodes must
   * keep their spaces. The chain is read through its balanced `.call(...)` segments, across lines.
   * shortcut: regex plus a paren scan, not AST; a chain built by a variable escapes, upgrade to the
   * TypeScript AST when one does.
   */
  static untrimmedStrings(source: string): ReadonlyArray<number> {
    // Comments blanked, line count kept: the kit's JSDoc quotes `vine.string()` in prose.
    const blank = (comment: string) => comment.replace(/[^\n]/g, ' ')
    const text = source
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/\/\/[^\n]*/g, blank)
    const out: number[] = []
    for (const match of text.matchAll(/\bvine\s*\.\s*string\s*\(\)/g)) {
      const start = match.index
      const before = text.slice(0, start)
      const key = /(\w+):\s*$/.exec(before.split('\n').slice(-1)[0] ?? '')?.[1]
      const method = [...before.matchAll(/static\s+(\w+)\s*\(/g)].pop()?.[1]
      if (
        /^(password|passwordConfirmation|currentPassword)$/i.test(
          key ?? method ?? '',
        )
      )
        continue
      let index = start + match[0].length
      for (;;) {
        const next = /^\s*\.\s*\w+\s*\(/.exec(text.slice(index))
        if (!next) break
        index += next[0].length
        for (let depth = 1; depth > 0 && index < text.length; index += 1) {
          if (text[index] === '(') depth += 1
          if (text[index] === ')') depth -= 1
        }
      }
      const chain = text.slice(start, index)
      if (chain.includes('.trim()') || chain.includes('.uuid()')) continue
      out.push(before.split('\n').length)
    }
    return out
  }

  /**
   * Lines that name MinIO where production reads them (tooling.md §8.4). MinIO is the local test
   * bucket of `backend/docker-compose.yml`, built from `backend/infra/minio/`; production is S3 or R2
   * behind `STORAGE_ENDPOINT`, so code that names MinIO depends on the test bucket. A
   * `Dockerfile-production` never names it, comment included. In code, a comment about the local
   * environment ("MinIO in dev and in the e2e") is allowed: a line that opens with `//`, `/*` or `*`,
   * and the ` // ...` that ends a line, are left out. JSON has no comment, so any mention counts.
   * shortcut: the comment is found per line, not by the TS AST; a block comment whose lines do not
   * open with `*` escapes, upgrade to the AST when one does.
   */
  static minioMentions(file: SourceFile): ReadonlyArray<number> {
    // Letter boundaries, not `\b`: `_` and digits stay boundaries (`MINIO_ENDPOINT`), while a
    // word that merely contains the letters ("dominio", Spanish for domain) is not a mention.
    const name = /(?<!\p{L})minio(?!\p{L})/iu
    if (file.path.endsWith('Dockerfile-production'))
      return PatternRules.matching(file.text, name)
    const out: number[] = []
    file.text.split('\n').forEach((line, index) => {
      // `(^|\s)` keeps the `//` of a URL (`http://minio:9000`), which is code, in the line.
      const code = line.replace(/(^|\s)\/\/.*$/, '')
      if (/^\s*(\/\*|\*)/.test(code)) return
      if (name.test(code)) out.push(index + 1)
    })
    return out
  }

  static readonly CATALOG: ReadonlyArray<Rule> = [
    {
      id: 'index-barrel',
      section: 'architecture.md §3 (DECISIONS.md #319)',
      message:
        'no `index.ts`: import the exact file; a barrel defeats tree shaking and hides cycles',
      // `routes/**/index.tsx` is a route file (TanStack file routing, architecture.md tree), not a barrel.
      scope: /^(backend\/app\/|frontend\/src\/(?!routes\/))(.+\/)?index\.tsx?$/,
      lines: () => [1],
    },
    {
      id: 'shared-no-vine',
      section: 'architecture.md §9',
      message:
        '`shared/` never imports `@vinejs/vine`: its schemas are Zod, read by both sides',
      scope: /^shared\/src\/.+\.ts$/,
      lines: (file) => PatternRules.matching(file.text, /from '@vinejs\/vine/),
    },
    {
      id: 'env-outside-config',
      section: 'domain.md §11.1 (DECISIONS.md #314)',
      message:
        'ENV is read only in `config/`: export the value from `config/<name>.ts` and import it',
      scope: /^backend\/(app|providers|start|commands)\/.+\.ts$/,
      exclude: /^backend\/start\/env\.ts$|\.spec\.ts$/,
      lines: (file) =>
        PatternRules.matching(file.text, /from '#start\/env'|\bprocess\.env\b/),
    },
    {
      id: 'request-logger',
      section: 'backend.md §4 (DECISIONS.md #314)',
      message:
        'a feature logs through `HttpContext.getOrFail().logger`, which carries the request id; a repository does not log',
      scope: /^backend\/app\/(features|repositories)\/.+\.ts$/,
      exclude: SPEC,
      lines: (file) =>
        PatternRules.matching(
          file.text,
          /from '@adonisjs\/core\/services\/logger'/,
        ),
    },
    {
      id: 'refusal-name',
      section: 'architecture.md §3',
      message:
        'a refusal translator is `_shared.<resource>-refusal.ts` (singular), over `_shared.refusal.base.ts`',
      scope: /^backend\/app\/features\/.*refusal[^/]*\.ts$/,
      exclude: SPEC,
      lines: (file) =>
        PatternRules.whole(
          !/^_shared\.([a-z0-9-]+-)?refusal(\.base)?\.ts$/.test(
            PatternRules.basename(file.path),
          ),
        ),
    },
    {
      id: 'spec-name',
      section: 'architecture.md §8',
      message:
        'a spec is `<name>.unit.spec.ts` or `<name>.e2e.spec.ts`, named after the file it covers without the role suffix',
      scope: /^backend\/.+\.spec\.ts$/,
      lines: (file) =>
        PatternRules.whole(
          !/\.(unit|e2e)\.spec\.ts$/.test(file.path) ||
            /\.(entity|service)\.(unit|e2e)\.spec\.ts$/.test(file.path),
        ),
    },
    {
      id: 'route-name',
      section: 'openapi.md §1',
      message:
        'a route name is `<module>.<resource>.<action>`, the same path as the feature folder',
      scope: /^backend\/start\/routes\.ts$/,
      lines: (file) => {
        const out: number[] = []
        file.text.split('\n').forEach((line, index) => {
          for (const match of line.matchAll(/\.as\('([^']+)'\)/g)) {
            if (
              !/^[a-z][a-z-]*\.[a-z][a-z-]*\.[a-z][a-z-]*$/.test(match[1] ?? '')
            )
              out.push(index + 1)
          }
        })
        return out
      },
    },
    {
      id: 'rollbacks-in-production',
      section: 'backend.md §3',
      message:
        '`config/database.ts` sets `migrations.disableRollbacksInProduction: true`',
      scope: /^backend\/config\/database\.ts$/,
      lines: (file) =>
        PatternRules.whole(
          !/disableRollbacksInProduction:\s*true/.test(file.text),
        ),
    },
    {
      id: 'or-fail',
      section: 'backend.md §4',
      message:
        '`*OrFail()` is a throw: the repository returns `null` and the use-case decides',
      scope: /^backend\/app\/.+\.ts$/,
      exclude: SPEC,
      // `HttpContext.getOrFail()` is the request logger's way in (`request-logger`, backend.md §4.2,
      // _doc-lib/adonisjs.md#guides/basics/http-context), not an ORM lookup that throws 404 as 500.
      // `getUserOrFail()` is the auth API: the doc reads the user through it and a guard implements
      // it as part of `GuardContract` (_doc-lib/adonisjs.md#guides/auth/custom-auth-guard).
      lines: (file) =>
        PatternRules.matching(
          file.text,
          /(?<!HttpContext\.)\b(?!getUserOrFail\()\w+OrFail\(/,
        ),
    },
    {
      id: 'shared-impure',
      section: 'architecture.md §3 (backend.md §4.9)',
      message:
        '`_shared.<theme>.ts` is a pure function: no model, `db` or `drive` as a value',
      scope: /^backend\/app\/features\/(.+\/)?_shared\.[a-z0-9-]+\.ts$/,
      exclude: /\.base\.ts$|-?refusal\.ts$/,
      lines: (file) =>
        PatternRules.matching(
          file.text,
          /^import (?!type )[^\n]*from '(#models\/|@adonisjs\/lucid\/services\/db|@adonisjs\/drive)/,
        ),
    },
    {
      id: 'common-prefix',
      section: 'i18n.md §4 (DECISIONS.md #359)',
      message:
        '`common_*` messages belong to `components/common/`; a screen uses its own prefix',
      scope: /^frontend\/src\/.+\.tsx?$/,
      exclude:
        /^frontend\/src\/components\/common\/|^frontend\/src\/paraglide\//,
      lines: (file) => PatternRules.matching(file.text, /\bm\.common_/),
    },
    {
      id: 'kit-import',
      section: 'frontend.md (KIT.md §1 item 7)',
      message:
        'a kit piece takes I/O by prop: no `mutations/`, `queries/` or `#/lib/labels`',
      scope: /^frontend\/src\/components\/common\/.+\.tsx?$/,
      lines: (file) =>
        PatternRules.matching(
          file.text,
          /from '#\/(mutations|queries)\/|from '#\/lib\/labels'/,
        ),
    },
    {
      id: 'query-exact-version',
      section: 'tooling.md §0 (DECISIONS.md #319)',
      message:
        '`@tanstack/*query*` at an exact version: the packages move together',
      scope: /^frontend\/package\.json$/,
      lines: (file) =>
        PatternRules.matching(
          file.text,
          /"@tanstack\/[a-z-]*query[a-z-]*":\s*"[\^~]/,
        ),
    },
    {
      id: 'boolean-layout-prop',
      section: 'frontend.md (KIT.md §1 item 6)',
      message:
        'a kit feature turns on by the part present or by a data/variant prop, never by `showX`, `hideX` or `borderX`',
      scope: /^frontend\/src\/components\/common\/.+\.tsx$/,
      // shortcut: regex over the prop type, not AST; a prop declared across lines escapes, upgrade
      // to the TypeScript AST when one does.
      lines: (file) =>
        PatternRules.matching(
          file.text,
          /\b(show|hide|border)[A-Z]\w*\??\s*:\s*boolean/,
        ),
    },
    {
      id: 'raw-interactive-element',
      section: 'frontend.md §6 (DECISIONS.md #366)',
      message:
        'a native interactive element outside `components/ui/`: use the shadcn component or the kit piece',
      scope: /^frontend\/src\/(routes|components\/common)\/.+\.tsx$/,
      exclude: SPEC,
      lines: (file) => PatternRules.rawInteractive(file.text),
    },
    {
      id: 'link-as-button',
      section: 'frontend.md §6 (DECISIONS.md #440)',
      message:
        'a link that looks like a button is a `Link` with `buttonVariants`, never `render={<Link />}` on a `Button`: Base UI forces `role="button"` and erases the link',
      scope: /^frontend\/src\/(routes|components\/common)\/.+\.tsx$/,
      exclude: SPEC,
      lines: (file) => PatternRules.linkAsButton(file.text),
    },
    {
      id: 'vine-string-trim',
      section: 'backend.md §4.4 (DECISIONS.md #402)',
      message:
        'a `vine.string()` text field needs `.trim()`: the body parser no longer trims; only the password and the rich text document go as typed',
      scope: /^backend\/app\/(validators\/.+|core\/validator)\.ts$/,
      exclude: SPEC,
      lines: (file) => PatternRules.untrimmedStrings(file.text),
    },
    {
      id: 'minio-outside-local',
      section: 'tooling.md §8.4 (DECISIONS.md #771)',
      message:
        'MinIO is the local test bucket (`backend/docker-compose.yml`, `backend/infra/minio/`): production code and `Dockerfile-production` reach S3 or R2 through `STORAGE_*` and never name MinIO; only a comment about the local environment may',
      // What runs or ships in production: the three packages, the Dockerfiles included (`PatternCheck.read`).
      // Out by definition, because they are test or local tooling and never serve production: specs,
      // `backend/tests/`, `frontend/e2e/`, the `scripts/` of each app (this rule names MinIO to find
      // it) and the compose with `infra/minio/`, which are where MinIO lives.
      scope: /^(backend|frontend|shared)\//,
      exclude:
        /\.spec\.tsx?$|\.test\.tsx?$|^backend\/(tests|scripts|infra\/minio)\/|^frontend\/(e2e|scripts)\/|^backend\/docker-compose\.yml$/,
      lines: (file) => PatternRules.minioMentions(file),
    },
  ]
}
