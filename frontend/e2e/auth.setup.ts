import {
  expect,
  request as playwrightRequest,
  test as setup,
} from '@playwright/test'

import { E2eAccountsStore } from './support/accounts'
import { E2eEnv } from './support/env'

/**
 * Cria uma conta por papel no backend (`node ace e2e:accounts`, só em development e test, senha
 * sorteada a cada execução, sem chave de ambiente nova; DECISIONS.md #442) e grava a sessão de
 * cada uma. A do dono da plataforma vai em `E2eEnv.storageState`, a de quem os projetos do
 * `playwright.config.ts` já entram; as outras em `playwright/.auth/<papel>.json`, para o spec de
 * papel pedir com `test.use({ storageState: E2eAccountsStore.stateOf('staff') })`.
 *
 * Entra pela API (`POST /authentication/sign-in`), não pela tela: o setup prova o contexto, e a tela
 * de entrada tem o spec dela.
 */
setup('cria as contas por papel e grava a sessão de cada uma', async () => {
  const accounts = E2eAccountsStore.create()

  for (const { role, account } of E2eAccountsStore.entries(accounts)) {
    // Um contexto por conta: o cookie de uma não pode ir no pedido da outra.
    const context = await playwrightRequest.newContext()
    const response = await context.post(
      `${E2eEnv.apiUrl}/authentication/sign-in`,
      {
        data: { login: account.login, password: account.password },
        headers: { origin: E2eEnv.baseUrl },
      },
    )
    expect(response.status(), `entrada de ${role}`).toBe(204)

    const path = E2eAccountsStore.stateOf(role)
    await context.storageState({ path })
    await context.dispose()
  }
})
