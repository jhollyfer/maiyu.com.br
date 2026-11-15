import {
  type AccessToken,
  DbAccessTokensProvider,
} from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import { column, scope } from '@adonisjs/lucid/orm'

import {
  TRASHED_MODE,
  type ActiveStatus,
  type PlatformRole,
  type TrashedMode,
} from '@maiyu/shared'

import LegacyAwareHashDriver from '#core/legacy-aware-hash-driver'
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
 * plain-text password. The mixin takes one hasher, so it gets the one that still reads the
 * legacy scrypt hashes (DECISIONS.md #370). The account has two identities, e-mail and phone
 * (DECISIONS.md #396), and both are uids: the doc says "if you assign a user a username or phone
 * number, you can also use them as a UID"
 * (_doc-lib/adonisjs.md#guides/auth/verifying-user-credentials,
 * https://docs.adonisjs.com/guides/auth/verifying-user-credentials).
 *
 * The kit's sign-in does not go through `User.verifyCredentials`: that lookup skips the soft
 * delete, the status that may sign in and the login normalization. The sign-in use-case reads
 * the account through the repository and checks the hash itself; do not call it from a feature.
 */
const AuthFinder = withAuthFinder(() => LegacyAwareHashDriver.hasher(), {
  uids: ['email', 'phone'],
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
  declare platformRole: PlatformRole

  @column()
  declare status: ActiveStatus
}
