/**
 * The output format of every `scripts/<name>-check.ts` (`_standards/backend.md` §10, KIT.md §5).
 *
 * One file, because the format is the contract: each guard with its own copy of the printer
 * drifted (one grouped by rule, another by kind of change, a third by section).
 */

/** One finding: where, which rule of the catalog, which section of the standard it applies, and why. */
export type Finding = {
  readonly file: string
  readonly line: number
  readonly rule: string
  readonly section: string
  readonly message: string
}

export class CheckReport {
  /**
   * Prints the findings grouped by `section` and returns the exit code: 1 with findings, 0 without.
   *
   * It returns instead of setting `process.exitCode`, so the spec checks the code without ending
   * the runner. The order is the section's: whoever fixes reads first which decision was broken,
   * and only then where.
   */
  static print(
    name: string,
    findings: ReadonlyArray<Finding>,
    write: (line: string) => void = console.log,
  ): number {
    if (findings.length === 0) {
      write(`${name}: no findings.`)
      return 0
    }

    write(`${name}: ${findings.length} findings\n`)
    const bySection = Map.groupBy(findings, (finding) => finding.section)
    const sections = [...bySection].toSorted((a, b) =>
      a[0].localeCompare(b[0], 'en', { numeric: true }),
    )
    for (const [section, list] of sections) {
      write(`  ${section}`)
      for (const finding of list) {
        write(`    ${finding.file}:${finding.line}`)
        write(`        [${finding.rule}] ${finding.message}`)
      }
    }

    return 1
  }
}
