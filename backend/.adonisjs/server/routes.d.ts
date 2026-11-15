import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health_check': { paramsTuple?: []; params?: {} }
    'documentation.openapi.show': { paramsTuple?: []; params?: {} }
    'documentation.reference.show': { paramsTuple?: []; params?: {} }
    'authentication.sessions.sign-in': { paramsTuple?: []; params?: {} }
    'authentication.sessions.sign-out': { paramsTuple?: []; params?: {} }
    'authentication.sessions.refresh': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'authentication.tenants.list': { paramsTuple?: []; params?: {} }
    'authentication.tenants.select': { paramsTuple?: []; params?: {} }
    'storefront.cities.list': { paramsTuple?: []; params?: {} }
    'storefront.tenants.list': { paramsTuple: [ParamValue]; params: {'city': ParamValue} }
    'platform.cities.create': { paramsTuple?: []; params?: {} }
    'platform.cities.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'platform.cities.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'platform.overview.show': { paramsTuple?: []; params?: {} }
    'platform.tenants.create': { paramsTuple?: []; params?: {} }
    'platform.tenants.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'platform.members.save': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'platform.members.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.paginate': { paramsTuple?: []; params?: {} }
    'storages.files.create': { paramsTuple?: []; params?: {} }
    'storages.files.create-for-tenant': { paramsTuple: [ParamValue,ParamValue]; params: {'city': ParamValue,'tenant': ParamValue} }
    'storages.files.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.parts': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.contacts.create': { paramsTuple?: []; params?: {} }
    'administrator.contacts.paginate': { paramsTuple?: []; params?: {} }
    'administrator.contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrator.contacts.answer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrator.contacts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'health_check': { paramsTuple?: []; params?: {} }
    'documentation.openapi.show': { paramsTuple?: []; params?: {} }
    'documentation.reference.show': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'authentication.tenants.list': { paramsTuple?: []; params?: {} }
    'storefront.cities.list': { paramsTuple?: []; params?: {} }
    'storefront.tenants.list': { paramsTuple: [ParamValue]; params: {'city': ParamValue} }
    'platform.overview.show': { paramsTuple?: []; params?: {} }
    'storages.files.paginate': { paramsTuple?: []; params?: {} }
    'storages.files.parts': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrator.contacts.paginate': { paramsTuple?: []; params?: {} }
    'administrator.contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'health_check': { paramsTuple?: []; params?: {} }
    'documentation.openapi.show': { paramsTuple?: []; params?: {} }
    'documentation.reference.show': { paramsTuple?: []; params?: {} }
    'account.profile.show': { paramsTuple?: []; params?: {} }
    'authentication.tenants.list': { paramsTuple?: []; params?: {} }
    'storefront.cities.list': { paramsTuple?: []; params?: {} }
    'storefront.tenants.list': { paramsTuple: [ParamValue]; params: {'city': ParamValue} }
    'platform.overview.show': { paramsTuple?: []; params?: {} }
    'storages.files.paginate': { paramsTuple?: []; params?: {} }
    'storages.files.parts': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrator.contacts.paginate': { paramsTuple?: []; params?: {} }
    'administrator.contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'authentication.sessions.sign-in': { paramsTuple?: []; params?: {} }
    'authentication.sessions.sign-out': { paramsTuple?: []; params?: {} }
    'authentication.sessions.refresh': { paramsTuple?: []; params?: {} }
    'platform.cities.create': { paramsTuple?: []; params?: {} }
    'platform.tenants.create': { paramsTuple?: []; params?: {} }
    'storages.files.create': { paramsTuple?: []; params?: {} }
    'storages.files.create-for-tenant': { paramsTuple: [ParamValue,ParamValue]; params: {'city': ParamValue,'tenant': ParamValue} }
    'storages.files.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.contacts.create': { paramsTuple?: []; params?: {} }
    'administrator.contacts.answer': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'account.profile.update': { paramsTuple?: []; params?: {} }
    'authentication.tenants.select': { paramsTuple?: []; params?: {} }
    'platform.cities.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'platform.tenants.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'platform.members.save': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'platform.cities.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'platform.members.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrator.contacts.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}