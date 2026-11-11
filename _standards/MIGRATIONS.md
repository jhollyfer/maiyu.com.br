# Migrações pendentes por projeto

## Todos os projetos — nomes em inglês (`DECISIONS.md` #120)

| Hoje | Vira | Como |
|---|---|---|
| `_padroes/` | `_standards/` | `node <maiyu-pattern>/scripts/sync-to-project.mjs .` cria a pasta nova; apagar `_padroes/` no mesmo commit |
| `.claude/skills/maiyu-padrao/` | `.claude/skills/maiyu-standards/` | idem; apagar a pasta antiga |
| referência a `_padroes/…`, `arquitetura.md`, `DECISOES.md`, `MIGRACOES.md` em `CLAUDE.md`, `AGENTS.md`, comentários e scripts (`sync:check`, `pattern:check`) | nome novo | busca e troca no mesmo commit |

## lowcodejs — rows tipadas (`architecture.md` §10)

| Hoje | Vira |
|---|---|
| valor de row como objeto solto, conferido com `typeof`/`instanceof` nas rotas de rows, no model-builder e no front | `FieldValue` (união discriminada por `FieldType`) e `Row`, em `shared/src/dynamic/` |
| schema da tabela dinâmica montado em lugares diferentes no back e no front | um `RowSchemaBuilder.build(fields)` em `shared/`, usado pelos dois lados |
| conversão para Mongo/Postgres espalhada | lookup por `FieldType` dentro do repository da row de cada driver |

## Todos os projetos — versões (`DECISIONS.md` #121)

| Projeto | Hoje | Vira |
|---|---|---|
| adacaibs (backend e frontend) | `typescript-native: npm:typescript@^7` para o typecheck | sai o alias; typecheck com `typescript@~6` |
| interclasse (backend e frontend) | `npm:@typescript/typescript6` | `typescript@~6` direto |
| lowcodejs backend | `typescript@^7` | `typescript@~6`, corrigindo o que o 7 permitiu |
| lowcodejs frontend, matiscraft | `typescript@^5.x` | `typescript@~6` |
| lowcodejs backend | `mongodb@^7.7` | última major do driver, ajustando a API |


## Todos os projetos: régua de 2026-10 (`_map/scan-2026-10/application/`)

Vale para o projeto que tiver o item; cada linha aponta a regra dona.

