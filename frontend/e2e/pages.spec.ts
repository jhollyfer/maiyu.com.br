import type { Locale } from '../src/paraglide/runtime'
import { LocalizedPath, PagesList } from './support/pages-list'
import { expect, test } from './support/test'

test.use({ storageState: PagesList.anonymous })

/**
 * Toda página pública, nos três idiomas e nas três larguras dos projetos: a
 * rota responde o status certo, tem um `h1`, não loga erro (o fixture reprova
 * `pageerror`, `console.error` e resposta 5xx da API) e cabe na janela, inclusive
 * nos 390 px do celular mais comum.
 *
 * A lista de rotas é do projeto e mora em `e2e/support/pages.md` (`PagesList`).
 * O spec é o mesmo em todo projeto. Base: `academy/frontend/e2e/pages.spec.ts`.
 */
const LOCALES = [
  { prefix: '/pt-br', locale: 'pt-BR' },
  { prefix: '/es', locale: 'es' },
  { prefix: '/en', locale: 'en' },
] as const satisfies ReadonlyArray<{ prefix: string; locale: Locale }>

const PAGES = PagesList.section('200')

/** O que não existe responde 404, com a tela de "não encontrado" dentro da casca. */
const MISSING = PagesList.section('404')

const PHONE = { width: 390, height: 844 } as const

test.describe('páginas públicas', () => {
  for (const { prefix, locale } of LOCALES) {
    for (const path of PAGES) {
      const url = LocalizedPath.of(prefix, path)

      test(`quando abre ${url}, responde 200 com h1 e cabe na janela`, async ({
        page,
        expectNoHorizontalScroll,
      }) => {
        const response = await page.goto(url)

        expect(response?.status()).toBe(200)
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expectNoHorizontalScroll()

        await page.setViewportSize(PHONE)
        await expectNoHorizontalScroll()
      })
    }

    for (const path of MISSING) {
      const url = LocalizedPath.of(prefix, path)

      test(`quando abre ${url}, responde 404 com a tela de não encontrado`, async ({
        page,
        expectNoHorizontalScroll,
      }) => {
        const response = await page.goto(url)

        expect(response?.status()).toBe(404)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        // Dentro da casca: o cabeçalho e o rodapé continuam lá, com saída.
        await expect(page.getByRole('banner')).toBeVisible()
        await expect(page.getByRole('contentinfo')).toBeVisible()
        await expectNoHorizontalScroll()
      })
    }
  }
})

/**
 * URL sem prefixo vai por 307 para `/pt-br`, também sem cabeçalho de navegação (`redirect:
 * 'navigation'`), e as rotas de máquina ficam fora do prefixo nos dois sentidos: nem o middleware
 * nem o `rewrite` do router as mandam para `/pt-br/...` (`DECISIONS.md` #384, #385).
 */
test.describe('prefixo de idioma', () => {
  test('quando pede / sem prefixo, responde 307 para /pt-br', async ({
    request,
  }) => {
    const response = await request.get('/', { maxRedirects: 0 })

    expect(response.status()).toBe(307)
    expect(
      new URL(response.headers()['location'] ?? '', 'http://x').pathname,
    ).toBe('/pt-br')
  })

  for (const path of ['/health-check', '/robots.txt']) {
    test(`quando pede ${path}, responde sem redirecionar`, async ({
      request,
    }) => {
      const response = await request.get(path, { maxRedirects: 0 })

      expect(response.status()).toBe(200)
    })
  }

  test('quando pede /.well-known/security.txt, não vai para /pt-br', async ({
    request,
  }) => {
    const response = await request.get('/.well-known/security.txt', {
      maxRedirects: 0,
    })

    expect([200, 404]).toContain(response.status())
  })
})
