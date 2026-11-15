/**
 * The test bootstrap guard: the suite runs `truncate()` between tests, so starting
 * against the development or production database would erase real data. The suite
 * database has the `_test` suffix in its name, and any other one brings the runner
 * down before the first migration (_standards/backend.md §7, "E2E never touches the
 * production database").
 */
export class DatabaseGuard {
  static readonly SUFFIX = '_test'
  // The suite database runs on this machine (compose or the session's container): a `_test`
  // name on another host is still someone else's database.
  static readonly LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])

  /** The name of the `DATABASE_URL` database, without the query string. */
  static databaseName(url: string): string {
    return new URL(url).pathname.replace(/^\//, '')
  }

  /**
   * Throws if the URL is missing or its host is not loopback. The one check the E2E commands
   * (`e2e:accounts`, `e2e:cleanup`) share with the suite: they run against the development
   * database, whose name has no `_test`, but never against someone else's machine.
   */
  static assertLoopback(url: string | undefined): void {
    if (!url)
      throw new Error(
        'DATABASE_URL missing: the suite does not know which database to run on.',
      )

    const host = new URL(url).hostname
    if (!DatabaseGuard.LOOPBACK.has(host))
      throw new Error(
        `The suite refuses to start: host "${host}" is not loopback. ` +
          'It drops the tables between tests; point DATABASE_URL of .env.test to the local test database.',
      )
  }

  /** Throws if the URL does not point to a `_test` database on loopback. */
  static assertTestDatabase(url: string | undefined): void {
    DatabaseGuard.assertLoopback(url)
    if (!url) return

    const name = DatabaseGuard.databaseName(url)

    if (!name.endsWith(DatabaseGuard.SUFFIX))
      throw new Error(
        `The suite refuses to start: database "${name}" does not end in "${DatabaseGuard.SUFFIX}". ` +
          'It drops the tables between tests; point DATABASE_URL of .env.test to the test database.',
      )
  }
}
