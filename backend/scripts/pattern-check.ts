import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { CheckReport, type Finding } from './check-report.ts'
import {
  PatternRules,
  type Rule,
  type SourceFile,
} from './pattern-check.rules.ts'

/**
 * One deliberate exception, listed by the project in `scripts/pattern-check.config.ts` (the only
 * file of `pattern:check` it owns). Without a `reason` it fails, and so does one that no longer
 * matches a finding: an exception outliving its cause hides the next violation in that file.
 */
export type PatternException = {
  readonly rule: string
  readonly file: string
  readonly reason: string
}

/** An entry of the optional `scripts/pattern-check.baseline.json`, which only shrinks. */
export type BaselineEntry = {
  readonly rule: string
  readonly file: string
}

type Input = {
  readonly files: ReadonlyArray<SourceFile>
  readonly exceptions: ReadonlyArray<PatternException>
  readonly baseline: ReadonlyArray<BaselineEntry>
  readonly rules?: ReadonlyArray<Rule>
  /** The public sign-up validators the project listed in its config (DECISIONS.md #799). */
  readonly signupValidators?: ReadonlyArray<string>
}

const SECTION = 'backend.md §10'
// `Dockerfile-production` too: `minio-outside-local` reads what the image is built from (tooling.md §8.4).
const GIT_VARIABLES = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_PREFIX',
  'GIT_COMMON_DIR',
] as const
const READ = /\.(ts|tsx|json)$|(^|\/)Dockerfile-production$/

/**
 * The single `pattern:check` engine (KIT.md §5): runs the catalog over the repository files,
 * applies the project's exceptions and baseline, and prints through `CheckReport`.
 */
export class PatternCheck {
  static run(input: Input): Finding[] {
    const signup = input.signupValidators ?? []
    const rules = input.rules ?? [
      ...PatternRules.CATALOG,
      ...PatternRules.publicSignup(signup),
    ]
    const raw: Finding[] = []
    for (const rule of rules) {
      for (const file of input.files) {
        if (!rule.scope.test(file.path) || rule.exclude?.test(file.path))
          continue
        for (const line of rule.lines(file)) {
          raw.push({
            file: file.path,
            line,
            rule: rule.id,
            section: rule.section,
            message: PatternCheck.describe(rule, file, line),
          })
        }
      }
    }

    const same = (a: BaselineEntry, b: BaselineEntry) =>
      a.rule === b.rule && a.file === b.file
    const findings: Finding[] = raw.filter(
      (finding) =>
        !input.exceptions.some((e) => same(e, finding)) &&
        !input.baseline.some((b) => same(b, finding)),
    )

    // A listed name that no validator declares would silently check nothing: it fails instead.
    for (const name of signup) {
      if (
        !input.files.some((file) =>
          PatternRules.declaresValidator(file.text, name),
        )
      )
        findings.push(
          PatternCheck.meta(
            'backend/scripts/pattern-check.config.ts',
            'unknown-signup-validator',
            `\`${name}\` in PUBLIC_SIGNUP_VALIDATORS is not a \`vine.create\` (backend) or \`z.object\` (shared) validator: fix the name or remove it`,
          ),
        )
    }

    for (const exception of input.exceptions) {
      if (!exception.reason.trim()) {
        findings.push(
          PatternCheck.meta(
            exception.file,
            'exception-without-reason',
            `exception for \`${exception.rule}\` without a reason`,
          ),
        )
      }
      if (!raw.some((finding) => same(exception, finding))) {
        findings.push(
          PatternCheck.meta(
            exception.file,
            'unused-exception',
            `exception for \`${exception.rule}\` matches no finding: remove it`,
          ),
        )
      }
    }
    for (const entry of input.baseline) {
      if (!raw.some((finding) => same(entry, finding))) {
        findings.push(
          PatternCheck.meta(
            entry.file,
            'stale-baseline',
            `baseline entry for \`${entry.rule}\` is fixed: remove it (the baseline only shrinks)`,
          ),
        )
      }
    }
    return findings
  }

  /** The rule message, with what the rule adds for the line (the sign-up field name). */
  private static describe(rule: Rule, file: SourceFile, line: number): string {
    const detail = rule.detail?.(file, line)
    if (!detail) return rule.message

    return `${rule.message}: ${detail}`
  }

  static meta(file: string, rule: string, message: string): Finding {
    return { file, line: 1, rule, section: SECTION, message }
  }

