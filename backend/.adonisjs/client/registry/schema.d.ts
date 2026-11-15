/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse, Method, PathWithRegistry, PatternsByMethod, RouteWithRegistry } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'
import type { routes } from './index.ts'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'health_check': {
    methods: ["GET","HEAD"]
    pattern: '/health-check'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/health-check.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/health-check.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/health-check.controller').default['handle']>>>
    }
  }
  'documentation.openapi.show': {
    methods: ["GET","HEAD"]
    pattern: '/openapi.json'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/documentation/openapi/show/show.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/documentation/openapi/show/show.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/documentation/openapi/show/show.controller').default['handle']>>>
    }
  }
  'documentation.reference.show': {
    methods: ["GET","HEAD"]
    pattern: '/documentation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/documentation/reference/show/show.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/documentation/reference/show/show.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/documentation/reference/show/show.controller').default['handle']>>>
    }
  }
  'authentication.sessions.sign-in': {
    methods: ["POST"]
    pattern: '/authentication/sign-in'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/authentication/sessions.validator').AuthenticationSessionSignInValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/authentication/sessions.validator').AuthenticationSessionSignInValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/authentication/sessions/sign-in/sign-in.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/authentication/sessions/sign-in/sign-in.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/authentication/sessions/sign-in/sign-in.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'authentication.sessions.sign-out': {
    methods: ["POST"]
    pattern: '/authentication/sign-out'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/authentication/sessions/sign-out/sign-out.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/authentication/sessions/sign-out/sign-out.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/authentication/sessions/sign-out/sign-out.controller').default['handle']>>>
    }
  }
  'authentication.sessions.refresh': {
    methods: ["POST"]
    pattern: '/authentication/refresh'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/authentication/sessions/refresh/refresh.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/authentication/sessions/refresh/refresh.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/authentication/sessions/refresh/refresh.controller').default['handle']>>>
    }
  }
  'account.profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/account/profile'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/account/profile/show/show.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/account/profile/show/show.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/account/profile/show/show.controller').default['handle']>>>
    }
  }
  'account.profile.update': {
    methods: ["PUT"]
    pattern: '/account/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/account/profile.validator').AccountProfileUpdateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/account/profile.validator').AccountProfileUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/account/profile/update/update.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/account/profile/update/update.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/account/profile/update/update.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'authentication.tenants.list': {
    methods: ["GET","HEAD"]
    pattern: '/authentication/tenants'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/authentication/tenants/list/list.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/authentication/tenants/list/list.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/authentication/tenants/list/list.controller').default['handle']>>>
    }
  }
  'authentication.tenants.select': {
    methods: ["PUT"]
    pattern: '/authentication/tenants/active'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/authentication/tenants.validator').AuthenticationTenantSelectValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/authentication/tenants.validator').AuthenticationTenantSelectValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/authentication/tenants/select/select.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/authentication/tenants/select/select.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/authentication/tenants/select/select.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.cities.list': {
    methods: ["GET","HEAD"]
    pattern: '/storefront/cities'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/storefront/cities/list/list.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storefront/cities/list/list.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storefront/cities/list/list.controller').default['handle']>>>
    }
  }
  'storefront.tenants.list': {
    methods: ["GET","HEAD"]
    pattern: '/storefront/cities/:city/tenants'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { city: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/storefront/tenants/list/list.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storefront/tenants/list/list.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storefront/tenants/list/list.controller').default['handle']>>>
    }
  }
  'platform.cities.create': {
    methods: ["POST"]
    pattern: '/platform/cities'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cities/cities.validator').CitiesCreateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/cities/cities.validator').CitiesCreateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/cities/create/create.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/cities/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/cities/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'platform.cities.update': {
    methods: ["PUT"]
    pattern: '/platform/cities/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#core/validator').IdentifierValidator)>|InferInput<(typeof import('#validators/cities/cities.validator').CitiesUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#core/validator').IdentifierValidator)>|InferInput<(typeof import('#validators/cities/cities.validator').CitiesUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/cities/update/update.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/cities/update/update.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/cities/update/update.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'platform.cities.delete': {
    methods: ["DELETE"]
    pattern: '/platform/cities/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/cities/delete/delete.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/cities/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/cities/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'platform.overview.show': {
    methods: ["GET","HEAD"]
    pattern: '/platform/overview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/overview/show/show.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/overview/show/show.controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/overview/show/show.controller').default['handle']>>>
    }
  }
  'platform.tenants.create': {
    methods: ["POST"]
    pattern: '/platform/tenants'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tenants/tenants.validator').TenantsCreateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/tenants/tenants.validator').TenantsCreateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/tenants/create/create.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/tenants/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/tenants/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'platform.tenants.update': {
    methods: ["PUT"]
    pattern: '/platform/tenants/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tenants/tenants.validator').TenantsUpdateValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/tenants/tenants.validator').TenantsUpdateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/tenants/update/update.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/tenants/update/update.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/tenants/update/update.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'platform.members.save': {
    methods: ["PUT"]
    pattern: '/platform/tenants/:id/members'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/tenants/tenants.validator').TenantsMemberSaveValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/tenants/tenants.validator').TenantsMemberSaveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/members/save/save.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/members/save/save.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/members/save/save.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'platform.members.delete': {
    methods: ["DELETE"]
    pattern: '/platform/members/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/platform/members/delete/delete.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/platform/members/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/platform/members/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.paginate': {
    methods: ["GET","HEAD"]
    pattern: '/storages'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/storages/files.validator').StoragesFilePaginateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/paginate/paginate.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/paginate/paginate.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/paginate/paginate.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.create': {
    methods: ["POST"]
    pattern: '/storages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storages/files.validator').StoragesFileCreateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storages/files.validator').StoragesFileCreateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/create/create.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.create-for-tenant': {
    methods: ["POST"]
    pattern: '/storages/cities/:city/tenants/:tenant'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storages/files.validator').StoragesFileCreateValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { city: ParamValue; tenant: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/storages/files.validator').StoragesFileCreateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/create/create.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.complete': {
    methods: ["POST"]
    pattern: '/storages/:id/complete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storages/files.validator').StoragesFileCompleteValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/storages/files.validator').StoragesFileCompleteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/complete/complete.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/complete/complete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/complete/complete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.parts': {
    methods: ["GET","HEAD"]
    pattern: '/storages/:id/parts'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/parts/parts.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/parts/parts.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/parts/parts.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.show': {
    methods: ["GET","HEAD"]
    pattern: '/storages/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/show/show.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/show/show.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/show/show.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.delete': {
    methods: ["DELETE"]
    pattern: '/storages/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/delete/delete.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storages.files.download': {
    methods: ["GET","HEAD"]
    pattern: '/storages/:id/download'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storages/files/download/download.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storages/files/download/download.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storages/files/download/download.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.contacts.create': {
    methods: ["POST"]
    pattern: '/storefront/contacts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/storefront/contacts.validator').StorefrontContactCreateValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/storefront/contacts.validator').StorefrontContactCreateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/storefront/contacts/create/create.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/storefront/contacts/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/storefront/contacts/create/create.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'administrator.contacts.paginate': {
    methods: ["GET","HEAD"]
    pattern: '/administrator/contacts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/administrator/contacts.validator').AdministratorContactPaginateValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/administrator/contacts/paginate/paginate.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/administrator/contacts/paginate/paginate.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/administrator/contacts/paginate/paginate.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'administrator.contacts.show': {
    methods: ["GET","HEAD"]
    pattern: '/administrator/contacts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/administrator/contacts/show/show.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/administrator/contacts/show/show.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/administrator/contacts/show/show.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'administrator.contacts.answer': {
    methods: ["POST"]
    pattern: '/administrator/contacts/:id/answer'
    types: {
      body: ExtractBody<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/administrator/contacts/answer/answer.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/administrator/contacts/answer/answer.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/administrator/contacts/answer/answer.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'administrator.contacts.delete': {
    methods: ["DELETE"]
    pattern: '/administrator/contacts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#core/validator').IdentifierValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#features/administrator/contacts/delete/delete.controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#features/administrator/contacts/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#features/administrator/contacts/delete/delete.controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}

export namespace Route {
  export type Request<Name extends keyof typeof routes> = RouteWithRegistry.Request<typeof routes, Name>
  export type Response<Name extends keyof typeof routes> = RouteWithRegistry.Response<typeof routes, Name>
  export type Params<Name extends keyof typeof routes> = RouteWithRegistry.Params<typeof routes, Name>
  export type Body<Name extends keyof typeof routes> = RouteWithRegistry.Body<typeof routes, Name>
  export type Query<Name extends keyof typeof routes> = RouteWithRegistry.Query<typeof routes, Name>
  export type Error<Name extends keyof typeof routes> = RouteWithRegistry.Error<typeof routes, Name>
}

export namespace Path {
  export type Request<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Request<typeof routes, M, P>
  export type Response<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Response<typeof routes, M, P>
  export type Params<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Params<typeof routes, M, P>
  export type Body<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Body<typeof routes, M, P>
  export type Query<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Query<typeof routes, M, P>
  export type Error<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Error<typeof routes, M, P>
}
