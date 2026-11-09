import limiter from '@adonisjs/limiter/services/main'

/**
 * Extension point (KIT.md §3.4): the ceilings of the kit routes come first, and the project
 * adds its own below them.
 */

/**
 * The per-account budget shared by every door that verifies a password. The e-mail is
 * normalized because each case or whitespace variant would open a new bucket.
 */
class AccountBudget {
  static limit(email: string) {
    const account = email.trim().toLowerCase()

    if (account.length === 0) return null

    return limiter
      .allowRequests(20)
      .every('1 hour')
      .blockFor('10 mins')
      .usingKey(`signin:${account}`)
  }
}

/** `blockFor` turns the ceiling into a cost: without it the window resets every minute. */
export const signInThrottle = limiter.define('signIn', function () {
  return limiter.allowRequests(5).every('1 minute').blockFor('10 mins')
})

/**
 * The same door counted per account: the per-IP ceiling alone lets whoever has many
 * addresses try one password on each. A second limit and not a joint `ip:email` key, which
 * would give each IP five attempts per e-mail and make enumeration cheaper.
 */
export const signInAccountThrottle = limiter.define(
  'signInAccount',
  function (context) {
    const email: unknown = context.request.input('email')

    // `null` applies no ceiling: a shared key for malformed bodies would lock out someone innocent.
    if (typeof email !== 'string') return null

    return AccountBudget.limit(email)
  },
)

/**
 * Only the writes that open an upload count, and by session user, so people behind the same
 * NAT do not share the bucket. Each part is a request, hence the higher ceiling.
 */
export const uploadThrottle = limiter.define('upload', function (context) {
  const user = context.auth.user
  const throttle = limiter.allowRequests(60).every('1 hour')

  if (!user) return throttle

  return throttle.usingKey(`user_${user.id}`)
})

/**
 * Renewal has no session and hits the database on every call; the token is not guessable,
 * so the ceiling is against the loop. Generous because SSR and tabs renew together.
 */
export const refreshThrottle = limiter.define('refresh', function () {
  return limiter.allowRequests(60).every('1 minute')
})
