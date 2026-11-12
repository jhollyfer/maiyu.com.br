# Painel de contatos Specification

**Approved**: pendente

## Problem Statement

A API já guarda as mensagens enviadas pelo formulário de contato e expõe a caixa de entrada do dono em
`/administrator/contacts` (`.specs/features/contato/`, `docs/SECURITY.md` §4). O site não tem tela
nenhuma para ler essas mensagens: o dono só as vê consultando a API. Esta feature entrega a caixa de
entrada no painel: listar, ler, marcar como respondida e apagar.

## Goals

- [ ] A equipe (`STAFF_USER_ROLES` no tenant único) lista, filtra e lê toda mensagem guardada, sem chamar a API à mão.
- [ ] Toda mensagem respondida e todo pedido de exclusão (LGPD) se resolvem pela tela, sem banco.
- [ ] Nenhuma conta fora da equipe vê a caixa de entrada.

## Out of Scope

| Feature                                                     | Reason                                                                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Tela de entrar (sign-in)                                    | peça do kit: lacuna levada à regente geral ("mesma coisa, mesmo jeito"); espera o upstream                     |
| Layout `_private` com a guarda de sessão                    | peça do kit, mesma lacuna; espera o upstream                                                                   |
| Shell do painel (navegação, topo, conta)                    | peça do kit, mesma lacuna; espera o upstream                                                                   |
| Formulário público de contato (`POST /storefront/contacts`) | outra entrega: volta com o multi-tenant (`docs/TASKS.md`, R3.2)                                                |
| Responder ao visitante pelo painel                          | o dono responde do próprio e-mail (`.specs/features/contato/spec.md`, Out of Scope)                            |
| Ordenação por coluna                                        | o contrato não aceita `sort` nem `direction`: a ordem é fixa, mais recente primeiro; mudança passa pela shared |
| Lixeira ou arquivar                                         | o contrato só tem apagar de vez (LGPD); não há `trashed`                                                       |
| Aviso ao dono por e-mail                                    | fora por decisão do dono (contato, resposta 7)                                                                 |

---

## Assumptions & Open Questions

| Assumption / decision                        | Chosen default                                                                                                                                                                                                                                                                                              | Rationale                                                                   | Confirmed? |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------- |
| Contrato                                     | `AdministratorContactPaginateResponse`, `AdministratorContactShowResponse`, `AdministratorContactPaginateValidator` (search da rota), `CONTACT_STATUS`/`CONTACT_STATUSES`, exportados por `@maiyu/shared`; erros `CONTACT_NOT_FOUND` (404) e `CONTACT_ALREADY_ANSWERED` (409) lidos pelo `code` do envelope | confirmado pela shared sobre `afe764c`                                      | y          |
| Rotas da API                                 | `GET /administrator/contacts`, `GET /administrator/contacts/:id`, `POST /administrator/contacts/:id/answer`, `DELETE /administrator/contacts/:id`; sessão e papel de equipe no tenant ativo                                                                                                                 | confirmado pela backend                                                     | y          |
| Área                                         | `AREAS.administrator` em `lib/areas.ts` lista `STAFF_USER_ROLES` no tenant (hoje `ADMINISTRATOR`); a guarda é `AreaCapability.require` no `beforeLoad` do layout da área                                                                                                                                    | ordem da regente; `lib/area-capability.ts` do kit                           | y          |
| Tabela                                       | `components/common/table/` do kit, religado pelo sync `--sem=pix --com=table`, com `ListSearch` na rota                                                                                                                                                                                                     | ordem da regente; régua `frontend.md` §3                                    | y          |
| Ordem                                        | fixa, mais recente primeiro (`createdAt` desc), sem cabeçalho ordenável                                                                                                                                                                                                                                     | contrato                                                                    | y          |
| Tamanho da página                            | o padrão do backend (`PAGINATION.PER_PAGE`) quando a URL não traz `perPage`; o seletor de itens por página do kit muda `perPage` dentro de 1 a 100                                                                                                                                                          | contrato: sem default no schema                                             | y          |
| Ler o detalhe não marca como respondida      | só a ação explícita marca                                                                                                                                                                                                                                                                                   | contrato                                                                    | y          |
| Q1: onde o detalhe abre                      | rota própria `/administrator/contacts/$id`, com voltar para a lista mantendo filtro e página                                                                                                                                                                                                                | link direto, botão voltar do navegador e recarregar funcionam; recomendação | n          |
| Q2: marcar como respondida pede confirmação? | sim, `ConfirmDialog` do kit, porque é de mão única (409 na segunda vez)                                                                                                                                                                                                                                     | ação irreversível pela tela; recomendação                                   | n          |
| Q3: atalho para responder                    | link "Responder por e-mail" no detalhe (`mailto:` com o e-mail do visitante), separado de "marcar como respondida"                                                                                                                                                                                          | o dono responde do próprio e-mail; recomendação                             | n          |
| Q4: filtro de status ao abrir                | todos (sem `status` na URL), com o filtro do kit em três opções: todos, pendentes, respondidas                                                                                                                                                                                                              | a caixa mostra tudo e o dono filtra; recomendação                           | n          |
| Q5: colunas da lista                         | nome, e-mail, início da mensagem (uma linha), idioma, status (pendente ou respondida, com data), recebida em                                                                                                                                                                                                | o que o item traz; recomendação                                             | n          |

