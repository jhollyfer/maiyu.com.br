# Tarefas do projeto

**Maiyu** · divididas em fases

> Roteiro do projeto. Detalhe de uma feature feita com `tlc-spec-driven` mora em
> `.specs/features/<feature>/tasks.md`; aqui a linha aponta para lá.
> Atualiza no mesmo commit em que a tarefa começa ou termina.

**Resumo:** 9 tarefas de produto (7 feitas, 2 a fazer) e 47 itens de migração para a régua (todos a fazer); atualizado 2026-11-09

Status: `A fazer` · `Em andamento` · `Feita` · `Bloqueada` (com motivo nas notas).
Prioridade: `Alta` · `Média` · `Baixa`.

## Fase 1 · Base (4/4)

Site no ar no padrão da casa, em três idiomas.

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 1.1 | Migrar o site para TanStack Start no padrão do academy | Alta | Feita | |
| 1.2 | Idioma na URL com paraglide (pt-BR, en, es) | Alta | Feita | `DECISIONS.md` #2 |
| 1.3 | Deploy da imagem Nitro no Coolify | Alta | Feita | `DECISIONS.md` #5 e #8 |
| 1.4 | Mapa da borda e time por ofício na home | Média | Feita | |

## Fase 2 · Posicionamento (0/3)

