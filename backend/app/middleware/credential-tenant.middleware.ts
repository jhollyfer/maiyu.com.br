import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { ACTIVE_STATUS } from '@maiyu/shared'

import {
  Credential,
  CredentialSecret,
  type CredentialMatch,
  type CredentialRecord,
  type CredentialSource,
} from '#core/credential'
import { TenantScope } from '#core/tenant-scope'
import HTTPException from '#exceptions/http.exception'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import type { CredentialAttempts } from '#start/limiter.base'

/**
 * Module augmentation next to the middleware (DECISIONS.md #353): the credential the route resolved,
 * for the use case to read the target it opens.
 */
declare module '@adonisjs/core/http' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation: TypeScript only merges an `interface`
  export interface HttpContext {
    /** Set by `credential-tenant.middleware.ts`; absent on a route that did not use it. */
    credential?: CredentialMatch
  }
}

/** The container token of a kind: the abstract class the project's source extends and binds. */
type SourceToken = abstract new () => CredentialSource

type Options = {
  /** The project's kind of credential: a class that extends `CredentialSource`, read from the container. */
  readonly source: SourceToken
  /** The route parameter or body field that carries the credential. */
  readonly from: string
  /**
   * The tries on one credential, counted only when they miss (`CredentialAttempts`,
   * `start/limiter.base.ts`): a code shared by a class does not lock after ten students got in.
   */
  readonly attempts: CredentialAttempts
  /** The credential is `<locator>.<secret>` and the secret is kept only as a hash (an invite token). */
  readonly secret?: boolean
  /** Read only (the default), or an anonymous write the route declares (`public-tenant.middleware.ts`). */
  readonly access?: 'read' | 'insert'
}

/** An id no tenant has: what a credential that names none looks up, so the lookup still happens. */
const NO_TENANT = '00000000-0000-0000-0000-000000000000'

/**
 * The tenant of a request that carries a public credential instead of a city and a tenant in the URL
 * (DECISIONS.md #583): the class code a student types, the code of a live room, the invite token, the
 * enrollment protocol. It resolves the tenant and the target from the credential alone and gives the
 * route the same read-only scope `public-tenant.middleware.ts` gives (or the declared write).
 *
 * A credential that does not exist, is expired, fails its secret or belongs to a tenant that is
 * inactive or gone is **one answer**: the 404 of any unknown address, same code and same message, so
 * the response never tells whether a tenant or a credential exists. And it is one cost: every path
 * looks the credential up, compares the secret (against a placeholder when there is nothing to
 * compare) and looks the tenant up, and decides only afterwards, so the time does not tell them
 * apart either. The attempts are counted here and by the route: `attempts` counts the misses on one
 * credential, and the route puts `credentialThrottle` (by IP, `start/limiter.base.ts`) before this
 * middleware. A short code a person types is guessable, and only the ceiling makes it safe.
 */
@inject()
export default class CredentialTenantMiddleware {
  constructor(private readonly tenants: TenantRepository) {}

  async handle(context: HttpContext, next: NextFn, options: Options) {
    const raw = CredentialTenantMiddleware.read(context, options.from)
    const parsed = CredentialTenantMiddleware.parse(
      raw,
      options.secret === true,
    )
    const lookup = async (): Promise<CredentialMatch> => {
      const found = await this.resolve(context, options, parsed)
      if (!found)
        throw HTTPException.NotFound(
          context.i18n.t('errors.not_found'),
          'RESOURCE_NOT_FOUND',
        )

      return found
    }
    // The miss is what the ceiling counts, and only on the locator: a token's secret never keys it.
    const [refusal, match] = await options.attempts.penalize(
      parsed?.locator ?? '',
      lookup,
    )
    if (refusal) throw refusal

    context.credential = match
    context.tenantScope = TenantScope.ofPublic(match.tenantId, [], {
      inserts: options.access === 'insert',
    })

    await next()
  }

  private async resolve(
    context: HttpContext,
    options: Options,
    parsed: { locator: string; secret: string } | null,
  ): Promise<CredentialMatch | null> {
    const source = await context.containerResolver.make(options.source)

    // A value with no usable shape (empty, too long, a token without both halves) is not looked up:
    // only its shape is learned, never whether anything exists.
    let record: CredentialRecord | null = null
    if (parsed?.locator) record = await source.find(parsed.locator)
    const secretKept =
      !options.secret ||
      CredentialSecret.matches(parsed?.secret ?? '', record?.secretHash ?? null)
    const tenant = await this.tenants.findById(record?.tenantId ?? NO_TENANT)

    const fresh =
      record !== null &&
      (record.expiresAt === null || record.expiresAt.getTime() > Date.now())
    const active = tenant?.snapshot().status === ACTIVE_STATUS.ACTIVE
    if (!record || !secretKept || !fresh || !active) return null

    return { tenantId: record.tenantId, targetId: record.targetId }
  }

  private static parse(
    raw: string,
    secret: boolean,
  ): { locator: string; secret: string } | null {
    if (secret) return CredentialSecret.split(raw)

    return { locator: Credential.normalize(raw), secret: '' }
  }

  private static read(context: HttpContext, from: string): string {
    const value: unknown = context.params[from] ?? context.request.input(from)

    if (typeof value !== 'string') return ''

    return value
  }
}