**Open questions:** Q1 a Q5 acima, para o dono (via regente). Nenhum código antes da aprovação.

---

## User Stories

### P1: Listar e filtrar a caixa de entrada ⭐ MVP

**User Story**: As a membro da equipe, I want ver as mensagens recebidas, buscar e filtrar por status so that eu saiba o que falta responder.

**Why P1**: sem a lista não há caixa de entrada.

**Acceptance Criteria**:

1. WHEN um membro da equipe abre `/administrator/contacts` THEN the system SHALL listar os contatos da página pedida, do mais recente ao mais antigo, com as colunas de Q5 <!-- event-driven -->
2. WHEN o membro digita uma busca THEN the system SHALL pôr `search` na URL, voltar à página 1 e listar só os contatos cujo nome ou e-mail contém o texto, sem diferenciar maiúsculas <!-- event-driven -->
3. WHEN o membro escolhe "pendentes" ou "respondidas" no filtro THEN the system SHALL pôr `status` na URL (`pending` ou `answered`), voltar à página 1 e listar só os contatos daquele status <!-- event-driven -->
4. WHEN o membro escolhe "todos" no filtro THEN the system SHALL tirar `status` da URL e listar todos os contatos <!-- event-driven -->
5. WHEN o membro muda de página ou de itens por página THEN the system SHALL refletir `page` e `perPage` na URL e manter `search` e `status` <!-- event-driven -->
6. IF a URL traz `page`, `perPage`, `search` ou `status` fora do schema `AdministratorContactPaginateValidator` THEN the system SHALL descartar o valor inválido e listar como se ele não viesse <!-- unwanted -->
7. WHILE a lista carrega the system SHALL mostrar o estado de carregamento da tabela do kit <!-- state-driven -->
8. WHEN a lista vem vazia sem busca nem filtro THEN the system SHALL mostrar o estado vazio de primeiro uso do kit (`EmptyState` reason `first-use`) com o texto "Nenhuma mensagem recebida ainda" <!-- event-driven -->
9. WHEN a lista vem vazia com busca ou filtro THEN the system SHALL mostrar o estado vazio filtrado do kit (`EmptyState` reason `filtered`) com a ação de limpar a busca e o filtro <!-- event-driven -->
10. IF a API responde erro diferente de 401 e 403 THEN the system SHALL mostrar o estado de erro do kit com a ação de tentar de novo <!-- unwanted -->

