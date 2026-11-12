/**
 * O ambiente do E2E, lido num lugar só. Sem default: endereço e credencial são de
 * quem roda (`.env.example`), e a falta de uma para a execução dizendo qual é, em
 * vez de tentar entrar com um valor inventado.
 */
export class E2eEnv {
  /** O site (frontend) sob teste. */
  static readonly baseUrl = E2eEnv.read('E2E_BASE_URL')
  /** A API, que o `setup` e o `teardown` chamam para entrar como dono e limpar dados. */
  static readonly apiUrl = E2eEnv.read('E2E_API_URL')
  static readonly ownerEmail = E2eEnv.read('E2E_OWNER_EMAIL')
  static readonly ownerPassword = E2eEnv.read('E2E_OWNER_PASSWORD')

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
