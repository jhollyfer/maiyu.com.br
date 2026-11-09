# Memória do projeto

**Maiyu** · onde a gente está, para a próxima conversa

> O agente lê **no início** de toda sessão e atualiza **no fim**. Curto: é um ponto de
> retomada, não um diário. Histórico vai para `CHANGELOG.md` e `DECISIONS.md`.

| Atualizado | Fase atual | Progresso | Status |
|---|---|---|---|
| 2026-11-09 | Migração para a régua | R1.2 em revisão | Em desenvolvimento · backend inicial |

## Já feito

- Site no padrão do academy, em três idiomas, no ar no Coolify.
- Mapa da borda com a tríplice fronteira e time apresentado por ofício.
- Sync com o maiyu-pattern; `AGENTS.md` e `docs/` preenchidos a partir do código; `CLAUDE.md` só com `@AGENTS.md`.
- Copy pt-BR, en e es do novo posicionamento e `areaServed` do JSON-LD (Brasil, Peru, Colômbia).

## Parou em

Migração para a régua, frente do backend (itens R1.2 e RB.1 a RB.4 de `TASKS.md`), na branch
`feat/backend-inicial`. Feito o R1.2: o workspace lista `backend`, `frontend` e `shared` pelo modelo
(`failIfNoMatch`, `allowBuilds` do projeto mantido), o `shared/` nasceu como `@maiyu/shared` com o kit
de `_templates/code/shared`, Zod e Tiptap, e o frontend passou a se chamar `@maiyu/frontend`. O pnpm
subiu para a 12 (`devEngines`), e o `minimumReleaseAgeExclude` do `@inlang` saiu: as versões já
passaram da idade mínima. O `check` do `shared/` reprova em três pontos do próprio kit (teste do
`actor` com um papel `EDITOR` que o site não tem, teste do envelope que pede mais de 40 respostas,
ordem de import dos testes do kit), levados à regente como lacuna do modelo.

RB.1 começou: o sync gravou o kit do backend em `backend/` (`@maiyu/backend`), com `.env.test`,
`.prettierignore` e o `@swc/core` liberado no `allowBuilds`. O backend ainda não compila: o kit importa
peças que não traz (entidade e repository de usuário, model e migration de `storages`, factories,
fixtures de teste, `config/openapi.ts`, `pattern-check.config.ts`), listadas à regente.
Já escritos os pontos de extensão do contrato (`config/openapi.ts`, `app/core/openapi/response.ts`,
`scripts/pattern-check.config.ts`, alias `#scripts/*`), o `docker-compose.yml` nas portas 5440, 9016 e
9017, o `.env.example` com os valores do projeto e `docs/ENV.md` e `docs/ARCHITECTURE.md` com a API.

Antes, a vitrine perdeu o serviço de aplicativos e a newsletter, e a rota-curinga passou a responder
404 de verdade (`routes/_public/$.tsx`).

## Próximos passos

1. RB.1 a RB.4: `backend/` AdonisJS 7 pelo kit, quando a regente responder sobre as lacunas.
2. Revisar os quatro artigos do diário e o texto de carreiras: foram escritos pela equipe de agentes
   sem passar pelo crivo de quem é da Maiyu.
3. Trocar as fotos de terceiros por fotos próprias do time e da região, com autorização.
4. Confirmar o e-mail de contato: `lib/site.ts` diz `contato@maiyu.com`, e o domínio do site é
   `maiyu.com.br`.
5. Levar ao dono as perguntas de `PRD.md` §8 e cadastrar os secrets novos (`ENV.md` §3).
6. Se o time quiser um grafismo do próprio povo no lugar do trançado genérico, entra com autorização
   de quem o pinta (`DESIGN.md` §2).

## Contexto importante

- Posicionamento: primeira empresa de consultoria e desenvolvimento de software sob demanda da tríplice fronteira, feita por indígenas e pessoas originárias da região (`PRD.md`).
- O site não tem backend; os formulários confirmam na tela e não enviam (`DECISIONS.md` #7).

## Lições

> Uma linha por correção do dono (`AGENTS.md`, "Modo de trabalho" item 3). Lida no início de toda
> sessão. Lição que vale para todo projeto sobe para a régua e sai daqui.

| Data | Erro | Regra que evita | Vale para |
|---|---|---|---|
| 2026-11-04 | Commit trazido por cherry-pick sem rodar o `format:check` de novo | rodar os passos do CI no estado final da branch, depois do último commit, e não antes dele | todo projeto |
| 2026-11-04 | Fonte da marca trocada (Raleway por Fraunces) sem perguntar | identidade visual (fonte, cor, logo) só muda com o dono escolhendo; a direção do redesign não autoriza trocar a fonte do guia | todo projeto |
| 2026-11-04 | Healthcheck passado ao dono como `/health` | o sinal de vida é `GET /health-check`, nome exato e sem alias (régua #184); conferir a régua antes de dar instrução de deploy | todo projeto |
| 2026-11-04 | Contexto descrito só como amazônico | a Maiyu atende povos originários de qualquer país, não só da Amazônia; a origem é o Alto Solimões | este projeto |
| 2026-11-04 | Workflows deixados fora do sync por conta própria | seguir os irmãos e a régua; regra que não serve muda no upstream, não se contorna no projeto | todo projeto |
| 2026-11-04 | "Pronto" sem scan de segurança, revisão, testes e lições | o fluxo da régua (etapas 6 a 8) vale inteiro antes de declarar pronto e antes do merge | todo projeto |
| 2026-11-04 | Merge feito pelo agente | o merge é do dono; o agente abre o PR verificado e para | todo projeto |
| 2026-11-04 | Conteúdo de exemplo no ar (autores, vagas e benefícios inventados) | não publicar pessoa, vaga, benefício nem número que não exista; na falta, banco de talentos e "Equipe Maiyu" | todo projeto |

## Problemas conhecidos

| Problema | Onde | Contorno |
|---|---|---|
| `sync --check` acusa `workflow-diverge` | `.github/workflows/` | aguardar decisão do dono (`DECISIONS.md` #6) |
| `.env.example` com chaves que o site não usa | `frontend/.env.example` | `ENV.md` explica; ajuste no upstream (`DECISIONS.md` #9) |

## Links úteis

- Repositório: https://github.com/jhollyfer/maiyu.com.br · Produção: https://maiyu.com.br · Design: Não se aplica: sem arquivo de design externo
