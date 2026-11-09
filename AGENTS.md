# Maiyu: instruções para agentes

Site institucional da Maiyu, consultoria e desenvolvimento de software sob demanda de Benjamin
Constant/AM (Alto Solimões), na tríplice fronteira Brasil, Peru e Colômbia, feita por indígenas e
pessoas originárias da região, para organizações de qualquer setor, povos e organizações indígenas e
quem quer trabalhar na Maiyu, em português (pt-BR), inglês (en) e espanhol (es).

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
- Sem GitHub Actions; testes antes do PR; deploy pelo Coolify a partir da `main`: o hook local roda
  `check`, unitário e commitlint; as suítes funcional e E2E rodam na sessão antes de abrir o PR, com
  o resultado no corpo do PR. Toda mudança entra por PR com merge do dono, em commit de merge com a
  mensagem padrão do git (`merge:` o commitlint reprova). O merge na `main` dispara o Coolify, que
  constrói cada app pelo `Dockerfile-production`; a `develop` não tem deploy. Pronto é a rodada
  antes do PR verde e, depois do merge, o deploy concluído com o healthcheck verde e a conferência
  em produção (`_standards/tooling.md` §6, §7, §8, §10.1, `DECISIONS.md` #298).
- Kit único: componente, `lib/`, integração, código comum do backend e checks que vêm de
  `_templates/code/` do upstream são o mesmo arquivo em todo projeto e não se editam aqui. Peça do kit
  liga por parte e por prop de dado; I/O do projeto entra por prop (`DECISIONS.md` #343). Cliente da
  API: Tuyau dentro do `request()`, validado pelo schema do `shared/` (`DECISIONS.md` #324).
- Segurança antes de padrão: a fase 0 é a lista de segurança do `_findings` do projeto no upstream;
  segredo commitado e dado pessoal versionado se tratam com o dono antes de qualquer PR
  (`DECISIONS.md` #363).
- `docs/` é deste projeto: cada arquivo completo, no escopo do produto e em dia com o código. Mas
  nenhum deles define padrão, organização, estrutura ou arquitetura; isso é do `maiyu-pattern`, e
  em conflito a régua vence (`_standards/documentation.md`, "Quem manda em quê").

## O que é do projeto

Nome fixo, conteúdo deste projeto (o resto vem do kit e não se edita):

- `shared/`: `src/enums/user-role.ts` (`USER_ROLE`, `STAFF_USER_ROLES`) e `src/records/demo-accounts.ts`
  (`DEMO_ACCOUNTS`);
- backend: `providers/repository.provider.ts`, `start/routes.ts`, `start/limiter.ts`, `config/openapi.ts`,
  `scripts/pattern-check.config.ts`, `app/core/openapi/authz-baseline.json`, `app/core/openapi/response.ts`
  e os blocos opcionais ligados em `start/env.ts`;
- frontend: `src/lib/areas.ts`, `src/lib/labels.ts`, `invalidate.ts`, `_query-keys.ts`, `queries/`,
  `mutations/`, o tema (`src/styles.css`, `src/assets/brand/*`, `public/*`) e as chaves de
  `messages/<locale>.json` fora de `kit_*`.

## Antes de qualquer tarefa

1. `docs/MEMORY.md`: onde o trabalho parou.
2. `docs/TASKS.md`: o que está em andamento e o que vem depois.
3. O que a tarefa pede, pela tabela de `_standards/documentation.md` §4:
   - feature nova: `docs/PRD.md`, `docs/USER-FLOWS.md`, `docs/ARCHITECTURE.md`;
   - tela ou componente: `docs/DESIGN.md` e o fluxo em `docs/USER-FLOWS.md`;
   - variável de ambiente ou deploy: `docs/ENV.md` e `docs/ARCHITECTURE.md` §9;
   - auth, papel, upload ou dado pessoal: `docs/SECURITY.md`;
   - teste: `docs/TEST-PLAN.md`;
   - escolha difícil de desfazer: `docs/DECISIONS.md`.
4. O padrão da casa: `_standards/` e `_doc-lib/`, na ordem de `maiyu-standards`.
5. Tarefa só no backend ou só no frontend: `backend/AGENTS.md` ou `frontend/AGENTS.md`, quando o
   app tem instrução própria (`_standards/documentation.md` §3).

**A `_doc-lib/` é contrato, obrigatório antes de toda decisão e de toda implementação.** Ler o
`.md` não basta: ache a entrada do assunto em `_doc-lib/<lib>.md` e **abra o link oficial dela**
(`[markdown]` primeiro, senão `[doc]`), lendo a seção que responde à decisão. A entrada é o índice; a
página é o contrato. Decisão sem a página aberta é decisão sem base. Cite a página (`_doc-lib/<lib>.md#<entrada>`
+ URL) no commit, no PR ou no comentário de "por quê". Página que não abre: escreva "página oficial
não conferida" ao lado da decisão e não trate o resumo como contrato.

Leia pela seção (`grep -n '^## ' docs/ARCHITECTURE.md`), não o arquivo inteiro.

## Ao terminar

No mesmo commit da mudança (`_standards/documentation.md` §5):

- status em `docs/TASKS.md`;
- "Parou em" e "Próximos passos" em `docs/MEMORY.md`;
- `docs/ENV.md` + `backend/.env.example` (ou `frontend/.env.example`) se mexeu em variável;
- `docs/DECISIONS.md` se decidiu algo difícil de desfazer;
- `docs/CHANGELOG.md` em `[Não lançado]` se o usuário percebe a mudança.

## Não toque sem perguntar

Lista completa em `docs/RULES.md` §2.
