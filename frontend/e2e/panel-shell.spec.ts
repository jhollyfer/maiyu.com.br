import en from '../messages/en.json' with { type: 'json' }
import ptBR from '../messages/pt-BR.json' with { type: 'json' }
import { SIGNED_OUT } from './support/session'
import { expect, test } from './support/test'

/**
 * A casca do painel e a tela de entrada (DECISIONS.md #491, `frontend.md` §8, §10.2): o tema que
 * persiste no cookie, o idioma que mantém a rota, a sidebar que vira gaveta no celular, o link de
 * pular e o axe nas duas telas, em claro e escuro. A sessão é a do dono (`auth.setup.ts`).
 */
const SCHEMES = ['light', 'dark'] as const

test.describe('painel', () => {
  test('o tema escolhido persiste no cookie e vale depois de recarregar', async ({
    page,
    expectHydrated,
  }) => {
    await page.goto('/pt-br/profile')
    await expectHydrated(page.getByRole('heading', { level: 1 }))

    await page
      .getByRole('button', { name: ptBR.kit_panel_toggle_theme })
      .click()
    await page.getByRole('menuitemradio', { name: ptBR.kit_theme_dark }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()

    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('trocar o idioma mantém a tela', async ({ page, expectHydrated }) => {
    await page.goto('/pt-br/profile')
    await expectHydrated(page.getByRole('heading', { level: 1 }))

    await page.getByLabel(ptBR.kit_locale_switcher_label).selectOption('en')

    await expect(page).toHaveURL(/\/en\/profile$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      en.kit_profile_title,
    )
  })

  test.describe('no desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('a sidebar fica à vista', async ({ page, expectHydrated }) => {
      await page.goto('/pt-br/profile')
      await expectHydrated(page.getByRole('heading', { level: 1 }))

      await expect(
        page.getByRole('navigation', { name: ptBR.kit_panel_navigation }),
      ).toBeVisible()
    })
  })

  test.describe('no celular', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('a sidebar vira gaveta, aberta pelo botão do cabeçalho', async ({
      page,
      expectHydrated,
    }) => {
      await page.goto('/pt-br/profile')
      await expectHydrated(page.getByRole('heading', { level: 1 }))
      await expect(
        page.getByRole('navigation', { name: ptBR.kit_panel_navigation }),
      ).toBeHidden()

      await page.getByRole('button', { name: ptBR.kit_panel_open_menu }).click()

      await expect(
        page
          .getByRole('dialog')
          .getByRole('link', { name: ptBR.kit_panel_my_profile }),
      ).toBeVisible()
    })
  })

  test('o link de pular é o primeiro foco e leva ao conteúdo', async ({
    page,
    expectHydrated,
  }) => {
    await page.goto('/pt-br/profile')
    await expectHydrated(page.getByRole('heading', { level: 1 }))

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', {
      name: ptBR.kit_panel_skip_to_content,
    })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('main')).toBeFocused()
  })

  for (const scheme of SCHEMES) {
    test(`o perfil em ${scheme}: o axe não acha violação que bloqueie`, async ({
      page,
      expectHydrated,
      expectNoBlockingViolations,
    }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/pt-br/profile')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectHydrated(page.getByRole('heading', { level: 1 }))

      await expectNoBlockingViolations()
    })
  }
})

test.describe('entrada', () => {
  test.use({ storageState: SIGNED_OUT })

  for (const scheme of SCHEMES) {
    test(`a entrada em ${scheme}: o axe não acha violação que bloqueie e nada passa da janela`, async ({
      page,
      expectHydrated,
      expectNoBlockingViolations,
      expectNoHorizontalScroll,
    }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/pt-br/sign-in')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectHydrated(page.getByRole('heading', { level: 1 }))

      await expectNoBlockingViolations()
      await expectNoHorizontalScroll()
    })
  }

  test('a entrada não entra no índice dos buscadores', async ({ page }) => {
    await page.goto('/pt-br/sign-in')

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
  })
})
