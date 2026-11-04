# Maiyu: instruções para agentes

Site institucional da Maiyu, consultoria e desenvolvimento de software sob demanda de Benjamin Constant/AM (Alto Solimões), na tríplice fronteira Brasil, Peru e Colômbia, construída por indígenas e pessoas originárias da região. Três idiomas (português, inglês e espanhol), sem backend.

Um workspace pnpm com um pacote só, `frontend/` (TanStack Start sobre Vite e Nitro), e um `pnpm-lock.yaml` na raiz, como nos irmãos (`_standards/tooling.md` §1). Não há `backend/` nem `shared/`: o site não tem API.

## O padrão Maiyu é seguido estritamente

Este projeto segue o `maiyu-pattern` sem exceção local: arquitetura, árvore de pastas, camadas, nomes,
escrita de código, testes, segurança, i18n e commits. O que o projeto faz diferente da régua é desvio
e se corrige, não se documenta como escolha. Regra que não serve ao projeto muda no upstream
(`maiyu-pattern`) e volta pelo sync; nunca se contorna aqui.

- `_doc-lib/`, `_standards/`, `SKILLS-MAP.md` e `.claude/skills/` são espelho do upstream. Não se editam
  e não recebem arquivo próprio: o sync remove o que sobrar. Página de doc ou skill que só este
  projeto usa entra primeiro no `maiyu-pattern`.
- Início de sessão: `node ../maiyu-pattern/scripts/sync-to-project.mjs . --check`, com o clone do
  upstream ao lado deste repositório. Divergência ou sobra se resolve com o sync antes da tarefa.
- Autor único `Jhollyfer Rodrigues <jhollyfer.fr@gmail.com>`: nenhum commit, PR ou arquivo leva agente
  como autor ou coautor (`Co-Authored-By`, `Claude-Session`, "Generated with").
- Branch `<tipo>/<escopo>-<assunto>` e título de PR em Conventional Commits (`feat(escopo): ...`,
  `fix`, `refactor`...). Nunca `claude`, `anthropic` ou outro agente no nome da branch, no título ou
  no corpo do PR; branch criada com prefixo de agente é renomeada antes do push (`_standards/tooling.md` §6).
- `docs/` é deste projeto: cada arquivo completo, no escopo do produto e em dia com o código. Mas
  nenhum deles define padrão, organização, estrutura ou arquitetura; isso é do `maiyu-pattern`, e
  em conflito a régua vence (`_standards/documentation.md`, "Quem manda em quê").

## Antes de qualquer tarefa

1. `docs/MEMORY.md`: onde o trabalho parou.
2. `docs/TASKS.md`: o que está em andamento e o que vem depois.
3. O que a tarefa pede, pela tabela de `_standards/documentation.md` §4:
   - feature nova: `docs/PRD.md`, `docs/USER-FLOWS.md`, `docs/ARCHITECTURE.md`;
   - tela ou componente: `docs/DESIGN.md` e o fluxo em `docs/USER-FLOWS.md`;
   - variável de ambiente ou deploy: `docs/ENV.md` e `docs/ARCHITECTURE.md` §9;
   - auth, papel, upload ou dado pessoal: `docs/SECURITY.md`;
   - teste: `docs/TEST-PLAN.md`;
   - escolha difícil de desfazer: `docs/DECISIONS.md` (as divergências deliberadas dos irmãos estão lá).
4. O padrão da casa: `_standards/` e `_doc-lib/`, na ordem de `maiyu-standards`.
5. Tarefa no `frontend/`: `frontend/AGENTS.md`, quando houver instrução própria
   (`_standards/documentation.md` §3).

**A `_doc-lib/` é contrato, obrigatório antes de toda decisão e de toda implementação.** Ler o
`.md` não basta: ache a entrada do assunto em `_doc-lib/<lib>.md` e **abra o link oficial dela**
(`[markdown]` primeiro, senão `[doc]`), lendo a seção que responde à decisão. A entrada é o índice; a
página é o contrato. Decisão sem a página aberta é decisão sem base. Cite a página (`_doc-lib/<lib>.md#<entrada>`
+ URL) no commit, no PR ou no comentário de "por quê". Página que não abre: escreva "página oficial
não conferida" ao lado da decisão e não trate o resumo como contrato.

Leia pela seção (`grep -n '^## ' docs/ARCHITECTURE.md`), não o arquivo inteiro.

## A regra zero

**A referência é a régua, e o código dela vence a documentação sobre ela.** Antes de escrever um
arquivo, abra o equivalente em `../academy/frontend` (o irmão mais próximo: também é vitrine pública
da Maiyu) ou em `../simple-hub/frontend` e leia inteiro.

Divergência deliberada vai para o JSDoc do arquivo, não só para o commit, e para `docs/DECISIONS.md`.
As que existem hoje têm o mesmo par de motivos (o site fala três línguas e não tem API) e estão
listadas lá.

## Comandos

Os scripts estão no `package.json` da raiz e do `frontend/`. O que o `package.json` não diz:

- `pnpm build` regenera `routeTree.gen.ts` (commitado) e `src/paraglide` (não commitado). Antes de
  `lint`, `typecheck` e `test` num clone novo, compile as mensagens:
  `pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/paraglide`.
