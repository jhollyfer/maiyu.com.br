import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

import ptBR from '../../messages/pt-BR.json' with { type: 'json' }
import type { E2eAccount } from './accounts'

/** Uma sessão que ninguém abriu: o `storageState` vazio, para o spec que testa a entrada. */
export const SIGNED_OUT = { cookies: [], origins: [] }

/**
 * A tela de entrada e o painel pelo que o usuário vê: o formulário do kit (`SignInForm`), o menu de
 * conta e a confirmação de saída. A língua é a das URLs que os specs abrem (`/pt-br`, o idioma base), e
 * o nome de cada controle vem da mensagem `kit_*` compilada (`frontend.md` §11.2), nunca do texto redigitado.
 *
 * Cada entrada pelo formulário conta no limite de tentativas da conta (20 por hora): o spec entra
 * pelo formulário só onde o formulário é o assunto, e usa o `storageState` do `auth.setup.ts` no resto.
 */
export class SessionPage {
  static readonly signInPath = '/pt-br/sign-in'

  /** Abre a entrada (com um destino em `?redirect=`, se houver) e espera o formulário assumir. */
  static async openSignIn(page: Page, redirect?: string): Promise<void> {
    const url = new URL(SessionPage.signInPath, 'http://localhost')
    if (redirect) url.searchParams.set('redirect', redirect)
    await page.goto(`${url.pathname}${url.search}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Antes de hidratar o clique cairia no HTML cru e enviaria o `<form>` nativo.
    await expect
      .poll(() =>
        page
          .getByRole('button', { name: ptBR.kit_sign_in_submit, exact: true })
          .evaluate((element) =>
            Object.keys(element).some((key) => key.startsWith('__reactProps')),
          ),
      )
      .toBe(true)
  }

  /** Preenche o formulário e envia. */
  static async submit(page: Page, account: E2eAccount): Promise<void> {
    await page.getByLabel(ptBR.kit_sign_in_login).fill(account.login)
    await page
      .getByLabel(ptBR.kit_sign_in_password, { exact: true })
      .fill(account.password)
    await page
      .getByRole('button', { name: ptBR.kit_sign_in_submit, exact: true })
      .click()
  }

  /** Abre o menu de conta do cabeçalho do painel. */
  static async openAccountMenu(page: Page): Promise<void> {
    await page
      .getByRole('button', { name: new RegExp(ptBR.kit_panel_account_label) })
      .click()
  }

  /** Sai pelo menu de conta, confirmando o alerta. */
  static async signOut(page: Page): Promise<void> {
    await SessionPage.openAccountMenu(page)
    await page.getByRole('menuitem', { name: ptBR.kit_sign_out }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: ptBR.kit_sign_out })
      .click()
  }
}
