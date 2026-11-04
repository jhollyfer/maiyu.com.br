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
                                             └── /health, /sitemap.xml
```

Não há API, banco, fila nem storage. O site é só o `frontend/`.

## 2. Stack

| Camada | Tecnologia | Versão | Doc |
|---|---|---|---|
| Linguagem | TypeScript | ver `frontend/package.json` | `_standards/typescript.md` |
| Repositório | projeto único em `frontend/`, sem workspace na raiz | | `DECISIONS.md` #1 |
| Web | TanStack Start (React 19) sobre Vite e Nitro, Tailwind v4, shadcn sobre Base UI | ver `frontend/package.json` | `_standards/frontend.md` |
| Validação | VineJS nos formulários, com react-hook-form | ver `frontend/package.json` | `_standards/frontend.md` |
| Idiomas | Paraglide (`project.inlang`, `messages/{locale}.json`), idioma no prefixo da URL | ver `frontend/package.json` | `_standards/i18n.md` |
| Banco | Não se aplica: sem backend | | |
| Fila | Não se aplica: sem backend | | |
| Arquivos | Não se aplica: imagens em `public/images` | | |
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
| `src/routes/health.ts` | rota de servidor para o healthcheck do container |
| `src/routes/sitemap[.]xml.ts` | sitemap gerado de `lib/sitemap.ts` |

Ausentes de propósito: `src/start.ts` (`DECISIONS.md` #4) e `integrations/tanstack-query/http.ts`,
`queries.ts`, `mutations.ts` (`DECISIONS.md` #3).

## 4. Módulos (features)

Não se aplica: sem backend. O site tem um grupo de rotas, `_public`.

| Rota | Arquivos | Público |
|---|---|---|
| `/` | `index.tsx`, `index.lazy.tsx` | todos |
| `/portfolio` | `portfolio.tsx`, `portfolio.lazy.tsx` | organizações |
| `/blog` e `/blog/$slug` | `blog/index.*`, `blog/$slug.*` | leitor |
| `/career` | `career.tsx`, `career.lazy.tsx` | candidato |
| `/contact` | `contact.tsx`, `contact.lazy.tsx` | todos |
| `/health` | `routes/health.ts` | orquestrador |
| `/sitemap.xml` | `routes/sitemap[.]xml.ts` | buscadores |
| qualquer outra | `_public/$.tsx` | 404 |

Entidades de domínio (`app/domain/`) não existem aqui.

### 4.1 Linguagem do domínio

| Termo no negócio | Significado | Nome no código | Evitar |
|---|---|---|---|
| Projeto | trabalho da Maiyu no ar, exibido no portfólio | `Project` em `lib/projects.ts` | "case" |
| Diário | o blog do site | `Article`, rota `/blog` | "notícia" |
| Vaga | posição aberta em carreiras | `Job` em `lib/jobs.ts` | "oportunidade" |
| Texto localizado | conteúdo de registro nas três línguas | `LocalizedText` | string solta por idioma |
| Vitrine | a casca pública do site | `_public` | "front público" |

## 5. Modelo de dados

Não se aplica: sem banco. Os registros são constantes tipadas em `lib/`
(`projects`, artigos de `articles.ts`, `JOBS`); o tipo de cada um está no próprio arquivo.

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

O site não chama API nenhuma em tempo de execução.

## 8. Autenticação e autorização

Não se aplica: site público, sem login nem papéis.

## 9. Ambientes

| Ambiente | URL | Onde roda | Banco | Deploy |
|---|---|---|---|---|
| Desenvolvimento | http://localhost:3000 | máquina local (`pnpm dev`) | não se aplica | não se aplica |
| Preview / Homologação | Não se aplica | | | |
| Produção | https://maiyu.com.br | Coolify, imagem Nitro na porta 3000 | não se aplica | push na `main` dispara o workflow |

Health check: `GET /health` (resposta `ok`, `no-store`). Desvio do `/health-check` do modelo: o
padrão do frontend dos irmãos é `/health` (`DECISIONS.md` #5).

### 9.1 O que a plataforma faz e o repositório não

| O quê | Onde se configura | Por quê |
|---|---|---|
| Healthcheck do painel em `/health` | painel do Coolify | o painel sobrepõe o `HEALTHCHECK` do `Dockerfile-production`; em `/` mediria a renderização da home inteira |
| Aplicação na imagem Nitro, porta 3000 | painel do Coolify | o site anterior era nginx estático na porta 80 |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID`, `VITE_SITE_URL` | secrets do repositório no GitHub | os workflows do perfil sem backend publicam a imagem `maiyu-app` e chamam o deploy (`DECISIONS.md` #14) |
| `UUID_APP` e `COOLIFY_URL` do deploy | `.github/workflows/main-deploy-coolify.yml` | o uuid é da aplicação e não da instância; uuid de outro team é aceito e não implanta nada |
| Deploy por `POST` em `/api/v1/deploy` com `curl -fsS` | workflow | a rota responde 405 a `GET` desde o Coolify v4.2 |
| Smoke test em `https://maiyu.com.br/revision.txt` com o sha do commit | workflow | prova que a imagem nova está de pé |

## 10. Escala e limites conhecidos

- Conteúdo em código: artigo, projeto ou vaga novos exigem commit e deploy.
- Os formulários não enviam nada (`DECISIONS.md` #7).
