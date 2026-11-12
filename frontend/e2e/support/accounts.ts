import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { z } from 'zod'

import { E2eEnv } from './env'

const Account = z.object({ login: z.string(), password: z.string() })

const Accounts = z.object({
  platformOwner: Account,
  platformAdministrator: Account,
  staff: Account,
  /** `null` no projeto de um papel só: não existe conta que a regra recuse. */
  nonStaff: Account.nullable(),
  customer: Account,
})

export type E2eAccount = z.infer<typeof Account>
export type E2eAccounts = z.infer<typeof Accounts>
export type E2eRole = keyof E2eAccounts

/** O prefixo da linha que o comando imprime: a API também escreve log no mesmo fluxo. */
const MARKER = 'E2E_ACCOUNTS='

/**
 * As contas por papel do E2E (DECISIONS.md #442). Quem as cria é o comando do backend
 * (`node ace e2e:accounts`), que não roda em produção e sorteia a senha a cada execução: nenhuma
 * chave de ambiente guarda credencial, então não há conta de senha conhecida para usar contra
 * outro ambiente. O `auth.setup.ts` chama `create` uma vez e grava as contas e a sessão de cada
 * uma em `playwright/.auth/` (no `.gitignore`); os specs de papel leem de lá.
 */
export class E2eAccountsStore {
  private static readonly file = 'playwright/.auth/accounts.json'

  /** Os papéis que o comando cria, na ordem em que o `setup` entra com cada um. */
  static readonly roles = [
    'platformOwner',
    'platformAdministrator',
    'staff',
    'nonStaff',
    'customer',
  ] as const satisfies ReadonlyArray<E2eRole>

  /** Cria as contas no backend desta execução e as guarda para os specs. */
  static create(): E2eAccounts {
    const output = execFileSync('node', ['ace.js', 'e2e:accounts'], {
      // O Playwright roda de `frontend/` (`playwright test --config e2e/playwright.config.ts`).
      cwd: resolve(process.cwd(), '../backend'),
      // Sem sobrescrever NODE_ENV: o processo filho herda o do Playwright e, faltando, o `.env` do
      // backend decide. Forçar `development` aqui anulava o `.env` com `production` (o process.env
      // vence o `.env` no Adonis) e o comando criava contas e imprimia senhas onde não devia.
      encoding: 'utf8',
    })
    const line = output
      .split('\n')
      .find((each) => each.trimStart().startsWith(MARKER))
    if (!line)
      throw new Error(`e2e:accounts não imprimiu as contas:\n${output}`)

    const accounts = Accounts.parse(
      JSON.parse(line.trimStart().slice(MARKER.length)),
    )
    mkdirSync(dirname(E2eAccountsStore.file), { recursive: true })
    writeFileSync(E2eAccountsStore.file, JSON.stringify(accounts))

    return accounts
  }

  /** As contas que existem, com o papel de cada uma: o `nonStaff` de projeto de um papel só fica de fora. */
  static entries(
    accounts: E2eAccounts,
  ): ReadonlyArray<{ role: E2eRole; account: E2eAccount }> {
    return E2eAccountsStore.roles.flatMap((role) => {
      const account = accounts[role]
      if (account === null) return []

      return [{ role, account }]
    })
  }

  /** As contas que o `setup` desta execução gravou. */
  static read(): E2eAccounts {
    return Accounts.parse(
      JSON.parse(readFileSync(E2eAccountsStore.file, 'utf8')),
    )
  }

  /**
   * A sessão gravada de um papel: `test.use({ storageState: E2eAccountsStore.stateOf('staff') })`.
   * A do dono da plataforma é a de `E2eEnv.storageState`, a que os projetos do
   * `playwright.config.ts` já usam.
   */
  static stateOf(role: E2eRole): string {
    if (role === 'platformOwner') return E2eEnv.storageState

    return `playwright/.auth/${role}.json`
  }
}
