# Memória do projeto

**Maiyu** · onde a gente está, para a próxima conversa

> O agente lê **no início** de toda sessão e atualiza **no fim**. Curto: é um ponto de
> retomada, não um diário. Histórico vai para `CHANGELOG.md` e `DECISIONS.md`.

| Atualizado | Fase atual | Progresso | Status |
|---|---|---|---|
| 2026-11-04 | 2 · Posicionamento | 5 de 8 tarefas | Em desenvolvimento · reposicionamento da vitrine |

## Já feito

- Site no padrão do academy, em três idiomas, no ar no Coolify.
- Mapa da borda com a tríplice fronteira e time apresentado por ofício.
- Sync com o maiyu-pattern; `AGENTS.md` e `docs/` preenchidos a partir do código; `CLAUDE.md` só com `@AGENTS.md`.
- Copy pt-BR, en e es do novo posicionamento e `areaServed` do JSON-LD (Brasil, Peru, Colômbia).

## Parou em

Tarefa 2.1 (`TASKS.md`) feita na branch `feat/vitrine-posicionamento-indigena`: copy nova nos três
idiomas, `areaServed` no JSON-LD, tema mais quente (fibra, mata, rio barrento, urucum, açaí, terra) o
trançado na faixa escura da home e as seções "Somos indígenas" (`Roots`) e "Para quem construímos" (`Audience`). Build, lint, typecheck, testes, prettier e ciclos de chunk verdes;
conferido no navegador em claro, escuro e celular. Os workflows viraram cópia exata do modelo, como nos irmãos, e o `sync --check` sai limpo; o CI e o deploy reprovam enquanto não houver `backend/` (`DECISIONS.md` #6).

Depois, o registry inteiro do shadcn foi instalado (`DECISIONS.md` #11) e as telas passaram a usar o
`ui/` onde há encaixe: Card, Item, Badge, Breadcrumb, Avatar, AspectRatio, Empty, Field. Ficaram feitos à
mão, por não terem equivalente: os painéis de `process.tsx`, a `dl` de `roots.tsx`, o passo a passo de
`vision.tsx`, os pontos do carrossel e a grade do rodapé.

## Próximos passos

1. Abrir o PR da branch quando o dono pedir.
2. Levar ao dono as perguntas de `PRD.md` §8 e cadastrar os secrets novos (`ENV.md` §3).
3. Se o time quiser um grafismo do próprio povo no lugar do trançado genérico, entra com autorização
   de quem o pinta (`DESIGN.md` §2).

## Contexto importante

- Posicionamento: primeira empresa de consultoria e desenvolvimento de software sob demanda da tríplice fronteira, feita por indígenas e pessoas originárias da região (`PRD.md`).
- O site não tem backend; os formulários confirmam na tela e não enviam (`DECISIONS.md` #7).

## Lições

> Uma linha por correção do dono (`AGENTS.md`, "Modo de trabalho" item 3). Lida no início de toda
> sessão. Lição que vale para todo projeto sobe para a régua e sai daqui.

| Data | Erro | Regra que evita | Vale para |
|---|---|---|---|

## Problemas conhecidos

| Problema | Onde | Contorno |
|---|---|---|
| `sync --check` acusa `workflow-diverge` | `.github/workflows/` | aguardar decisão do dono (`DECISIONS.md` #6) |
| `.env.example` com chaves que o site não usa | `frontend/.env.example` | `ENV.md` explica; ajuste no upstream (`DECISIONS.md` #9) |

## Links úteis

- Repositório: https://github.com/jhollyfer/maiyu.com.br · Produção: https://maiyu.com.br · Design: Não se aplica: sem arquivo de design externo
