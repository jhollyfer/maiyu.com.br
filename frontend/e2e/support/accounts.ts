import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { z } from 'zod'

import { E2eEnv } from './env'
import { PROJECT_E2E_ACCOUNT_NAMES } from './project-accounts'

const Account = z.object({ login: z.string(), password: z.string() })

const Accounts = z.object({
  platformOwner: Account,
  platformAdministrator: Account,
  staff: Account,
  /** `null` no projeto de um papel só: não existe conta que a regra recuse. */
  nonStaff: Account.nullable(),
  customer: Account,
  /** As contas de domínio do projeto (`backend/tests/e2e-project-accounts.ts`), por nome. */
  project: z.record(z.string(), Account),
})

export type E2eAccount = z.infer<typeof Account>
export type E2eAccounts = z.infer<typeof Accounts>

/** Os papéis que o comando cria, na ordem em que o `setup` entra com cada um. */
const BASE_ROLES = [
  'platformOwner',
  'platformAdministrator',
  'staff',
  'nonStaff',
  'customer',
] as const satisfies ReadonlyArray<keyof E2eAccounts>

/**
 * O que um nome de conta do projeto não pode ser (DECISIONS.md #611): cada nome é um arquivo em
 * `playwright/.auth/` (_doc-lib/playwright.md#docs/auth, "Multiple signed in roles"), então repetir
 * um papel do kit faria o `setup` sobrescrever a sessão dele (`platformOwner` é a de todos os
 * projetos do `playwright.config.ts`); `project` é a chave do grupo e `accounts` o arquivo das contas.
 */
const RESERVED_NAMES = [...BASE_ROLES, 'project', 'accounts'] as const

/** Os nomes de `TNames` que repetem um reservado: tem de ser `never`, senão o tipo de baixo não compila. */
export type KitNameCollision<TNames extends string> = Extract<
  TNames,
  (typeof RESERVED_NAMES)[number]
>

/** A checagem em tipo: um nome do projeto igual a um papel do kit faz este `{}` deixar de compilar. */
export const PROJECT_NAMES_FREE_OF_KIT_ROLES: Record<
  KitNameCollision<(typeof PROJECT_E2E_ACCOUNT_NAMES)[number]>,
  never
> = {}

/** Os papéis do esqueleto e os nomes das contas de domínio do projeto. */
export type E2eRole = [
  ...typeof BASE_ROLES,
  ...typeof PROJECT_E2E_ACCOUNT_NAMES,
][number]

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

  static readonly roles = BASE_ROLES

  /**
   * Lê a linha `E2E_ACCOUNTS=` da saída do comando e confere os nomes do projeto: nenhum repete um
   * papel do kit nem outro nome, e são exatamente os de `project-accounts.ts`. A lista à mão do
   * frontend e a do backend, se divergem, fariam `stateOf` mentir sobre uma conta.
   */
  static parse(output: string): E2eAccounts {
    const line = output
      .split('\n')
      .find((each) => each.trimStart().startsWith(MARKER))
    if (!line)
      throw new Error(`e2e:accounts não imprimiu as contas:\n${output}`)

    const accounts = Accounts.parse(
      JSON.parse(line.trimStart().slice(MARKER.length)),
    )
    const declared: ReadonlyArray<string> = PROJECT_E2E_ACCOUNT_NAMES
    const reserved: ReadonlyArray<string> = RESERVED_NAMES
    const repeated = [...declared, ...Object.keys(accounts.project)].filter(
      (name) => reserved.includes(name),
    )
    if (repeated.length > 0 || new Set(declared).size !== declared.length)
      throw new Error(
        `conta do projeto repete um papel do kit ou outro nome (${[...repeated, ...declared].join(', ')}): cada nome é um arquivo de sessão`,
      )
    const printed = Object.keys(accounts.project).sort().join(',')
    const listed = [...declared].sort().join(',')
    if (printed !== listed)
      throw new Error(
        `project-accounts.ts (${listed}) difere das contas do projeto que o comando criou (${printed})`,
      )

    return accounts
  }

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
    const accounts = E2eAccountsStore.parse(output)
    mkdirSync(dirname(E2eAccountsStore.file), { recursive: true })
    writeFileSync(E2eAccountsStore.file, JSON.stringify(accounts))

    return accounts
  }

  /**
   * Apaga o que a rodada criou (`node ace e2e:cleanup`, DECISIONS.md #713): as linhas marcadas com
   * `E2eEnv.marker` nas tabelas que o projeto declarou em `backend/tests/e2e-project-cleanup.ts` e as
   * contas que `create` fez. Mesma trava do `create`: só em development e test, e o processo filho
   * herda o `NODE_ENV` do Playwright. Chamado pelo projeto `cleanup` (`cleanup.teardown.ts`).
   */
  static cleanup(): void {
    execFileSync('node', ['ace.js', 'e2e:cleanup'], {
      cwd: resolve(process.cwd(), '../backend'),
      encoding: 'utf8',
    })
  }

  /**
   * As contas que existem, com o papel ou o nome de cada uma: o `nonStaff` de projeto de um papel
   * só fica de fora, e as de domínio do projeto entram depois das do esqueleto.
   */
  static entries(
    accounts: E2eAccounts,
  ): ReadonlyArray<{ role: E2eRole; account: E2eAccount }> {
    const base = E2eAccountsStore.roles.flatMap((role) => {
      const account = accounts[role]
      if (account === null) return []

      return [{ role, account }]
    })
    const project = PROJECT_E2E_ACCOUNT_NAMES.flatMap((role) => {
      const account = accounts.project[role]
      if (account === undefined) return []

      return [{ role, account }]
    })

    return [...base, ...project]
  }

  /** As contas que o `setup` desta execução gravou. */
  static read(): E2eAccounts {
    return Accounts.parse(
      JSON.parse(readFileSync(E2eAccountsStore.file, 'utf8')),
    )
  }

  /**
   * A sessão gravada de um papel ou de uma conta de domínio do projeto:
   * `test.use({ storageState: E2eAccountsStore.stateOf('staff') })`.
   * A do dono da plataforma é a de `E2eEnv.storageState`, a que os projetos do
   * `playwright.config.ts` já usam.
   */
  static stateOf(role: E2eRole): string {
    if (role === 'platformOwner') return E2eEnv.storageState

    return `playwright/.auth/${role}.json`
  }
}
