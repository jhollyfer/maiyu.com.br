import { createFileRoute } from '@tanstack/react-router'

/**
 * O sinal de vida do servidor de SSR, em `/health`.
 *
 * Existe para o `HEALTHCHECK` do `Dockerfile-production`, o mesmo contrato dos
 * irmãos. Apontar o healthcheck para `/` mediria a renderização da home
 * inteira, fontes e imagens incluídas; esta rota só prova que o processo do
 * Nitro aceita requisição e roteia, que é exatamente a pergunta do
 * orquestrador.
 *
 * Rota de servidor e não página: quem consome é o `curl` do container, que
 * precisa de status e corpo próprios e não tem navegador.
 *
 * `Cache-Control: no-store` porque um proxy que guardasse a resposta faria o
 * healthcheck continuar verde depois de o servidor morrer.
 */
export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: () =>
        new Response('ok', {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store',
          },
        }),
    },
  },
})
