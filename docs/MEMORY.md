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

R2.3 volta a Em andamento: os enums `PROJECT_STATUS`, `JOB_POSITION` e `ARTICLE_CATEGORY` ficam em
`lib/` até o sync da leva 10A, quando a sessão do `shared/` os publica em `shared/src/enums/`.

R2.1 feita: as telas de career, contact, portfolio e blog moram em `-components/` da rota e os `.lazy.tsx` são stubs; os testes de contrato leem os caminhos novos. R2.2 feita: as peças só da home desceram para `_public/-components/home/`. R2.3 feita: `lib/entity.ts` e `lib/interfaces.ts` saíram e as enums viraram trinca nos arquivos de `lib/` que as leem. R2.7 feita: a busca do diário é `blog/-search.ts` com `listValidateSearch` do kit. R2.5 feita: o 404 público e o artigo inexistente montam o head pelo `pageHead`, e a imagem da marca nos dados estruturados é a `logo-512.png` do tema. R2.6 feita: `public/` só com `favicon.svg` e `maiyu-symbol.svg`, o símbolo da vitrine vem de `assets/brand/logo.svg` e as capturas de projeto moram em `assets/projects/`. R2.9 bloqueada: sem código morto do projeto; `lib/utils.ts` espera o sync do kit (`cn.ts`, `cn-project.ts`) e o alias `utils` do `components.json`, porque `ui/` o importa.

RD.3 feita: `ARCHITECTURE.md` §9.1 descreve os dois recursos do Coolify (site e API) pelo quadro da régua, sem workflows de entrega. RD.2 feita: `docs/` posto em dia (SECURITY, TEST-PLAN, ENV, ARCHITECTURE, RULES, PRD) e as decisões locais substituídas marcadas em `DECISIONS.md`. RD.4 feita: `frontend/README.md` e `frontend/AGENTS.md` pela régua, `frontend/CLAUDE.md` com `@AGENTS.md`, `components/common/CLAUDE.md` removido. Régua D fechada na branch `docs/regua-docs`.

R4.1 e R4.3: os sete workflows saíram de `.github/workflows/` (`--remover-workflows`); `dependabot.yml` e `.editorconfig` já estavam iguais ao kit. Falta o dono: ligar o *Auto Deploy* no Coolify e apagar os secrets do Actions (`ENV.md` §3). O `AGENTS.md` (seção Produção, ainda cita workflows e smoke por `revision.txt`) não diverge do modelo no `sync --check` e não foi editado.

R4.2: `frontend/Dockerfile-production` e `backend/Dockerfile-production` iguais ao kit (multi-stage, base por digest). `docker build` a partir da raiz: com a CA do proxy do ambiente e dois acréscimos fora do repositório, os dois constroem; o frontend sobe, `/health-check` 200, `/` 307 para `/pt-br` e o container fica `healthy`. Sem esses acréscimos reprovam por duas lacunas do kit, a levar à régua: o `prepare` da raiz roda `node .husky/install.mjs`, que o Dockerfile não copia; e o `frontend` depende de `@maiyu/backend`, cujo `build` roda no filtro `{./frontend}...` sem o código do `backend/` na imagem.

O E2E do kit cobre as páginas públicas (`e2e/support/pages.md`): 90 de 90, depois de levar a 44px os
alvos de toque do crédito das fotos, do rodapé e do breadcrumb do artigo.

