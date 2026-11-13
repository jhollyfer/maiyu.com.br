import ptBR from '../messages/pt-BR.json' with { type: 'json' }
import { E2eAccountsStore } from './support/accounts'
import { E2eEnv } from './support/env'
import { SessionPage, SIGNED_OUT } from './support/session'
import { expect, test } from './support/test'

/**
 * A sessão pelo navegador (DECISIONS.md #491, `frontend.md` §1.3 e §3.2): a entrada, o `?redirect=`
 * que só aceita caminho interno, a guarda inversa, a saída e a sessão que vence no meio do uso.
 * Roda nos três tamanhos de tela, contra a API de verdade.
 *
 * Cada entrada pelo formulário conta no limite da conta, então só os testes em que o formulário é o
 * assunto entram por ele, todos com o administrador da plataforma (a conta do `auth.setup.ts` que
 * entra no painel em qualquer projeto), e a saída revoga a sessão: ela usa a sessão que o próprio
 * teste abriu, nunca o `storageState` do dono que os outros specs compartilham. O bloco `painel` só
 * existe em projeto com a API da sessão (`/authentication/*`), então o spec não pergunta se há backend.
 */
test.describe('sem sessão', () => {
  test.use({ storageState: SIGNED_OUT })

  test('abrir uma tela do painel leva à entrada, com a tela pedida em ?redirect=', async ({
    page,
  }) => {
    await page.goto('/pt-br/profile')

    await expect(page).toHaveURL(/\/pt-br\/sign-in\?redirect=/)
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(
      '/pt-br/profile',
    )
  })

  test('credencial errada mostra a mensagem, sem dizer qual campo falhou, e fica na entrada', async ({
    page,
  }) => {
    const { staff } = E2eAccountsStore.read()
    await SessionPage.openSignIn(page)

    await SessionPage.submit(page, { ...staff, password: 'senha errada' })

    await expect(page.getByTestId('sign-in-error')).toContainText(
      ptBR.kit_sign_in_invalid_credentials,
    )
    await expect(page).toHaveURL(/\/pt-br\/sign-in/)
  })

  test('entra pelo formulário e chega ao destino de ?redirect=', async ({
    page,
  }) => {
    const { platformAdministrator } = E2eAccountsStore.read()
    await SessionPage.openSignIn(page, '/pt-br/profile')

    await SessionPage.submit(page, platformAdministrator)

    await expect(page).toHaveURL(/\/pt-br\/profile$/)
    await expect(
      page.getByRole('heading', { level: 1, name: ptBR.kit_profile_title }),
    ).toBeVisible()
  })

  test('um ?redirect= para outro site é recusado: entra e fica no próprio site', async ({
    page,
  }) => {
    const { platformAdministrator } = E2eAccountsStore.read()
    await SessionPage.openSignIn(page, '//evil.example/x')

    await SessionPage.submit(page, platformAdministrator)

    await expect(page.getByRole('main')).toBeVisible()
    expect(new URL(page.url()).origin).toBe(new URL(E2eEnv.baseUrl).origin)
    expect(page.url()).not.toContain('evil.example')
  })

  test('sair pede confirmação, encerra a sessão e fecha o painel para a próxima visita', async ({
    page,
  }) => {
    const { platformAdministrator } = E2eAccountsStore.read()
    await SessionPage.openSignIn(page, '/pt-br/profile')
    await SessionPage.submit(page, platformAdministrator)
    await expect(page).toHaveURL(/\/pt-br\/profile$/)

    await SessionPage.signOut(page)

    await expect(page).toHaveURL(/\/pt-br\/sign-in$/)
    await page.goto('/pt-br/profile')
    await expect(page).toHaveURL(/\/pt-br\/sign-in\?redirect=/)
  })

  test('a sessão que vence no meio do uso leva à entrada, com a tela de agora em ?redirect=', async ({
    page,
    context,
  }) => {
    const { platformAdministrator } = E2eAccountsStore.read()
    await SessionPage.openSignIn(page, '/pt-br/profile')
    await SessionPage.submit(page, platformAdministrator)
    await expect(page).toHaveURL(/\/pt-br\/profile$/)

    // Sem cookie nem o refresh renova: o próximo pedido à API é um 401 sem volta.
    await context.clearCookies()
    await SessionPage.openAccountMenu(page)

    await expect(page).toHaveURL(/\/pt-br\/sign-in\?redirect=/)
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(
      '/pt-br/profile',
    )
  })
})

test('quem já tem sessão não vê a entrada: a guarda inversa o leva ao painel', async ({
  page,
}) => {
  await page.goto('/pt-br/sign-in')

  await expect(page).not.toHaveURL(/\/sign-in/)
  await expect(page.getByRole('main')).toBeVisible()
})
