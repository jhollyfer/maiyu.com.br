import type { ApplicationService } from '@adonisjs/core/types'

import { IdGeneratorContract } from '#services/id-generator/id-generator.contract'
import CryptoIdGeneratorService from '#services/id-generator/id-generator.service'

/**
 * Tells the container who answers for `IdGeneratorContract`: Node's `randomUUID`.
 *
 * `bind` for the same reason as `ClockProvider`: no state, no connection
 * (_doc-lib/adonisjs.md#guides/concepts/service-providers,
 * https://docs.adonisjs.com/guides/concepts/service-providers).
 */
export default class IdGeneratorProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(IdGeneratorContract, () =>
      this.app.container.make(CryptoIdGeneratorService)
    )
  }
}
