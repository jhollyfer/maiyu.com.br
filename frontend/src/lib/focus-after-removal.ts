/**
 * Where focus goes when the confirmed action removes from the screen the element that opened
 * it (archive, restore, delete).
 *
 * The alert returns focus to its trigger, but the trigger lives in the row that just vanished
 * (or on the screen the action left), and focus fell on `<body>`: whoever navigates by keyboard
 * or screen reader lost their place (WCAG 2.4.3 Focus Order, and 3.2.2 On Input).
 */

/** The records list: the region that scrolls, focusable by `tabIndex={0}` (`TableGrid`). */
export const TABLE_FOCUS_FALLBACK = '[data-slot="table"]'

/**
 * The row actions trigger, by attribute: its accessible name follows the locale, so reading
 * `aria-label` would only match in one language.
 */
export const ROW_ACTIONS_SELECTOR = '[data-row-actions]'

/** A table row or a mobile card, whichever the layout draws. */
const ROW_SELECTOR = 'tr, li'

/**
 * The actions trigger of the neighbouring row (the one below, or above on the last row), read
 * **before** the action: after it the source row is no longer in the DOM.
 */
export function neighbourRowActions(from: Element | null): HTMLElement | null {
  const row = from?.closest(ROW_SELECTOR)
  const sibling = row?.nextElementSibling ?? row?.previousElementSibling

  return sibling?.querySelector<HTMLElement>(ROW_ACTIONS_SELECTOR) ?? null
}

/** About one second of frames: after navigating, the target screen mounts a few frames late. */
const MAX_ATTEMPTS = 60

/**
 * Focuses `target` if it is still in the document; otherwise the first element of
 * `fallbackSelector`. It tries for a few frames, because when the mutation resolves the
 * screen that holds the fallback may not have mounted yet.
 */
export function focusAfterRemoval(
  target: HTMLElement | null,
  fallbackSelector: string = TABLE_FOCUS_FALLBACK,
): void {
  let attempts = 0

  function tryFocus(): void {
    attempts += 1

    if (target?.isConnected) {
      target.focus()
      return
    }

    const fallback = document.querySelector<HTMLElement>(fallbackSelector)
    if (fallback) {
      fallback.focus()
      return
    }

    if (attempts < MAX_ATTEMPTS) requestAnimationFrame(tryFocus)
  }

  requestAnimationFrame(tryFocus)
}
