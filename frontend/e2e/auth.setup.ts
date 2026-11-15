import {
  expect,
  request as playwrightRequest,
  test as setup,
} from '@playwright/test'

import { E2eAccountsStore } from './support/accounts'
import { ClientAddress } from './support/client-address'
import { E2eEnv } from './support/env'
import { SignInRetry } from './support/sign-in-retry'

/**
 * Cria uma conta por papel no backend (`node ace e2e:accounts`, só em development e test, senha
 * sorteada a cada execução, sem chave de ambiente nova; DECISIONS.md #442) e grava a sessão de
 * cada uma. A do dono da plataforma vai em `E2eEnv.storageState`, a de quem os projetos do
 * `playwright.config.ts` já entram; as outras em `playwright/.auth/<papel>.json`, para o spec de
 * papel pedir com `test.use({ storageState: E2eAccountsStore.stateOf('staff') })`. As contas de
 * domínio do projeto (`e2e/support/project-accounts.ts`) entram pelo mesmo laço, com o nome no lugar do papel.
 *
 * Cada conta entra de um endereço próprio no `X-Forwarded-For` (`client-address.ts`), como cada teste, e
 * o 429 do limiter é respeitado (`SignInRetry`, DECISIONS.md #742): o limiter de entrada por IP
 * (5 por minuto) segue valendo, só que as sete contas não saem mais do mesmo IP.
 *
 * Entra pela API (`POST /authentication/sign-in`), não pela tela: o setup prova o contexto, e a tela
 * de entrada tem o spec dela.
 */
setup('cria as contas por papel e grava a sessão de cada uma', async () => {
  // O pior caso é esperar o bloqueio do limiter (10 minutos) uma vez.
  setup.setTimeout(15 * 60_000)
  const accounts = E2eAccountsStore.create()

  for (const { role, account } of E2eAccountsStore.entries(accounts)) {
    // Um contexto por conta: o cookie de uma não pode ir no pedido da outra.
    const context = await playwrightRequest.newContext({
      extraHTTPHeaders: { [ClientAddress.header]: ClientAddress.random() },
    })
    const answer = await SignInRetry.run(role, async () => {
      const response = await context.post(
        `${E2eEnv.apiUrl}/authentication/sign-in`,
        {
          data: { login: account.login, password: account.password },
          headers: { origin: E2eEnv.baseUrl },
        },
      )
      return {
        status: response.status(),
        retryAfter: response.headers()['retry-after'],
      }
    })
    expect(answer.status, `entrada de ${role}`).toBe(204)

    const path = E2eAccountsStore.stateOf(role)
    await context.storageState({ path })
    await context.dispose()
  }
})