| Hoje | Vira | Regra |
|---|---|---|
| tipo `I<Nome>`, enum `E_<NOME>` (ex.: `E_AREA_CAPABILITY` no lowcodejs) | sem prefixo: `AreaCapability`, `AREA_CAPABILITY` | `typescript.md` §4 |
| enum em `lib/entity.ts` ou `core/entity.ts` | `shared/src/enums/<nome>.ts`; rótulo em `lib/labels.ts` | `typescript.md` §4 |
| `lib/utils.ts` com `cn()` | `lib/cn.ts`, só com `cn()` | `typescript.md` §6 |
| `src/validators/`, `lib/validator.ts` no frontend e script `validators:check` de paridade | validator único em `shared/`; o `validators:check` do **frontend** sai; o do backend Adonis fica (paridade entre `app/validators/` e o shared, `DECISIONS.md` #326, #359) | `architecture.md` §9 |
| tipo de resposta montado pelo model ou redigitado no frontend | schema `…Response` em `shared/src/responses/` e presenter no backend | `architecture.md` §10 |
| `ensureQueryData` no loader | `context.queryClient.query()` com a fábrica de `queryOptions` | `frontend.md` §1.3 |
| `data-test-id` | `data-testid`, só quando não há papel e nome acessível | `frontend.md` §11 |
| edição por `?mode=edit` | rota `$id/edit` | `frontend.md` §1.2 |
| `robots.txt` em `public/` | rota de servidor `robots[.]txt.ts` | `frontend.md` §9.7 |
| E2E `<ação>.spec.ts` | `<ação>.e2e.spec.ts` | `architecture.md` §3 |
| `<nome>-contract.service.ts` | `<nome>.contract.ts`; contrato só para I/O externo, o resto vira classe concreta | `solid.md` §2 |
| hook em `backend/.husky` | `.husky/` na raiz, um para o repositório | `tooling.md` §6 |
| `npx commitlint@N` em hook ou script | `pnpm exec commitlint`, versão da devDependency da raiz | `tooling.md` §6 |
| espera do MinIO por `sleep` | espera pelo estado (o bucket existe e responde) | `tooling.md` §7 |
| deploy por workflow (`main.yml`, `main-docker-*`, `main-deploy-coolify.yml`, imagem no Docker Hub) | recurso do Coolify que constrói do Git com *Auto Deploy* e healthcheck em `/health-check`; secrets de deploy apagados do Actions (#290) | `tooling.md` §8.3 |
| qualquer `.github/workflows/` (CI de PR, push, imagem, deploy) | nada: hook local, rodada de suítes antes do PR e *Auto Deploy* do Coolify; o sync apaga a pasta e a proteção de branch perde o check do Actions (#298) | `tooling.md` §7, §8.1, §9 |
| `docs/adr/`, `<projeto>-threat-model.md`, `.specs/STATE.md` (`AD-xxx`), `LESSONS.md` | `docs/DECISIONS.md`, `docs/SECURITY.md` §2, `docs/MEMORY.md` | `documentation.md` §1 |


Gerado a partir de `_standards/_map/*.md` (seções Desvios do padrão) e de `architecture.md` (tabelas
"Migração estrutural"). Linhas
ordenadas por risco — segurança/comportamento primeiro, estilo depois.

Vale para todos: `.claude/settings.json` ganha `enabledPlugins` com `superpowers`,
`claude-code-setup` e `claude-security` (`@claude-plugins-official`, `AGENTS.md`); `.gitignore` ganha
`CLAUDE-SECURITY-*/` (`tooling.md` §9, §10.4).

Vale para todos: data só por Luxon e ícone só por Phosphor (`tooling.md` §0.1). `date-fns` sai dos
frontends de simple-hub, adacaibs, matiscraft, academy, lowcodejs e manganga e dos backends de
matiscraft e lowcodejs; `lucide-react` sai do matiscraft (o `frontend-old` do manganga já saiu, em `e7bdde2`); `zod` deixa de ser proibido (`DECISIONS.md` #241): fica no matiscraft (Fastify), onde já é o schema, e entra no frontend e no `shared/` de todos.

Vale para todos, schema (`DECISIONS.md` #241): Zod no frontend e em `shared/`, em qualquer projeto;
VineJS só no backend Adonis (simple-hub, adacaibs, interclasse, academy). No Fastify (lowcodejs,
matiscraft) o Zod vale também no backend. `@vinejs/vine` sai de frontend, `shared/` e Fastify, e o
ESLint ganha `no-restricted-imports` dele nesses três lugares; `yup` segue proibido. Cada schema
Zod é lido na doc em `_doc-lib/zod.md#basics` e `#api`.

Vale para todos: backend e frontend que ainda não expõem o próprio `GET /health-check`
independente criam o seu (`architecture.md` §7, obrigatório). Estado em 2026-10-14:

| Projeto | Backend | Frontend | O que fazer |
|---|---|---|---|
| simple-hub | `/health-check` | `/health-check` | Nada |
| adacaibs | `/health-check` | `/health-check` | Nada |
| interclasse | `/health-check` | `/health-check` | Nada |
| lowcodejs | `/health-check` | `/health-check` | Nada |
| academy | `/health-check` + `GET /health` (revisão da imagem) | `/health-check` + alias `src/routes/health.ts` | Remover `/health` dos dois lados e apontar o healthcheck do recurso no Coolify para `/health-check`; a prova de revisão saiu com o deploy por workflow (`tooling.md` §8.3, #290) |
| manganga | sem rota (`backend-old/` em Fastify; nasce no `backend/` Adonis) | `src/routes/health.ts` | Criar no `backend/`; renomear a do front para `health-check.ts`; `Dockerfile-production` e deploy apontam para `/health-check` |
| matiscraft | **sem rota**; o compose de produção sonda `/health-check` e o container nunca fica saudável | sem rota; o compose sonda `/` | Criar as duas rotas; probe do frontend para `/health-check` |

---

## simple-hub

| Item | Onde | Regra | Correção |
|---|---|---|---|
| `userId: string` no Payload em vez de `actor` | 79 use-cases/controllers, ex. `features/producer/products/update.use-case.ts:1`, `features/company/**` (62x), `features/customer/orders/**` | backend.md §4.3 | Trocar `userId` por `actor: Actor` (tipo do `ActorSchema` de `shared/`); o middleware de autenticação deixa `ctx.actor` e o controller o repassa |
| `pre-commit` não roda nada | `.husky/pre-commit:20` (`#pnpm check && pnpm test`) | tooling.md §6 | Descomentar, ou documentar a exceção com o porquê |
| `new DemoSeeder(...)` fora do container em teste | `tests/functional/{lote,storefront,storefront-organizations,storefront-privacy,storefront-qrcode,company-identity,demo_seeder,origin,prova}.spec.ts` (50 ocorrências, 9 arquivos) | backend.md §2.1 | `app.container.make(DemoSeeder)`; ESLint não pega porque `Seeder` não está no seletor — ver tooling.md §4 atualizado |
| I/O externo sem contrato | `services/storage.service.ts`, `brasil-api.service.ts`, `opentimestamps.service.ts`, `rfc3161.service.ts` | solid.md §2 | `abstract class *Contract`; dívida aceitável até um teste precisar trocar fornecedor |
| Posse de empresa/produtor fora de policy nomeada | `features/_shared.organization.ts:38` (`companyOf`), 70+ use-cases | backend.md §4.6 | `CompanyPolicy`/`ProducerPolicy` no formato de `UserPolicy`, se virar padrão citado em revisão |
| `_shared` fazendo I/O (consulta ao banco) | `_shared.organization.ts`, `_shared.impact.ts` | backend.md §4.9 | Mover para service injetável (`SessionScopeService`); `_shared` é só função pura sobre dado já em mãos |
| `tsconfig.json` sem `noUncheckedIndexedAccess`/`noImplicitOverride` (frontend) | `frontend/tsconfig.json:14-29` | tooling.md §3 | Somar as duas flags — `noUncheckedIndexedAccess` importa aqui pelo uso de `Record<string,string>` em `HTTPError.errors` |
| `form-edit.tsx` não reflete produto carregado depois do primeiro render | `producer/products/-components/form-edit.tsx:50-55` | frontend.md §4 | `useState(product?.category ?? null)` → mover para `values:` do RHF, como o resto do mesmo form |
| Formulário de autenticação repete `onError` cru (sem retry/código) | `authentication/_sign-in/-components/sign-in-form.tsx:70,82`, `sign-up/customer-sign-up.tsx:69,79`, `producer-sign-up.tsx`, `multi-step-form.tsx` | frontend.md §4 | Extrair o mesmo helper de `use-resource-form.ts` (`applyHTTPErrorToForm`) |
| `Merge<A,B>` substituído por `&` (gerado) | `components/ui/native-select.tsx:6` | typescript.md §1 | Baixa prioridade — saída de `shadcn add`, isento por desenho |
| `pnpm@11.21.0` | `backend/package.json:7`, `frontend/package.json` | tooling.md §0 | Confirmar `12.x` publicado e migrar |

### Migração estrutural — simple-hub

Plano canônico de 2026-11 (`DECISIONS.md` #362; fases **0** segurança, **1** stack, **2** árvore e
camadas, **3** kit, **4** testes e infra; P até meio dia, M um a três dias, G mais que isso). Passo F da
ordem entre projetos.

| Fase | Item | Tam. |
|---|---|---|
| 0 | `start.ts` com CSRF; shield sem cookie XSRF inútil; SEC-24 (janela de regravação) | P |
| 1 | **`shared/` de VineJS para Zod**: 38 validators reescritos, `@vinejs/vine` sai de `shared/package.json` e do frontend; `app/validators/<m>/<r>.validator.ts` criados em VineJS; `core/validator.ts` deixa de reexportar do shared; `validators:check` liga (#326) | G |
| 1 | hash scrypt para Argon2 (rehash); `@tanstack/*query*` em versão exata; Tuyau como transporte do `request()` e `@tuyau/core` na mesma versão nos dois lados (#324) | M |
| 2 | criar `shared/src/merge.ts`, `core/trusted-proxies.ts` (kit), `features/health-check.controller.e2e.spec.ts`; `repositories/unit-of-work/transaction-context.ts` para `core/`; `repositories/memory-page.ts` para `core/memory-rows.ts` | M |
| 2 | presenters escondidos em `features/_shared.{order,product,category,subcategory,address,storage,company,review}.ts` viram `_shared.<e>.presenter.ts` (#341); `_shared` em classe | M |
| 2 | `providers/repositories.provider.ts` para `repository.provider.ts`; specs de service renomeados (#342); `rating.unit.spec.ts` para `rating.value-object.unit.spec.ts`; `database/demo.e2e.spec.ts` para `seeders/dev/demo.e2e.spec.ts`; `shared/src/responses/{columns,text-enum}.ts` para `records/` e `enums/`; `validators.test.ts` por arquivo | M |
| 2 | `hash.verify` importado nos use-cases (4) vira `PasswordContract`; `origin.middleware` sem `#start/env` (config); `features/authentication/session` para `sessions` | M |
| 2 | `scripts/depcruise-resolve.mjs` para `scripts/depcruise.config.ts` | P |
| 3 | 43 `common/*/index.ts` e 7 de `-components/` saem; kit inteiro (table, confirm-dialog, form-shell, page-shell sem `borderBottom`, empty-state com `reason`, image-field com upload por prop, option-combobox compound, filters, row-actions, bulk-archive, route-status, theme; `copy-id-menu-item` some; `currency-input` e `basis-points-input` viram `FieldMask` ou `FieldNumber`, #325); telas: 20 `table.tsx`, 15 `form-edit`, 12 `form-create`, 19 `row-actions`, 12 `bulk-actions` | G |
| 3 | `invalidate.ts`; `new.tsx` só onde há loader (#356); `routes/{artesao.$slug,organizacao.$slug,carrinho,authentication.*}.ts` e `lib/moved-url.ts` saem, sem redirect (#383: o caminho antigo dá 404); `routes/-theme.ts` para `integrations/theme/get-theme.ts`; `router-register.d.ts` e `query-register.d.ts` para `router.tsx` e `http.ts`; `lib/interfaces.ts` e `lib/async-handler.ts` redistribuídos; `http.ts:185`; usar o `_schema` que hoje é ignorado (`http.ts:524-532`) | M |
| 4 | `tsr.config.json` sai; `paraglide.config.ts`; `.env.production`; `.env.example` (back e front) pelo modelo; `.github/workflows/` (10) e secrets saem; `docs/ARCHITECTURE.md` atualizado; e2e com três viewports, `touch-targets`, `responsive`, `pages`; `afterEach(cleanup)` nos 13 `.test.tsx` | M |

### Versões — simple-hub

| Pacote | Atual | Última |
|---|---|---|
| `@adonisjs/core` | ^7.5.0 | 7.6.0 |
| `@adonisjs/lucid` | ^22.4.2 | 22.4.2 |
| `@adonisjs/drive` | ^4.0.0 | 4.0.0 |
| `@vinejs/vine` | ^4.4.0 | 4.4.0 |
| `zod` | (novo, frontend e `shared/`) | 4.6.7 |
| `react-hook-form` | ^7.82.0 | 7.89.0 |
| `@hookform/resolvers` | ^5.4.0 | 5.9.1 |
| `shadcn` | ^4.13.1 | 4.21.4 |
| `tailwindcss` | ^4.1.18 | 4.3.3 |
| `@tanstack/react-query` | ^5.101.4 | 5.104.1 |
| `@tanstack/react-router` | ^1.170.23 | 1.170.42 |
| `@tanstack/react-start` | ^1.168.40 | 1.168.61 |
| `@tanstack/react-table` | ^9.1.0 | 9.2.8 |
| `@tiptap/core` | 3.30.5 | 3.31.4 |
| `use-mask-input` | ^3.13.0 | 3.14.2 |
| `vite` | ^8.0.0 | 8.3.4 |
| `vitest` | ^4.1.5 | 5.0.3 |
| `@base-ui/react` | ^1.6.0 | 1.9.0 |

---

## adacaibs

| Item | Onde | Regra | Correção |
|---|---|---|---|
| `!` sem narrowing em código sem `Either` | `app/services/cookie.service.ts:162-163` (`accessToken.value!.release()`, `refreshToken.value!.release()`) | typescript.md §1 | `if (!accessToken.value) throw new Error(...)` antes do `.release()` |
| `!` sem narrowing em teste | `tests/helpers.ts:49-50` | backend.md §2 + typescript.md §1 | `if (!cookie) throw new Error('cookie ausente na resposta de sign-in')` |
| `whereNotNull('deletedAt')` escrito à mão (7 arquivos, `unarchive.use-case.ts`) | `app/features/administrator/{albums,events,notices,podcasts,testimonials,users,videos}/unarchive.use-case.ts` | backend.md §4.8 | Criar `static onlyDeleted = scope(...)` por model, usar `withScopes` |
| idem, em `paginate.use-case.ts` (7 arquivos) | mesmos módulos, `paginate.use-case.ts:25` | backend.md §4.8 | scope `trashed(mode)` no model (`_shared` não modifica query) |
| `pattern-check.ts` só cobre `whereNull`, não `whereNotNull` | `scripts/pattern-check.ts:525` (módulo congelado, espelhado nos 4 repos) | backend.md §10 | Estender o regex nos quatro repositórios (régua §11) |
| `padrao.manifest.json::softDeleteExempt` com entradas de outro projeto | `padrao.manifest.json` | backend.md §4.8 | Reduzir à lista real deste repositório, ou nomear por projeto |
| `VITE_API_URL` lido direto por `import.meta.env`, sem `env.ts` | `frontend/src/integrations/tanstack-query/http.ts:143` (idem em maiyu.com.br) | frontend.md §3 | Extrair para `src/env.ts` (`architecture.md` §4) com checagem explícita |
| Fábrica de query key centralizada (não por módulo) | `frontend/src/hooks/tanstack-query/_query-keys.ts` (164 linhas, 13 recursos) | frontend.md §2.1 (divergência já registrada) | Documentar como 3º projeto que diverge, ou migrar |

### Migração estrutural — adacaibs

| Atual | Alvo (`architecture.md`) | Como |
|---|---|---|
| Ação como par de arquivos no recurso: `app/features/<módulo>/<recurso>/<verbo>.{controller,use-case}.ts` | Pasta por ação: `app/features/<módulo>/<recurso>/<ação>/<ação>.{controller,use-case,unit.spec,e2e.spec}.ts` | `git mv` por recurso; `start/routes.ts` aponta para `#features/.../<ação>/<ação>.controller`; import do use-case irmão continua relativo (`./<ação>.use-case.ts`) |
| Validators num arquivo só: `app/core/validator.ts` | Backend continua VineJS (nativo do Adonis), um validator por recurso com o mesmo caminho e nome do schema Zod de `shared/src/validators/<módulo>/<recurso>.validator.ts`; regras compartilhadas, `PAGINATION` e mensagens nos três idiomas ficam em `app/core/validator.ts` (`architecture.md` §3, §9; `DECISIONS.md` #241) | Quebrar por recurso; spec de paridade VineJS × Zod confere os campos dos dois lados; a meta-spec varre os dois antes do corte |
| Mensagens do provider em `start/validator.ts` | `app/core/validator.ts` | Mover; `start/` só registra o provider no boot |
| Specs em `tests/functional/<tema>.spec.ts` | `<ação>/<ação>.e2e.spec.ts` (e `<ação>.unit.spec.ts`) ao lado da ação; transversais ao lado do que cobrem (`app/core/validator.unit.spec.ts`, `app/middleware/<nome>.middleware.e2e.spec.ts`); `tests/` só fixtures | Quebrar cada spec de recurso por ação; suítes do Japa `unit` (`app/**/*.unit.spec.ts`) e `functional` (`app/**/*.e2e.spec.ts`), `architecture.md` §3.2 |
| Middleware e policy em snake_case: `app/middleware/<nome>_middleware.ts`, `app/policies/<entidade>_policy.ts` | `app/middleware/<nome>.middleware.ts`, `app/policies/<entidade>.policy.ts` | Renomear + atualizar `start/kernel.ts` e imports `#middleware/*`/`#policies/*` |
| Model em snake_case, se houver | `app/models/<entidade>.ts` em kebab-case | Renomear |
| Service solto: `app/services/<nome>.service.ts` | `app/services/<nome>/<nome>.service.ts` (+ `<nome>.contract.ts` e `<nome>.fake.ts`, só se I/O externo) | Mover; subpath import `#services/*` cobre a profundidade nova |
| `CLAUDE.md` por camada/módulo/recurso + `docs:sync`/`docs:check` | Só `/CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`; operação documentada pelo OpenAPI | Apagar os `CLAUDE.md` internos depois de mover para comentário de use-case o porquê que não está no OpenAPI |
| `PADRAO-BACKEND.md` local + `padrao.manifest.json`/`sync:check` entre irmãos | `_standards/`, `_doc-lib/` e skills via `node scripts/sync-to-project.mjs <dir>`; `--check` à mão a partir do `maiyu-pattern`, nunca no CI | Remover o manifesto e o `PADRAO-BACKEND.md`; `softDeleteExempt` e a lista de ENV fora do leitor vão para a config do `pattern:check` |
| Validators do frontend num arquivo só (`src/lib/validator.ts`) | Zod em `shared/src/validators/<módulo>/<recurso>.validator.ts`, com par de caminho e nome no validator VineJS do backend; `z.config` com as mensagens pt-BR/es/en, formulário por `zodResolver` (`architecture.md` §9; `DECISIONS.md` #241; `_doc-lib/zod.md#error-customization`) | Reescrever cada validator em Zod no `shared/`; apagar a cópia local e trocar `vineResolver` por `zodResolver` (`@hookform/resolvers/zod`); o spec de paridade substitui o script antigo |

### Versões — adacaibs

| Pacote | Atual | Última |
|---|---|---|
| `@adonisjs/core` | ^7.5.0 | 7.6.0 |
| `@adonisjs/lucid` | ^22.4.2 | 22.4.2 |
| `@adonisjs/drive` | ^4.0.0 | 4.0.0 |
| `react-hook-form` | ^7.82.0 | 7.89.0 |
| `@hookform/resolvers` | ^5.4.0 | 5.9.1 |
| `shadcn` | ^4.13.1 | 4.21.4 |
| `tailwindcss` | ^4.1.18 | 4.3.3 |
| `@tanstack/react-query` | ^5.101.4 | 5.104.1 |
| `@tanstack/react-router` | ^1.170.23 | 1.170.42 |
| `@tanstack/react-table` | ^9.1.0 | 9.2.8 |
| `@tiptap/core` | 3.30.5 | 3.31.4 |
| `vite` | ^8.0.0 | 8.3.4 |
| `vitest` | ^4.1.5 | 5.0.3 |
| `@base-ui/react` | ^1.6.0 | 1.9.0 |

---

## lowcodejs

| Item | Onde | Regra | Correção |
|---|---|---|---|
| `apiKey!`/`baseUrl!` sem checagem prévia (5x) | `application/services/chat/internal/llm-chat/llm-chat.service.ts:98,103,109,118,125` | typescript.md §1 | Validar antes de montar `PROVIDERS`, ou estreitar `ResolvedLlmConfig` por provider |
| `messages[i]!` em loop indexado | `application/services/chat/internal/providers/claude-provider.service.ts:158` | typescript.md §1 | `for...of` ou `if (!msg) continue` |
| `mcpClient!` sem checagem na mesma função | `application/services/chat/chat-socket/chat-socket.service.ts:556` | typescript.md §1 | Guard antes da chamada |
| `process.env.NODE_ENV` lido fora de `env.ts` | `application/services/email/email.service.ts:227` | backend-fastify.md §7 | Expor via `Env`/flag dedicada |
| `new X()` em migration/seeder/remodel sem exceção registrada na régua geral | `database/migrations/{08,29,72}*.ts`, `remodels/migrate-fieldgroup-to-relationship.ts`, `seeders/1786000000-default-workspace.seed.ts`, `shared/task-logger.ts`, `migrations/13-*.ts` | backend.md §2.1 | Nenhuma correção de código — registrar a isenção de `database/` na tabela de isenções nomeadas de §2.1 (hoje só no `CLAUDE.md` local) |
| `no-restricted-syntax` de `new *Service\|...` ausente do `eslint.config.js` | `eslint.config.js` (raiz) | tooling.md §4 | Adicionar o bloco; incluir override de `files` para `database/**` |
| Sem `.env.example` | raiz do backend | backend.md §6 | Criar, ou registrar que `.env.test`/`.env.test.import.example` cobrem o papel |
| `userId: string` em vez de `actor` (perfil Fastify) | `notification/_shared.validator.ts:29,36,38,42` + 4 consumidores | backend.md §4.3 | `actor` sai das claims do JWT validadas pelo `ActorSchema`, sem consulta extra por rota (`backend-fastify.md` §3, `DECISIONS.md` #115) |
| Mesmo dado, três nomes (`actorUserId`/`userId`/`ownerId`) | `table/show/show.use-case.ts:22`, `setting/base/show/show.use-case.ts:142`, `table/schema-import/schema-import.use-case.ts:268`, `table/file-import/commit/commit.use-case.ts:71,198` | backend.md §4.3 | Padronizar em `actor` |
| `try/catch` global ausente em use-case | `storage/files/download/download.use-case.ts:39`, `storage/files/changes/changes.use-case.ts`, `storage/migration/status/status.use-case.ts` | backend.md §4.2 | Envolver em `try/catch` com tag `[módulo > recurso > verbo][error]` |
| `as <Tipo>` em fixture de teste sem helper | `extension/toggle/toggle.controller.spec.ts:50,230` | typescript.md §1/§4 | Helper de fixture tipado em vez de `as` |
| 17 `CLAUDE.md` de operação fora do formato (sem `## Endpoint`/`## Testes`, ou com JSON embutido) | 11 arquivos com JSON (`menu/base/bulk-*`, `user-group/base/bulk-*`, `user/base/bulk-*`) + 6 fora do esqueleto (`row/base/bulk-delete`, `row/base/bulk-move-list`, `row/base/empty-trash`, `logger/errors/paginated`, `logger/errors/resolve`, `setting/setup/database`) | backend.md §8 | Remover JSON (forma deriva do validator/model); reformatar os 6 para `## Endpoint`/`## Fluxo`/`## Erros Possiveis`/`## Testes` |
| `as` em frontend sem `satisfies` na origem (3x) | `_private/settings/-components/card-ai-assistant.tsx:50,121`, `table-forum-view.tsx:510` | typescript.md §1 | Tipar na origem em vez de assertar |
| `!` sem guard único (12 acessos no mesmo bloco) | `_private/tables/$slug/-components/field-management/use-table-field-management.ts:93-107` | typescript.md §1 | Um `if (!field.relationship) return` no topo troca os 12 `!` |
| `!` sem narrowing (demais ocorrências) | `calendar-event-dialog.tsx:575,583,594`, `kanban-row-dialog.tsx:1027,1232,1235`, `table-calendar-view.tsx:107`, `table-kanban-view.tsx:794,802` | typescript.md §1 | Guard no topo da função ou type guard no `.filter` |
| `value!`/`children!` sem narrowing (frontend core) | `tree-node.tsx:227`, `tree-list.tsx:201`, `table-field-validations-field.tsx:234,258`, `calendar-helpers.ts:199,200,215`, `menu-ref.ts:43`, `-value-map-sheet.tsx:115`, `cascade-dropdown/index.tsx:329` | typescript.md §1 | Narrow explícito antes do uso, caso a caso (ver `_map/lowcodejs-frontend-core.md`) |
| `useEffect` sincronizando dado de servidor já disponível | `_private/tables/$slug/-components/table-row/field-form-sections.tsx:369-376` | frontend.md §4 | Mover para `onSuccess` da query ou `defaultValues` |
| `pnpm@12.4.1` vs. demais projetos em `11.21.0` | `package.json:7` | tooling.md §0/§1 | Alinhar todos os projetos na mais nova publicada |
| `health-check.*` solto em `features/`, path não conferido | `application/features/health-check.*` | architecture.md §7 | Conferir `GET /health-check`, `200` + `Cache-Control: no-store`, corpo mínimo e sem consulta a banco/frontend |

### Migração estrutural — lowcodejs

| Atual | Alvo (`architecture.md`) | Como |
|---|---|---|
| Raiz `application/` | Raiz `app/` | `git mv application app`; bootstrap do `fastify-decorators` passa a varrer `app/features` |
| Alias `@application/*`, `@database/*`, `@extensions/*` em `tsconfig.json#paths` | Subpath imports `#core/*`, `#features/*`, `#services/*`, `#models/*`, `#middleware/*`, … no `package.json#imports` | Reescrever imports por codemod; remover `paths`; conferir que SWC/Vitest resolvem `#` (nativo do Node) |
| `application/model/` | `app/models/<entidade>.ts` | Mover |
| `application/middlewares/` | `app/middleware/<nome>.middleware.ts` | Mover + sufixo kebab |
| Ação em `features/<x>/<ação>/<verbo>.{controller,use-case}.ts` (um nível só acima da ação) | `app/features/<módulo>/<recurso>/<ação>/<ação>.{controller,use-case,unit.spec,e2e.spec}.ts` | Introduzir o nível que faltar (`<módulo>` ou `<recurso>`); arquivo repete o nome da pasta da ação |
| `_shared.validator.ts` por módulo, em VineJS | Zod em `shared/src/validators/<módulo>/<recurso>.validator.ts`; regra de 2+ recursos vira função em `shared/src/validator.ts` | Reescrever em Zod, separar por recurso; ninguém importa `@vinejs/vine` no backend Fastify, no frontend nem em `shared/` (ESLint `no-restricted-imports`, `DECISIONS.md` #241; `_doc-lib/zod.md#api`) |
| E2E `*.controller.spec.ts` | `<ação>/<ação>.e2e.spec.ts`; unit continua `*.unit.spec.ts` | Renomear; configs do Vitest `unit` e `e2e` (`architecture.md` §8) |
| `start/schema.generated.ts` | `app/core/openapi/schema.generated.ts` | Mover; `openapi:check` confere (`openapi.md`) |
| Middleware em tripla (`-middleware-contract.service.ts` + `-middleware.service.ts` + `.middleware.ts`) | Classe `@Service()` + `hook()` estático em `<nome>.middleware.ts` | `backend-fastify.md` §1 |
| Schema de rota em `@vinejs/vine` 4.4.0 (backend) e `start/env.ts` manual | Zod: rota por `fastify-type-provider-zod` (`validatorCompiler`, `serializerCompiler`, `jsonSchemaTransform` para o `@fastify/swagger`); `start/env.ts` vira `z.object(...).safeParse(process.env)`, síncrono no import, com todas as falhas listadas de uma vez | `DECISIONS.md` #241; `_doc-lib/zod.md#basics`, `#error-formatting`, `#json-schema`; `_doc-lib/fastify-plugins.md#fastify-type-provider-zod`; resposta do OpenAPI por `z.toJSONSchema` |
| Store sobre a collection | Repository Mongo (`<entidade>.mongo.repository.ts`) com contrato e memória | `domain.md` §5 |
| Contrato para service sem I/O (20 ou mais) | Classe `@Service()` concreta | `backend-fastify.md` §3 |
| `actorUserId` no Payload | `actor` | `backend.md` §4.3 |
| `CLAUDE.md` por operação/recurso | Só raiz, backend e frontend; operação pelo OpenAPI (`backend.md` §8) | Apagar depois de mover o porquê para comentário do use-case |
| Validators do frontend num arquivo só (`src/lib/validator.ts`) | Zod em `shared/src/validators/<módulo>/<recurso>.validator.ts`, o mesmo schema nos dois lados (Fastify); `z.config` com as mensagens pt-BR/es/en, formulário por `zodResolver` (`@hookform/resolvers/zod`) (`architecture.md` §9; `DECISIONS.md` #241; `_doc-lib/zod.md#error-customization`) | Mover junto com o corte do backend do mesmo recurso; apagar a cópia do frontend e o script de paridade, que deixa de existir quando o schema é um só |

### Versões — lowcodejs

| Pacote | Atual | Última |
|---|---|---|
| `fastify` | 5.12.3 | 5.12.5 |
| `mongodb` | ^7.6.0 | 7.7.0 |
| `zod` | (novo) | 4.6.7 |
| `fastify-type-provider-zod` | (novo) | 7.0.0 |
| `@vinejs/vine` | ^4.4.0 | sai (`DECISIONS.md` #241) |
| `bullmq` | ^6.3.2 | 6.3.12 |
| `socket.io` | ^4.8.3 | 4.8.4 |
| `isolated-vm` | ^7.0.1 | 6.x enquanto o Node for 24: a 7.x é para o Node 26 (_doc-lib/isolated-vm.md#compatibility) |
| `vitest` (backend) | ^5.0.0 | 5.0.3 |
| `react-hook-form` | ^7.68.0 | 7.89.0 |
| `@hookform/resolvers` | ^5.2.2 | 5.9.1 |
| `shadcn` | ^4.21.2 | 4.21.4 |
| `tailwindcss` | ^4.0.6 | 4.3.3 |
| `@tanstack/react-query` | ^5.66.5 | 5.104.1 |
| `@tanstack/react-router` | ~1.170.1 | 1.170.42 |
| `@tanstack/react-start` | ~1.168.1 | 1.168.61 |
| `@tanstack/react-table` | ^9.2.4 | 9.2.8 |
| `@tiptap/core` | 3.31.3 | 3.31.4 |
| `vite` | ^8.3.0 | 8.3.4 |
| `vitest` (frontend) | ^5.0.1 | 5.0.3 |
| `@base-ui/react` | ^1.0.0 | 1.9.0 |

---

## interclasse

| Item | Onde | Regra | Correção |
|---|---|---|---|
| `!` sem narrow (5 pontos, mesmos do padrão canônico) | `cookie-access-tokens.guard.ts:17` (tipo `A & B`), `account/show.controller.ts:20`, `account/update.controller.ts:32`, `account/update.use-case.ts:64`, `administrator/users/update.controller.ts:40`, `cookie.service.ts:162-163` | typescript.md §1 | `Merge<A,B>` no guard; `if (!value)` nos demais |
| `whereNotNull('deletedAt')` à mão | `administrator/users/unarchive.use-case.ts:25`, `paginate.use-case.ts:33` | backend.md §4.8 | `onlyDeleted` com `withScopes`, ou o scope `trashed(mode)` no model |
| `as unknown as X` em frontend | `hooks/use-resource-form.ts:196`, `http.ts:407`, `components/ui/sonner.tsx:19`, `components/ui/sidebar.tsx:167,223,666` | typescript.md §1 | Tipar na origem; `sidebar.tsx` é saída de shadcn, baixa prioridade |
| Ternário em teste (não isento aqui) | `validator-messages.test.ts:61,84`, `http.test.ts:38` | backend.md §2 (vale para `tests/`) | Extrair variável com `if` antes |
| `PADRAO-BACKEND.md` local ~119 linhas atrás da régua canônica | `/PADRAO-BACKEND.md` | — (meta, `sync-check.ts`) | Copiar a versão atual (onlyDeleted, docs:check, `actor`, §4.6 Bouncer) |
| `padrao.manifest.json::softDeleteExempt` com 4 entradas mortas | `backend/padrao.manifest.json` | backend.md §4.8 | Remover ou confirmar intenção |
| Manifesto não lista o próprio projeto como irmão | `backend/padrao.manifest.json::irmaos` | — (meta) | Adicionar `../../interclasse/backend` ou documentar que o fork não participa do `--propagate` |
| **Autorização sem Bouncer** (gap estrutural, não só estilo) | `backend/app/policies/user_policy.ts`, `backend/app/guards/**` | backend.md §4.6 (reescrito, decisão #20/#21 de `DECISIONS.md`) | Adotar `@adonisjs/bouncer`: policy estende `BasePolicy`, checagem via `ctx.bouncer.with(Policy).authorize/allows/denies/execute`; registrar `app/abilities/main.ts` |

### Migração estrutural — interclasse

| Atual | Alvo (`architecture.md`) | Como |
|---|---|---|
| Ação como par de arquivos no recurso: `app/features/<módulo>/<recurso>/<verbo>.{controller,use-case}.ts` | Pasta por ação: `app/features/<módulo>/<recurso>/<ação>/<ação>.{controller,use-case,unit.spec,e2e.spec}.ts` | `git mv` por recurso; `start/routes.ts` aponta para `#features/.../<ação>/<ação>.controller`; import do use-case irmão continua relativo (`./<ação>.use-case.ts`) |
| Validators num arquivo só: `app/core/validator.ts` | Backend continua VineJS (nativo do Adonis), um validator por recurso com o mesmo caminho e nome do schema Zod de `shared/src/validators/<módulo>/<recurso>.validator.ts`; regras compartilhadas, `PAGINATION` e mensagens nos três idiomas ficam em `app/core/validator.ts` (`architecture.md` §3, §9; `DECISIONS.md` #241) | Quebrar por recurso; spec de paridade VineJS × Zod confere os campos dos dois lados; a meta-spec varre os dois antes do corte |
| Mensagens do provider em `start/validator.ts` | `app/core/validator.ts` | Mover; `start/` só registra o provider no boot |
| Specs em `tests/functional/<tema>.spec.ts` | `<ação>/<ação>.e2e.spec.ts` (e `<ação>.unit.spec.ts`) ao lado da ação; transversais ao lado do que cobrem (`app/core/validator.unit.spec.ts`, `app/middleware/<nome>.middleware.e2e.spec.ts`); `tests/` só fixtures | Quebrar cada spec de recurso por ação; suítes do Japa `unit` (`app/**/*.unit.spec.ts`) e `functional` (`app/**/*.e2e.spec.ts`), `architecture.md` §3.2 |
| Middleware e policy em snake_case: `app/middleware/<nome>_middleware.ts`, `app/policies/<entidade>_policy.ts` | `app/middleware/<nome>.middleware.ts`, `app/policies/<entidade>.policy.ts` | Renomear + atualizar `start/kernel.ts` e imports `#middleware/*`/`#policies/*` |
| Model em snake_case, se houver | `app/models/<entidade>.ts` em kebab-case | Renomear |
| Service solto: `app/services/<nome>.service.ts` | `app/services/<nome>/<nome>.service.ts` (+ `<nome>.contract.ts` e `<nome>.fake.ts`, só se I/O externo) | Mover; subpath import `#services/*` cobre a profundidade nova |
| `CLAUDE.md` por camada/módulo/recurso + `docs:sync`/`docs:check` | Só `/CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`; operação documentada pelo OpenAPI | Apagar os `CLAUDE.md` internos depois de mover para comentário de use-case o porquê que não está no OpenAPI |
| `PADRAO-BACKEND.md` local + `padrao.manifest.json`/`sync:check` entre irmãos | `_standards/`, `_doc-lib/` e skills via `node scripts/sync-to-project.mjs <dir>`; `--check` à mão a partir do `maiyu-pattern`, nunca no CI | Remover o manifesto e o `PADRAO-BACKEND.md`; `softDeleteExempt` e a lista de ENV fora do leitor vão para a config do `pattern:check` |
| Validators do frontend num arquivo só (`src/lib/validator.ts`) | Zod em `shared/src/validators/<módulo>/<recurso>.validator.ts`, com par de caminho e nome no validator VineJS do backend; `z.config` com as mensagens pt-BR/es/en, formulário por `zodResolver` (`architecture.md` §9; `DECISIONS.md` #241; `_doc-lib/zod.md#error-customization`) | Reescrever cada validator em Zod no `shared/`; apagar a cópia local e trocar `vineResolver` por `zodResolver` (`@hookform/resolvers/zod`); o spec de paridade substitui o script antigo |

### Versões — interclasse

| Pacote | Atual | Última |
|---|---|---|
| `@adonisjs/core` | ^7.5.0 | 7.6.0 |
| `@adonisjs/lucid` | ^22.4.2 | 22.4.2 |
| `@adonisjs/drive` | ^4.0.0 | 4.0.0 |
| `react-hook-form` | ^7.82.0 | 7.89.0 |
| `@hookform/resolvers` | ^5.4.0 | 5.9.1 |
| `shadcn` | ^4.13.1 | 4.21.4 |
| `tailwindcss` | ^4.1.18 | 4.3.3 |
| `@tanstack/react-query` | ^5.101.4 | 5.104.1 |
| `@tanstack/react-router` | ^1.170.23 | 1.170.42 |
| `@tanstack/react-table` | ^9.1.0 | 9.2.8 |
| `vite` | ^8.0.0 | 8.3.4 |
| `vitest` | ^4.1.5 | 5.0.3 |
| `@base-ui/react` | ^1.6.0 | 1.9.0 |

---

## maiyu.com.br (frontend)

| Item | Onde | Regra | Correção |
|---|---|---|---|
| `VITE_API_URL` lido direto, sem `env.ts` | `src/integrations/tanstack-query/http.ts:143` | frontend.md §3 | Extrair para `src/env.ts` (`architecture.md` §4) |
| Health check em `GET /health` | `src/routes/health.ts` | architecture.md §7 | Renomear para `src/routes/health-check.ts` (`GET /health-check`); atualizar o probe do deploy junto |
| Ternário só em código gerado (`paraglide`), fora de autoria do time | `src/paraglide/runtime.js`, `server.js` (20 ocorrências) | typescript.md §2 | Nenhuma ação — fora do critério de autoria |

### Migração estrutural — maiyu.com.br (frontend)

| Atual | Alvo (`architecture.md`) | Como |
|---|---|---|
| Validators do frontend num arquivo só (`src/lib/validator.ts`), onde houver formulário | Zod em `shared/src/validators/<módulo>/<recurso>.validator.ts`, com par de caminho e nome no validator VineJS do backend; `z.config` com as mensagens pt-BR/es/en, formulário por `zodResolver` (`architecture.md` §9; `DECISIONS.md` #241; `_doc-lib/zod.md#error-customization`) | Reescrever cada validator em Zod no `shared/`; apagar a cópia local e trocar `vineResolver` por `zodResolver` (`@hookform/resolvers/zod`); o spec de paridade substitui o script antigo |

### Versões — maiyu.com.br (frontend)

| Pacote | Atual | Última |
|---|---|---|
| `react-hook-form` | ^7.82.0 | 7.89.0 |
| `@hookform/resolvers` | ^5.4.0 | 5.9.1 |
| `shadcn` | ^4.13.1 | 4.21.4 |
| `tailwindcss` | ^4.1.18 | 4.3.3 |
| `@tanstack/react-query` | ^5.101.4 | 5.104.1 |
| `@tanstack/react-router` | ^1.170.23 | 1.170.42 |
| `@tanstack/react-start` | ^1.168.40 | 1.168.61 |
| `@tanstack/react-table` | ^9.1.0 | 9.2.8 |
| `@tiptap/core` | 3.30.5 | 3.31.4 |
| `use-mask-input` | ^3.13.0 | 3.14.2 |
| `vite` | ^8.0.0 | 8.3.4 |
| `vitest` | ^4.1.5 | 5.0.3 |
| `@base-ui/react` | ^1.6.0 | 1.9.0 |

---

## academy

Backend AdonisJS com Lucid; o roteiro sai do mapa canônico de 2026-11 (`_map/canon-2026-11/`).

### Migração estrutural — academy

Plano canônico de 2026-11 (`DECISIONS.md` #362; fases e tamanhos como em simple-hub). Passo G: o mais
longe entre os Adonis (sem `shared/`, sem `domain/`, 152 imports de model), feito com a régua estável.

| Fase | Item | Tam. |
|---|---|---|
| 0 | SEC-2, SEC-4, SEC-5 (handler 500, throttle da troca de senha, oráculo do cadastro); `same-site` inválido devolve `lax`; `origin` pela forma canônica; `verify-email` por `POST`; limiters de refresh, export, convite e sala; CSP da API | M |
| 1 | criar `shared/` (Zod, responses, enums, `either.ts`) e ligar ao workspace da raiz; tirar lockfile e `pnpm-workspace.yaml` do frontend; `@vinejs/vine` sai do front | G |
| 1 | Markdown das aulas para JSON do Tiptap por `MarkdownManager.parse` no backend (#323), antes de trocar a tela; `react-markdown` e `rehype` saem; Paraglide 3 confirmado como o da casa ou volta a 2 (ler `#/changelog`) | G |
| 1 | `next-themes` sai (tema por cookie); Argon2; Tuyau como transporte do `request()` (#324) | M |
| 2 | `domain/` e `repositories/` para os 24 models; tirar 152 imports de `#models/*` de `features/` e 33 de `services/`; `services` para `features` (27) | G |
| 2 | 32 `features/<m>/<r>/<r>.validator.ts` para `app/validators/<m>/<r>.validator.ts` e o par Zod (#326) | M |
| 2 | 124 `<ação>.spec.ts` para `<ação>.e2e.spec.ts` e `<ação>.unit.spec.ts` novos; `services/<n>/<n>-contract.service.ts` (7) para `<n>.contract.ts` e `.fake.ts`; specs de middleware e core renomeados | G |
| 2 | `core/{either,entity,aggregate}.ts` saem; `core/locale.ts` e `request-locale.ts` viram middleware de idioma e `I18n` injetado (#334); `start/{mail,scheduler,transmit}.ts` ficam (#351); `scripts/{lessons-import,quiz-reorder}.ts` viram comandos (#348); `check-report.ts` vira o do kit; `database/*.spec.ts` para o lado do seeder; `database/content/` para `database/data/` (#354) | G |
| 2 | serviços de domínio de e-mail (`notification`, `token-link-mail`) viram composição no use-case com `MailContract` | M |
| 3 | 20 `index.ts`; 33 peças soltas em pasta; `rich-editor` (Markdown, prefixo `I`, `IMerge`) vira o do kit; `rich-text` do kit; `empty-state` (hoje `section-card`); `masked-input` vira `FieldMask` (#325); `queries.ts` e `mutations.ts` únicos viram um por módulo; `invalidate.ts`; `integrations/response.ts` sai | G |
| 3 | rotas: `validateSearch` inline para `-search.ts`; `new/index(.lazy).tsx` para `new(.lazy).tsx`; `$id/edit/index` para `$id/edit`; `routes/authentication/` vira server route em `_public/`; `routeFileIgnorePattern` para os testes em `routes/`; `lib/` com `form-a11y`, `load-or-not-found`, `local-store` | M |
| 4 | `.cta.json`, `.cursorrules`, `.vscode/`, `.idea/`, `tsr.config.json` saem; `.dockerignore` na raiz; `tmp/.gitkeep` sai; fixture de erros no e2e; porta pela tabela de `tooling.md` §8.4 | P |

---

## Todos os projetos: regras de 2026-11-08 sem projeto aplicando

Entram como item na fase 1 ou 2 de cada projeto abaixo e dos de cima, onde ainda faltarem.

| Regra | Onde ela mora |
|---|---|
| nome do cookie de sessão com prefixo `__Host-` ou `__Secure-` (`DECISIONS.md` #320) | `backend.md` §4.10 |
| hash de senha Argon2, com rehash no login (`DECISIONS.md` #314) | `backend.md` §5.6, item 6 |
| `keepAliveTimeout` acima do timeout do proxy | `backend.md` §5.6, item 7 |
| log do use-case pelo `ctx.logger` (`DECISIONS.md` #314) | `backend.md` §4.2 |
| `disableRollbacksInProduction` (`DECISIONS.md` #291) | `backend.md` §4.13 |
| `verbatimModuleSyntax: false` no frontend (`DECISIONS.md` #319) | `tooling.md` §3 |
| teste de contrato com as implementações como dataset (`DECISIONS.md` #316) | `domain.md` §5.4 |

Ordem entre projetos: adacaibs, interclasse, curupira, aporta, simple-hub, academy, lowcodejs,
manganga, matiscraft. Passa ao próximo só com `sync-to-project.mjs <dir> --check`
limpo no anterior, `pnpm check` verde, suítes pesadas uma vez antes do PR e deploy com healthcheck
verde.

## Todos os projetos: rótulo de campo e teto de lista saem do kit

O `shared/src/validator.ts` e o `resources/lang/<l>/validator.json` do kit passam a ter só os
rótulos que o próprio kit valida (sessão, storage, usuário, listagem), e `LIST_LIMITS` sai dos dois
`validator.ts`. O sync seguinte sobrescreve os dois arquivos: o rótulo de recurso e o teto de lista
que o projeto tinha ali somem no mesmo passo, e o typecheck quebra onde `LIST_LIMITS` era importado.

| Hoje | Vira | Como |
|---|---|---|
| rótulo de recurso (`title`, `tags`, `coverId`...) em `FIELD_LABELS` do `shared/src/validator.ts` | `PROJECT_FIELD_LABELS` em `shared/src/records/field-labels.ts` (KIT.md §3.4) | o sync cria o arquivo vazio quando falta; antes do sync, copiar para ele as chaves que não são do kit, nos três idiomas |
| o mesmo rótulo em `shared.fields` do `resources/lang/<l>/validator.json` | `resources/lang/<l>/validator/shared/fields.json`, só as chaves do projeto, sem o prefixo | o `lang.unit.spec.ts` acusa a chave do shared que falta no backend |
| `LIST_LIMITS` em `shared/src/validator.ts` e em `backend/app/core/validator.ts` | `LIST_LIMITS` em `shared/src/records/list-limits.ts`, uma cópia, importada de `@<projeto>/shared` pelos dois lados | trocar o import nos validators que o usam; projeto sem lista com teto não cria o arquivo |

---

## curupira

Mesma origem do interclasse: os itens da seção dele valem aqui, mais estes.

| Fase | Item | Tam. |
|---|---|---|
| 0 | upload anônimo da denúncia: decisão do dono, exceção nomeada com limite forte ou dono técnico (`DECISIONS.md` #363) | P e dono |
| 0 | `Dockerfile-production:52-55`: `STORAGE_SECRET` sai do `ENV`; `start.ts` com CSRF; CSP da API | P |
| 2 | itens do interclasse (6 entity specs, 7 refusals, core, specs soltos, scripts extras, `sync-check.ts`) | M |
| 2 | `domain/neighborhood/nearest-neighborhood.ts` (função solta) vira classe `neighborhood.<conceito>.ts`; `core/{cors-origins,instant,local-day,report-photo-key,semaphore}.ts` conferidos pelo critério de `core/<tema>.ts` (#340); `report-photo-key` para `domain/report/` ou `services/storage/` | M |
| 2 | `database/seeders/assets/` para `database/data/<n>/` (#354) | P |
| 3 | 26 `index.ts`; `table/` reduzida vira a do kit; `option-select/` monta `OptionCombobox`; `_private/management/layout.tsx` (guard de área) no lugar dos 3 por recurso; `-schema.ts` x2 para o shared | M |
| 4 | e2e do interclasse; porta nova pela tabela de `tooling.md` §8.4 (colidia com aporta em 9006/9007) | P |

## aporta

| Fase | Item | Tam. |
|---|---|---|
| 0 | `.dockerignore` com `**/` (kit); se alguma imagem saiu para registry, rotacionar o que o `backend/.env` tinha | P e dono |
| 0 | criar `src/start.ts` (CSRF e `requestScope`) e `http.server.test.ts`; `env.ts` com `throw`, sem `localhost` | P |
| 1 | `@tanstack/react-table` entra com a primeira listagem do kit; Argon2; tema por cookie (`integrations/theme/get-theme.ts`, hoje `lib/theme.ts`); Tuyau como transporte do `request()` (#324) | M |
| 2 | presenters `_shared.{listing,place,profile}.presenter.ts` ficam (#341); `_shared.storage-orphans.e2e.spec.ts`, `storage.e2e.spec.ts` e `storefront.e2e.spec.ts` viram spec das ações; `listing.repository.ownership.e2e.spec.ts` vira casos no spec de contrato; `tests/listing-repository-subject.ts` fundido em `listing-fixtures.ts` | M |
| 2 | arquivar por `PATCH :id/archive` (hoje `DELETE :id`), status pela tabela (#345); `unit-of-work/` com 0 usos sai até a primeira transação | M |
| 2 | upload pela canônica (multipart em `storage`, `content-length`, claim); `staff-create` vira o comando canônico de criar o primeiro admin | M |
| 3 | 35 `index.ts`; `confirm-dialog`, `empty-state`, `not-found-page`, `modal-dialog`, `pagination-nav`, `search-pill`, `queue-search`, `segmented-filter`, `filter-bar`, `action-button`, `pill-button`, `field`, `form-notice` trocados por peça do kit ou `ui/` | G |
| 3 | `invalidate.ts` com `DEPENDENTS`; `-components/use-enter-session.ts` para `-use-enter-session.ts`; `lib/*-failure.ts` (x5), `*-form.ts` e `zod-jitless.ts` para `-<tema>.ts` das rotas; `paraglide.config.ts`; `.env.production` | M |
| 4 | `tmp/.gitkeep` sai; `styles.css` com `.dark` e escala `--z-*`; `docs/` sem Docker Hub e workflows | P |

## manganga

Monorepo da casa desde `e7bdde2` (#365): o antigo `jhollyfer/manganga.api` (Fastify com Prisma) está em
`backend-old/` e migra para `backend/` em Adonis com Lucid; o front é `frontend/`.

| Fase | Item | Tam. |
|---|---|---|
| 0 | backend: refresh aceito como access (conferir `type`); refresh sem verificação; hash na resposta (presenter); `role()` em `administrator/*`; log de headers; tempo e limite no login; tetos de `perPage` e `page` | M |
| 0 | backend: dono: `backend-old/prisma/seeders/{users,members,responsibles}.csv` (CPF, RG, nascimento) fora do repositório e do histórico do manganga e do antigo `jhollyfer/manganga.api` | P e dono |
| 0 | frontend: `env.ts` com `throw` (nada de `localhost` em build); `server.ts` com cabeçalhos; `start.ts` com CSRF; pedido sem CPF no `localStorage` (ou com validade) | P |
| 1 | backend: Adonis 7, Lucid, VineJS, Argon2 e `@adonisjs/auth`; `xlsx` não migra (avaliar o export) | G |
| 1 | frontend: `package.json` na raiz e workspace `backend/`, `frontend/` e `shared/` (#365); `@vinejs/vine` sai; `date-fns` para Luxon; `next-themes` para tema por cookie; `@base-ui/react` e `@tanstack/react-table` sobem | M |
| 2 | backend: `app/controllers` e `app/use-case` para `features/<m>/<r>/<ação>/`; `get-by-id` para `show`, `list-paginated` para `paginate`; `dashboard` para `administrator/dashboard/show/`; `welcome` para `health-check.controller.ts`; validators para `app/validators/` com o Zod no `shared/`; `domain/`, `repositories/`, `models/`, `database/migrations/` (de `prisma/schema.prisma`), `providers/`, `tests/`; `backend-old/` sai quando o `backend/` cobrir as rotas dele | G |
| 2 | frontend: `routes/health.ts` para `health-check.ts`; `robots[.]txt.ts` (sai o `public/robots.txt`); `http.ts` canônico e `http.server.ts`; `queries.ts` e `mutations.ts` em pastas; `_query-keys.ts`, `invalidate.ts`; hooks em `-components/use-*.ts` (4) para `-use-<nome>.ts`; `lib/{utils,entity,interfaces,model,validator}.ts` redistribuídos; `lib/store/` para `lib/store-<tema>.ts`; `_private/painel/layout.tsx` (guard de área quando a API tiver papel) | M |
| 3 | frontend: recebe o kit inteiro (hoje 5 peças); `brand-mark`, `not-found-page` e `theme-toggle` viram as do kit; `scenery` fica; crédito em `lib/site.ts` vira `MaiyuCredit`; `components/common/CLAUDE.md` sai; os 35 arquivos de `ui/` sem consumidor ficam (registry inteiro, #299) | M |
| 3 | frontend: i18n: `paraglide.config.ts`, `inlang check`, chaves em snake; renomear as 503 chaves é decisão do dono (#197) | M e dono |
| 4 | backend: `.env.example` do modelo (sem `JWT_*`, `ADMIN_*` para `SEED_OWNER_*`, sem credencial `hydra`); `credential-generator.sh` sai; compose e Dockerfile da casa | M |
| 4 | frontend: `e2e/` inteiro (config, `support/test.ts`, `pages.spec.ts` da vitrine); `.cta.json`, `.vscode/` e `tsr.config.json` saem; workflows e secrets saem | M |

## matiscraft

Fastify com Prisma, migra para Adonis com Lucid e tem o front refeito: o maior risco, por último, sobre
a régua já provada.

| Fase | Item | Tam. |
|---|---|---|
| 0 | **antes de tudo, no código atual**: `jwtVerify` (S1); dono rotaciona chave RSA e Mailtrap, workflow sai, histórico limpo (S2) | P e dono |
| 0 | `password` fora das respostas (S3, SEC-2); `PermissionMiddleware` nega sem usuário (S4); upload e delete com sessão e posse (S5); IDOR (S6); listagem pública só de aprovados, com DTO (S7); rascunho filtrado (S8); upload com allowlist e sem SVG inline (SEC-1); `rehypeRaw` sai da vitrine (XSS) | M |
| 0 | QueryClient por requisição (S9); guard de papel no front (S10); rate limit registrado com `trustProxy` (S11, SEC-7); helmet (SEC-8); enumeração (S12, SEC-3, SEC-4); cookie `maxAge` e sign-out (S13, S14); seeder de faker com guarda (SEC-9); tetos (SEC-10, SEC-16); doc fora de produção (SEC-17) | M |
| 1 | Adonis 7, Lucid, VineJS, `@adonisjs/auth` e Argon2 (rehash ou reset); front: Radix (26) para Base UI, axios para o `request()` sobre Tuyau (#324), zustand sai, `react-markdown` para o renderer estático do Tiptap com o dado migrado para JSON, `jsonwebtoken`, `@modelcontextprotocol/sdk`, `@t3-oss/env-core`, `next-themes` e `vite-tsconfig-paths` saem, i18n para Paraglide | G |
| 2 | `application/` para `app/`; `resources/<m>/<r>/<a>/` para `features/<m>/<r>/<a>/`, toda ação com módulo; 69 `.schema.ts` para `app/validators/` (Vine) com o Zod no shared, deduplicados (approve x6, `SectionSchema` x5); 76 `.doc.ts` para `OpenApiDocs.defineDocs`; `repositories/<e>-repository/*` para `repositories/<e>/*` com spec de contrato; `domain/` a partir de `core/entities.ts`; migrations a partir do `schema.prisma`; seeders para `database/seeders/` e `dev/demo.ts`; `services/email` para `services/mail`; presenters (#315) | G |
| 3 | `common/` reescrito no kit (36 soltos); front refeito por rota (par `.lazy`, `-components/`, layouts de área, `start.ts`, `server.ts`, `http.ts`, `invalidate.ts`); `dialog-*-report.tsx` e `edit-*-profile-sheet.tsx` ficam como domínio sobre o kit; PDF no servidor | G |
| 4 | `package.json` na raiz (o sync não roda sem); pnpm no lugar de `package-lock.json`; `Dockerfile-production`, `prettier.config.js`, `vitest.config.ts`, `check-chunk-cycles.mjs`; `e2e/` inteiro; `.cta.json`, `.vscode/`, `.prettierrc` e `dockerfile-development` saem; 7 workflows saem | G |

## jhollyfer.com.br

Portfólio pessoal, só frontend com `shared/` mínimo (#361), hoje em Next.js 15 com publicação por Actions e
Docker Hub. Achados com ID em `_findings/jhollyfer.com.br.md`.

| Fase | Item | Tam. |
|---|---|---|
| 0 | sync da régua; `AGENTS.md` do modelo, `CLAUDE.md` com `@AGENTS.md`, `docs/` da casa (DOC-1 a DOC-14, ARV-20 a ARV-24) | M |
| 0 | `.github/workflows/` sai e o README perde Vercel e Actions (SEC-1, INF-10, INF-17, #369); secrets e Coolify com o dono (INF-9) | P e dono |
| 0 | cabeçalhos de segurança, `poweredByHeader` desligado, limite e honeypot no contato, `.max(254)` no e-mail (SEC-2, SEC-4 a SEC-6) | P |
| 0 | `Dockerfile-production` multi-stage no molde do academy, `USER node`, digest, `/health-check` com `HEALTHCHECK` (INF-1 a INF-5, INF-11, INF-12); troca pelo do kit quando chegar | M |
| 0 | "Enviar outra" sem os campos em erro (FRM-5) | P |
| 0 | dono: destino do contato (SEC-3), CV (TST-3), autoria (INF-8), `.claude/settings.json` (TST-12) | dono |
| 1 | linha de base E2E no site atual antes de qualquer troca (TST-2) | M |
| 1 | workspace pnpm `frontend/` e `shared/`, Node 24, TypeScript, tsconfig, ESLint, Prettier, husky, commitlint, scripts de check (STK-7 a STK-17, TST-8 a TST-10, INF-7, INF-13, INF-16) | G |
| 1 | TanStack Start, Paraglide (pt-BR, en, es; `en-US` vira `en` com o dono), Phosphor, Base UI via shadcn, `motion/react`, Luxon, tema por cookie (STK-1 a STK-6, STK-18 a STK-21, ARV-1, ARV-2, ARV-11, ARV-14, ARV-16 a ARV-19, RTA-1 a RTA-3, I18N-1 a I18N-3, I18N-6, I18N-8, I18N-14, CMP-12 a CMP-15, TS-8) | G |
| 2 | árvore da régua: `templates/` para `-components/`, `lib/` redistribuído, `shared/src/{enums,records,validators}`, `LocalizedText` no conteúdo (ARV-3 a ARV-10, ARV-13, ARV-15, ARV-25 a ARV-28, I18N-4, I18N-5, I18N-7, I18N-11, I18N-12) | G |
| 2 | tipos: sem `interface`, `as`, ternário, função solta; `readonly`; enums pela trinca (TS-1 a TS-14) | M |
| 2 | SEO: canonical, hreflang, sitemap, robots, `X-Robots-Tag` fora de produção, JSON-LD (RTA-4 a RTA-6, RTA-9, RTA-10) | M |
| 3 | kit inteiro e #366: `ui/` do shadcn, seletor de idioma, abas, tema, gaveta como Sheet, links como Button, `Picture`, ícones locais, `MaiyuCredit`, `brand-mark`, `route-status`, formulário com RHF e `AppField` (CMP-1 a CMP-11, CMP-16 a CMP-20, FRM-1 a FRM-10, RTA-7, SEC-11, I18N-10, I18N-13, TS-12) | G |
| 4 | Vitest e Playwright com axe, `.env.e2e.example`, `pnpm audit`, Dockerfile do kit, `docs/ARCHITECTURE.md` §9.1 (TST-1, TST-5 a TST-7, TST-16 a TST-18, STK-12, STK-23, DOC-12) | M |