**Independent Test**: com contatos semeados, abrir a lista, buscar por um e-mail, filtrar pendentes e paginar, conferindo a URL e as linhas.

---

### P1: Ler uma mensagem ⭐ MVP

**User Story**: As a membro da equipe, I want abrir uma mensagem e ler o texto inteiro so that eu possa responder.

**Why P1**: a lista mostra só o começo da mensagem.

**Acceptance Criteria**:

1. WHEN o membro escolhe um contato na lista THEN the system SHALL abrir o detalhe com nome, e-mail, idioma, mensagem inteira, recebida em e status (com a data quando respondida) <!-- event-driven -->
2. The system SHALL não marcar o contato como respondido ao abrir o detalhe <!-- ubiquitous -->
3. IF a API responde 404 `CONTACT_NOT_FOUND` ao abrir o detalhe THEN the system SHALL mostrar o estado "não encontrado" do kit com a ação de voltar à lista <!-- unwanted -->
4. WHEN o membro volta do detalhe para a lista THEN the system SHALL mostrar a lista com a mesma busca, filtro e página de antes <!-- event-driven -->
5. WHEN o membro usa "Responder por e-mail" THEN the system SHALL abrir o `mailto:` com o e-mail do visitante, sem mudar o status <!-- event-driven -->

**Independent Test**: abrir um contato pendente, ler a mensagem inteira, voltar e conferir que segue pendente e a lista segue no mesmo filtro.

---

### P1: Marcar como respondida ⭐ MVP

**User Story**: As a membro da equipe, I want marcar a mensagem como respondida so that a equipe saiba o que já foi tratado.

**Why P1**: é a transição de estado que a caixa de entrada controla.

**Acceptance Criteria**:

1. WHILE o contato está pendente the system SHALL oferecer a ação "Marcar como respondida" no detalhe e nas ações da linha <!-- state-driven -->
2. WHEN o membro confirma "Marcar como respondida" THEN the system SHALL chamar `POST /administrator/contacts/:id/answer`, mostrar o status "respondida" com a data devolvida e atualizar a lista <!-- event-driven -->
3. WHILE o contato está respondido the system SHALL não oferecer a ação "Marcar como respondida" <!-- state-driven -->
4. IF a API responde 409 `CONTACT_ALREADY_ANSWERED` THEN the system SHALL avisar que o contato já estava respondido e recarregar o contato <!-- unwanted -->
5. WHILE a marcação está em andamento the system SHALL desabilitar a ação para impedir um segundo envio <!-- state-driven -->

**Independent Test**: marcar um contato pendente, ver o status mudar e a ação sumir; repetir por outra aba e ver o aviso do 409.

---

### P1: Apagar uma mensagem (LGPD) ⭐ MVP

**User Story**: As a membro da equipe, I want apagar de vez uma mensagem so that eu atenda o pedido de exclusão do titular.

**Why P1**: direito de exclusão (`docs/SECURITY.md`, tabela de dados pessoais).

**Acceptance Criteria**:

1. WHEN o membro usa "Apagar" no detalhe ou nas ações da linha THEN the system SHALL abrir o `ConfirmDialog` do kit dizendo que a exclusão é definitiva <!-- event-driven -->
2. WHEN o membro confirma a exclusão THEN the system SHALL chamar `DELETE /administrator/contacts/:id`, avisar o sucesso e voltar à lista sem o contato <!-- event-driven -->
3. WHEN o membro cancela a confirmação THEN the system SHALL fechar o diálogo sem chamar a API <!-- event-driven -->
4. IF a API responde 404 `CONTACT_NOT_FOUND` na exclusão THEN the system SHALL avisar que o contato não existe mais e atualizar a lista <!-- unwanted -->

**Independent Test**: apagar um contato pela linha, confirmar, ver o aviso e a linha sumir; cancelar outro e ver que fica.

---

### P1: Só a equipe entra ⭐ MVP

**User Story**: As a dono, I want que só a equipe veja a caixa de entrada so that dado pessoal não vaze.

