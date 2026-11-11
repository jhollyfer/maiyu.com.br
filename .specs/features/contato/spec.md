# Contato Specification

**Approved**: pending

## Problem Statement

O formulário de contato do site confirma na tela e não envia nada (`docs/DECISIONS.md` #7, R0.3): quem
escreve para a Maiyu fala sozinho. O dono aprovou (R2.10) que a API receba a mensagem, guarde-a por um
prazo declarado e deixe o dono listá-la e marcá-la como respondida.

## Goals

- [ ] Toda mensagem válida enviada pelo site fica guardada e aparece na listagem do dono.
- [ ] Nenhum dado de contato fica guardado mais de 12 meses.
- [ ] Um robô que preenche o honeypot ou passa do limite por IP não grava nada.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Candidatura (carreiras) | fora do R2.10 aprovado |
| Conteúdo editável do site | fora do R2.10 aprovado |
| Tela do painel e o envio pelo frontend | frente F (RB.5 e R3); aqui só a API |
| Responder ao visitante pelo painel | o dono responde do próprio e-mail |
| Arquivar ou apagar contato à mão | não pedido; ver Open questions |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Rotas | `POST /storefront/contacts` (público); `GET /administrator/contacts`, `GET /administrator/contacts/:id`, `POST /administrator/contacts/:id/answer` | rota em inglês (#383), módulo público `storefront` e painel `administrator` como no adacaibs | n |
| Marcar como respondida | mão única: grava `answered_at`; segunda vez responde 409 `CONTACT_ALREADY_ANSWERED` | transição de estado simples e auditável | n |
| Limites do formulário | nome 1 a 120, e-mail até 254 (formato de e-mail), mensagem 10 a 5000 caracteres, idioma em `pt-BR`, `en`, `es` | tetos de `Rule` e do `LOCALES` do shared | n |
| Honeypot | campo `website` no corpo; preenchido, a API responde 201 igual ao sucesso e não grava nem avisa | o robô não aprende que foi barrado | n |
| Limite por IP | 5 envios por hora por IP, 429 `TOO_MANY_REQUESTS` no sexto | limiter nomeado da casa em `start/limiter.ts` | n |
| Aviso ao dono | e-mail pelo bloco opcional de e-mail do kit para toda conta `ADMINISTRATOR` ativa, com nome, e-mail, idioma e a mensagem; sem SMTP configurado o envio é pulado e o contato fica gravado | o kit traz `MailContract.sendLater` com `isConfigured`; sem chave nova fora do catálogo | n |
| Guarda de 12 meses | comando `contacts:prune` apaga de vez o contato criado há mais de 12 meses; roda pelo agendador do ambiente (tarefa agendada do Coolify), como o `storages:prune` do kit | não há agendador dentro da aplicação na régua | n |
| Listagem | página de 20, mais recente primeiro, filtro `?status=pending|answered`, busca em nome e e-mail, índice em `created_at` e `answered_at` | #382 | n |

**Open questions:** (1) marcar como respondida é mão única? (2) quem recebe o aviso: toda conta `ADMINISTRATOR` ativa? (3) o dono precisa apagar contato à mão (pedido de exclusão LGPD) ou só o expurgo de 12 meses? (4) os limites e o teto de 5 por hora servem?

---

## User Stories

### P1: Visitante envia mensagem ⭐ MVP

**User Story**: As a visitante do site, I want enviar nome, e-mail, mensagem e idioma so that a Maiyu me responda.

**Why P1**: é o fluxo que hoje não existe.

**Acceptance Criteria**:

1. WHEN um visitante sem sessão envia `POST /storefront/contacts` com nome, e-mail, mensagem e idioma válidos THEN the system SHALL responder 201 e gravar o contato com `answered_at` nulo  <!-- event-driven -->
2. IF um campo falta ou passa do limite THEN the system SHALL responder 422 com o campo em `errors` e não gravar nada  <!-- unwanted -->
3. IF o campo `website` vem preenchido THEN the system SHALL responder 201 e não gravar nem avisar  <!-- unwanted -->
4. IF o mesmo IP passa de 5 envios na mesma hora THEN the system SHALL responder 429 e não gravar  <!-- unwanted -->
5. IF a escrita chega de uma origem fora de `CORS_ORIGINS` THEN the system SHALL responder 403 `ORIGIN_NOT_ALLOWED` e não gravar  <!-- unwanted -->

**Independent Test**: `POST` válido seguido de leitura do banco; os quatro casos de recusa deixam a tabela vazia.

---

### P1: Dono lista e marca como respondida ⭐ MVP

**User Story**: As a dono, I want listar os contatos e marcar o que já respondi so that nada fique sem resposta.

**Why P1**: sem listagem a mensagem gravada não chega a ninguém.

**Acceptance Criteria**:

1. WHEN o dono lista `GET /administrator/contacts` THEN the system SHALL devolver a página de 20 contatos, do mais recente ao mais antigo, com o envelope paginado  <!-- event-driven -->
2. WHEN o dono filtra `?status=pending` THEN the system SHALL devolver só contatos com `answered_at` nulo  <!-- event-driven -->
3. WHEN o dono filtra `?status=answered` THEN the system SHALL devolver só contatos com `answered_at` preenchido  <!-- event-driven -->
4. WHEN o dono busca `?search=<texto>` THEN the system SHALL devolver só contatos cujo nome ou e-mail contém o texto, sem diferenciar maiúsculas  <!-- event-driven -->
5. WHEN o dono abre `GET /administrator/contacts/:id` THEN the system SHALL devolver o contato inteiro  <!-- event-driven -->
6. WHEN o dono envia `POST /administrator/contacts/:id/answer` para um contato pendente THEN the system SHALL gravar `answered_at` com o instante do relógio e responder 200 com o contato  <!-- event-driven -->
7. IF o contato já está respondido THEN the system SHALL responder 409 `CONTACT_ALREADY_ANSWERED` e não mudar `answered_at`  <!-- unwanted -->
8. IF o id não existe THEN the system SHALL responder 404 `CONTACT_NOT_FOUND`  <!-- unwanted -->
9. IF quem chama não tem sessão THEN the system SHALL responder 401  <!-- unwanted -->
10. IF quem chama tem sessão com papel fora do staff THEN the system SHALL responder 403  <!-- unwanted -->
11. The system SHALL listar com número de queries fixo, travado em teste  <!-- ubiquitous -->

**Independent Test**: semear contatos, listar com e sem filtro, marcar um, repetir a marcação.

---

### P2: Aviso ao dono por e-mail

**User Story**: As a dono, I want receber um e-mail quando chega contato so that eu não precise abrir o painel para saber.

**Why P2**: a listagem já resolve; o aviso encurta a resposta.

**Acceptance Criteria**:

1. WHERE o e-mail está configurado (`MAIL_FROM` e `SMTP_HOST`) WHEN um contato é gravado THEN the system SHALL enfileirar um e-mail para cada conta `ADMINISTRATOR` ativa com nome, e-mail, idioma e mensagem, depois do commit  <!-- optional-feature -->
2. IF o e-mail não está configurado THEN the system SHALL gravar o contato e pular o aviso, com uma linha de log sem dado pessoal  <!-- unwanted -->
3. IF o envio falha THEN the system SHALL manter o contato gravado e responder 201 ao visitante  <!-- unwanted -->

**Independent Test**: com o dublê de e-mail, um envio gera uma mensagem por administrador ativo; sem configuração, nenhuma.

---

### P1: Guarda de 12 meses ⭐ MVP

**User Story**: As a dono, I want que contato velho saia sozinho so that o site cumpra a guarda declarada na LGPD.

**Why P1**: dado pessoal sem prazo de guarda não pode entrar em produção (`docs/SECURITY.md` §8).

**Acceptance Criteria**:

1. WHEN `node ace contacts:prune` roda THEN the system SHALL apagar de vez todo contato criado há mais de 12 meses, respondido ou não  <!-- event-driven -->
2. The system SHALL manter todo contato criado há 12 meses ou menos  <!-- ubiquitous -->
3. WHEN o comando roda com `--dry-run` THEN the system SHALL listar a contagem sem apagar  <!-- event-driven -->
4. WHEN o comando roda duas vezes seguidas THEN the system SHALL deixar o mesmo estado e sair com código 0  <!-- event-driven -->

**Independent Test**: semear contatos de 13 meses e de 11 meses, rodar o comando, contar o que ficou.

---

## Edge Cases

- IF a mensagem só tem espaços THEN the system SHALL responder 422 no campo `message`
- IF o idioma não é `pt-BR`, `en` nem `es` THEN the system SHALL responder 422 no campo `locale`
- WHEN dois `answer` chegam juntos para o mesmo contato THEN the system SHALL gravar `answered_at` uma vez e responder 409 ao segundo

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CONTACT-01 | P1: Visitante envia mensagem | Design | Pending |
| CONTACT-02 | P1: Dono lista e marca como respondida | Design | Pending |
| CONTACT-03 | P2: Aviso ao dono por e-mail | Design | Pending |
| CONTACT-04 | P1: Guarda de 12 meses | Design | Pending |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped

---

## Sources

- Mensagem da regente de 2026-11-11 (R2.10 aprovado pelo dono) - escopo dos dois recursos
- `docs/SECURITY.md` §8 - finalidade e guarda do dado pessoal
- `_standards/_map/canon-2026-11/SINTESE/CANONICAS.md` §A, §F, §H - forma do CRUD, listagem e comando

---

## Success Criteria

- [ ] Funcional cobre os cinco envios (aceito, 422, honeypot, 429, origem) e a transição de resposta
- [ ] `contacts:prune` apaga só o que passou de 12 meses
