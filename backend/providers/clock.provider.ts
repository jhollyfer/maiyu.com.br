import type { ApplicationService } from '@adonisjs/core/types'

import { ClockContract } from '#services/clock/clock.contract'
import SystemClockService from '#services/clock/clock.service'

/**
 * Tells the container who answers for `ClockContract`: the system clock.
 *
 * `bind` and not `singleton`: the clock keeps neither state nor connection. The
 * test that needs a fixed instant swaps the binding with
 * `container.swap(ClockContract, () => new ClockFake(...))`
 * (_doc-lib/adonisjs.md#guides/concepts/service-providers,
 * https://docs.adonisjs.com/guides/concepts/service-providers).
 */
export default class ClockProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(ClockContract, () =>
      this.app.container.make(SystemClockService),
    )
  }
}