**Why P1**: a caixa guarda nome, e-mail e mensagem (dado pessoal).

**Acceptance Criteria**:

1. The system SHALL declarar a área `administrator` em `lib/areas.ts` com `STAFF_USER_ROLES` no tenant <!-- ubiquitous -->
2. IF a conta da sessão não está em `STAFF_USER_ROLES` no tenant ativo THEN the system SHALL redirecionar para `homeOf(conta)` antes de carregar dado <!-- unwanted -->
3. IF a API responde 401 em qualquer chamada da caixa THEN the system SHALL seguir o tratamento de sessão expirada do kit (`-use-session-expiry-redirect`) <!-- unwanted -->

**Independent Test**: com uma conta fora da equipe, abrir a URL e ver o redirecionamento sem chamada à API de contatos.

---

## Edge Cases

- IF a mensagem tem 5000 caracteres THEN the system SHALL mostrá-la inteira no detalhe, com quebra de linha preservada e sem cortar
- IF a mensagem tem HTML ou markdown THEN the system SHALL mostrá-la como texto puro, sem interpretar
- WHEN o nome ou o e-mail passam da largura da coluna THEN the system SHALL truncar na lista com reticências e mostrar inteiro no detalhe
- WHEN a página pedida passa da última THEN the system SHALL seguir o comportamento da tabela do kit para página vazia

---

## Implicit-requirement dimensions

| Dimension                       | Coverage                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Input validation & bounds       | search da URL pelo schema do shared (P1 lista, 6)                                                            |
| Failure / partial-failure       | erro da lista (lista, 10), 404 (detalhe 3, apagar 4), 409 (marcar 4)                                         |
| Idempotency / retry / duplicate | ação desabilitada em andamento (marcar 5); 409 tratado                                                       |
| Auth boundaries & rate limits   | guarda de área (equipe 2), 401 (equipe 3); rate limit N/A because as rotas do painel não têm limiter próprio |
| Concurrency / ordering          | outra aba marcou antes: 409 (marcar 4); ordem fixa do contrato                                               |
| Data lifecycle / expiry         | apagar de vez (LGPD); expiração de 12 meses N/A because é o `contacts:prune` do backend                      |
| Observability                   | N/A because o frontend não tem telemetria na régua deste projeto                                             |
| External-dependency failure     | API fora: estado de erro com tentar de novo (lista 10)                                                       |
| State-transition integrity      | pendente para respondida, mão única (marcar 1 a 4)                                                           |

---

## Requirement Traceability

| Requirement ID | Story                      | Phase  | Status  |
| -------------- | -------------------------- | ------ | ------- |
| INBOX-01       | P1: Listar e filtrar       | Design | Pending |
| INBOX-02       | P1: Ler uma mensagem       | Design | Pending |
| INBOX-03       | P1: Marcar como respondida | Design | Pending |
| INBOX-04       | P1: Apagar uma mensagem    | Design | Pending |
| INBOX-05       | P1: Só a equipe entra      | Design | Pending |

**Coverage:** 5 total, 0 mapped to tasks, 5 unmapped (tasks vêm depois da aprovação)

---

## Sources

- `.specs/features/contato/spec.md` - rotas, transição pendente para respondida, apagar de vez, ordem e filtros
- contrato confirmado pela shared sobre `afe764c` (`shared/src/responses/administrator/contacts.response.ts`, `shared/src/validators/administrator/contacts.validator.ts`, `shared/src/enums/contact-status.ts`)
- `docs/SECURITY.md` - papéis da equipe e tabela de dados pessoais
- ordens da regente: área por `STAFF_USER_ROLES`, tabela do kit com `--com=table`, entrar, layout e shell fora até o kit

---

## Success Criteria

- [ ] A equipe trata uma mensagem do recebimento à resposta ou à exclusão só pela tela.
- [ ] Nenhuma conta fora da equipe carrega dado da caixa de entrada.
