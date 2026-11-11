# Tarefas do projeto

**Maiyu** · divididas em fases

> Roteiro do projeto. Detalhe de uma feature feita com `tlc-spec-driven` mora em
> `.specs/features/<feature>/tasks.md`; aqui a linha aponta para lá.
> Atualiza no mesmo commit em que a tarefa começa ou termina.

**Resumo:** 9 tarefas de produto (7 feitas, 2 a fazer) e 48 itens de migração para a régua (26 feitos, 1 em andamento, 3 bloqueados, 18 a fazer); atualizado 2026-11-11

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
| 2.3 | Definir o destino do formulário de contato (a candidatura ficou fora) | Média | A fazer | `PRD.md` §8; `DECISIONS.md` #17 |
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
| R0.1 | Cabeçalhos de segurança e `X-Robots-Tag` fora de produção no `server.ts` | P | Feita | `frontend.md` §3.3, #356; pronto na branch `fix/seguranca-cabecalhos`; merge feito; sem erro de CSP no console em `/pt-br` e num artigo |
| R0.2 | JSON-LD serializado com `<` escapado | P | Feita | `frontend.md` §9.7; `docs/SECURITY.md` |
| R0.3 | Formulários de contato e candidatura deixam de anunciar envio que não acontece | P | Feita | `DECISIONS.md` #17: sem formulário, aviso e canais reais; contato volta com o recurso do backend (R2.10) |
| R0.4 | `.gitignore` cobre `.env.*` e `src/paraglide/`; `.gitleaks.toml` da raiz | P | Feita | `tooling.md` §9 e §7, KIT.md §3.3 |
| R0.5 | `.claude/settings.json` com `attribution` vazio e guarda `PreToolUse` | P | Bloqueada | dono: agente não edita `settings.json` |

