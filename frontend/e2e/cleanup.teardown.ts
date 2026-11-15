import { expect, test as teardown } from '@playwright/test'

import { E2eAccountsStore } from './support/accounts'

/**
 * Depois de todos os projetos (o `cleanup` é o `teardown` do `setup`, `playwright.config.ts`), apaga
 * o que a rodada criou no backend: as contas por papel e as linhas marcadas com `E2eEnv.marker`
 * (`node ace e2e:cleanup`, só em development e test; DECISIONS.md #713). Sem backend, o projeto não existe.
 */
teardown('apaga o que a rodada criou', () => {
  expect(() => E2eAccountsStore.cleanup()).not.toThrow()
})
