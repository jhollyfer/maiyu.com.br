/** A labelled element and the name of its closest labelled ancestor, as the page reports them. */
export type NamedNode = {
  tag: string
  name: string
  ancestorName: string | null
}

/**
 * The repeated-name rule of the `Rail` (`rail.tsx`): a list, region or landmark whose name is the one
 * its labelled container already carries makes a screen reader say it twice. The kit cannot see how a
 * project uses the piece, so the E2E of every page charges it (`ResponsiveAudit.repeatedNames`).
 */
export class RepeatedNames {
  /** The nodes whose name equals the one of the container, as one line each. */
  static of(nodes: readonly NamedNode[]): string[] {
    return nodes
      .filter(({ name, ancestorName }) => {
        const own = RepeatedNames.normalize(name)

        return own !== '' && own === RepeatedNames.normalize(ancestorName ?? '')
      })
      .map(
        ({ tag, name }) =>
          `${tag} "${name.trim()}" repeats the name of its container`,
      )
  }

  private static normalize(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase()
  }
}