Dizer, no site, quem é a Maiyu: tríplice fronteira, equipe indígena e originária da região.

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 2.1 | Reposicionar a vitrine: copy indígena/tríplice fronteira e design mais amazônico | Alta | Feita | checklist abaixo; aguarda PR |
| 2.2 | Decidir os workflows de `.github/workflows` com o dono ou ajustar o upstream | Média | Feita | cópia do modelo, como nos irmãos (`DECISIONS.md` #6) |
| 2.3 | Definir o destino dos formulários de contato e candidatura | Média | A fazer | `PRD.md` §8 |
| 2.4 | Redesign editorial: fotografia do lugar, Fraunces nos títulos, cinco produtos no portfólio, diário e carreiras reescritos no contexto | Alta | Feita | `DECISIONS.md` #12 e #13 |

Checklist da 2.1:

- [x] Sincronizar com o maiyu-pattern
- [x] Preencher `AGENTS.md` e `docs/`
- [x] Copy em pt-BR, en e es
- [x] JSON-LD `areaServed` (Brasil, Peru, Colômbia)
- [x] Design amazônico
- [x] Verificação visual

## Fase 3 · Medição (0/1)

| # | Tarefa | Prioridade | Status | Notas |
|---|---|---|---|---|
| 3.1 | Definir metas e a ferramenta de métricas | Baixa | A fazer | depende de `PRD.md` §8 |

## Migração para a régua (rodada canon-2026-11)

Aplicar o `maiyu-pattern` inteiro, sem exceção local (`_standards/tooling.md` §10.7, `DECISIONS.md` #364
a #369 do upstream). Origem: a varredura de 2026-11-08 (154 achados depois do cético, levada ao upstream
como `_findings/maiyu.com.br.md`) e o `sync --check` (85 `diverge` de espelho, 326 `sobra`, `falta:
shared/package.json`). Tamanho: `P` até um dia, `M` alguns dias, `G` item que se quebra em plano
(`tlc-plan`). Uma PR por fase ou por item G; o merge é do dono.

### Régua 0 · Segurança

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| R0.1 | Cabeçalhos de segurança e `X-Robots-Tag` fora de produção no `server.ts` | P | A fazer | SEGURANCA.md; ARVORE.md |
| R0.2 | JSON-LD serializado com `<` escapado | P | A fazer | SEGURANCA.md |
| R0.3 | Formulários de contato e candidatura deixam de anunciar envio que não acontece | P | A fazer | dono decide o destino (R2.10); até lá, sem coletar dado pessoal à toa |
| R0.4 | `.gitignore` cobre `.env.*` e `src/paraglide/`; `.gitleaks.toml` da raiz | P | A fazer | `tooling.md` §6, KIT.md §3.3 |
| R0.5 | `.claude/settings.json` com `attribution` vazio e guarda `PreToolUse` | P | Bloqueada | dono: agente não edita `settings.json` |

### Régua 1 · Stack e tooling

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| R1.1 | Sync dos espelhos (`_doc-lib/`, `_standards/`, skills, `SKILLS-MAP.md`) e remoção das sobras | P | A fazer | `sync --check` |
| R1.2 | Monorepo da casa: `pnpm-workspace.yaml` do modelo, `shared/` mínimo (`@maiyu/shared`), nome `@maiyu/frontend` | M | A fazer | destrava o `code-diverge`; `tooling.md` §1 |
| R1.3 | Husky e commitlint na raiz (`prepare`, `.husky/` do kit, teto de 72) | P | A fazer | `tooling.md` §6 |
| R1.4 | Zod no lugar do VineJS no frontend; validators em `shared/src/validators/`, `zodResolver` | M | A fazer | #241; MIGRATIONS.md |
| R1.5 | Libs fora da casa saem: `react-markdown`, `remark-*`, `rehype-*`, `date-fns`, `next-themes`, `motion` sem uso | M | A fazer | `tooling.md` §0.1 |
| R1.6 | Luxon nas datas; Tiptap `static-renderer` no diário | M | A fazer | `tooling.md` §0.1 |
| R1.7 | Versões na última publicada (nitro, vitest 5, eslint 10, pnpm 12, `@tanstack/*-query` exata) | M | A fazer | `tooling.md` §0; MIGRATIONS.md |
| R1.8 | `tsconfig` com as flags do piso | P | A fazer | `tooling.md` §3 |
| R1.9 | ESLint pelo bloco comum e o do frontend, `--max-warnings 0`, #366 cobrada | M | A fazer | `tooling.md` §4.1, §4.2 |
| R1.10 | `src/env.ts`, `.env.example` canônico, `frontend/.env.production` com `VITE_SITE_URL` | P | A fazer | `architecture.md` §4; ENV do modelo |
| R1.11 | `src/start.ts` com CSRF e escopo por requisição | P | A fazer | ARVORE.md |

### Régua B · Backend inicial (item G, sub-sessão)

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| RB.1 | `backend/` AdonisJS 7 + Lucid + PostgreSQL a partir do esqueleto de `_templates/code/backend` | G | Bloqueada | aguarda a leva 2 do modelo (esqueleto, user, seeder) |
| RB.2 | `/health-check`, OpenAPI, i18n do backend nos três idiomas, specs do modelo | M | A fazer | depois de RB.1 |
| RB.3 | Sessão do dono: seeder por `SEED_OWNER_*` (#329), revogação de sessão em update de conta | M | A fazer | roteiro do simple-hub |
| RB.4 | `backend/.env.example` do modelo, `docs/ENV.md` e `Dockerfile-production` do backend | P | A fazer | |
| RB.5 | Tuyau dentro do `request()` no frontend | M | A fazer | #324; depois de RB.1 |

### Régua 2 · Árvore e camadas

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| R2.1 | `.lazy.tsx` como stub; tela em `-components/` da rota | M | A fazer | ARVORE.md |
| R2.2 | Peças no ancestral certo; `common/` só o que 2+ rotas usam | M | A fazer | CANONICAS.md |
| R2.3 | `lib/entity.ts` e `lib/interfaces.ts` na árvore; enums com a trinca canônica | M | A fazer | |
| R2.4 | Conteúdo editorial (artigos, projetos, vagas, fotos) fora de `lib/` | G | A fazer | forma depende de R2.10 |
| R2.5 | Head e SEO num lugar só; sitemap com hreflang; `robots` por ambiente | M | A fazer | |
| R2.6 | `src/assets/`, `public/` só com o que a árvore pede | M | A fazer | |
| R2.7 | Busca do diário pela forma canônica do `validateSearch` | P | A fazer | |
| R2.8 | Código em inglês: comentários, JSDoc, `Merge` no lugar de `&`, `satisfies` | G | A fazer | `typescript.md` |
| R2.9 | Código morto do registry fora de `hooks/` e `lib/`; arquivos que a árvore manda tirar | P | A fazer | |
| R2.10 | Proposta ao dono: o que vira recurso do backend (contato, candidatura, conteúdo) | P | A fazer | sem inventar domínio |

### Régua 3 · Kit do frontend (espera o aviso da regente geral)

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| R3.1 | Cópias locais trocadas pelo kit (`lib/utils`, `form-a11y`, `highlighter`, hooks) | M | Bloqueada | aguarda o kit |
| R3.2 | Formulários com `FormShell`, `AppField`, `SubmitButton`, `HydratedFieldset` | M | Bloqueada | #325, #366 |
| R3.3 | Peças do kit no lugar das locais: seletor de idioma e de tema, `route-status`, `MaiyuCredit`, `Picture` | M | Bloqueada | #366 |
| R3.4 | #366 no resto: cards, badges e links crus trocados por `ui/` | M | Bloqueada | |
| R3.5 | Chaves de mensagem em `snake_case` por área, `kit_*` fundidas | G | Bloqueada | `i18n.md` |
| R3.6 | `components/ui/` só com o que tem consumidor; sem `@radix-ui` | M | Bloqueada | `frontend.md` §6; revoga #11 |

### Régua 4 · Testes e infra

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| R4.1 | Sem `.github/workflows/`, com o Dockerfile multi-stage na mesma PR | M | A fazer | #298, #368, #369; o dono troca o Coolify antes do merge |
| R4.2 | `Dockerfile-production` multi-stage pelo modelo do academy; `.dockerignore` na raiz | M | A fazer | `tooling.md` §8.2 |
| R4.3 | `dependabot.yml` e `.editorconfig` do modelo | P | A fazer | `tooling.md` §9 |
| R4.4 | E2E Playwright dos fluxos públicos | G | A fazer | `tooling.md` §7 |
| R4.5 | Unitários com nome e lugar canônicos; contratos por regex viram teste do que se vê | M | A fazer | `tooling.md` §10.6 |
| R4.6 | `check` com `test:unit`; `test:e2e` e `test:changed` | P | A fazer | |

### Régua D · Documentação

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| RD.1 | `AGENTS.md` pelo modelo de `_templates/AGENTS.md`, `CLAUDE.md` com `@AGENTS.md` | P | A fazer | texto vai à regente geral antes da troca |
| RD.2 | `docs/` reescrito a partir dos modelos e do código; DECISIONS locais que eram desvio marcadas como substituídas | M | A fazer | #6, #8, #9, #10, #11, #14 |
| RD.3 | `ARCHITECTURE.md` §9.1 com o que o painel do Coolify faz | P | A fazer | modelo do academy |
| RD.4 | `frontend/README.md`, `frontend/AGENTS.md` e `components/common/CLAUDE.md` pela régua | P | A fazer | |

## Fase N · Ideias (fora do escopo atual)

- Envio real dos formulários, quando houver endpoint (origem: `PRD.md` §5)
- Painel de edição de conteúdo (origem: `PRD.md` §5)

---

## Como escrever uma tarefa

| Campo | Exemplo |
|---|---|
| Tarefa | Criar formulário de tarefa |
| Entradas | título e data de entrega |
| Validação | título obrigatório |
| Pronta quando | tarefa salva aparece na lista |

Antes de começar, a tarefa tem: um resultado claro, dependências listadas, arquivos
identificados e critério de aceite. Ao terminar: resultado revisado e status atualizado.
