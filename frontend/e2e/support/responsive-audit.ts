import type { Page } from '@playwright/test'

/** The house touch target, in CSS pixels, charged on every screen (`docs/DESIGN.md` §4). */
export const TOUCH_TARGET = 44

/** What the browser can say about a page's layout; each method returns the offenders, empty when fine. */
export class ResponsiveAudit {
  constructor(private readonly page: Page) {}

  /**
   * Waits for the finite, time-based animations to end: measured mid-entrance, a target under a
   * `transform` reads smaller than it is (seen on a breadcrumb, failing one run in a few) and text
   * mixes with the background. One cancelled midway (React swaps the entrance class on hydration)
   * rejects `finished` with `AbortError`: it ended all the same. A scroll-linked animation
   * (`animation-timeline: scroll()`) never ends by itself, so it is left out.
   */
  async settle(): Promise<void> {
    await this.page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getComputedTiming().iterations !== Infinity,
          )
          .filter((animation) => animation.timeline instanceof DocumentTimeline)
          .map((animation) =>
            animation.finished.then(
              () => undefined,
              () => undefined,
            ),
          ),
      ),
    )
  }

  /** The page is wider than the window: `scrollWidth` above `clientWidth` on the root element. */
  async horizontalOverflow(): Promise<string[]> {
    return this.page.evaluate(() => {
      const root = document.documentElement

      if (root.scrollWidth <= root.clientWidth) return []

      const offenders: string[] = []

      for (const element of document.querySelectorAll('body *')) {
        const rect = element.getBoundingClientRect()

        if (rect.right > root.clientWidth + 1 && rect.width > 0)
          offenders.push(
            `${element.tagName.toLowerCase()}.${String(element.getAttribute('class')).slice(0, 60)} right=${Math.round(rect.right)}`,
          )
      }

      return [
        `scrollWidth ${root.scrollWidth} > clientWidth ${root.clientWidth}`,
        ...offenders.slice(0, 6),
      ]
    })
  }

  /**
   * Interactive elements, visible, smaller than `minimum` on either side.
   *
   * Out, as in WCAG 2.2 SC 2.5.8: an inline link inside a paragraph. Also out: what is not for the
   * pointer (the visually hidden skip link, the controls taken out of the tab order). It is the
   * plain size check of the 44 px goal, with no spacing exception.
   */
  async smallTouchTargets(minimum: number): Promise<string[]> {
    await this.settle()
    return this.page.evaluate(
      ({ min }) => {
        const selector = [
          'a[href]',
          'button',
          'input:not([type=hidden])',
          'select',
          'textarea',
          '[role=button]',
          '[role=checkbox]',
          '[role=switch]',
          '[role=tab]',
          '[role=menuitem]',
          '[role=combobox]',
        ].join(',')
        const targets: { element: Element; rect: DOMRect }[] = []

        for (const element of document.querySelectorAll(selector)) {
          if (element.closest('p, [aria-hidden=true], [inert], .sr-only'))
            continue
          if (element.getAttribute('tabindex') === '-1') continue

          const style = getComputedStyle(element)

          if (style.visibility === 'hidden' || style.display === 'none')
            continue

          const rect = element.getBoundingClientRect()

          if (rect.width <= 1 || rect.height <= 1) continue

          // The `::after` an element stretches over its surroundings is part of what the finger
          // hits (the checkbox does this), so its box counts, not only the element's own.
          const after = getComputedStyle(element, '::after')
          const stretched =
            after.position === 'absolute' && after.content !== 'none'
          let hitWidth = rect.width
          let hitHeight = rect.height
          if (stretched) {
            hitWidth = Math.max(rect.width, parseFloat(after.width))
            hitHeight = Math.max(rect.height, parseFloat(after.height))
          }
          const centreX = rect.left + rect.width / 2
          const centreY = rect.top + rect.height / 2

          targets.push({
            element,
            rect: new DOMRect(
              centreX - hitWidth / 2,
              centreY - hitHeight / 2,
              hitWidth,
              hitHeight,
            ),
          })
        }

        const small = targets.filter(
          ({ rect }) => rect.width < min || rect.height < min,
        )
        const offenders = new Set<string>()

        for (const { element, rect } of small) {
          const label = (element.textContent ?? '').trim().slice(0, 24)

          offenders.add(
            `${element.tagName.toLowerCase()}.${String(element.getAttribute('class')).slice(0, 40)} "${label || element.getAttribute('aria-label') || ''}" ${Math.round(rect.width)}x${Math.round(rect.height)}`,
          )
        }

        return [...offenders].slice(0, 12)
      },
      { min: minimum },
    )
  }

  /**
   * Text cut by a box with hidden overflow that nobody asked for: the content is wider (or taller)
   * than its box and the box is neither `truncate` (ellipsis) nor `line-clamp`.
   */
  async clippedText(): Promise<string[]> {
    return this.page.evaluate(() => {
      const offenders = new Set<string>()

      for (const element of document.querySelectorAll('body *')) {
        const style = getComputedStyle(element)
        const clips = [style.overflowX, style.overflowY].some(
          (value) => value === 'hidden' || value === 'clip',
        )

        if (!clips) continue
        if (style.textOverflow === 'ellipsis') continue
        if (style.getPropertyValue('-webkit-line-clamp') !== 'none') continue
        if (element.closest('.sr-only, [aria-hidden=true]')) continue

        const ownText = [...element.childNodes].some(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        )

        if (!ownText) continue

        const wider = element.scrollWidth > element.clientWidth + 1
        const taller = element.scrollHeight > element.clientHeight + 1

        if (!wider && !taller) continue

        offenders.add(
          `${element.tagName.toLowerCase()} "${(element.textContent ?? '').trim().slice(0, 30)}" ${element.scrollWidth}x${element.scrollHeight} in ${element.clientWidth}x${element.clientHeight}`,
        )
      }

      return [...offenders].slice(0, 12)
    })
  }

  /**
   * Text that an ellipsis cut down to almost nothing: a `truncate` box narrower than 48 px whose
   * content is wider. Cutting on purpose is fine; a label that leaves only its first letter is a
   * layout that gave the room to its neighbours.
   */
  async collapsedText(): Promise<string[]> {
    return this.page.evaluate(() => {
      const offenders = new Set<string>()

      for (const element of document.querySelectorAll('body *')) {
        if (element.closest('.sr-only, [aria-hidden=true]')) continue
        if (getComputedStyle(element).textOverflow !== 'ellipsis') continue
        if (element.clientWidth >= 48) continue
        if (element.scrollWidth <= element.clientWidth + 1) continue

        offenders.add(
          `${element.tagName.toLowerCase()} "${(element.textContent ?? '').trim().slice(0, 30)}" ${element.clientWidth}px of ${element.scrollWidth}px`,
        )
      }

      return [...offenders].slice(0, 12)
    })
  }
}
