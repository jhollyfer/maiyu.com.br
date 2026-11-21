/** The element that scrolls a list, and how far below its top the list starts. */
export type ScrollFrame = {
  readonly scroller: HTMLElement
  /** Pixels between the scroller's content top and the first item (what sits above the list). */
  readonly margin: number
}

function scrolls(element: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(element)

  return overflowY === 'auto' || overflowY === 'scroll'
}

/**
 * The nearest ancestor that scrolls `element`, with the list's offset inside it; `null` when
 * nothing scrolls it, so the window is the scroller and the caller leaves the list to the page.
 *
 * A virtualized list that does not own its scroll (the phone's cards, which scroll with the page
 * content, not in a frame of their own) needs both: the element to read the offset from and the
 * margin (`scrollMargin`) to subtract from every item's position
 * (_doc-lib/tanstack-virtual.md#framework/react/react-virtual).
 */
export function scrollFrameOf(element: HTMLElement): ScrollFrame | null {
  let parent = element.parentElement
  while (parent && !scrolls(parent)) parent = parent.parentElement
  if (!parent) return null

  const margin =
    element.getBoundingClientRect().top -
    parent.getBoundingClientRect().top +
    parent.scrollTop

  return { scroller: parent, margin }
}
