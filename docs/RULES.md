# Regras de desenvolvimento

**Maiyu** · valem para quem escreve código aqui, pessoa ou agente

> As regras da casa (TypeScript sem `any`/`as`/`!`, SOLID, `Either`, VineJS, commits) estão em
> `_standards/` e valem integralmente. Este arquivo só **acrescenta** o que é deste projeto.
> Regra que serviria para qualquer projeto vai para `_standards/`, não aqui.

## 1. Antes de mudar

- Ler `docs/MEMORY.md` e a linha da tarefa em `docs/TASKS.md`.
- Mudança pequena, um assunto por commit; todo ajuste vem com teste.
- Procurar o que já existe antes de criar (`_standards/architecture.md` §1, item 10).
- Ler `docs/DECISIONS.md` antes de uma escolha difícil de desfazer.
- Abrir o equivalente em `../academy/frontend` ou `../simple-hub/frontend` antes de escrever um arquivo (`AGENTS.md`, "A regra zero").

## 2. O agente não mexe sem perguntar

- Dependência nova, ou troca de versão major.
- Teste que está falhando: investiga, não apaga nem pula.
- `docs/PRD.md` (escopo).
- Secret do repositório, painel do Coolify, `UUID_APP` e configuração de deploy.
- `components/ui/`: território do shadcn, nunca editado à mão.
- `.github/workflows/`: pendente de decisão do dono (`DECISIONS.md` #6).
- Copy de posicionamento (quem é a Maiyu, a quem serve): vem do dono do produto (`PRD.md` §1 e §2).

## 3. Regras deste projeto

| Tema | Regra | Por quê |
|---|---|---|
| Idioma na URL | rotas declaram `/portfolio` uma vez; o prefixo vem do `rewrite`; nenhuma tela monta URL com idioma à mão | o `Link` já devolve o prefixo, e URL à mão quebra ao mudar de língua |
| Mensagem lida no render | `m.chave()` dentro do componente, nunca string resolvida no módulo | a mensagem do paraglide depende do idioma da requisição |
| Conteúdo de registro | `LocalizedText` no próprio registro de `lib/`, nas três línguas | tradução separada do dado envelhece em ritmo diferente |
| Rótulo de valor fechado | função em `lib/labels.ts` | string no módulo congelaria o idioma do primeiro SSR |
| Formulário | o site não tem; aviso e canais no lugar | contato volta com o recurso do backend (`DECISIONS.md` #17) |
| Animação | CSS com `motion-reduce:`; sem `motion` | `DECISIONS.md` #10 |
| Tom do texto | fala da Maiyu e de quem a Maiyu serve com respeito e sem exotizar: povos e organizações indígenas são clientes e parceiros, não tema decorativo | o público inclui organizações indígenas (`PRD.md` §2) |
| Texto versionado | sem emoji e sem travessão | regra de escrita da casa (`AGENTS.md`, "Escrita") |

## 4. Estrutura

Tela em `frontend/src/routes/_public/`, peça de vitrine em `_public/-components/`, peça de mais de
uma área em `components/common/`, conteúdo em `lib/`. A árvore é a de `_standards/architecture.md`
§4. O que diverge dela é desvio e se corrige; regra que não serve muda no `maiyu-pattern`
(`documentation.md`, "Quem manda em quê"). As divergências deliberadas estão em `ARCHITECTURE.md` §3.

## 5. Definição de pronto

- [ ] Lint, typecheck, `pattern:check` e testes rodados no `HEAD` atual, com o resultado à mão
      (critério completo em `TEST-PLAN.md` §6).
- [ ] Teste novo cobre o comportamento e entra na matriz de `TEST-PLAN.md` §3.
- [ ] Estados de carregando, vazio, erro e sucesso tratados na tela (`DESIGN.md` §8, `USER-FLOWS.md`).
- [ ] Texto visível por chave i18n nos três idiomas (`_standards/i18n.md`).
- [ ] `docs/` atualizado no mesmo commit (`_standards/documentation.md` §5).
- [ ] Sem segredo, `console.log`, código comentado ou `TODO` sem dono no diff.

## Histórico

| Data | Mudança |
|---|---|
| 2026-11-04 | Primeira versão, migrada do `CLAUDE.md` |
