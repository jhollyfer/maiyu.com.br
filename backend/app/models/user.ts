import {
  TRASHED_MODE,
  type ActiveStatus,
  type TrashedMode,
  type UserRole,
} from '@maiyu/shared'
import {
  type AccessToken,
  DbAccessTokensProvider,
} from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { column, scope } from '@adonisjs/lucid/orm'

import { UserSchema } from '#database/schema'

/**
 * The session tokens table. The `@adonisjs/auth` provider receives it by option, and the
 * session repository deletes by it inside a transaction, which the provider does not
 * accept: one name in two places would silently diverge.
 */
export const ACCESS_TOKEN_TABLE = 'auth_access_tokens'

/**
 * Hashing before save and `verifyCredentials` (lookup by uid, hash checked in constant
 * time) come together from the mixin: split, they leave a creation path that saves the
 * plain-text password.
 */
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

/**
 * Extension point (KIT.md §3.4): the project adds its columns and relations here, and the
 * kit guard and session repository only rely on what is below.
 */
export default class User extends compose(UserSchema, AuthFinder) {
  /**
   * The soft-delete filter lives in the model and nowhere else: written by hand in each
   * query it depends on someone remembering, and `pattern:check` refuses it outside here.
   */
  static notDeleted = scope((query) => {
    query.whereNull('deletedAt')
  })

  static onlyDeleted = scope((query) => {
    query.whereNotNull('deletedAt')
  })

  /** The `?trashed` cut, chosen by the criterion's mode (`_standards/backend.md` §4.8). */
  static trashed = scope((query, mode?: TrashedMode) => {
    if (mode === TRASHED_MODE.WITH) return

    if (mode === TRASHED_MODE.ONLY) {
      query.whereNotNull('deletedAt')
      return
    }

    query.whereNull('deletedAt')
  })

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    table: ACCESS_TOKEN_TABLE,
  })

  /** Filled by the cookie guard; outside a request there is no token, hence optional. */
  declare currentAccessToken?: AccessToken

  /**
   * Redeclared to narrow the type: the generated `database/schema.ts` types every enum as
   * `string`, and a wrong role literal would compile and only fail when Postgres refused it.
   */
  @column()
  declare role: UserRole

  @column()
  declare status: ActiveStatus
}