- `pnpm check-cycles` lê `.output/`, então roda depois do build.
- `node scripts/generate-icons.mjs` gera `favicon.ico`, `apple-touch` e os ícones do manifesto.

## Neste projeto

- **Rotas em par**: `rota.tsx` com `head`, `loader` e `validateSearch`; `rota.lazy.tsx` com a tela.
  `$.tsx` fica sem `.lazy`, como no academy.
- **`getRouteApi('/rota')` no escopo do módulo**, nunca importar o `Route` de volta do arquivo de
  rota: o ciclo de chunk devolve `undefined` no primeiro SSR, e `check-chunk-cycles.mjs` reprova.
- **Estado de listagem na URL**: o filtro do diário é `?category=`, validado à mão em
  `lib/blog-search.ts` (o `validateSearch` é síncrono, o VineJS não).
- **404 de negócio é `notFound()` no loader**, e a rota de detalhe declara o `notFoundComponent`
  próprio (`blog/$slug`).
- **Formulários**: react-hook-form + VineJS, `mode: 'onTouched'`, `Controller` e nunca `register`.
  Todo campo usa `{...invalidProps(fieldState.invalid, name)}` e `<FieldError id={errorId(name)}>`.
- **Idioma**: mensagem de interface em `messages/{locale}.json`, lida como `m.chave()` no render.
  Conteúdo de registro (título de artigo, resumo de projeto) mora no próprio registro como
  `LocalizedText`. Rótulo de valor fechado é função em `lib/labels.ts`, nunca string resolvida no módulo.
- **Animação é CSS**: `REVEAL` e `STAGGER` de `_public/-components/reveal.ts`, com `motion-reduce:`
  em tudo. O `motion` fica no `package.json` por paridade com o academy, e nada o importa.
- **`components/common/` mede o ancestral comum dos consumidores**, não o nível hierárquico. O
  critério está em `src/components/common/CLAUDE.md`.
- **`components/ui/` é território do shadcn**: nunca editar à mão.

## Estilo de código

Quatro regras cobradas pelo ESLint, iguais nos irmãos: `no-ternary`, `no-explicit-any`,
`consistent-type-assertions: never` (nada de `as`), `consistent-type-definitions: type` (nunca
`interface`). Combine tipos com `Merge`, não com `&`. Prefira lookup object a cadeia de `if`. O resto
está na skill `code-pattern`.

Comentário explica **por quê**, não o quê, e de preferência com o defeito que ele evita.

## Redes que cobram o que ninguém lembra

| Teste | O que reprova |
| --- | --- |
| `lib/messages.test.ts` | chave faltando num idioma, mensagem vazia, chave que nada usa |
| `lib/validator-messages.test.ts` | campo sem rótulo em algum idioma, regra sem mensagem, texto sem teto |
| `routes/_public/composition.test.ts` | a home fora da ordem que ela defende |
| `routes/_public/vitrine-contract.test.ts` | `motion-reduce` apagado, `motion` de volta, painel do celular mudo |
| `check-chunk-cycles.mjs` | ciclo de chunk que quebra o SSR |

## Produção

O detalhe está em `docs/ARCHITECTURE.md` §9 e §9.1. O que precisa estar na cabeça de quem mexe no deploy:

- A aplicação no Coolify é a imagem Nitro na porta 3000, e não mais o nginx estático da porta 80 do
  site anterior.
- O healthcheck no painel precisa apontar para `/health-check` (régua, `DECISIONS.md` #15). O painel sobrepõe o `HEALTHCHECK` do
  `Dockerfile-production`, e em `/` ele mediria a renderização da home inteira.
- Os workflows são o perfil sem backend do modelo do upstream (`DECISIONS.md` #14). Secrets do
  repositório: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID`
  e `VITE_SITE_URL`.
- O deploy sai por `POST` no Coolify, e o smoke test espera `VITE_SITE_URL` + `/revision.txt`
  responder o sha do commit. **Não volte para `GET`**: a rota
  responde 405 desde a v4.2.

## Escrita

Vale para todo commit, PR, documento e comentário de código deste repositório, as mesmas regras do
simple-hub.

Commits em Conventional Commits, **em português**, com escopo de domínio: `feat(vitrine):`,
`fix(idioma):`, `ci(frontend):`. O assunto diz o efeito, não o arquivo. Sempre
`git commit -- <pathspec>` explícito.

**Sem emoji** e **sem travessão** em texto versionado. Trocar travessão por hífen não resolve:
reescreva com vírgula, dois-pontos, ponto ou parênteses.

## Ao terminar

No mesmo commit da mudança (`_standards/documentation.md` §5):

- status em `docs/TASKS.md`;
- "Parou em" e "Próximos passos" em `docs/MEMORY.md`;
- `docs/ENV.md` + `frontend/.env.example` se mexeu em variável;
- `docs/DECISIONS.md` se decidiu algo difícil de desfazer;
- `docs/CHANGELOG.md` em `[Não lançado]` se o usuário percebe a mudança.

## Não toque sem perguntar

Lista completa em `docs/RULES.md` §2.
