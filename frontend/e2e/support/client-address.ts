import { randomInt } from 'node:crypto'

import type { BrowserContext } from '@playwright/test'

import { E2eEnv } from './env'

/**
 * O endereço de cliente de cada teste, no `X-Forwarded-For` das requisições à
 * API.
 *
 * Os limiters do cadastro (5 por hora), do código da turma (10 por hora) e da
 * entrada (5 por minuto) contam por IP, e o E2E inteiro sai de `127.0.0.1`: a
 * segunda execução na mesma hora, ou o sexto aluno da mesma execução, esbarrava
 * no 429. Desligar o limiter seria testar outro servidor; aqui cada teste é um
 * cliente diferente atrás do proxy, que é o que o Traefik faz em produção.
 *
 * Funciona porque a API acredita no `X-Forwarded-For` que vem do loopback
 * (`TRUSTED_PROXIES=loopback`, o padrão de desenvolvimento e o valor do CI,
 * `backend/app/core/trusted-proxies.ts`). Em produção o loopback é o próprio
 * contêiner: o cliente de fora não escolhe o balde.
 */
export class ClientAddress {
  static readonly header = 'x-forwarded-for'

  /** Um endereço da faixa de teste de rede (RFC 2544, 198.18.0.0/15). */
  static random(): string {
    return `198.${randomInt(18, 20)}.${randomInt(0, 256)}.${randomInt(1, 255)}`
  }

  /**
   * O cabeçalho entra pela interceptação da rede, e não pelo
   * `extraHTTPHeaders` do contexto: no Chromium este vira cabeçalho da página,
   * a requisição ganha um preflight de CORS, e a API (que lista só os
   * cabeçalhos dela em `config/cors.ts`) o recusa.
   */
  static async route(context: BrowserContext, address: string): Promise<void> {
    // Sem backend (`E2E_API_URL` ausente) não há API para receber o cabeçalho.
    if (!E2eEnv.apiUrl) return

    await context.route(`${E2eEnv.apiUrl}/**`, (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          [ClientAddress.header]: address,
        },
      }),
    )
  }
}
