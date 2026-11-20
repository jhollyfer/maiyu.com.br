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
    // Relativo: atrás do proxy TLS a origem chega como http, e um Location absoluto rebaixaria
    // o visitante (`lib/relative-redirect.ts`).
    expect(response.headers()['location']).toBe('/pt-br')
  })

  test('quando pede / com X-Forwarded-Proto https, o Location continua relativo', async ({
    request,
  }) => {
    const response = await request.get('/', {
      maxRedirects: 0,
      headers: { 'X-Forwarded-Proto': 'https' },
    })

    expect(response.headers()['location']).toBe('/pt-br')
  })

  test('quando pede /blog/v1.2 sem prefixo, a página com ponto vai por 307 para o idioma', async ({
    request,
  }) => {
    const response = await request.get('/blog/v1.2', { maxRedirects: 0 })

    expect(response.status()).toBe(307)
    expect(response.headers()['location']).toBe('/pt-br/blog/v1.2')
  })

  for (const path of ['/inexistente.pdf']) {
    test(`quando pede o arquivo ${path} que não existe, responde 404 e não 307`, async ({
      request,
    }) => {
      const response = await request.get(path, { maxRedirects: 0 })

      expect(response.status()).toBe(404)
    })
  }

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

    // 200 com `SECURITY_CONTACT`, 404 sem: o RFC 9116 exige `Contact`, então sem contato não há
    // arquivo (`frontend.md` §3.3).
    expect([200, 404]).toContain(response.status())
  })

  test('quando pede uma página, manda a Permissions-Policy e o HSTS com subdomínios', async ({
    request,
  }) => {
    const response = await request.get('/health-check', { maxRedirects: 0 })
    const headers = response.headers()

    expect(headers['permissions-policy']).toContain('camera=(self)')
    expect(headers['permissions-policy']).toContain('geolocation=(self)')
    expect(headers['strict-transport-security']).toContain('includeSubDomains')
  })
})
