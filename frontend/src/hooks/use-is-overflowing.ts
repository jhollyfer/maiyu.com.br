import * as React from 'react'

/**
 * Whether the element's content is cut off by its own box (a `line-clamp`, an `overflow: hidden`),
 * measured by the browser and kept current by a `ResizeObserver`, so a column that narrows with the
 * window starts to cut without a render being asked for. The element comes in as state (a callback
 * `ref`) and not as a `useRef`, so a node that remounts is observed again.
 *
 * The observer fires once when it starts observing, which is the first measure: on the server and
 * until then the answer is `false` and the markup is the uncut one.
 * `ResizeObserver` is a web-platform API: not covered by `_doc-lib/`, read in the type (`lib.dom.d.ts`).
 */
export function useIsOverflowing(node: HTMLElement | null): boolean {
  const [overflowing, setOverflowing] = React.useState(false)

  React.useEffect(() => {
    if (!node) return

    const observer = new ResizeObserver(() => {
      setOverflowing(
        node.scrollHeight > node.clientHeight ||
          node.scrollWidth > node.clientWidth,
      )
    })
    observer.observe(node)

    return () => observer.disconnect()
  }, [node])

  return overflowing
}
