import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

/**
 * O ambiente do E2E, lido num lugar só. Sem default: o endereço é de quem roda
 * (`.env.example`), e a falta de um para a execução dizendo qual é, em vez de tentar
 * com um valor inventado. Senha não é chave: as contas por papel nascem no
 * `auth.setup.ts` (`support/accounts.ts`, DECISIONS.md #443).
 *
 * Projeto sem backend (só frontend) não define `E2E_API_URL`: `withBackend` é falso, o
 * `playwright.config.ts` não sobe a API nem roda o `setup`.
 */
export class E2eEnv {
  /**
   * O `frontend/.env` entra antes da primeira leitura: o Playwright não o carrega sozinho, e sem
   * isso quem roda precisava exportar `E2E_BASE_URL` à mão (achado no maiyu.com.br). Valor que já
   * está no ambiente vence o do arquivo, como no `--env-file` do Node; arquivo ausente não é erro,
   * porque no container a variável vem do ambiente. `util.parseEnv`, sem dependência
   * (https://nodejs.org/api/util.html#utilparseenvcontent).
   */
  static {
    E2eEnv.loadDotEnv()
  }

  /** O site (frontend) sob teste. */
  static readonly baseUrl = E2eEnv.read('E2E_BASE_URL')
  /** A API, que o `setup` e o `teardown` chamam para entrar como dono e limpar dados. Ausente: projeto sem backend. */
  static readonly apiUrl: string | undefined =
    process.env.E2E_API_URL || undefined
  /** Há API para subir e sessão de dono para gravar. */
  static readonly withBackend = E2eEnv.apiUrl !== undefined

  private static loadDotEnv(): void {
    const file = new URL('../../.env', import.meta.url)
    if (!existsSync(file)) return
    for (const [name, value] of Object.entries(
      parseEnv(readFileSync(file, 'utf8')),
    ))
      process.env[name] ??= value
  }

  /** `items` só com backend; sem ele, nada (servidor da API, projetos `setup` e `cleanup`). */
  static onlyWithBackend<T>(items: ReadonlyArray<T>): Array<T> {
    if (!E2eEnv.withBackend) return []

    return [...items]
  }

  /** A sessão do dono, gravada pelo `setup` (`playwright/.auth` está no `.gitignore`). */
  static readonly storageState = 'playwright/.auth/owner.json'

  /**
   * Marca no e-mail das matrículas que o E2E cria, para o `teardown` achá-las
   * pela busca do painel sem tocar em dado que não é dele.
   */
  static readonly fixtureMarker = 'e2e-fixture'

  /**
   * O começo, com o hífen, do campo de texto (título, nome) de tudo que um spec cria no backend: o
   * `e2e:cleanup` apaga, depois da rodada, só a linha que o tem (DECISIONS.md #713). É o
   * `E2E_MARKER` de `backend/commands/e2e-cleanup.command.ts`: os dois lados têm o mesmo texto.
   */
  static readonly marker = 'E2E-'

  /**
   * Opcional: um binário do Chromium para quando o baixado pelo Playwright não
   * roda (o contêiner da nuvem). Sem ele, vale o do próprio Playwright.
   */
  static readonly chromiumPath: string | undefined =
    process.env.E2E_CHROMIUM_PATH

  private static read(name: string): string {
    const value = process.env[name]

    if (!value)
      throw new Error(
        `${name} ausente: defina no ambiente (frontend/.env.example)`,
      )

    return value
  }
}
