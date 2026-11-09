import type { ApplicationService } from '@adonisjs/core/types'

import { SessionLucidRepository } from '#repositories/session/session.lucid.repository'
import { SessionRepository } from '#repositories/session/session.repository'
import { StorageLucidRepository } from '#repositories/storage/storage.lucid.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UnitOfWorkLucid } from '#repositories/unit-of-work/unit-of-work.lucid'

/**
 * Extension point (KIT.md §3.4): the kit repositories are bound here, and the project adds
 * one `bind` per repository it creates. The use case asks for the abstract class; this is
 * the only place that knows it is Lucid.
 */
export default class RepositoryProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(UnitOfWork, () =>
      this.app.container.make(UnitOfWorkLucid),
    )
    this.app.container.bind(SessionRepository, () =>
      this.app.container.make(SessionLucidRepository),
    )
    this.app.container.bind(StorageRepository, () =>
      this.app.container.make(StorageLucidRepository),
    )
  }
}
