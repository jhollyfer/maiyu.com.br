import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { z } from 'zod'

import { E2eEnv } from './env'
import {
  PROJECT_E2E_ACCOUNT_NAMES,
  PROJECT_E2E_OWNER_ACCOUNT,
  PROJECT_E2E_ROLE_NAMES,
} from './project-accounts'

const Account = z.object({ login: z.string(), password: z.string() })

/**
 * A linha que o comando imprime (DECISIONS.md #778): o grupo `project` e uma chave por nome do mapa
 * de papéis (`PROJECT_E2E_ROLE_NAMES`), cada uma anulável: `null` é o papel que o projeto não tem
 * nesta execução, e o `setup` pula a conta. Os nomes do mapa não são fixos: o projeto de tenant tem
 * `staff` e `platformOwner`, o de só administrador e operador tem os dois.
 */
const Printed = z
  .object({
    /** As contas de domínio do projeto (`backend/tests/e2e-project-accounts.ts`), por nome. */
    project: z.record(z.string(), Account),
  })
  .catchall(Account.nullable())

const Roles = z.record(z.string(), Account.nullable())

export type E2eAccount = z.infer<typeof Account>
/** As contas desta execução: os papéis do mapa e as de domínio do projeto, cada um por nome. */
export type E2eAccounts = {
  readonly roles: Readonly<Record<string, E2eAccount | null>>
  readonly project: Readonly<Record<string, E2eAccount>>
}

/** Os papéis do mapa do projeto, na ordem em que o `setup` entra com cada um. */
const BASE_ROLES = PROJECT_E2E_ROLE_NAMES

/**
 * O que um nome de conta do projeto não pode ser (DECISIONS.md #611): cada nome é um arquivo em
 * `playwright/.auth/` (_doc-lib/playwright.md#docs/auth, "Multiple signed in roles"), então repetir
 * um papel do mapa faria o `setup` sobrescrever a sessão dele; `project` é a chave do grupo e
 * `accounts` o arquivo das contas.
 */
const RESERVED_NAMES = [...BASE_ROLES, 'project', 'accounts'] as const

/** Os nomes de `TNames` que repetem um reservado: tem de ser `never`, senão o tipo de baixo não compila. */
export type KitNameCollision<TNames extends string> = Extract<
  TNames,
  (typeof RESERVED_NAMES)[number]
>

/** A checagem em tipo: um nome do projeto igual a um papel do mapa faz este `{}` deixar de compilar. */
export const PROJECT_NAMES_FREE_OF_KIT_ROLES: Record<
  KitNameCollision<(typeof PROJECT_E2E_ACCOUNT_NAMES)[number]>,
  never
> = {}

/** Os papéis do mapa e os nomes das contas de domínio do projeto. */
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

    const printed = Printed.parse(
      JSON.parse(line.trimStart().slice(MARKER.length)),
    )
    const accounts: E2eAccounts = {
      project: printed.project,
      roles: Roles.parse(
        Object.fromEntries(
          Object.entries(printed).filter(([key]) => key !== 'project'),
        ),
      ),
    }
    const declared: ReadonlyArray<string> = PROJECT_E2E_ACCOUNT_NAMES
    const reserved: ReadonlyArray<string> = RESERVED_NAMES
    const repeated = [...declared, ...Object.keys(accounts.project)].filter(
      (name) => reserved.includes(name),
    )
    if (repeated.length > 0 || new Set(declared).size !== declared.length)
      throw new Error(
        `conta do projeto repete um papel do kit ou outro nome (${[...repeated, ...declared].join(', ')}): cada nome é um arquivo de sessão`,
      )
    const owner = E2eAccountsStore.owner()
    if (!E2eAccountsStore.entries(accounts).some((each) => each.role === owner))
      throw new Error(
        `a conta ${owner}, de quem é a sessão padrão (${E2eEnv.storageState}), não foi criada: sem o esqueleto multi-tenant o projeto nomeia a sua em PROJECT_E2E_OWNER_ACCOUNT, e o nome é de uma conta que o comando imprime`,
      )
    const printedNames = Object.keys(accounts.project).sort().join(',')
    const listed = [...declared].sort().join(',')
    if (printedNames !== listed)
      throw new Error(
        `project-accounts.ts (${listed}) difere das contas do projeto que o comando criou (${printedNames})`,
      )
    const printedRoles = Object.keys(accounts.roles).sort().join(',')
    const listedRoles = [...BASE_ROLES].sort().join(',')
    if (printedRoles !== listedRoles)
      throw new Error(
        `PROJECT_E2E_ROLE_NAMES (${listedRoles}) difere dos papéis que o comando imprimiu (${printedRoles}): o mapa do backend (E2eSkeletonAccounts.roleNames) e o do frontend são o mesmo`,
      )

    return accounts
  }

  /**
   * A conta cuja sessão é a padrão dos projetos do `playwright.config.ts` (`E2eEnv.storageState`): o
   * dono da plataforma, ou, no projeto sem o esqueleto, a que ele nomeia em `PROJECT_E2E_OWNER_ACCOUNT`.
   */
  static owner(): string {
    return PROJECT_E2E_OWNER_ACCOUNT ?? 'platformOwner'
  }

  /** A conta de um papel, ou o erro que diz qual falta: o papel que o projeto não tem vem `null`. */
  static accountOf(accounts: E2eAccounts, role: E2eRole): E2eAccount {
    const found = E2eAccountsStore.entries(accounts).find(
      (each) => each.role === role,
    )
    if (!found)
      throw new Error(
        `o projeto não tem a conta ${role} (o e2e:accounts a imprimiu null)`,
      )

    return found.account
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
      const account = accounts.roles[role]
      if (!account) return []

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
    const stored = z
      .object({ roles: Roles, project: z.record(z.string(), Account) })
      .parse(JSON.parse(readFileSync(E2eAccountsStore.file, 'utf8')))

    return stored
  }

  /**
   * A sessão gravada de um papel ou de uma conta de domínio do projeto:
   * `test.use({ storageState: E2eAccountsStore.stateOf('staff') })`.
   * A de `E2eAccountsStore.owner()` é a de `E2eEnv.storageState`, a que os projetos do
   * `playwright.config.ts` já usam.
   */
  static stateOf(role: E2eRole): string {
    if (role === E2eAccountsStore.owner()) return E2eEnv.storageState

    return `playwright/.auth/${role}.json`
  }
}
