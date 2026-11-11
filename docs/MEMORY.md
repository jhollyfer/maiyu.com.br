# Memória do projeto

**Maiyu** · onde a gente está, para a próxima conversa

> O agente lê **no início** de toda sessão e atualiza **no fim**. Curto: é um ponto de
> retomada, não um diário. Histórico vai para `CHANGELOG.md` e `DECISIONS.md`.

| Atualizado | Fase atual | Progresso | Status |
|---|---|---|---|
| 2026-11-09 | Migração para a régua | 3 de 47 itens | Em desenvolvimento |

## Já feito

- Site no padrão do academy, em três idiomas, no ar no Coolify.
- Mapa da borda com a tríplice fronteira e time apresentado por ofício.
- Sync com o maiyu-pattern; `AGENTS.md` e `docs/` preenchidos a partir do código; `CLAUDE.md` só com `@AGENTS.md`.
- Copy pt-BR, en e es do novo posicionamento e `areaServed` do JSON-LD (Brasil, Peru, Colômbia).

## Parou em

Frente do frontend (item G, sub-sessão), na branch `feat/frontend-regua`, nascida de
`feat/backend-inicial`. O lote 1 juntou, por merge e sem force, as branches prontas da fase 1:
espelhos (R1.1), husky e commitlint (R1.3), Luxon (R1.6, parte), versões (R1.7), piso do
`tsconfig` (R1.8) e o `AGENTS.md` da régua (RD.1). Os espelhos foram ressincronizados com o upstream
de 2026-11-11 (`--so-regua`). O `pnpm-lock.yaml` regenera quando os pacotes do backend passam do
`minimumReleaseAge`. Seguem as rotas em inglês (#383) e o prefixo de idioma (#384, #385).

A varredura de 2026-11-08 comparou o projeto com o `maiyu-pattern` e deu 154 achados, levados ao
upstream; o plano de migração saiu dela e está em `TASKS.md` (itens R, RB e RD). A fase 0 traz o
R0.2 (JSON-LD com `<` escapado) e o R0.4 (`.gitignore` da raiz pela régua, `.gitleaks.toml` do
modelo, `frontend/.vscode/` fora do índice). O R0.1 (cabeçalhos de segurança) está pronto na branch
`fix/seguranca-cabecalhos` e está bloqueado por R1.4 (o Zod), porque a CSP recusa o VineJS no navegador.

Frente do backend (R1.2 e RB.1 a RB.4), na branch `feat/backend-inicial`. O R1.2 está montado: o
workspace lista `backend`, `frontend` e `shared` pelo modelo (`failIfNoMatch`, `allowBuilds` mantido),
o `shared/` nasceu como `@maiyu/shared` com o kit de `_templates/code/shared`, Zod e Tiptap, o
frontend virou `@maiyu/frontend` e o pnpm subiu para a 12. O sync gravou o kit do backend em
`backend/` (`@maiyu/backend`), com `.env.test`, `.prettierignore`, `docker-compose.yml` nas portas
5440, 9016 e 9017 e o `.env.example` com os valores do projeto. Os dois pacotes esperam a próxima
leva do kit: o `check` do `shared/` reprova em três testes do próprio kit, e o backend não compila
porque o kit importa peças que não traz (lacunas 1 a 16, com a regente geral). Por ordem da regente,
nenhuma lacuna se escreve no projeto. O `argon2` entrou pelo kit (lacuna 17 resolvida no upstream) e
está liberado no `allowBuilds`. O RB.3 fica no que o kit traz (seeder do dono e as três rotas de
sessão); rota de conta é domínio e vai para a R2.10. O MinIO local da sessão é ambiente declarado: e2e
de storage rodada contra ele não conta como prova de PR até a régua escolher o substituto.

Antes da migração, a fase 2 parou com a vitrine reposicionada (tarefas 2.1 e 2.4), sem o serviço de
aplicativos e a newsletter, e com a rota-curinga respondendo 404 de verdade (`routes/_public/$.tsx`).

R1.7 feito na branch `chore/frontend-versoes`: o `frontend/` está na última versão publicada, com
um dia de idade mínima. Ficam de fora o TypeScript 7 (exceção do `tooling.md` §0) e os `@tiptap/*`
do `shared/` em 3.30.5, que são da frente do backend. O frontend não importa o Tiptap hoje.

## Próximos passos

1. R0.3 com o dono: o destino dos formulários de contato e candidatura (R2.10); até lá, sem
   anunciar envio que não acontece.
2. Lote 1 do frontend: rotas em inglês (#383) e prefixo de idioma (#384, #385); depois o lote 2
   (kit do frontend, R3.1 a R3.5, R1.4, R1.9, R0.1). R1.2 e RB.1 a RB.4 esperam a leva do kit.
3. Revisar os quatro artigos do diário e o texto de carreiras: foram escritos pela equipe de agentes
   sem passar pelo crivo de quem é da Maiyu.
4. Trocar as fotos de terceiros por fotos próprias do time e da região, com autorização.
5. Confirmar o e-mail de contato: `lib/site.ts` diz `contato@maiyu.com`, e o domínio do site é
   `maiyu.com.br`.
6. Levar ao dono as perguntas de `PRD.md` §8 e cadastrar os secrets novos (`ENV.md` §3).
7. Se o time quiser um grafismo do próprio povo no lugar do trançado genérico, entra com autorização
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
| `sync --check` acusa `workflow-diverge` | `.github/workflows/` | a #6 foi substituída: o sync resolve o resto no R1.1, e os workflows saem no R4.1, na PR do Dockerfile (`DECISIONS.md` #371 do upstream) |
| `.env.example` com chaves que o site não usa | `frontend/.env.example` | `ENV.md` explica; ajuste no upstream (`DECISIONS.md` #9) |

## Links úteis

- Repositório: https://github.com/jhollyfer/maiyu.com.br · Produção: https://maiyu.com.br · Design: Não se aplica: sem arquivo de design externo
