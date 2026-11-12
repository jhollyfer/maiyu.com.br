/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  healthCheck: typeof routes['health_check']
  documentation: {
    openapi: {
      show: typeof routes['documentation.openapi.show']
    }
    reference: {
      show: typeof routes['documentation.reference.show']
    }
  }
  authentication: {
    sessions: {
      signIn: typeof routes['authentication.sessions.sign-in']
      signOut: typeof routes['authentication.sessions.sign-out']
      refresh: typeof routes['authentication.sessions.refresh']
    }
    tenants: {
      list: typeof routes['authentication.tenants.list']
      select: typeof routes['authentication.tenants.select']
    }
  }
  account: {
    profile: {
      show: typeof routes['account.profile.show']
      update: typeof routes['account.profile.update']
    }
  }
  storefront: {
    cities: {
      list: typeof routes['storefront.cities.list']
    }
    tenants: {
      list: typeof routes['storefront.tenants.list']
    }
    contacts: {
      create: typeof routes['storefront.contacts.create']
    }
  }
  platform: {
    cities: {
      create: typeof routes['platform.cities.create']
      update: typeof routes['platform.cities.update']
      delete: typeof routes['platform.cities.delete']
    }
    overview: {
      show: typeof routes['platform.overview.show']
    }
    tenants: {
      create: typeof routes['platform.tenants.create']
      update: typeof routes['platform.tenants.update']
    }
    members: {
      save: typeof routes['platform.members.save']
      delete: typeof routes['platform.members.delete']
    }
  }
  storages: {
    files: {
      paginate: typeof routes['storages.files.paginate']
      create: typeof routes['storages.files.create']
      createForTenant: typeof routes['storages.files.create-for-tenant']
      complete: typeof routes['storages.files.complete']
      parts: typeof routes['storages.files.parts']
      show: typeof routes['storages.files.show']
      delete: typeof routes['storages.files.delete']
      download: typeof routes['storages.files.download']
    }
  }
  administrator: {
    contacts: {
      paginate: typeof routes['administrator.contacts.paginate']
      show: typeof routes['administrator.contacts.show']
      answer: typeof routes['administrator.contacts.answer']
      delete: typeof routes['administrator.contacts.delete']
    }
  }
}
