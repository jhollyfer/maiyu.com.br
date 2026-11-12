/**
 * Um erro de servidor que o spec declara de propósito: o status e o padrão do endereço da
 * resposta. `url` sem a flag `g` (ela guarda `lastIndex` e faz o segundo `test` errar).
 */
export type ExpectedApiError = { status: number; url: RegExp }

/**
 * A lista de erros que o `watch` (`test.ts`) deixa passar num teste. Libera só o status declarado
 * naquele endereço e o `console.error` que o navegador loga para essa mesma resposta; o resto
 * continua reprovando. Declarar e não receber também reprova (`unmet`): sem isso o spec do erro de
 * servidor passaria mesmo se a API deixasse de falhar, sem provar o caso que ele nomeia.
 */
export class ExpectedApiErrors {
  private readonly answered = new Set<ExpectedApiError>()

  constructor(private readonly declared: readonly ExpectedApiError[]) {}

  /** A resposta é a declarada? Se for, conta como recebida. */
  acceptsResponse(status: number, url: string): boolean {
    const matched = this.declared.filter((error) =>
      this.matches(error, status, url),
    )
    for (const error of matched) this.answered.add(error)

    return matched.length > 0
  }

  /**
   * O `console.error` é o que o navegador loga para a resposta declarada? O texto traz
   * `status of <código>` e a localização é o endereço da requisição. Também vale o `HTTPError` do
   * kit que o router loga no erro de um `loader`: o `stack` dele abre com `HTTPError <código>:`
   * (`http.ts`), e a localização desse log é o chunk do app, não a API, então só o status casa.
   * Não conta como recebida: quem prova que a resposta veio é o evento `response`.
   */
  acceptsConsole(text: string, url: string): boolean {
    return this.declared.some(
      (error) =>
        (text.includes(`status of ${error.status}`) && error.url.test(url)) ||
        text.includes(`HTTPError ${error.status}:`),
    )
  }

  /** Os declarados que nenhuma resposta cumpriu. */
  unmet(): string[] {
    return this.declared
      .filter((error) => !this.answered.has(error))
      .map(
        (error) => `expected api error not seen: ${error.status} ${error.url}`,
      )
  }

  private matches(error: ExpectedApiError, status: number, url: string) {
    return error.status === status && error.url.test(url)
  }
}
