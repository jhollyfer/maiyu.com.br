# Memória do projeto

**Maiyu** · onde a gente está, para a próxima conversa

> O agente lê **no início** de toda sessão e atualiza **no fim**. Curto: é um ponto de
> retomada, não um diário. Histórico vai para `CHANGELOG.md` e `DECISIONS.md`.

| Atualizado | Fase atual | Progresso | Status |
|---|---|---|---|
| 2026-11-11 | Migração para a régua (régua na leva 8, `maiyu-pattern` em 1a9a636) | 7 de 47 itens | Em desenvolvimento |

## Já feito

- Site no padrão do academy, em três idiomas, no ar no Coolify.
- Mapa da borda com a tríplice fronteira e time apresentado por ofício.
- Sync com o maiyu-pattern; `AGENTS.md` e `docs/` preenchidos a partir do código; `CLAUDE.md` só com `@AGENTS.md`.
- Copy pt-BR, en e es do novo posicionamento e `areaServed` do JSON-LD (Brasil, Peru, Colômbia).

## Parou em

A varredura de 2026-11-08 comparou o projeto com o `maiyu-pattern` e deu 154 achados, levados ao
upstream; o plano de migração saiu dela e está em `TASKS.md` (itens R, RB e RD). A fase 0 traz o
R0.2 (JSON-LD com `<` escapado) e o R0.4 (`.gitignore` da raiz pela régua, `.gitleaks.toml` do
modelo, `frontend/.vscode/` fora do índice). O R0.1 (cabeçalhos de segurança) está pronto na branch
`fix/seguranca-cabecalhos` e está bloqueado por R1.4 (o Zod), porque a CSP recusa o VineJS no navegador.

Frente do backend (R1.2 e RB.1 a RB.4) feita na branch `feat/backend-inicial`, com a leva 8 do kit
(`maiyu-pattern` em 1a9a636): `shared/` e `backend/` verdes em format, lint, tsc, `pattern:check`,
`validators:check`, `openapi:check` e `authz:check`; `shared/` com 62 testes, backend com unitário 233
de 233 e funcional 143 de 143. Os pontos de extensão nunca editados foram apagados e recriados pelo
sync, e a migration de `users` segue a do kit (papéis `ADMINISTRATOR` e `MEMBER`). A funcional de
storage rodou contra o MinIO local, ambiente declarado que não vale como prova de PR até a régua
escolher o substituto. O RB.3 ficou no que o kit traz; rota de conta é proposta ao dono (R2.10).

Contato do backend (R2.10, spec `.specs/features/contato/`, branch `feat/backend-contato-conta`) feito:
`POST /storefront/contacts` (público, honeypot, 5 por hora por IP), `GET /administrator/contacts`,
`GET /administrator/contacts/:id`, `POST /administrator/contacts/:id/answer` (mão única, 409),
`DELETE /administrator/contacts/:id` e o comando `contacts:prune` (12 meses). Aviso por e-mail ao dono
ficou fora, por decisão do dono. Verde com `shared/` em 79 testes, backend unitário 265 e funcional 194. O formulário do frontend ainda não envia (R0.3, RB.5 e R3).

Conta do dono no backend (R2.10, spec `.specs/features/conta/`, mesma branch) feita: `GET /account/profile`
e `PUT /account/profile` (sessão, sem `role`), com troca de nome e de senha exigindo `currentPassword`,
senha nova pela regra do `Rule` (422 `PASSWORD_SAME_AS_CURRENT` se igual à atual), revogação de todas as
sessões na mesma `UnitOfWork` do save quando a senha troca (a da chamada inclusive, com cookies limpos na
200) e limite do kit, 10 por 15 minutos por usuário (`accountThrottle`). Trocar só o nome responde 200 e
mantém a sessão. A troca de e-mail ficou fora por decisão do dono (sem o link de confirmação da
`backend.md` §7 item 7): bloqueada até existir o bloco de e-mail. O `Rule.email()` do kit passou a baixar a
caixa (upstream a8462c8, pelo sync). A funcional prova 200 seguido de 401 para a senha. Falta a
verificação final da feature; a tela da conta no frontend é a frente F.

Antes da migração, a fase 2 parou com a vitrine reposicionada (tarefas 2.1 e 2.4), sem o serviço de
aplicativos e a newsletter, e com a rota-curinga respondendo 404 de verdade (`routes/_public/$.tsx`).

## Próximos passos

1. Regente verifica a `feat/backend-inicial` e abre a PR do backend inicial.
1a. Verificar a conta do dono (`.specs/features/conta/`) e ligar a tela da conta no frontend (frente F).
1b. Agendar no Coolify a tarefa `node ace contacts:prune` (`ARCHITECTURE.md` §9.1) antes de o formulário ir ao ar, e ligar o formulário à API (frente F).
2. R0.3 com o dono: o destino dos formulários de contato e candidatura (R2.10); até lá, sem
   anunciar envio que não acontece.
3. Fase 1 da migração (R1.1 em diante, `TASKS.md`); R1.2 e RB.1 a RB.4 esperam a leva do kit.
4. Revisar os quatro artigos do diário e o texto de carreiras: foram escritos pela equipe de agentes
   sem passar pelo crivo de quem é da Maiyu.
5. Trocar as fotos de terceiros por fotos próprias do time e da região, com autorização.
6. Confirmar o e-mail de contato: `lib/site.ts` diz `contato@maiyu.com`, e o domínio do site é
   `maiyu.com.br`.
7. Levar ao dono as perguntas de `PRD.md` §8 e cadastrar os secrets novos (`ENV.md` §3).
8. Se o time quiser um grafismo do próprio povo no lugar do trançado genérico, entra com autorização
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
