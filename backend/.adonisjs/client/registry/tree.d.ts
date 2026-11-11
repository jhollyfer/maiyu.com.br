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
  }
  storages: {
    files: {
      paginate: typeof routes['storages.files.paginate']
      create: typeof routes['storages.files.create']
      complete: typeof routes['storages.files.complete']
      parts: typeof routes['storages.files.parts']
      show: typeof routes['storages.files.show']
      delete: typeof routes['storages.files.delete']
      download: typeof routes['storages.files.download']
    }
  }
  storefront: {
    contacts: {
      create: typeof routes['storefront.contacts.create']
    }
  }
  administrator: {
    contacts: {
      paginate: typeof routes['administrator.contacts.paginate']
      show: typeof routes['administrator.contacts.show']
    }
  }
}
