/**
 * O ambiente do E2E, lido num lugar só. Sem default: endereço e credencial são de
 * quem roda (`.env.example`), e a falta de uma para a execução dizendo qual é, em
 * vez de tentar entrar com um valor inventado.
 *
 * Projeto sem backend (só frontend) não define `E2E_API_URL`: `withBackend` é falso, o
 * `playwright.config.ts` não sobe a API nem roda o `setup`, e o dono só é exigido
 * quando um spec ou o `auth.setup.ts` o lê (`ownerEmail`, `ownerPassword`).
 */
export class E2eEnv {
  /** O site (frontend) sob teste. */
  static readonly baseUrl = E2eEnv.read('E2E_BASE_URL')
  /** A API, que o `setup` e o `teardown` chamam para entrar como dono e limpar dados. Ausente: projeto sem backend. */
  static readonly apiUrl: string | undefined =
    process.env.E2E_API_URL || undefined
  /** Há API para subir e sessão de dono para gravar. */
  static readonly withBackend = E2eEnv.apiUrl !== undefined

  /** `items` só com backend; sem ele, nada (servidor da API, projetos `setup` e `cleanup`). */
  static onlyWithBackend<T>(items: ReadonlyArray<T>): Array<T> {
    if (!E2eEnv.withBackend) return []

    return [...items]
  }

  static get ownerEmail(): string {
    return E2eEnv.read('E2E_OWNER_EMAIL')
  }

  static get ownerPassword(): string {
    return E2eEnv.read('E2E_OWNER_PASSWORD')
  }

  /** A sessão do dono, gravada pelo `setup` (`playwright/.auth` está no `.gitignore`). */
  static readonly storageState = 'playwright/.auth/owner.json'

  /**
   * Marca no e-mail das matrículas que o E2E cria, para o `teardown` achá-las
   * pela busca do painel sem tocar em dado que não é dele.
   */
  static readonly fixtureMarker = 'e2e-fixture'

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
