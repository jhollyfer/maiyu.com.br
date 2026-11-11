# Maiyu: frontend

Site institucional da Maiyu (`https://maiyu.com.br`), em português, inglês e espanhol, feito em
TanStack Start sobre Vite e Nitro. O idioma vai no prefixo da URL (`/en`, `/es`; o português fica
sem prefixo).

O produto, a arquitetura e o padrão de código estão em `docs/` e no `AGENTS.md` da raiz; este arquivo
só diz como rodar o pacote.

## Rodar

Na raiz do repositório, `pnpm install`. Depois, neste diretório:

```bash
pnpm i18n:compile   # gera src/paraglide a partir de messages/; antes de lint, typecheck e teste
pnpm dev            # http://localhost:3000, nenhuma variável de ambiente necessária
```

Reinicie o `pnpm dev` depois de mudar `messages/`.

## Scripts

| Script              | O que faz                                                                   |
| ------------------- | --------------------------------------------------------------------------- |
| `pnpm build`        | gera o bundle e o `.output/` do Nitro, e regenera `src/routeTree.gen.ts`    |
| `pnpm check`        | compila as mensagens, confere o i18n, roda lint, typecheck e `format:check` |
| `pnpm test:unit`    | compila as mensagens e roda o Vitest                                        |
| `pnpm check-cycles` | procura ciclo de chunk em `.output/`; roda depois do build                  |
| `pnpm format`       | Prettier e `eslint --fix`                                                   |

O Playwright mora em `e2e/` e roda na sessão, antes do PR (`docs/TEST-PLAN.md`).

## Variáveis de ambiente

`VITE_SITE_URL` e `VITE_API_URL` vêm de `.env.production` no build; `SITE_ENV` e o resto são lidos
pelo servidor a cada requisição. Cada uma está em `docs/ENV.md`, e o modelo em `.env.example`.

## Produção

Imagem Nitro na porta 3000, construída pelo Coolify a partir de `Dockerfile-production`, com
`GET /health-check` como healthcheck (`docs/ARCHITECTURE.md` §9).
