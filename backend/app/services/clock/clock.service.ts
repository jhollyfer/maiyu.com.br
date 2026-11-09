import { DateTime } from 'luxon'

import { ClockContract } from '#services/clock/clock.contract'

/** The system clock: the only production place that reads the real now. */
export default class SystemClockService extends ClockContract {
  now(): DateTime {
    return DateTime.now()
  }
}
