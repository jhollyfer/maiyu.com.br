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
    'storages.files.paginate': { paramsTuple?: []; params?: {} }
    'storages.files.create': { paramsTuple?: []; params?: {} }
    'storages.files.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.parts': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storages.files.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.contacts.create': { paramsTuple?: []; params?: {} }
    'administrator.contacts.paginate': { paramsTuple?: []; params?: {} }
    'administrator.contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'health_check': { paramsTuple?: []; params?: {} }
    'documentation.openapi.show': { paramsTuple?: []; params?: {} }
    'documentation.reference.show': { paramsTuple?: []; params?: {} }
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
    'storages.files.create': { paramsTuple?: []; params?: {} }
    'storages.files.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.contacts.create': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'storages.files.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}