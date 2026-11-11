import { DateTime, type DurationLike } from 'luxon'

import { ClockContract } from '#services/clock/clock.contract'

/**
 * The stopped clock, for the test that needs a known instant (`domain.md` §10,
 * `backend.md` §5.3).
 *
 * It starts at a fixed instant and only moves when the test says so (`set`,
 * `advance`): the assertion compares with the value the test itself chose, not
 * with a recomputed now. `clock.contract.unit.spec.ts` runs the same contract
 * against this double and against the system clock.
 */
export class ClockFake extends ClockContract {
  private current: DateTime

  constructor(
    start: DateTime = DateTime.fromISO('2026-01-01T12:00:00.000Z', {
      zone: 'utc',
    }),
  ) {
    super()
    this.current = start
  }

  now(): DateTime {
    return this.current
  }

  set(instant: DateTime): void {
    this.current = instant
  }

  advance(duration: DurationLike): void {
    this.current = this.current.plus(duration)
  }
}