Frente do frontend (item G, sub-sessão), na branch `feat/frontend-regua`, nascida de
`feat/backend-inicial`. O lote 1 juntou, por merge e sem force, as branches prontas da fase 1:
espelhos (R1.1), husky e commitlint (R1.3), Luxon (R1.6, parte), versões (R1.7), piso do
`tsconfig` (R1.8) e o `AGENTS.md` da régua (RD.1). Os espelhos foram ressincronizados com o upstream
de 2026-11-11 (`--so-regua`). O `pnpm-lock.yaml` foi regenerado depois que os pacotes do backend passaram
do `minimumReleaseAge`. As rotas já estavam em inglês e sem alias (#383). Toda URL tem prefixo
`/pt-br`, `/en` ou `/es` pelo `paraglide.config.ts` do kit (#384, #385), com sitemap, hreflang,
canonical e JSON-LD prefixados. O lote 2 trouxe o kit livre do backend (levas 7 e 8), o ESLint do
kit (que ignora `components/ui/`, #391) e o merge da `feat/backend-inicial` (PR B, #23). O VineJS saiu
do frontend; contato e carreiras não têm formulário, só o aviso honesto e os canais reais
(`DECISIONS.md` #17, decisão do dono); o contato volta numa PR que consome o recurso do backend.
A branch `feat/frontend-kit-backend` trouxe as peças do kit que esperavam o backend (router, http com
Tuyau, env, start, page-head, sitemap, `robots.txt`, route-error, hooks, rich-text, `areas.ts`), o
`ThemeProvider`, o `ThemeToggle` e o `LocaleSwitcher` do kit no lugar dos locais, e o merge do R0.1.
Fora, por lacuna do kit: `table/` e `list-shell/` (o kit não os torna opcionais e o `typecheck` exige
uma rota com `ListSearch`), o domínio da API em `.env.production` (decisão do dono) e o Dockerfile e workflows
(PR própria). Os `<a>` externos dentro de `PillButton render` não
têm par no `ui/`. O diário saiu do `react-markdown`: o corpo dos artigos é documento Tiptap em JSON, um por língua, lido pelo `RichText` do kit no SSR (R1.5 e R1.6 fechadas, `motion` fora).
Foto e crédito pelas peças do kit (R3.3): todo `img` é `Picture`, as imagens moram em `src/assets` (importadas, com hash), o rodapé mostra só `MaiyuCredit`; `PillButton` segue local e o `maiyu.png` do kit estava corrompido no espelho (restaurado do upstream).
As 117 chaves de mensagem do projeto passaram a `snake_case` por área (R3.5, `i18n.md` §2), sem mudar texto; as `kit_*` ficaram intactas.

A varredura de 2026-11-08 comparou o projeto com o `maiyu-pattern` e deu 154 achados, levados ao
upstream; o plano de migração saiu dela e está em `TASKS.md` (itens R, RB e RD). A fase 0 traz o
R0.2 (JSON-LD com `<` escapado) e o R0.4 (`.gitignore` da raiz pela régua, `.gitleaks.toml` do
modelo, `frontend/.vscode/` fora do índice). O R0.1 (cabeçalhos de segurança) entrou por merge da branch `fix/seguranca-cabecalhos`.

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

R1.7 feito na branch `chore/frontend-versoes`: o `frontend/` está na última versão publicada, com
um dia de idade mínima. Ficam de fora o TypeScript 7 (exceção do `tooling.md` §0) e os `@tiptap/*`
do `shared/` em 3.30.5, que são da frente do backend. O frontend não importa o Tiptap hoje.

R1.4, R3.2 e R0.3 (parte) no working tree: contato e candidatura com schema Zod no `shared/`
(`validators/contact/messages`, `validators/careers/applications`, `PROJECT_FIELD_LABELS`), `zodResolver` e as peças do kit; o VineJS saiu do
frontend. Os formulários estão desligados com aviso (`DECISIONS.md` #17). Falta o merge do R0.1 e a prova da CSP.

## Próximos passos

1. PR do contato e da conta do dono (#25) em revisão; depois do merge dela, o lote multi-tenant
   (`chore/backend-multi-tenant`), com o painel de contatos no escopo `platform`.
2. Agendar no Coolify a tarefa `node ace contacts:prune` (`ARCHITECTURE.md` §9.1) antes de o
   formulário ir ao ar, e ligar o formulário de contato e a tela da conta à API (frente F).
3. Frente do frontend: R0.1 e as peças do kit que esperavam o backend (router, http, env, page-head,
   sitemap, route-error, Tuyau, start.ts: R1.10, R1.11, RB.5); depois snake_case (R3.5) e #366 (R3.4).
4. Revisar os quatro artigos do diário e o texto de carreiras: foram escritos pela equipe de agentes
   sem passar pelo crivo de quem é da Maiyu.
5. Trocar as fotos de terceiros por fotos próprias do time e da região, com autorização.
6. Levar ao dono as perguntas de `PRD.md` §8 e cadastrar os secrets novos (`ENV.md` §3).
7. Se o time quiser um grafismo do próprio povo no lugar do trançado genérico, entra com autorização
   de quem o pinta (`DESIGN.md` §2).

## Contexto importante

- Posicionamento: primeira empresa de consultoria e desenvolvimento de software sob demanda da tríplice fronteira, feita por indígenas e pessoas originárias da região (`PRD.md`).
- Contato e carreiras sem formulário: aviso honesto e canais reais, `contato@maiyu.com.br` e WhatsApp (`DECISIONS.md` #17, que substitui a #7).

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
