import { LocalizedPath, PagesList } from './support/pages-list'
import { expect, test } from './support/test'

/**
 * Every public page fits the window at the narrowest phone still in use (320 px) and keeps the
 * shell (header and footer) on screen. The three project widths are in `playwright.config.ts`;
 * this one goes below them, where the layout breaks first. Pages: `support/pages.md`.
 */
const NARROW = { width: 320, height: 640 } as const

for (const path of PagesList.section('200')) {
  const url = LocalizedPath.of('/pt-br', path)

  test(`when ${url} opens at ${NARROW.width}px, it does not scroll sideways and keeps the shell`, async ({
    page,
    expectNoHorizontalScroll,
  }) => {
    await page.setViewportSize(NARROW)
    await page.goto(url)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeAttached()
    await expectNoHorizontalScroll()
  })
}
