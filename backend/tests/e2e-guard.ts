import { DatabaseGuard } from '#tests/database-guard'
import type { ProjectE2eMarker } from '#tests/e2e-project-cleanup'

/**
 * The refusals shared by `e2e:accounts` and `e2e:cleanup` (DECISIONS.md #732): each answers with the
 * text to log, or `null` when the run may go on. A class with only `static`, like `Tenants`.
 */
export class E2eGuard {
  /** The only environments where the E2E commands touch the database. */
  static readonly ENVIRONMENTS: ReadonlyArray<string> = ['development', 'test']

  /**
   * The tables of the kit (accounts, sessions, memberships, tenants): `e2e:cleanup` reaches the
   * accounts only by the rule of e-mail and name together, never through the project's list.
   */
  static readonly KIT_TABLES: ReadonlyArray<string> = [
    'users',
    'tenants',
    'cities',
    'tenant_memberships',
    'auth_access_tokens',
    'consumed_refresh_tokens',
    'rate_limits',
    'email_changes',
    'adonis_schema',
    'adonis_schema_versions',
  ]

  /** A table or a column of the project's list: letters, digits and `_`, so no SQL travels in it. */
  static readonly IDENTIFIER = /^[a-z][a-z0-9_]*$/

  /**
   * Two locks, both needed: `NODE_ENV` is whatever the process was started with, and a production
   * container started with `NODE_ENV=development` passes it, so the database host must also be
   * loopback (the same `DatabaseGuard` the suite uses).
   */
  static environmentRefusal(
    command: string,
    nodeEnvironment: string,
    databaseUrl: string | undefined,
  ): string | null {
    if (!E2eGuard.ENVIRONMENTS.includes(nodeEnvironment))
      return `${command} runs only in development and test, not in ${nodeEnvironment}`

    try {
      DatabaseGuard.assertLoopback(databaseUrl)
    } catch (error) {
      const reason = (error instanceof Error && error.message) || ''

      return `${command} refused: ${reason || 'DATABASE_URL is not usable'}`
    }

    return null
  }

  /** The refusal for a project list that names a SQL fragment or a table of the kit, or `null`. */
  static markersRefusal(
    markers: ReadonlyArray<ProjectE2eMarker>,
  ): string | null {
    const invalid = markers.filter(
      (each) =>
        !E2eGuard.IDENTIFIER.test(each.table) ||
        !E2eGuard.IDENTIFIER.test(each.column),
    )
    if (invalid.length > 0)
      return `E2E_CLEANUP_INVALID_MARKER: table or column that is not a plain identifier (a-z, 0-9, _): ${invalid
        .map((each) => `${each.table}.${each.column}`)
        .join(', ')}`

    const kit = markers.filter((each) =>
      E2eGuard.KIT_TABLES.includes(each.table),
    )
    if (kit.length > 0)
      return `E2E_CLEANUP_KIT_TABLE: table of the kit in tests/e2e-project-cleanup.ts: ${kit
        .map((each) => each.table)
        .join(', ')}`

    return null
  }
}
