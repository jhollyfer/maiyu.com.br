import env from '#start/env'

/**
 * What the suite fixes in the environment before it starts, whatever `.env` or the shell hold.
 * `resetDatabase` runs every seeder on each test and the functional specs expect the domain tables
 * empty, so a `SEED_DEMO_PASSWORD` in the developer's `.env` (DECISIONS.md #802) would fill them in
 * every test. The demonstration's own specs set the key themselves, per test.
 */
export class SuiteEnv {
  /** Switches the demonstration off for the whole run. */
  static quietDemo(): void {
    env.set('SEED_DEMO_PASSWORD', '')
  }
}
