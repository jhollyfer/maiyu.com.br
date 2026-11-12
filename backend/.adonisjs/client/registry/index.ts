/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'health_check': {
    methods: ["GET","HEAD"],
    pattern: '/health-check',
    tokens: [[0,"health-check"]],
    types: placeholder as Registry['health_check']['types'],
  },
  'documentation.openapi.show': {
    methods: ["GET","HEAD"],
    pattern: '/openapi.json',
    tokens: [[0,"openapi.json"]],
    types: placeholder as Registry['documentation.openapi.show']['types'],
  },
  'documentation.reference.show': {
    methods: ["GET","HEAD"],
    pattern: '/documentation',
    tokens: [[0,"documentation"]],
    types: placeholder as Registry['documentation.reference.show']['types'],
  },
  'authentication.sessions.sign-in': {
    methods: ["POST"],
    pattern: '/authentication/sign-in',
    tokens: [[0,"authentication"],[0,"sign-in"]],
    types: placeholder as Registry['authentication.sessions.sign-in']['types'],
  },
  'authentication.sessions.sign-out': {
    methods: ["POST"],
    pattern: '/authentication/sign-out',
    tokens: [[0,"authentication"],[0,"sign-out"]],
    types: placeholder as Registry['authentication.sessions.sign-out']['types'],
  },
  'authentication.sessions.refresh': {
    methods: ["POST"],
    pattern: '/authentication/refresh',
    tokens: [[0,"authentication"],[0,"refresh"]],
    types: placeholder as Registry['authentication.sessions.refresh']['types'],
  },
  'storages.files.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/storages',
    tokens: [[0,"storages"]],
    types: placeholder as Registry['storages.files.paginate']['types'],
  },
  'storages.files.create': {
    methods: ["POST"],
    pattern: '/storages',
    tokens: [[0,"storages"]],
    types: placeholder as Registry['storages.files.create']['types'],
  },
  'storages.files.complete': {
    methods: ["POST"],
    pattern: '/storages/:id/complete',
    tokens: [[0,"storages"],[1,"id"],[0,"complete"]],
    types: placeholder as Registry['storages.files.complete']['types'],
  },
  'storages.files.parts': {
    methods: ["GET","HEAD"],
    pattern: '/storages/:id/parts',
    tokens: [[0,"storages"],[1,"id"],[0,"parts"]],
    types: placeholder as Registry['storages.files.parts']['types'],
  },
  'storages.files.show': {
    methods: ["GET","HEAD"],
    pattern: '/storages/:id',
    tokens: [[0,"storages"],[1,"id"]],
    types: placeholder as Registry['storages.files.show']['types'],
  },
  'storages.files.delete': {
    methods: ["DELETE"],
    pattern: '/storages/:id',
    tokens: [[0,"storages"],[1,"id"]],
    types: placeholder as Registry['storages.files.delete']['types'],
  },
  'storages.files.download': {
    methods: ["GET","HEAD"],
    pattern: '/storages/:id/download',
    tokens: [[0,"storages"],[1,"id"],[0,"download"]],
    types: placeholder as Registry['storages.files.download']['types'],
  },
  'storefront.contacts.create': {
    methods: ["POST"],
    pattern: '/storefront/contacts',
    tokens: [[0,"storefront"],[0,"contacts"]],
    types: placeholder as Registry['storefront.contacts.create']['types'],
  },
  'administrator.contacts.paginate': {
    methods: ["GET","HEAD"],
    pattern: '/administrator/contacts',
    tokens: [[0,"administrator"],[0,"contacts"]],
    types: placeholder as Registry['administrator.contacts.paginate']['types'],
  },
  'administrator.contacts.show': {
    methods: ["GET","HEAD"],
    pattern: '/administrator/contacts/:id',
    tokens: [[0,"administrator"],[0,"contacts"],[1,"id"]],
    types: placeholder as Registry['administrator.contacts.show']['types'],
  },
  'administrator.contacts.answer': {
    methods: ["POST"],
    pattern: '/administrator/contacts/:id/answer',
    tokens: [[0,"administrator"],[0,"contacts"],[1,"id"],[0,"answer"]],
    types: placeholder as Registry['administrator.contacts.answer']['types'],
  },
  'administrator.contacts.delete': {
    methods: ["DELETE"],
    pattern: '/administrator/contacts/:id',
    tokens: [[0,"administrator"],[0,"contacts"],[1,"id"]],
    types: placeholder as Registry['administrator.contacts.delete']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
