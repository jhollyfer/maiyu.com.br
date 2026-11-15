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
}

const SECTION = 'backend.md §10'
// `Dockerfile-production` too: `minio-outside-local` reads what the image is built from (tooling.md §8.4).
const READ = /\.(ts|tsx|json)$|(^|\/)Dockerfile-production$/

/**
 * The single `pattern:check` engine (KIT.md §5): runs the catalog over the repository files,
 * applies the project's exceptions and baseline, and prints through `CheckReport`.
 */
export class PatternCheck {
  static run(input: Input): Finding[] {
    const rules = input.rules ?? PatternRules.CATALOG
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
            message: rule.message,
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

  static meta(file: string, rule: string, message: string): Finding {
    return { file, line: 1, rule, section: SECTION, message }
  }

  /** The tracked files of the three packages, with paths relative to the repository root. */
  static read(root: string): SourceFile[] {
    const tracked = execFileSync(
      'git',
      ['ls-files', '--', 'backend', 'frontend', 'shared'],
      { cwd: root, encoding: 'utf8' },
    )
    return tracked
      .split('\n')
      .filter((path) => READ.test(path) && existsSync(join(root, path)))
      .map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }))
  }

  static async main(): Promise<void> {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
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
    })
    process.exitCode = CheckReport.print('pattern:check', findings)
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
