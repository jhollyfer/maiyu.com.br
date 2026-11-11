import { LocalizedPath, PagesList } from './support/pages-list'
import { ResponsiveAudit, TOUCH_TARGET } from './support/responsive-audit'
import { expect, test } from './support/test'

/**
 * The touch targets of every public page on the phone (`mobile` project only, see
 * `playwright.config.ts`), charged the house goal, 44 px (`docs/DESIGN.md` §4), with no spacing
 * exception: the kit grows its controls below `sm` (`_standards/frontend.md` §10.2).
 *
 * The pages are the project's list in `support/pages.md`, the same one `pages.spec.ts` opens: the
 * spec assumes no screen of the project. One language is enough, the targets do not change with it.
 */
for (const path of PagesList.section('200')) {
  const url = LocalizedPath.of('/pt-br', path)

  test(`when the phone opens ${url}, every target is at least ${TOUCH_TARGET}px`, async ({
    page,
    expectHydrated,
  }) => {
    await page.goto(url)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    // The server's HTML has no `role=tab` yet: audited before hydration, the tabs do not exist.
    await expectHydrated(page.getByRole('heading', { level: 1 }))

    const audit = new ResponsiveAudit(page)

    expect(
      await audit.smallTouchTargets(TOUCH_TARGET),
      `targets under ${TOUCH_TARGET}px`,
    ).toEqual([])
  })
}
