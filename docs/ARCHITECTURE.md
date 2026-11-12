# Arquitetura do sistema

**Maiyu** · como as peças conversam

> Só o que é **deste** projeto. Camadas, árvore de pastas e nomes seguem
> `_standards/architecture.md`; aqui não se repete, se aponta.

## 1. Visão geral

```
Navegador ──HTTPS──▶ Coolify (proxy) ──▶ Nitro :3000 (TanStack Start, SSR)
                                             │
                                             ├── server.ts: paraglideMiddleware (idioma da URL)
                                             ├── lib/: conteúdo (projects, articles, jobs) em código
                                             └── /health-check, /sitemap.xml

Navegador ──HTTPS──▶ Coolify (proxy) ──▶ API AdonisJS :3333 (backend/)
                                             ├── sessão do dono em cookie httpOnly
                                             ├── PostgreSQL (rede interna do Coolify)
                                             └── bucket S3 privado (URL assinada)
```

Monorepo pnpm com `frontend/`, `backend/` e `shared/` (`@maiyu/shared`, o código que os dois lados
leem igual). A API nasceu do kit da régua e ainda não tem domínio próprio: só health-check, sessão do
dono, anexos e documentação. O que o site vai pedir dela (contato, candidatura, conteúdo) é proposta
para o dono (R2.10 de `TASKS.md`), e o frontend ainda não a chama (RB.5).

## 2. Stack