### Régua 1 · Stack e tooling

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| R1.1 | Sync dos espelhos (`_doc-lib/`, `_standards/`, skills, `SKILLS-MAP.md`) e remoção das sobras | P | Feita | `sync --check`; espelhos no upstream de 2026-11-11 |
| R1.2 | Monorepo da casa: `pnpm-workspace.yaml` do modelo, `shared/` mínimo (`@maiyu/shared`), nome `@maiyu/frontend` | M | Feita | `feat/backend-inicial`; workspace do modelo e `shared/` (`@maiyu/shared`) com o kit da leva 8: format, lint, tsc e 62 testes |
| R1.3 | Husky e commitlint na raiz (`prepare`, `.husky/` do kit, teto de 72) | P | Feita | `tooling.md` §6; branch `chore/raiz-husky-commitlint` |
| R1.4 | Zod no lugar do VineJS no frontend; validators em `shared/src/validators/`, `zodResolver` | M | Feita | #241; MIGRATIONS.md; `@vinejs/vine` fora do frontend; os schemas dos formulários saíram do `shared/` com a decisão #17 (sem formulário no site) |
| R1.5 | Libs fora da casa saem: `react-markdown`, `remark-*`, `rehype-*`, `date-fns`, `next-themes`, `motion` sem uso | M | Feita | `tooling.md` §0.1; markdown e `motion` saíram com o diário em Tiptap |
| R1.6 | Luxon nas datas; Tiptap `static-renderer` no diário | M | Feita | `tooling.md` §0.1; Luxon feito; o corpo dos artigos é documento Tiptap em JSON (um por língua) e o `RichText` do kit o desenha no SSR |
| R1.7 | Versões na última publicada (nitro, vitest 5, eslint 10, pnpm 12, `@tanstack/*-query` exata) | M | Feita | `tooling.md` §0; MIGRATIONS.md; fica fora só o TypeScript 7 (exceção do §0); o `@tiptap/*` do `shared/` é da outra frente |
| R1.8 | `tsconfig` com as flags do piso | P | Feita | `tooling.md` §3; `verbatimModuleSyntax: false` (#319) |
| R1.9 | ESLint pelo bloco comum e o do frontend, `--max-warnings 0`, #366 cobrada | M | Feita | `tooling.md` §4.1, §4.2; `eslint.config.js` do kit, que ignora `components/ui/` (#391) |
| R1.10 | `src/env.ts`, `.env.example` canônico, `frontend/.env.production` com `VITE_SITE_URL` | P | Feita | `architecture.md` §4; ENV do modelo; `VITE_API_URL=https://api.maiyu.com.br` (decisão do dono) |
| R1.11 | `src/start.ts` com CSRF e escopo por requisição | P | Feita | ARVORE.md |

### Régua B · Backend inicial (item G, sub-sessão)

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| RB.1 | `backend/` AdonisJS 7 + Lucid + PostgreSQL a partir do esqueleto de `_templates/code/backend` | G | Feita | kit da leva 8 pelo sync; format, lint, tsc, `pattern:check`, `validators:check`, unitário 233 de 233 e funcional 143 de 143 |
| RB.2 | `/health-check`, OpenAPI, i18n do backend nos três idiomas, specs do modelo | M | Feita | `/health-check`, OpenAPI (`openapi:check` e `authz:check` verdes), i18n pt-BR, en e es e as specs do kit |
| RB.3 | Sessão do dono: seeder por `SEED_OWNER_*` (#329), revogação de sessão em update de conta | M | Feita | no que o kit traz: seeder do dono por `SEED_OWNER_*` (`firstOrCreate`) e sign-in, refresh e sign-out; revogação em update de conta espera rota de conta (R2.10) |
| RB.4 | `backend/.env.example` do modelo, `docs/ENV.md` e `Dockerfile-production` do backend | P | Feita | `.env.example` do modelo com os valores do projeto, `docs/ENV.md`, compose nas portas 5440, 9016 e 9017 e o `Dockerfile-production` do kit; e2e de storage rodou contra o MinIO local declarado, que não vale como prova de PR |
| RB.5 | Tuyau dentro do `request()` no frontend | M | Feita | #324; depois de RB.1 |

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
| R3.1 | Cópias locais trocadas pelo kit (`lib/utils`, `form-a11y`, `highlighter`, hooks) | M | Feita | kit inteiro no frontend, menos `table/` e `list-shell/` (R3.7) |
| R3.2 | Formulários com `FormShell`, `AppField`, `SubmitButton`, `HydratedFieldset` | M | Feita | #325, #366; sem formulário no site agora (`DECISIONS.md` #17), volta com o recurso de contato do backend |
| R3.3 | Peças do kit no lugar das locais: seletor de idioma e de tema, `route-status`, `MaiyuCredit`, `Picture` | M | Feita | #366; `MaiyuCredit` no rodapé e `Picture` em todo `img`; `Photo` ficou só como legenda com crédito CC sobre o `Picture`; imagens em `src/assets`; `PillButton` segue local (desvio, sem variante no `ui/`) |
| R3.4 | #366 no resto: cards, badges e links crus trocados por `ui/` | M | Feita | varredura sem elemento interativo cru fora de `ui/`; `<a>` externo só como `render` do `Button`; `PillButton` local é invólucro do `Button`, desvio relatado à régua |
| R3.5 | Chaves de mensagem em `snake_case` por área, `kit_*` fundidas | G | Feita | `i18n.md` §2; 117 chaves renomeadas nos três idiomas e nos usos, `kit_*` intactas |
| R3.6 | Registry inteiro pela #299, sem `@radix-ui` | M | Bloqueada | `frontend.md` §6; #299 do upstream; confirma a #11 local |
| R3.7 | `components/common/table/` e `list-shell/` do kit no frontend | M | Bloqueada | lacuna do kit (leva 9): `table/` e `list-shell/` exigem search paginado |

### Régua 4 · Testes e infra

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| R4.1 | Sem `.github/workflows/`, com o Dockerfile multi-stage na mesma PR | M | A fazer | #298, #368, #369; o dono troca o Coolify antes do merge |
| R4.2 | `Dockerfile-production` multi-stage pelo modelo do academy; `.dockerignore` na raiz | M | A fazer | `tooling.md` §8.2 |
| R4.3 | `dependabot.yml` e `.editorconfig` do modelo | P | A fazer | `tooling.md` §9 |
| R4.4 | E2E Playwright dos fluxos públicos | G | Em andamento | `tooling.md` §7; `e2e/support/pages.md` com as rotas do site, 90 de 90 nos três projetos; o config do kit exige dono autenticado e o backend no ar, que o site público não usa (lacuna levada à régua) |
| R4.5 | Unitários com nome e lugar canônicos; contratos por regex viram teste do que se vê | M | A fazer | `tooling.md` §10.6 |
| R4.6 | `check` com `test:unit`; `test:e2e` e `test:changed` | P | A fazer | |

### Régua D · Documentação

| # | Tarefa | Tam. | Status | Notas |
|---|---|---|---|---|
| RD.1 | `AGENTS.md` pelo modelo de `_templates/AGENTS.md`, `CLAUDE.md` com `@AGENTS.md` | P | Feita | branch `docs/regua-agents` |
| RD.2 | `docs/` reescrito a partir dos modelos e do código; DECISIONS locais que eram desvio marcadas como substituídas | M | A fazer | #6, #8, #9, #10, #11, #14 |
| RD.3 | `ARCHITECTURE.md` §9.1 com o que o painel do Coolify faz | P | Feita | os dois recursos (site e API) pelo quadro de `tooling.md` §8.3; branch `docs/regua-docs` |
| RD.4 | `frontend/README.md`, `frontend/AGENTS.md` e `components/common/CLAUDE.md` pela régua | P | A fazer | |

## Fase N · Ideias (fora do escopo atual)

- Formulário de contato, quando o backend tiver o recurso (origem: `PRD.md` §5)
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