  /**
   * The environment for a `git` child: git exports `GIT_DIR`, `GIT_WORK_TREE` and `GIT_INDEX_FILE`
   * to a hook, and with them a `git` run from an app folder resolves the wrong repository or index
   * and lists nothing. They are dropped so git finds the repository from `cwd` (DECISIONS.md #809).
   */
  static gitEnv(base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...base }
    for (const key of GIT_VARIABLES) delete env[key]

    return env
  }

  /**
   * The tracked files of the three packages, with paths relative to the repository root. Reading
   * zero files from a project that has `backend/app` is a failure, never a green run.
   */
  static read(
    root: string,
    env: NodeJS.ProcessEnv = process.env,
  ): SourceFile[] {
    const tracked = execFileSync(
      'git',
      ['-C', root, 'ls-files', '--', 'backend', 'frontend', 'shared'],
      { encoding: 'utf8', env: PatternCheck.gitEnv(env) },
    )
    const files = tracked
      .split('\n')
      .filter((path) => READ.test(path) && existsSync(join(root, path)))
      .map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }))
    if (files.length === 0 && existsSync(join(root, 'backend/app')))
      throw new Error(
        `pattern:check: read 0 files from \`${root}\`, which has backend/app: git listed nothing (GIT_DIR, GIT_WORK_TREE or GIT_INDEX_FILE of a hook?). Zero files is never green.`,
      )

    return files
  }

  static async main(): Promise<void> {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      env: PatternCheck.gitEnv(),
    }).trim()
    const config: unknown = await import(
      pathToFileURL(join(process.cwd(), 'scripts/pattern-check.config.ts')).href
    )
    let exceptions: ReadonlyArray<PatternException> = []
    if (
      config &&
      typeof config === 'object' &&
      'PATTERN_EXCEPTIONS' in config
    ) {
      exceptions = PatternCheck.entries(config.PATTERN_EXCEPTIONS).map((e) => ({
        ...e,
        reason: e.reason ?? '',
      }))
    }
    const baselinePath = join(
      process.cwd(),
      'scripts/pattern-check.baseline.json',
    )
    let baseline: ReadonlyArray<BaselineEntry> = []
    if (existsSync(baselinePath))
      baseline = PatternCheck.entries(
        JSON.parse(readFileSync(baselinePath, 'utf8')),
      )

    const findings = PatternCheck.run({
      files: PatternCheck.read(root),
      exceptions,
      baseline,
      signupValidators: PatternCheck.names(
        PatternCheck.optional(config, 'PUBLIC_SIGNUP_VALIDATORS'),
      ),
    })
    process.exitCode = CheckReport.print('pattern:check', findings)
  }

  /**
   * What the config module exports under `key`, `[]` when it does not: a config made before the
   * export existed (the model is an extension point and never rewritten) keeps working.
   */
  static optional(config: unknown, key: string): unknown {
    if (config && typeof config === 'object' && key in config)
      return Reflect.get(config, key)

    return []
  }

  /** The names of a config list (`PUBLIC_SIGNUP_VALIDATORS`): an array of strings, narrowed from `unknown`. */
  static names(value: unknown): ReadonlyArray<string> {
    if (!Array.isArray(value))
      throw new Error(
        'pattern:check: PUBLIC_SIGNUP_VALIDATORS is an array of names',
      )

    return value.map((item: unknown) => {
      if (typeof item !== 'string')
        throw new Error(
          'pattern:check: PUBLIC_SIGNUP_VALIDATORS holds names (strings)',
        )

      return item
    })
  }

  /** Data from outside (config module, baseline JSON) is `unknown` until narrowed (typescript.md §2). */
  static entries(
    value: unknown,
  ): Array<{ rule: string; file: string; reason?: string }> {
    if (!Array.isArray(value))
      throw new Error(
        'pattern:check: exceptions and baseline are arrays of { rule, file }',
      )
    return value.map((item: unknown) => {
      if (
        !item ||
        typeof item !== 'object' ||
        !('rule' in item) ||
        !('file' in item)
      ) {
        throw new Error('pattern:check: every entry has `rule` and `file`')
      }
      const { rule, file } = item
      if (typeof rule !== 'string' || typeof file !== 'string')
        throw new Error('pattern:check: `rule` and `file` are strings')
      if ('reason' in item && typeof item.reason === 'string')
        return { rule, file, reason: item.reason }
      return { rule, file }
    })
  }
}

if (import.meta.main) await PatternCheck.main()
