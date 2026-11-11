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
| Validação | VineJS nos formulários, com react-hook-form | ver `frontend/package.json` | `_standards/frontend.md` |
| Idiomas | Paraglide (`project.inlang`, `messages/{locale}.json`), idioma no prefixo da URL | ver `frontend/package.json` | `_standards/i18n.md` |
| API | AdonisJS 7, VineJS nos validators de request, `@adonisjs/i18n` (pt-BR, en, es) | ver `backend/package.json` | `_standards/backend.md` |
| Banco | PostgreSQL pelo Lucid | 18 no compose local | `_standards/backend.md` §4.7 |
| Fila | Não se aplica: sem e-mail nem tarefa fora da requisição | | |
| Arquivos | bucket S3 privado (MinIO só em dev e teste), upload multipart assinado; imagens do site em `public/images` | | `_standards/backend.md` §5.4 |
| Contrato | `openapi.json` gerado e conferido por `openapi:check`, referência Scalar em `/documentation` | | `_standards/openapi.md` |
| Deploy | imagem Docker Nitro no Coolify, publicada pelo GitHub Actions | | §9 |

## 3. Estrutura de pastas

Segue `_standards/architecture.md` §4 (frontend). O que o projeto usa e a árvore deixa opcional, ou
muda por causa de três idiomas e ausência de API (motivos em `DECISIONS.md`):