| Camada | Tecnologia | Versão | Doc |
|---|---|---|---|
| Linguagem | TypeScript | ver `frontend/package.json` | `_standards/typescript.md` |
| Repositório | pnpm workspace com `backend`, `frontend` e `shared`, um `pnpm-lock.yaml` na raiz | pnpm 12 | `_standards/tooling.md` §1 |
| Web | TanStack Start (React 19) sobre Vite e Nitro, Tailwind v4, shadcn sobre Base UI | ver `frontend/package.json` | `_standards/frontend.md` |
| Validação | nenhuma no site: sem formulário (`DECISIONS.md` #17); o do contato volta com Zod no `shared/` e o recurso do backend | ver `frontend/package.json` | `_standards/frontend.md` |
| Idiomas | Paraglide (`project.inlang`, `messages/{locale}.json`), idioma no prefixo da URL | ver `frontend/package.json` | `_standards/i18n.md` |
| API | AdonisJS 7, VineJS nos validators de request, `@adonisjs/i18n` (pt-BR, en, es) | ver `backend/package.json` | `_standards/backend.md` |
| Banco | PostgreSQL pelo Lucid | 18 no compose local | `_standards/backend.md` §4.7 |
| Fila | Não se aplica: sem e-mail nem tarefa fora da requisição | | |
| Arquivos | bucket S3 privado (MinIO só em dev e teste), upload multipart assinado; imagens do site em `src/assets` | | `_standards/backend.md` §5.4 |
| Contrato | `openapi.json` gerado e conferido por `openapi:check`, referência Scalar em `/documentation` | | `_standards/openapi.md` |
| Deploy | dois recursos no Coolify (site e API), construídos do Git por `Dockerfile-production` | | §9 |

## 3. Estrutura de pastas

Segue `_standards/architecture.md` §4 (frontend). O que o projeto usa e a árvore deixa opcional, ou
muda por causa dos três idiomas e do conteúdo em código (motivos em `DECISIONS.md`):

| Pasta | Por quê |
|---|---|
| `src/server.ts` | embrulha o handler do Start com o `paraglideMiddleware`; o idioma de cada requisição é resolvido antes de renderizar (`DECISIONS.md` #2) |
| `src/lib/projects.ts`, `articles.ts`, `jobs.ts` | conteúdo em código no lugar de `integrations/tanstack-query/queries.ts`, até o dono decidir o que vira recurso do backend (`DECISIONS.md` #3, R2.10 de `TASKS.md`); o corpo de cada artigo é um documento Tiptap em JSON por idioma, lido pelo `RichText` do kit |
| `src/lib/i18n.ts`, `labels.ts` | `LocalizedText` do conteúdo de registro e rótulos de valor fechado como função |
| `src/routes/_public/-components/` | peças da vitrine usadas só pela casca pública (a régua de `components/common/` está em `_standards/architecture.md`: só sobe o que mais de uma rota usa) |
| `src/routes/health-check.ts` | rota de servidor para o healthcheck do container |
| `src/routes/sitemap[.]xml.ts` | sitemap gerado de `lib/sitemap.ts` |

Ausentes de propósito: `integrations/tanstack-query/queries.ts` e `mutations.ts` (`DECISIONS.md` #3).
O `src/start.ts` e o cliente `http.ts` existem, do kit (`_standards/DECISIONS.md` #336).

## 4. Módulos (features)

Backend (`backend/app/features/`), todo do kit da régua:

| Módulo | Rotas | Quem |
|---|---|---|
| `health-check.controller.ts` | `GET /health-check` | orquestrador |
| `authentication/sessions` | `POST /authentication/{sign-in,sign-out,refresh}` | o dono |
| `storages/files` | `/storages` (abrir, partes, confirmar, listar, ver, baixar, apagar) | sessão |
| `documentation` | `GET /openapi.json`, `GET /documentation` | papel de staff |

Frontend: o site tem um grupo de rotas, `_public`.

| Rota | Arquivos | Público |
|---|---|---|
| `/` | `index.tsx`, `index.lazy.tsx` | todos |
| `/portfolio` | `portfolio.tsx`, `portfolio.lazy.tsx` | organizações |
| `/blog` e `/blog/$slug` | `blog/index.*`, `blog/$slug.*` | leitor |
| `/career` | `career.tsx`, `career.lazy.tsx` | candidato |
| `/contact` | `contact.tsx`, `contact.lazy.tsx` | todos |
| `/health-check` | `routes/health-check.ts` | orquestrador |
| `/sitemap.xml` | `routes/sitemap[.]xml.ts` | buscadores |
| qualquer outra | `_public/$.tsx` | 404 |

Entidades de domínio do backend: `user` (a conta do dono) e `storage` (o arquivo enviado), ambas do kit.

### 4.1 Linguagem do domínio

| Termo no negócio | Significado | Nome no código | Evitar |
|---|---|---|---|
| Projeto | trabalho da Maiyu no ar, exibido no portfólio | `Project` em `lib/projects.ts` | "case" |
| Diário | o blog do site | `Article`, rota `/blog` | "notícia" |
| Vaga | posição aberta em carreiras | `Job` em `lib/jobs.ts` | "oportunidade" |
| Texto localizado | conteúdo de registro nas três línguas | `LocalizedText` | string solta por idioma |
| Vitrine | a casca pública do site | `_public` | "front público" |

## 5. Modelo de dados

Banco da API (`backend/database/migrations/`, todas do kit):

| Tabela | O que guarda |
|---|---|
| `users` | a conta do dono: nome, e-mail único, hash Argon2 da senha, papel (`ADMINISTRATOR` ou `MEMBER`), status, foto (`avatar_id` em `storages`) e arquivamento |
| `auth_access_tokens` | o par de tokens da sessão (acesso e refresh rotativo), apagado em logout e em mudança de senha, e-mail, papel ou status |
| `rate_limits` | contadores dos limites nomeados de `start/limiter.ts` |
| `consumed_refresh_tokens` | refresh já usado, para detectar reuso e revogar a família da sessão |
| `storages` | metadados do arquivo no bucket: nome, tipo, tamanho, estado do upload multipart |

O conteúdo do site continua em constantes tipadas em `frontend/src/lib/` (`projects`, artigos de
`articles.ts`, `JOBS`), com o tipo de cada um no próprio arquivo.

## 6. Fluxo de dados

Visitante abre `/en/portfolio`: o `paraglideMiddleware` de `server.ts` lê o prefixo `en` e guarda o
idioma no escopo da requisição; o `rewrite` de `router.tsx` tira o prefixo para casar a rota
`/portfolio`; o loader lê `projects` de `lib/projects.ts`; a tela escolhe o texto com
`localized(...)` e as mensagens com `m.chave()`; o `Link` de saída devolve o prefixo pelo
`localizeUrl`. O estilo de renderização é SSR em todas as rotas de `_public`.

## 7. Integrações externas

| Serviço | Para quê | Contrato no código | Variáveis (`ENV.md`) |
|---|---|---|---|
| WhatsApp (`wa.me`) | "Agendar conversa" | `CALL_URL` em `lib/site.ts` | nenhuma |
| GitHub e LinkedIn | links de rede social | `SOCIALS` em `lib/site.ts` | nenhuma |
| Bucket S3 (R2 ou S3 em produção) | anexos da API, sempre privados | `backend/app/services/storage/` | `STORAGE_*` |

O site ainda não chama a API em tempo de execução; o domínio dela (`api.maiyu.com.br`) já está em `frontend/.env.production`.

## 8. Autenticação e autorização

O site é público. A API tem uma conta só, a do dono, criada pelo seeder a partir de `SEED_OWNER_EMAIL`
e `SEED_OWNER_PASSWORD` (`firstOrCreate`: o deploy roda o seed toda vez e nunca reescreve a senha
trocada). Sessão por par de tokens opacos em cookie `httpOnly` (guard `cookie-access-tokens` do kit),
com refresh rotativo e checagem de origem em toda escrita. Mudar senha, e-mail, papel ou status da
conta, ou arquivá-la, apaga as sessões dela na mesma transação do save. Papéis do esqueleto do kit em `shared/src/enums/user-role.ts`:
`ADMINISTRATOR`, que é a lista de staff, e `MEMBER`, o papel menos privilegiado, que nenhuma rota cria hoje.

## 9. Ambientes

| Ambiente | URL | Onde roda | Banco | Deploy |
|---|---|---|---|---|
| Desenvolvimento | site http://localhost:3000, API http://localhost:3333 | máquina local (`pnpm dev`) | Postgres do `backend/docker-compose.yml` na porta 5440 | não se aplica |
| Preview / Homologação | Não se aplica | | | |
| Produção (site) | https://maiyu.com.br | Coolify, `frontend/Dockerfile-production`, imagem Nitro na porta 3000 | não se aplica | *Auto Deploy* do recurso: o merge na `main` dispara o build (§9.1) |
| Produção (API) | https://api.maiyu.com.br (decisão do dono, 2026-11-11) | Coolify, `backend/Dockerfile-production`, porta 3333 | Postgres do Coolify, só na rede interna | *Auto Deploy* do recurso (§9.1) |

Health check: `GET /health-check` nos dois apps (no site, `{ "status": "ok" }` com `no-store`), o nome
exato que a régua exige, sem alias (`_standards/DECISIONS.md` #184, `DECISIONS.md` #15). O
repositório não tem passo de deploy nem GitHub Actions de entrega: quem constrói e publica é o
Coolify, puxando o commit da `main` (`_standards/tooling.md` §8.3, `_standards/DECISIONS.md` #298).

### 9.1 O que a plataforma faz e o repositório não

Dois recursos *Application* no Coolify, os dois com origem no repositório privado pelo **GitHub App**,
*Branch* `main`, *Build Pack* `Dockerfile`, *Base Directory* `/` e *Auto Deploy* ligado
(`_standards/tooling.md` §8.3; `_doc-lib/coolify.md`). Cada um com o quadro abaixo.

| Campo | Recurso do site (`maiyu.com.br`) | Recurso da API (`api.maiyu.com.br`) |
|---|---|---|
| *Dockerfile Location* | `/frontend/Dockerfile-production` | `/backend/Dockerfile-production` |
| *Watch Paths* (um padrão por linha, relativos à raiz do repositório) | `frontend/**`, `shared/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | `backend/**`, `shared/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` |
| *Pre-deployment command* | vazio | vazio (roda no container que sai, antes do build) |
| *Post-deployment command* | vazio | `node ace migration:run --force && node ace db:seed` (nunca `migration:refresh`, `reset` nem `fresh`; o Lucid recusa `--force` no seed, `_standards/DECISIONS.md` #372; o seed do dono é `firstOrCreate`) |
| *Health Check* do painel | vazio: vale o `HEALTHCHECK` da imagem, que aponta para `/health-check` (porta 3000) | vazio: vale o `HEALTHCHECK` da imagem, que aponta para `/health-check` (porta 3333) |
| Porta | 3000 (o site anterior era nginx estático na porta 80) | 3333 |
| Variáveis de runtime | `SITE_ENV=production`, `TZ=America/Eirunepe` | `NODE_ENV=production`, `TZ=America/Eirunepe`, `CORS_ORIGINS=https://maiyu.com.br`, `APP_KEY`, `DATABASE_URL`, `APP_SERVER_URL`, `APP_CLIENT_URL`, `COOKIE_DOMAIN`, `TRUSTED_PROXIES`, `STORAGE_*`, `SEED_OWNER_*` (lista e significado em `ENV.md` §1.1) |

- *Watch Paths*: mudança em `shared/` ou no `package.json` da raiz redeploya os dois recursos; mudança
  só no `frontend/` não redeploya a API (`_standards/DECISIONS.md` #355, #379).
- `NODE_ENV` da API sem *Available at Buildtime*: marcada, entra no build como `production` e o
  `pnpm install` pula as `devDependencies` que compilam o app. O site não precisa de variável de build
  no painel: os `VITE_*` vêm de `frontend/.env.production` (`ENV.md` §3).
- Valor secreto (`APP_KEY`, `DATABASE_URL`, `STORAGE_SECRET`, `SEED_OWNER_PASSWORD`) só no painel,
  nunca no repositório nem neste arquivo.
- Domínios: `maiyu.com.br` no recurso do site e `api.maiyu.com.br` no da API, o `COOKIE_DOMAIN`
  `.maiyu.com.br` para a sessão do dono valer nos dois.
- Postgres sem porta pública: o `DATABASE_URL` usa a URL **interna** que o Coolify mostra no recurso
  de banco.
- CORS do bucket de produção aberto ao site, com `PUT` e `ETag` exposto, no painel do provedor S3 ou
  R2: sem o `ETag` exposto nenhum upload multipart se completa.
- A prova do deploy é o healthcheck: o Coolify só troca o container quando o novo responde
  `/health-check`. Depois do merge, conferir o deploy `finished` de cada recurso e
  `curl -fsS https://maiyu.com.br/health-check` e `https://api.maiyu.com.br/health-check`
  (`_standards/tooling.md` §8.3 e §10.1).
- Rollback: aba *Rollback* do recurso no Coolify ou redeploy do commit anterior; toda migration
  precisa ser compatível com a imagem anterior (expandir, migrar, contrair).
- Secrets do repositório no GitHub (`DOCKERHUB_*`, `COOLIFY_*`, `VITE_SITE_URL`) deixam de existir
  quando os workflows saem (`_standards/DECISIONS.md` #368, #369); o dono os apaga em Settings, Secrets
  and variables, Actions.

## 10. Escala e limites conhecidos

- Conteúdo em código: artigo, projeto ou vaga novos exigem commit e deploy.
- A API tem uma réplica só: os limites de taxa contam no Postgres (`rate_limits`), sem Redis.
- Contato e carreiras não têm formulário: um aviso e os canais reais, e-mail e WhatsApp (`DECISIONS.md` #17).
