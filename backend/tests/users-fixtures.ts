import User from '#models/user'

/** The account by e-mail, read straight from the database: the spec checks the effect without importing the model. */
export function findUserByEmail(email: string): Promise<User> {
  return User.findByOrFail('email', email)
}

/** Whether the account row still exists, deleted for good or not. */
export async function userExists(id: string): Promise<boolean> {
  return (await User.find(id)) !== null
}

/**
 * What the account signs in with: its e-mail, or its phone when it has none (DECISIONS.md #396).
 * An account with neither cannot exist (`users_contact_required`), so the throw is a broken fixture.
 */
export function loginOf(user: Pick<User, 'email' | 'phone'>): string {
  const login = user.email ?? user.phone
  if (login === null) throw new Error('account with no e-mail and no phone')

  return login
}
