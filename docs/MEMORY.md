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

Por último, o redesign editorial (tarefa 2.4, `DECISIONS.md` #12 e #13): saiu o céu ilustrado
(`sky.tsx` e `glider.tsx` apagados, com os utilitários e tokens que só eles usavam), entraram Fraunces
nos h1 e h2, fotos de lugar do Wikimedia Commons com crédito na legenda (`lib/photos.ts` e
`-components/photo.tsx`: Benjamin Constant, o porto e Letícia, todas CC0), as capturas reais dos cinco
produtos no portfólio, os quatro artigos do diário reescritos no contexto (assinados como Equipe
Maiyu), carreiras como banco de talentos sem vaga nem benefício inventado, títulos e descrições de SEO
por rota e a `og-image.png` nova. A foto da foz do Javari não baixou (o Commons limitou e depois
respondeu 404), e ficou de fora.

Depois do redesign, a vitrine perdeu o serviço de aplicativos e a newsletter, que prometiam o que a Maiyu não
entrega, e a rota-curinga passou a responder 404 de verdade (`routes/_public/$.tsx`).

## Próximos passos

1. Revisar os quatro artigos do diário e o texto de carreiras: foram escritos pela equipe de agentes
   sem passar pelo crivo de quem é da Maiyu.
2. Trocar as fotos de terceiros por fotos próprias do time e da região, com autorização.
3. Confirmar o e-mail de contato: `lib/site.ts` diz `contato@maiyu.com`, e o domínio do site é
   `maiyu.com.br`.
4. Levar ao dono as perguntas de `PRD.md` §8 e cadastrar os secrets novos (`ENV.md` §3).
5. Se o time quiser um grafismo do próprio povo no lugar do trançado genérico, entra com autorização
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