| Pasta | Por quê |
|---|---|
| `src/server.ts` | embrulha o handler do Start com o `paraglideMiddleware`; o idioma de cada requisição é resolvido antes de renderizar (`DECISIONS.md` #2) |
| `src/lib/projects.ts`, `articles.ts`, `jobs.ts` | conteúdo em código no lugar de `integrations/tanstack-query/queries.ts` (`DECISIONS.md` #3) |
| `src/lib/i18n.ts`, `labels.ts` | `LocalizedText` do conteúdo de registro e rótulos de valor fechado como função |
| `src/routes/_public/-components/` | peças da vitrine usadas só pela casca pública (`components/common/CLAUDE.md`) |
| `src/routes/health-check.ts` | rota de servidor para o healthcheck do container |
| `src/routes/sitemap[.]xml.ts` | sitemap gerado de `lib/sitemap.ts` |

Ausentes de propósito: `src/start.ts` (`DECISIONS.md` #4) e `integrations/tanstack-query/http.ts`,
`queries.ts`, `mutations.ts` (`DECISIONS.md` #3).

## 4. Módulos (features)

Backend (`backend/app/features/`): o kit da régua e o contato do site:

| Módulo | Rotas | Quem |
|---|---|---|
| `health-check.controller.ts` | `GET /health-check` | orquestrador |
| `authentication/sessions` | `POST /authentication/{sign-in,sign-out,refresh}` | o dono |
| `storages/files` | `/storages` (abrir, partes, confirmar, listar, ver, baixar, apagar) | sessão |
| `documentation` | `GET /openapi.json`, `GET /documentation` | papel de staff |
| `account/profile` | `GET /account/profile`, `PUT /account/profile` | qualquer papel, com sessão |
| `storefront/contacts` | `POST /storefront/contacts` | visitante, sem sessão |
| `administrator/contacts` | `GET /administrator/contacts`, `GET /administrator/contacts/:id`, `POST /administrator/contacts/:id/answer`, `DELETE /administrator/contacts/:id`; mais o comando `contacts:prune` | papel de staff |

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

Entidades de domínio do backend: `user` (a conta do dono, que troca nome e senha por `update` e marca a revogação das sessões em `credentials()`) e `storage` (o arquivo enviado), do kit, e `contact` (a mensagem do formulário, que nasce pendente e tem uma só transição, `answer`).

### 4.1 Linguagem do domínio

| Termo no negócio | Significado | Nome no código | Evitar |
|---|---|---|---|
| Projeto | trabalho da Maiyu no ar, exibido no portfólio | `Project` em `lib/projects.ts` | "case" |
| Diário | o blog do site | `Article`, rota `/blog` | "notícia" |
| Vaga | posição aberta em carreiras | `Job` em `lib/jobs.ts` | "oportunidade" |
| Texto localizado | conteúdo de registro nas três línguas | `LocalizedText` | string solta por idioma |
| Vitrine | a casca pública do site | `_public` | "front público" |

## 5. Modelo de dados

Banco da API (`backend/database/migrations/`, as do kit e a de `contacts`):

| Tabela | O que guarda |
|---|---|
| `users` | a conta do dono: nome, e-mail único, hash Argon2 da senha, papel (`ADMINISTRATOR` ou `MEMBER`), status, foto (`avatar_id` em `storages`) e arquivamento |
| `auth_access_tokens` | o par de tokens da sessão (acesso e refresh rotativo), apagado em logout e em mudança de senha, e-mail, papel ou status |
| `rate_limits` | contadores dos limites nomeados de `start/limiter.ts` |
| `consumed_refresh_tokens` | refresh já usado, para detectar reuso e revogar a família da sessão |
| `storages` | metadados do arquivo no bucket: nome, tipo, tamanho, estado do upload multipart |
| `contacts` | a mensagem do formulário de contato: nome (120), e-mail (254), mensagem, idioma, `answered_at` (nulo é pendente), `created_at`; índices em `created_at` e `answered_at`; sem lixeira |

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

O site ainda não chama a API em tempo de execução.

## 8. Autenticação e autorização

O site é público. A API tem uma conta só, a do dono, criada pelo seeder a partir de `SEED_OWNER_EMAIL`
e `SEED_OWNER_PASSWORD` (`firstOrCreate`: o deploy roda o seed toda vez e nunca reescreve a senha
trocada). Sessão por par de tokens opacos em cookie `httpOnly` (guard `cookie-access-tokens` do kit),
com refresh rotativo e checagem de origem em toda escrita. Mudar senha, e-mail, papel ou status da
conta, ou arquivá-la, apaga as sessões dela na mesma transação do save. Papéis do esqueleto do kit em `shared/src/enums/user-role.ts`:
`ADMINISTRATOR`, que é a lista de staff, e `MEMBER`, o papel menos privilegiado, que nenhuma rota cria hoje.

Troca de nome e de senha (`PUT /account/profile`, `.specs/features/conta/`): o dono ou qualquer conta
com sessão troca o próprio nome e a própria senha, sem `role`, e a rota não recebe id: o escopo é o
`actor` do cookie. O corpo precisa de `name` (1 a 120) ou `password`, e trocar qualquer um exige
`currentPassword` (422 no campo `currentPassword` se errada, antes de qualquer outra regra); a senha
nova segue o `Rule.password()` do `shared/`, com confirmação, e igual à atual é 422
`PASSWORD_SAME_AS_CURRENT` no campo `password`. A troca de e-mail não está nesta entrega: a `backend.md`
§7 item 7 manda confirmar o endereço novo por link, com aviso ao antigo, e o bloco de e-mail ainda não
existe (decisão do dono; o corpo não aceita `email`). Quando muda a senha, a entidade `User` marca a
revogação, e o `UserRepository.save` grava a linha e chama `SessionRepository.revokeAll` na mesma
`UnitOfWork`: ou ficam a senha antiga e as sessões, ou nenhuma das duas. A revogação inclui a sessão
que fez a chamada, então a resposta 200 limpa os cookies (`SessionCookie.clear`) e o dono entra de novo
com a senha nova; o cookie de antes responde 401. Trocar só o nome não é troca de credencial: 200, sem
revogar e sem limpar cookie. O limite é de 10 trocas por 15 minutos por usuário (`accountThrottle` do
kit, em `start/limiter.base.ts`, com bloqueio de 15 minutos), porque a rota compara a senha atual e
seria um oráculo de senha para quem roubasse o cookie.

## 9. Ambientes

| Ambiente | URL | Onde roda | Banco | Deploy |
|---|---|---|---|---|
| Desenvolvimento | site http://localhost:3000, API http://localhost:3333 | máquina local (`pnpm dev`) | Postgres do `backend/docker-compose.yml` na porta 5440 | não se aplica |
| Preview / Homologação | Não se aplica | | | |
| Produção | https://maiyu.com.br | Coolify, imagem Nitro na porta 3000 | não se aplica | push na `main` dispara o workflow |
| Produção (API) | ainda sem recurso no Coolify: endereço a definir pelo dono | Coolify, `backend/Dockerfile-production` na porta 3333 | Postgres do Coolify na rede interna | *Auto Deploy* do recurso, `_standards/tooling.md` §8.3 |

Health check: `GET /health-check` (resposta `{ "status": "ok" }`, `no-store`), o nome exato que a
régua exige em todo frontend, sem alias (`_standards/DECISIONS.md` #184, `DECISIONS.md` #15).

### 9.1 O que a plataforma faz e o repositório não

| O quê | Onde se configura | Por quê |
|---|---|---|
| Recurso da API: *Base Directory* `/`, *Dockerfile Location* `/backend/Dockerfile-production`, *Watch Paths* `backend/**`, `shared/**`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | painel do Coolify | a imagem constrói da raiz para ver o `shared/` e o lockfile único |
| *Post-deployment command* da API: `node ace migration:run --force && node ace db:seed` (o Lucid recusa `--force` no seed, `_standards/DECISIONS.md` #372); *Pre-deployment* vazio | painel do Coolify | o *Pre-deployment* roda no container que sai; o seed do dono é `firstOrCreate` e pode rodar a cada deploy |
| Healthcheck da API: campo vazio no painel, vale o `HEALTHCHECK` da imagem em `/health-check` | painel do Coolify | `_standards/tooling.md` §8.3 |
| Variáveis de runtime da API (`APP_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, `COOKIE_DOMAIN`, `TRUSTED_PROXIES`, `STORAGE_*`, `SEED_OWNER_*`) | recurso da API no Coolify | nunca no repositório (`ENV.md` §1.1) |
| Postgres sem porta pública, URL interna no `DATABASE_URL` | recurso de banco do Coolify | `_standards/tooling.md` §8.3 |
| CORS do bucket de produção aberto ao site, com `PUT` e `ETag` exposto | painel do provedor S3 ou R2 | sem o `ETag` exposto nenhum upload multipart se completa |
| Healthcheck do painel em `/health-check` | painel do Coolify | o painel sobrepõe o `HEALTHCHECK` do `Dockerfile-production`; em `/` mediria a renderização da home inteira |
| Aplicação na imagem Nitro, porta 3000 | painel do Coolify | o site anterior era nginx estático na porta 80 |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID`, `VITE_SITE_URL` | secrets do repositório no GitHub | os workflows do perfil sem backend publicam a imagem `maiyu-app` e chamam o deploy (`DECISIONS.md` #14) |
| `UUID_APP` e `COOLIFY_URL` do deploy | `.github/workflows/main-deploy-coolify.yml` | o uuid é da aplicação e não da instância; uuid de outro team é aceito e não implanta nada |
| Deploy por `POST` em `/api/v1/deploy` com `curl -fsS` | workflow | a rota responde 405 a `GET` desde o Coolify v4.2 |
| Smoke test em `https://maiyu.com.br/revision.txt` com o sha do commit | workflow | prova que a imagem nova está de pé |
| Tarefa agendada da API: `node ace contacts:prune`, todo dia, no container da API | painel do Coolify (*Scheduled Tasks* do recurso da API) | a aplicação não tem agendador interno; sem a tarefa a guarda de 12 meses do contato (`SECURITY.md` §8) não se cumpre. Rodar duas vezes é inofensivo, e `--dry-run` só conta |

## 10. Escala e limites conhecidos

- Conteúdo em código: artigo, projeto ou vaga novos exigem commit e deploy.
- A API tem uma réplica só: os limites de taxa contam no Postgres (`rate_limits`), sem Redis.
- Os formulários não enviam nada (`DECISIONS.md` #7).
