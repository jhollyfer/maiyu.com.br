import { LocalizedPath, PagesList } from './support/pages-list'
import { expect, test } from './support/test'

/**
 * Each public page answers in every language with the head that search engines read: `html lang`,
 * `og:locale` and the reciprocal `hreflang` set with the `x-default` (`_standards/i18n.md`,
 * `frontend.md` §9.7). Pages: `support/pages.md`.
 */
const LOCALES = [
  { prefix: '/pt-br', lang: 'pt-BR', og: 'pt_BR' },
  { prefix: '/es', lang: 'es', og: 'es_ES' },
  { prefix: '/en', lang: 'en', og: 'en_US' },
] as const

for (const { prefix, lang, og } of LOCALES) {
  for (const path of PagesList.section('200')) {
    const url = LocalizedPath.of(prefix, path)

    test(`when ${url} opens, the head is in ${lang} with the hreflang set`, async ({
      page,
    }) => {
      await page.goto(url)

      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
        'content',
        og,
      )
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
        LOCALES.length + 1,
      )
      await expect(
        page.locator('link[rel="alternate"][hreflang="x-default"]'),
      ).toHaveCount(1)
    })
  }
}
