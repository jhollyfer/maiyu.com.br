import AxeBuilder from '@axe-core/playwright'
import { expect, test as base } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

import { ClientAddress } from './client-address'
import { E2eEnv } from './env'
import { ResponsiveAudit } from './responsive-audit'

type Fixtures = {
  /** O IP deste teste no `X-Forwarded-For` (`client-address.ts`). */
  clientAddress: string
  /**
   * Põe na mesma rede de erros uma página aberta à mão (`browser.newContext()`),
   * como a do professor: a do fixture `page` já vem vigiada.
   */
  watch: (page: Page) => void
  /** Reprova em violação `serious` ou `critical` na página (`frontend.md` §11.2). */
  expectNoBlockingViolations: () => Promise<void>
  /** Espera o React assumir o elemento: antes disso o clique cai no HTML cru do SSR. */
  expectHydrated: (locator: Locator) => Promise<void>
  /** Reprova se a página ficou mais larga que a janela. */
  expectNoHorizontalScroll: () => Promise<void>
}

/**
 * O `test` da casa (_doc-lib/playwright.md#docs/test-fixtures).
 *
 * `pageerror`, `console.error` da origem do app e resposta 5xx da API reprovam
 * o teste: um erro de hidratação não derruba a página, e a falha do servidor
 * numa consulta secundária some atrás de um bloco vazio - é por isso que
 * ninguém os vê sem esta rede.
 */
export const test = base.extend<Fixtures>({
  clientAddress: async ({}, provide) => {
    await provide(ClientAddress.random())
  },

  context: async ({ context, clientAddress }, provide) => {
    await ClientAddress.route(context, clientAddress)
    await provide(context)
  },

  watch: async ({ baseURL }, provide) => {
    const seen: string[] = []

    await provide((page) => {
      page.on('pageerror', (error) => seen.push(`pageerror: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() !== 'error') return

        const { url } = message.location()

        // Só a origem do app: recurso de terceiro que a rede do runner não
        // alcança loga um erro que não é nosso, e a resposta de erro da API
        // (o 401 de quem não entrou, o 422 do código errado) loga o
        // "Failed to load resource" com o endereço dela.
        if (url && baseURL && !url.startsWith(baseURL)) return
        // O próprio documento respondendo 404: é o que o spec da página que não
        // existe pede, e ele confere o status pela resposta do `goto`.
        if (url === page.url() && message.text().includes('status of 404'))
          return

        seen.push(`console: ${message.text()}`)
      })
      page.on('response', (response) => {
        if (!E2eEnv.apiUrl || !response.url().startsWith(E2eEnv.apiUrl)) return
        if (response.status() < 500) return

        seen.push(
          `api ${response.status()}: ${response.request().method()} ${response.url()}`,
        )
      })
    })

    expect(seen).toEqual([])
  },

  page: async ({ page, watch }, provide) => {
    watch(page)
    await provide(page)
  },

  expectNoBlockingViolations: async ({ page }, provide) => {
    await provide(async () => {
      // Animação finita ainda rodando mistura o texto com o fundo e simula uma
      // falha de `color-contrast`: mede só depois que elas terminam.
      await new ResponsiveAudit(page).settle()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === 'serious' || violation.impact === 'critical',
      )

      expect(
        blocking.map(
          (violation) =>
            `${violation.impact} ${violation.id}: ${violation.nodes
              .map((node) => node.target.join(' '))
              .join(' | ')}`,
        ),
      ).toEqual([])
    })
  },

  // `__reactProps$…` é a marca que o React põe no nó que assumiu; a página não
  // tem outro sinal de hidratação, e o `networkidle` que a doc desaconselha não é um.
  expectHydrated: async ({}, provide) => {
    await provide(async (locator) => {
      await expect
        .poll(() =>
          locator.evaluate((element) =>
            Object.keys(element).some((key) => key.startsWith('__reactProps')),
          ),
        )
        .toBe(true)
    })
  },

  expectNoHorizontalScroll: async ({ page }, provide) => {
    await provide(async () => {
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        )
        .toBe(true)
    })
  },
})

export { expect }
