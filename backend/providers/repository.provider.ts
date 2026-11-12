import type { ApplicationService } from '@adonisjs/core/types'

import { CityLucidRepository } from '#repositories/city/city.lucid.repository'
import { CityRepository } from '#repositories/city/city.repository'
import { ContactLucidRepository } from '#repositories/contact/contact.lucid.repository'
import { ContactRepository } from '#repositories/contact/contact.repository'
import { EmailChangeLucidRepository } from '#repositories/email-change/email-change.lucid.repository'
import { EmailChangeRepository } from '#repositories/email-change/email-change.repository'
import { SessionLucidRepository } from '#repositories/session/session.lucid.repository'
import { SessionRepository } from '#repositories/session/session.repository'
import { StorageLucidRepository } from '#repositories/storage/storage.lucid.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { TenantLucidRepository } from '#repositories/tenant/tenant.lucid.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { LucidUnitOfWork } from '#repositories/unit-of-work/unit-of-work.lucid'
import { UserLucidRepository } from '#repositories/user/user.lucid.repository'
import { UserRepository } from '#repositories/user/user.repository'

/**
 * Extension point (KIT.md §3.4): the kit repositories are bound here, and the project adds
 * one `bind` per repository it creates. The use case asks for the abstract class; this is
 * the only place that knows it is Lucid.
 */
export default class RepositoryProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(UnitOfWork, () =>
      this.app.container.make(LucidUnitOfWork),
    )
    this.app.container.bind(SessionRepository, () =>
      this.app.container.make(SessionLucidRepository),
    )
    this.app.container.bind(StorageRepository, () =>
      this.app.container.make(StorageLucidRepository),
    )
    this.app.container.bind(EmailChangeRepository, () =>
      this.app.container.make(EmailChangeLucidRepository),
    )
    this.app.container.bind(CityRepository, () =>
      this.app.container.make(CityLucidRepository),
    )
    this.app.container.bind(TenantRepository, () =>
      this.app.container.make(TenantLucidRepository),
    )
    this.app.container.bind(ContactRepository, () =>
      this.app.container.make(ContactLucidRepository),
    )
    this.app.container.bind(UserRepository, () =>
      this.app.container.make(UserLucidRepository),
    )
  }
}
