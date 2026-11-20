/** The values a function needs from the profile, by field name: the project declares which. */
export type ProfileFields = Readonly<Record<string, unknown>>

/**
 * Which fields of the profile are still empty for a function that depends on them (DECISIONS.md
 * #799). A public sign-up asks for the minimum, and the rest is completed after the login: the
 * account enters and uses the panel, and only the function that needs the data is refused until it
 * is filled. The kit gives the piece and the project declares, per function, which fields it needs
 * (`ProfileGate.missing({ pixKey: store.pixKey })`): there is no product rule here.
 *
 * A field is missing when it is `null`, `undefined`, a blank text or an empty list. `0` and `false`
 * are values: a number or a flag the person chose is filled.
 */
export default class ProfileGate {
  static missing(fields: ProfileFields): ReadonlyArray<string> {
    return Object.entries(fields)
      .filter(([, value]) => ProfileGate.isEmpty(value))
      .map(([field]) => field)
  }

  private static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0

    return false
  }
}
