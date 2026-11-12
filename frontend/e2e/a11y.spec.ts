import { LocalizedPath, PagesList } from './support/pages-list'
import { expect, test } from './support/test'

/**
 * No `serious` or `critical` axe violation on any public page (`_standards/frontend.md` §11.2),
 * in light and dark. Pages: `support/pages.md`.
 */
const SCHEMES = ['light', 'dark'] as const

for (const path of PagesList.section('200')) {
  const url = LocalizedPath.of('/pt-br', path)

  for (const scheme of SCHEMES) {
    test(`when ${url} opens in ${scheme}, axe finds no blocking violation`, async ({
      page,
      expectHydrated,
      expectNoBlockingViolations,
    }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto(url)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectHydrated(page.getByRole('heading', { level: 1 }))

      await expectNoBlockingViolations()
    })
  }
}
