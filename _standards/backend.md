# Padrão de backend

A régua de todo backend da casa, qualquer que seja o framework. A árvore, as camadas e os nomes
estão em [`architecture.md`](architecture.md); a forma de entidade, repository, presenter e
transação está em [`domain.md`](domain.md); este arquivo diz **como** cada camada da borda
(controller, use-case, policy, middleware, service, model) se escreve e por quê. O que só vale
para um framework aparece como **nota de adaptador** *(Adonis)* ou *(Fastify)*; o perfil Fastify
completo está em [`backend-fastify.md`](backend-fastify.md).

Este repositório é o **upstream**: projetos recebem `_standards/`, `_doc-lib/` e as skills por
`node scripts/sync-to-project.mjs <dir>`, rodado à mão a partir daqui. Nada do projeto
busca nem consulta este repositório (§11).

---

## 0. A hierarquia de autoridade

Quando duas fontes discordam, esta é a ordem:

1. **`_doc-lib/`** e a página oficial que a entrada cita: o contrato. A entrada é índice; a
   decisão lê a página (`DECISIONS.md` #114).
2. **O tipo instalado** (`node_modules/<pkg>/**/*.d.ts`), quando a doc não cobre o ponto. É
   prova, não opinião.
3. **Este documento** (e `architecture.md`, `domain.md`).
4. **O código existente.**

Se o código contradiz a doc oficial, o código está errado, mesmo que esteja assim em todo
projeto. Quando nem a doc nem o tipo instalado cobrem o assunto, diga "não coberto" e decida com o
critério declarado aqui. Não invente prescrição de doc. Regra desta página que depende de página
oficial que não pôde ser aberta sai marcada *página oficial não conferida*.

---

## 1. Organização

### 1.1 `app/`

A árvore fechada (o que entra em `core/`, `domain/`, `repositories/`, `services/`, `policies/`,
`middleware/`, `exceptions/`, `features/`) é a de
[`architecture.md` §3](architecture.md#3-árvore-do-backend), com as camadas opcionais de §3.1 e as
pastas de framework de §3.2/§3.3. Este arquivo não a repete. Três pontos dela que mudam como se
escreve:

- **`Either` vem de `shared/`** (`shared/src/either.ts`, `DECISIONS.md` #117), não de `core/`.
- **`exceptions/` é fechado** em `http.exception.ts` e `handler.ts`. Tradução de fato de domínio
  ou de service para HTTP não abre arquivo ali: mora em
  `features/<módulo>/<recurso>/_shared.<recurso>-refusal.ts` (`domain.md` §2, C6).
- **`services/` é só I/O externo**, sempre com contrato (`<nome>.contract.ts`, `<nome>.service.ts`,
  `<nome>.fake.ts`; §5.3, `solid.md` §2, C20). Piso da casa: `storage` (inclui o upload
  multipart, §5.4); `mail` entra no piso com o primeiro e-mail do produto (`DECISIONS.md` #351). Persistência é repository (`domain.md` §5); função pura é entidade,
  value object ou `_shared` (§4.9). Atributo de cookie é configuração (§4.10); normalizar slug é o
  value object `Slug`.

*(Adonis)* `app/abilities/main.ts` sempre presente: `node ace add @adonisjs/bouncer` cria o
arquivo e registra o middleware que dá `ctx.bouncer` em todo controller. O guard de sessão por
cookie mora em `app/guards/cookie-access-tokens.guard.ts`. `app/jobs/` nasce com
`@adonisjs/queue`.

**A policy usa o mecanismo que a doc do framework documenta.** *(Adonis)* `@adonisjs/bouncer` é
dependência de baseline, não condicional, porque `app/policies/` é obrigatório e a doc oficial
resolve autorização por registro exatamente com esse pacote
(`_doc-lib/adonisjs.md#guides/auth/authorization`). Ver §4.6.

**Regra de criação:** diretório transversal nasce *vazio-mas-presente* quando o mecanismo é
transversal (`policies/`, `repositories/`, `domain/`); nasce *junto com a dependência* quando o
mecanismo é opcional (`jobs/`, config de e-mail, config de fila). O `pattern:check` cobra a
primeira lista e ignora a segunda.

### 1.2 Fatia vertical, uma pasta por ação

Uma operação HTTP é **uma pasta**: `app/features/<módulo>/<recurso>/<ação>/`, com
`<ação>.controller.ts`, `<ação>.use-case.ts`, `<ação>.unit.spec.ts` e `<ação>.e2e.spec.ts`. Ação é
pasta sempre, inclusive a trivial: é onde os testes dela moram e onde quem procura "arquivar post"
encontra tudo *(opinião da casa)*. Sempre três níveis, nenhum módulo sem recurso, nenhum
`.service.ts` dentro da ação (`architecture.md` §3).

O use-case fala com o **repository** (contrato) e com a **entidade** de domínio, nunca com o model
(`domain.md` §7). A pasta não define a rota: o prefixo vem do registro de rotas do framework
(`architecture.md` §5).

### 1.3 Dependência entre camadas

A tabela de quem importa quem está em `architecture.md` §2. Três consequências que se escrevem no
código desta camada:

- **Uma tabela, um escritor.** Só o repository da entidade dona grava na tabela dela. Feature que
  precisa mudar dado de outro agregado chama o repository (e a entidade) dele, nunca
  `db.from('posts').update(...)` nem `PostModel.query().update(...)` fora de
  `repositories/post/` *(opinião da casa)*. Escritor espalhado é invariante que ninguém garante.
- **Sem import circular**, em camada nenhuma: no Fastify, ciclo faz a injeção chegar `undefined`
  (`domain.md` §8).
- Uma feature não importa outra; o compartilhado sobe para `_shared.<tema>`, domínio ou service.

Cobrado por dependency-cruiser e `pattern:check` (`domain.md` §8).

---

## 2. Convenções de escrita

Valem para todo `.ts` do repositório, incluindo `database/`, `config/`, `tests/`. São a fonte das
regras de estilo que `typescript.md` cita sem repetir. As cinco primeiras são cobradas por ESLint
(`tooling.md` §4); as demais, por `pattern:check` ou revisão.

1. **Sem ternário** de atribuição ou controle de fluxo → `if` clássico. `??`, `?.` e o
   short-circuit `&&` com booleano continuam válidos.
2. **Sem `any`** → `unknown` mais narrowing na fronteira (`typescript.md` §2.1). Lib com tipo
   errado é cast de fronteira registrado (`typescript.md` §1), nunca `any`.
3. **Sem `as`** → `satisfies`, ou corrigir o tipo na origem. `as const` é permitido. Cast de
   fronteira real leva `eslint-disable-next-line` com justificativa em inglês (`typescript.md` §12).
4. **Sem `!` non-null** → guard no topo (`typescript.md` §1).
5. **Sempre `type`, nunca `interface`** *(opinião da casa)*, exceto em `declare module`, onde o
   TypeScript exige `interface` para o declaration merging (tipagem de eventos, `ctx.actor`,
   _doc-lib/typescript.md#docs/handbook/declaration-merging). A doc **permite** e **não recomenda**:
   o Handbook diz que, na maior parte dos casos, a escolha é de preferência, mas a heurística dele é
   a oposta ("use interface until you need to use features from type") e registra que `interface`
   com `extends` costuma ser mais rápida para o compilador que interseção
   (_doc-lib/typescript.md#docs/handbook/2/everyday-types, "Differences Between Type Aliases and
   Interfaces"). A casa fica com `type` para ter uma forma só, que também cobre união, tupla e tipo
   mapeado, e aceita o custo de compilação; tipo que fica lento se quebra em tipos nomeados
   (`typescript.md` §8).
6. **`Merge<A, B>` no lugar de `A & B`** para tipos objeto *(opinião da casa, `typescript.md` §8)*.
   Onde `&` continua certo (`Array<T>`, união discriminada): `typescript.md` §8.
7. **Lookup object** no lugar de cadeia de `if/else if` com 3+ casos que mapeia um discriminante
   para valor ou handler, `satisfies Record<União, V>` e sem `??` de fallback quando a chave é
   união fechada *(opinião da casa)*. Lógica booleana arbitrária continua `if`.
8. **`async/await`, nunca cadeia `.then/.catch/.finally`** *(opinião da casa)*. Combinadores
   seguem válidos com `await Promise.all([...])`.
9. **Logger do framework, nunca `console.*`** em `app/`, `commands/`, `start/` e `config/`
   (`_doc-lib/adonisjs.md#guides/digging-deeper/logger`; `_doc-lib/fastify.md#Reference/Logging`).
   `console` só em `scripts/`. Lint `no-console`.

### 2.1 DI sempre, `new Classe()` nunca

Injeção por construtor em todo código de produção **e em teste E2E**.

`new X()` onde `X` termina em `Service`, `UseCase`, `Policy`, `Controller`, `Repository` ou
`Seeder` é recusado por `eslint.config.js` **em todo arquivo**, sem isenção por diretório.
Isenção por diretório (`start/`, `config/`, `providers/`, `commands/`, middlewares, na tese de
que ali é o composition root) é exatamente por onde passa o defeito: um callback de evento faz
`new XService()` tendo o contexto em mãos para pedir ao container. O composition root de
verdade instancia classes que não casam com o seletor (`Guard`, `Provider`, `Bouncer`); o que
precisar de exceção entra na allowlist do `eslint.config.js`, por símbolo. As isenções são
nomeadas e fechadas:

| Isenção | Por quê |
|---|---|
| `new CookieAccessTokensGuard(context)` *(Adonis)* | factory que `config/auth.ts` exige; o guard recebe o `HttpContext` da requisição, não do container |
| `new Bouncer(() => ctx.actor, ...)` *(Adonis)* | API pública do `@adonisjs/bouncer`, só no middleware que o inicializa (§4.6) |
| `*.unit.spec.ts` (os dois perfis) | o unitário instancia o use-case com a implementação em memória do contrato (`<entidade>.memory.repository.ts`, `<nome>.fake.ts`); a implementação real só aparece no E2E (`DECISIONS.md` #116) |
| `database/{migrations,seeders,remodels}/**` *(Fastify)* | migration/seeder/remodel não sobe kernel nem container por desenho; o guard real é revisão, não lint |

**Teste E2E pede o objeto ao container (`app.container.make(X)` no Adonis), nunca
`new X()`.** Com `new`, o teste não quebra quando o construtor ganha uma dependência: passa
testando um objeto meio construído. No unitário o risco não existe: o construtor recebe tudo
explícito, e o compilador acusa a dependência que faltar.

- **Factory que dá `new` em colaborador e singleton fora do container** são proibidos; a regra, o
  porquê e a forma no lugar (lookup no composition root, `singleton` no provider) estão em
  `domain.md` §11.1 (Strategy com I/O) e §11.2.

---

## 3. Nomenclatura

Todo nome de arquivo é **kebab-case com sufixo de papel** (lista fechada em `architecture.md`
§3). Gerador de framework que produza outro formato (snake_case) é renomeado na hora, exceto
migration. Identificador, rota e comentário em inglês; texto que o usuário vê por chave i18n
(`typescript.md` §12, `i18n.md`).

**Rota em inglês, sem alias nem redirect** (`DECISIONS.md` #383), na API e no frontend: o caminho
é inglês (`/courses`, `/sign-in`, `/administrator/users`), e a rota renomeada morre no nome antigo, que
passa a responder 404. Não há segundo caminho para o mesmo recurso, nem 301/302/307 de caminho antigo
para novo, nem rota que só repassa. Quem consome o caminho antigo (link, painel do Coolify, cliente) muda
no mesmo PR ou antes do merge. O prefixo de idioma do frontend é *rewrite* do Paraglide (`i18n.md`),
não alias: `/es/courses` e `/pt-br/courses` são a mesma rota. A URL sem prefixo redirecionar para
`/pt-br` é a única exceção (#384).
Não são alias: a guarda de sessão e de papel (`/sign-in?redirect=`), o download que responde com a URL
assinada do bucket e o índice de um layout que leva à primeira aba (`/$company` para
`/$company/dashboard`), desde que o índice nunca tenha sido uma página própria.

**Tudo que nomeia a ação deriva do caminho** `features/<módulo>/<recurso>/<ação>/` (C1, C11),
e o `pattern:check` gera cada nome do caminho e compara:

| Coisa | Forma | Exemplo (`features/administrator/posts/archive/`) |
|---|---|---|
| classe de controller | `<Módulo><Recurso><Ação>Controller`, recurso no singular | `AdministratorPostArchiveController` |
| classe de use-case | `<Módulo><Recurso><Ação>UseCase` | `AdministratorPostArchiveUseCase` |
| export de validator (request) | `<Módulo><Recurso><Ação>Validator` + `type <…>Payload` | `AdministratorPostArchiveValidator` |
| schema de resposta | `<Módulo><Recurso><Ação>Response` (`architecture.md` §10) | `AdministratorPostShowResponse` |
| código de 500 | `<MÓDULO>_<RECURSO>_<AÇÃO>_ERROR`, sempre com o módulo | `ADMINISTRATOR_POST_ARCHIVE_ERROR` |
| tag de log do use-case | `[<módulo>/<recurso> > <ação>][error]`, recurso como a pasta; passo intermediário num colchete próprio | `[administrator/posts > archive][error]`, `[account/storages > create][abort][error]` |

O módulo vai **sempre**: "só quando o recurso existe em dois módulos" muda de resposta no dia em
que nasce o segundo módulo, e as tags e códigos sem prefixo colidem (administrator × storefront).

| Coisa | Forma |
|---|---|
| pasta de ação | `<ação>/`, verbo em kebab-case (`archive/`, `sign-in/`); ciclo de vida com o vocabulário de §4.8 |
| arquivos da ação | `<ação>.controller.ts`, `<ação>.use-case.ts`, `<ação>.unit.spec.ts`, `<ação>.e2e.spec.ts` |
| validator | Adonis: `app/validators/<módulo>/<recurso>.validator.ts` (VineJS) e o par Zod em `shared/src/validators/` com o mesmo caminho e nome (`architecture.md` §9, `DECISIONS.md` #241, #326); Fastify: só o Zod do `shared/` |
| resposta | `shared/src/responses/<módulo>/<recurso>.response.ts`, um arquivo por recurso (`architecture.md` §10) |
| entidade, fato, value object | `domain/<entidade>/<entidade>.entity.ts`, `<entidade>.errors.ts`; `<nome>.value-object.ts` (`domain.md` §1–§3) |
| repository | contrato `<Entidade>Repository` em `<entidade>.repository.ts`; `<Entidade>LucidRepository`/`MongoRepository`/`MemoryRepository` (`domain.md` §5) |
| presenter | `<Entidade>Presenter` em `features/<módulo>/<recurso>/<recurso>.presenter.ts`, um método por forma de resposta (`architecture.md` §10) |
| tradutor de recusa | `features/<módulo>/<recurso>/_shared.<recurso>-refusal.ts` (`domain.md` §2) |
| service de I/O | `services/<nome>/<nome>.contract.ts` (`abstract class <Nome>Contract`), `<nome>.service.ts`, `<nome>.fake.ts` |
| arquivo de model | `models/<entidade>.ts` em kebab-case (`team-member.ts`, nunca `team_member.ts`) |
| middleware | `<nome>.middleware.ts` (`auth.middleware.ts`) |
| policy | `<entidade>.policy.ts`; base comum `session-scoped-policy.base.ts` (§4.6) |
| classe base de template method | `abstract class` com o algoritmo, subclasse preenche o passo, **um nível** de herança. Em `services/` e `policies/`, `<nome>.base.ts`; entre recursos de um módulo, `_shared.<tema>.base.ts` (`architecture.md` §3). Não é contrato: o contrato é fronteira de I/O trocável em teste, a base não se troca |
| comando de CLI | `commands/<recurso>-<verbo>.command.ts`, invocado como `<recurso>:<verbo>`; mutante aceita `--dry-run` (§4.12). _doc-lib/adonisjs.md#guides/ace/creating-commands |
| evento | `<recurso>:<particípio>` (`post:archived`), como a doc (`_doc-lib/adonisjs.md#guides/digging-deeper/emitter`) |
| seeder | `database/seeders/<nome>.seed.ts`: o sufixo é o contrato de descoberta do boot/`db:seed`. Seed manual (dado de demo, carga pontual) fica em `database/seeders/dev/` sem o sufixo, com o motivo no topo, e roda por script nomeado. O seeder do dono liga pela chave e não restringe ambiente (§6); só a demonstração declara `static environment = ['development', 'test']` (_doc-lib/lucid.md#seeders, `DECISIONS.md` #329) |
| factory | `database/factories/<entidade>.factory.ts`, uma por entidade viva, usada só por spec; espelha o model, sem regra de negócio, nasce com o papel menos privilegiado (§7). _doc-lib/lucid.md#model-factories |
| provider | um por contrato, `providers/<contrato>.provider.ts`, mais `repository.provider.ts` e `i18n.provider.ts`, com import estático (`DECISIONS.md` #340): `register()` liga contrato → implementação, `shutdown()` libera pool/conexão; `singleton` quando o cliente guarda conexão, `bind` quando é sem estado, comentário do porquê. _doc-lib/adonisjs.md#guides/concepts/service-providers |
| socket | por feature, no contrato do service do socket: `<FEATURE>_NAMESPACE` (constante) e `<feature>Room(scopeId)` (única função que monta o nome da sala): quem entra e quem emite montam a mesma string. _doc-lib/socket-io.md#namespaces, #rooms |
| migration | **exceção ao kebab**: o nome é o que o framework ordena e registra. Adonis: o gerado por `make:migration` (`<timestamp>_<verbo>_<entidade>.ts`), nunca renomeado (a tabela de controle guarda o nome, renomear reexecuta; _doc-lib/lucid.md#migrations). Script standalone (Fastify): `<sequencial>-migrate-<descrição>.ts` (§7) |
| código de erro de negócio | literal, em inglês maiúsculo, no `HTTPException` (`'POST_NOT_FOUND'`), nunca constante importada: o `openapi:generate` só lê literal (`openapi.md` #erros-do-use-case). Um código por conflito: a mesma recusa tem o mesmo código no pré-check e no `catch` da corrida (§4.4) |
| mensagem de erro | chave i18n, nunca literal (`i18n.md` §3); o `code` é o contrato e não se traduz |
| lógica pura compartilhada | `features/<módulo>/_shared.<tema>.ts`; entre módulos, `features/_shared.<tema>.ts` (§4.9) |
| alias de import do irmão | o nome da classe, sempre (`import AdministratorUserPaginateUseCase from './paginate.use-case.ts'`) |
| import que é só tipo | `import type` (`HttpContext` em controller, `Actor` em `Payload`) |
| alias de import | subpath imports do `package.json` (`#core/*`, `#domain/*`, …, `architecture.md` §3), nativo do Node; o pacote compartilhado entra como `@<projeto>/shared` |

---

## 4. Camadas

### 4.1 Controller

Não contém regra de negócio. Faz: validar, autorizar quando há regra por registro (§4.6), chamar
o use-case, escolher o status.

```ts
// app/features/administrator/posts/update/update.controller.ts  (Adonis)
@inject()
export default class AdministratorPostUpdateController {
  static docs = OpenApiDocs.defineDocs({ /* summary when the action is not derivable */ })

  constructor(private readonly useCase: AdministratorPostUpdateUseCase) {}

  async handle(context: HttpContext) {
    const { params, ...body } = await context.request.validateUsing(AdministratorPostUpdateValidator)
    const result = await this.useCase.execute({ ...body, postId: params.id, actor: context.actor })
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
```

- **Uma forma de ler a entrada.** Um `validateUsing(<Validator>)` por ação, com o parâmetro de rota no
  bloco `params: vine.object({ id: ... })` do próprio schema, que o `validateUsing` extrai sozinho
  (_doc-lib/adonisjs.md#guides/basics/validation, "Validating query strings, params, headers, and cookies",
  conferida em 2026-11-09). O gerador do Tuyau lê esse bloco como `params` da rota: com o
  `IdentifierValidator` passado por `{ data: context.params }` ele trata o `id` como query obrigatória e o
  cliente do frontend não compila (`DECISIONS.md` #375, que substitui a forma da #126). O campo do erro
  segue o caminho no schema: o 422 de um `:id` malformado aponta `params.id` em `errors`, nunca `id`. Nunca
  `request.input()`, `request.body()`, `request.all()` nem `V.validate(request.body())`.

**`HTTPException`** (`exceptions/http.exception.ts`): construtor `protected`; criação só pelas
fábricas estáticas por status, com argumentos posicionais `(message, code, errors?)`, sem default em
nenhum argumento (cobrado pelo `pattern:check`, regra `http-exception-default`; `DECISIONS.md` #352)
(`HTTPException.NotFound(t('posts.not_found'), 'POST_NOT_FOUND')`); `handle()` próprio que
devolve o envelope de §4.5 (`_doc-lib/adonisjs.md#guides/basics/exception-handling`). O `code` é
literal no ponto de uso: embrulhar a fábrica numa função (`slugConflict({...})`) tira o código do
contrato, porque o gerador lê o texto. O que se compartilha é a pergunta (`emailTaken`), não a
resposta.

### 4.2 Use-case

A forma inteira (carregar pelo repository, chamar a entidade, gravar, traduzir o fato, devolver
pelo presenter) está em `domain.md` §7. O esqueleto que o `pattern:check` cobra:

```ts
type Payload = Merge<AdministratorPostUpdatePayload, { actor: Actor; postId: string }>
type Response = Either<HTTPException, AdministratorPostShowResponse>

@inject()
export default class AdministratorPostUpdateUseCase {
  constructor(
    private readonly posts: PostRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // repository, entity, presenter: domain.md §7
    } catch (error) {
      HttpContext.getOrFail().logger.error({ err: error }, '[administrator/posts > update][error]')
      return left(HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'ADMINISTRATOR_POST_UPDATE_ERROR'))
    }
  }
}
```

- **Tradutor injetado** (`DECISIONS.md` #346): no Adonis, `I18n` no construtor e `this.i18n.t('<módulo>.<fato>')`;
  no Fastify, `locale` no payload e `translator(locale)`. Fora da requisição, o `I18n` vem de
  `providers/i18n.provider.ts` (`i18n.md` §3).
- **Log do use-case sai pelo logger da requisição (`ctx.logger`)**, que já carrega o id da
  requisição (§5.6, item 4): `HttpContext.getOrFail().logger`, com `useAsyncLocalStorage: true`
  (_doc-lib/adonisjs.md#guides/basics/http-context). Use-case chamado por job ou comando, que não
  tem `HttpContext`, recebe do chamador o logger filho com o id do job (`DECISIONS.md` #314).
  O logger entra pelo payload, como campo opcional (`Merge<Payload, { logger?: Logger }>`), e o
  use-case usa `payload.logger ?? HttpContext.getOrFail().logger`; o comando passa
  `logger.child({ ... })` (`storages/files/delete` e `storages:prune` no kit). Repository não
  loga: devolve `null` ou lança, e quem loga é o use-case (`pattern:check`, regra
  `request-logger`, cobre `app/features` e `app/repositories`). Unit spec de use-case que loga
  roda dentro de `insideHttpContext(group)` (`tests/http-context-fixtures.ts`); o que não loga
  não chama o fixture.
- **Falha de negócio é `left`, nunca `throw`.** Quem transforma em resposta é o controller.
  Método `*OrFail()` do ORM conta como `throw` (cai no `catch` global e vira 500 onde deveria
  haver 404) e não aparece nem na implementação do repository: o contrato devolve `null` e o
  use-case decide. Cobrado por `pattern:check` (regra `or-fail`), que deixa passar
  `HttpContext.getOrFail()`: não é método do ORM, é a entrada do logger da requisição do item acima.
- **`try/catch` global obrigatório**, começando antes da primeira ida ao repository, com a tag de
  log e o código de 500 derivados do caminho (§3). O 500 sai com mensagem genérica; o detalhe só
  no log (§5.5).
- **Nunca engolir erro.** `catch` que só loga e devolve `false`/`null`/lista vazia é proibido: ou
  traduz para `left`, ou registra a falha durável no próprio registro (`failedAt`,
  `failureCode`, consultável e reprocessável), ou relança. A exceção é o efeito colateral que
  tolera perda, e esse sai do fluxo por evento ou fila (§4.12).
- **Mais de uma escrita, uma unidade de trabalho**: `UnitOfWork.run` (`domain.md` §6), com
  `commit` em `right` e `rollback` em `left`. A saída da transação é `Either`, nunca sentinela
  (`'CONFLICT'` devolvido como string para o chamador interpretar). Bloqueio de linha-pai
  (`forUpdate()`) é método por intenção do repository (`findByIdForUpdate`), não query no
  use-case.
- **Escopo de sessão nunca vem do body.** `actor` e o que dele deriva (dono, tenant) entram pelo
  tipo, a partir da sessão autenticada (§4.3).
- **Idempotência** em toda operação atrás de rede não confiável: §4.11.
- **Template method para ações quase idênticas** *(opinião da casa)*: quando dois use-cases
  diferem só num passo (`archive`/`unarchive`, `bulk-archive`/`bulk-unarchive`), uma base
  `abstract` com o fluxo (`try/catch`, log, tradução) e passos `protected abstract`
  (`logTag`, `notFound`, `failure`) em `_shared.<tema>.ts` do módulo. **Obrigatória** quando três
  ou mais recursos do módulo repetem o mesmo molde: a terceira cópia é onde o bug corrigido em
  uma segue vivo nas outras.

### 4.3 `actor` vai no payload, tipado por schema *(opinião da casa)*

O use-case recebe quem age no próprio payload, como `actor` (`DECISIONS.md` #115). O tipo nasce
de um schema Zod em `shared/`, nunca de `type` redigitado nem do model do ORM:

```ts
// shared/src/validators/authentication/actor.validator.ts
export const ActorSchema = z.object({
  id: z.string(),
  roles: z.array(z.enum(ROLES)),
  teamId: z.string().nullable(),
  locale: z.enum(LOCALES),
})
export type Actor = z.infer<typeof ActorSchema>

// features/administrator/posts/archive/archive.use-case.ts
type Payload = { actor: Actor; postId: string }
```

- **Quem monta é o middleware de autenticação.** Ele autentica (guard do framework), valida o
  usuário contra o `ActorSchema` e deixa o `actor` no contexto (`ctx.actor`, tipado por
  `declare module`); o controller só o repassa. Use-case não importa model (`architecture.md`
  §2), por isso o `actor` não é o `User` do Lucid.
- A policy recebe `(actor, target)`. `actor.roles` e `actor.teamId` resolvem a checagem comum sem
  nova consulta; o que exigir mais dado pede ao repository.
- **E chama-se `actor`.** `user`, `userId`, `createdBy` e `ownerId` no `Payload` são o mesmo dado
  com outro nome, e escapam da policy `(actor, target)`. Cobrado por `pattern:check`. A própria
  conta (`/account`) também é o `actor`.

### 4.4 Validator

**O servidor valida sempre**, mesmo quando o formulário já validou: a validação do frontend é
experiência de uso e se contorna com uma requisição direta. Toda entrada (body, params, query,
cabeçalho que vira dado) passa pelo validator no controller antes do use-case, e o use-case confere
de novo o que é regra de negócio (existência, unicidade, posse).

**O body parser não apara strings** (`trimWhitespaces: false`, `DECISIONS.md` #402): todo `vine.string()` de texto leva `.trim()` na própria regra, e o `pattern:check` (`vine-string-trim`) reprova o que esquecer. A senha e o documento rich-text vão como digitados.

O validator de request é **Zod e mora em `shared/`**, um arquivo por recurso
(`shared/src/validators/<módulo>/<recurso>.validator.ts`), com um export por ação e o tipo ao
lado; o schema de resposta mora em `shared/src/responses/` (`architecture.md` §9, §10). O backend
Fastify os importa de `@<projeto>/shared`; `app/core/validator.ts` reexporta o `z` configurado e
guarda só regra que depende do backend (`architecture.md` §3). **No backend Adonis o validator de
request é VineJS** (nativo do framework), em `app/validators/<módulo>/<recurso>.validator.ts`, com o
mesmo caminho e o mesmo nome do Zod do `shared/`, que o frontend usa; o spec de paridade
(`validators:check`) reprova par faltando e campo, tipo ou teto divergente (`architecture.md` §10;
`DECISIONS.md` #241).

```ts
// shared/src/validators/administrator/posts.validator.ts (Zod; Fastify e frontend)
const postFields = () => ({
  title: z.string().trim().max(160),
  body: z.string().trim().max(20_000),
})

export const AdministratorPostCreateValidator = z.object(postFields())
export type AdministratorPostCreatePayload = z.infer<typeof AdministratorPostCreateValidator>

export const AdministratorPostUpdateValidator = Rule.partial(postFields())
```

```ts
// backend/app/validators/administrator/posts.validator.ts (VineJS; só Adonis)
const postFields = () => ({
  title: vine.string().trim().maxLength(160),
  body: vine.string().trim().maxLength(20_000),
})

export const AdministratorPostCreateValidator = vine.create(vine.object(postFields()))

export const AdministratorPostUpdateValidator = vine.create(Rule.partial(postFields()))
```

- **Ninguém importa `zod` direto nos validators** nem `@vinejs/vine`, nem os subpaths
  (`@vinejs/vine/types`). O `z` configurado sai de `shared/src/validator.ts`; no Adonis, o `vine`
  configurado e o `Infer` saem de `#core/validator`. É por eles que as mensagens e as regras da casa
  valem em todo schema. O sensor do `pattern:check` casa `@vinejs/vine` e `@vinejs/vine/*`; o
  ESLint barra `@vinejs/vine` fora do Adonis (`tooling.md` §0.1, §4.1).
- **Todo dado de fora passa pelo validator (Zod; VineJS no Adonis) antes da regra**: params, query, body, cabeçalho usado em
  decisão, payload de webhook, mensagem de socket, payload de job, resposta de API externa
  (`typescript.md` §2). Query é tratada como possivelmente array ou objeto até o schema dizer o
  contrário.
- **Validator é forma e formato.** Unicidade e existência são do use-case via repository (409 e
  404), não da regra `unique()`/`exists()` do ORM: a mensagem por campo e o 409 com `code`
  estável são o contrato do cliente, e a regra do ORM devolveria um 422 genérico (divergência
  deliberada de `_doc-lib/lucid.md#validation`).
- **A invariante dura mora no banco também.** Toda unicidade tem índice único; todo obrigatório,
  `NOT NULL`; todo domínio fechado, `check` ou FK. O validator dá a mensagem, o índice garante.
  A corrida entre o pré-check e o INSERT cai no `catch` do repository, que reconhece a violação de
  unicidade e devolve o **mesmo** fato do pré-check (um código por conflito). Unicidade sem
  índice único é defeito.
- **Bloco reusável é função**, não constante: no VineJS, nó de schema compartilhado vaza
  `.optional()` entre validators; o Zod é imutável e não vaza, mas a casa mantém a função nos dois
  lados para os pares ficarem iguais. A casa dela é a classe `Rule`, com o mesmo nome de método nos
  dois lados: `Rule` de `shared/src/validator.ts` no Zod e `Rule` de `app/core/validator.ts` no
  VineJS (`Rule.pageFields()`, `Rule.paginationFields()`, `Rule.trashedField()`,
  `Rule.sortFields(tupla)`, `Rule.partial(campos)`, `Rule.notNull()`, `Rule.password()`,
  `Rule.email()`, `Rule.identifierParams()`), nunca `export function` solta
  (`typescript.md` §6). Bloco usado por um recurso só fica no arquivo dele.
- **`Update` não repete o `Create` campo a campo**: os campos nascem de uma função do recurso e o
  update é `Rule.partial(<recurso>Fields())` nos dois lados (exemplos acima, `DECISIONS.md` #386). No
  VineJS ele usa o `.partial()` do objeto e põe `Rule.notNull()` em todo campo que não é
  `.nullable()`: o `.optional()` do VineJS aceita `null` como ausente, e o `convertEmptyStringsToNull`
  do `vine` configurado do Adonis já transformou `''` em `null`, então sem a regra `{ title: null }`
  apaga a coluna obrigatória e volta 200. No Zod ele é o `.partial()` do objeto com `''` lido como
  `null` antes dos campos, para o formulário recusar o campo obrigatório apagado com a mesma
  mensagem `required` da API. Campo escrito à mão no update usa `.optional().use(Rule.notNull())` no
  VineJS e `Rule.notNull(schema)` no Zod (_doc-lib/vinejs.md#extend/custom_rules, regra implícita,
  https://vinejs.dev/docs/extend/custom_rules; `VineObject.partial()` pelo tipo instalado da 4.4,
  `build/src/schema/object/main.d.ts`, que a página `#types/object` não cobre; Zod:
  _doc-lib/zod.md#api, https://zod.dev/api#partial).
- Validator final é constante: `export const <X>Validator = z.object(...)` ou, no Adonis,
  `vine.create(...)`, criado fora do handler. `vine.compile()` está `@deprecated` desde a 4.x.
- **Data declara os formatos que os clientes mandam** (`DECISIONS.md` #307). Sem `formats`, o
  `vine.date()` aceita só `YYYY-MM-DD` e `YYYY-MM-DD HH:mm:ss`; o `JSON.stringify` de um `Date` do
  formulário sai em ISO 8601 (`2026-03-07T00:00:00.000Z`) e volta 422 "data inválida" no campo
  preenchido certo. O campo lista as formas de verdade numa constante do recurso, como
  `vine.date({ formats: ['YYYY-MM-DD', 'iso8601'] })` (_doc-lib/vinejs.md#types/date,
  https://vinejs.dev/docs/types/date, aberta), e o E2E do painel prova pela tela
  (`frontend.md` §11.2).
- **Todo texto tem teto** (`maxLength`). **Quem não filtra por `search` não o aceita**:
  parâmetro aceito e ignorado promete no OpenAPI um filtro que não existe. A listagem sem busca usa
  `Rule.pageFields()` (`page`, `perPage`) e o global `PageValidator`; `Rule.paginationFields()` é ele
  mais `search`.
- **Regra que serve a mais de um campo tem nome próprio** (`cpfLength`, `phone`): a chave do
  provider é `campo.regra`, e `cpf.fixedLength` não é chave de campo nenhum. Regra que valida
  formato de value object chama o predicado do VO (`Email.isValid`, `domain.md` §3).
- **Meta-spec dos validators** (`core/validator.unit.spec.ts`, `architecture.md` §3; o mesmo no
  `shared/`) varre todo export `*Validator` e reprova: mensagem que escapou sem tradução, campo de
  texto sem teto, campo sem rótulo, rótulo órfão. Os schemas `*Response` ficam fora dela pelo
  sufixo (C7). Onde moram as mensagens e os rótulos nos três idiomas: `architecture.md` §9 e
  `i18n.md` §3–§4.
- **Schema definido em runtime** (campo que o usuário configura) não cabe em validator fixo: o
  construtor de schema mora em `shared/` (Zod) e monta da definição salva; o Adonis monta o par
  VineJS em `app/validators/` (`architecture.md` §10).

### 4.5 Response e paginação

Envelope de erro único: `{ message, status, code, errors? }` (`shared/src/responses/envelope.ts`,
`architecture.md` §10). `code` é o identificador estável que o cliente compara; `message` é texto
no idioma da requisição e nunca é comparado; `errors` é `campo → mensagem`, com a chave `root`
para o formulário inteiro. Validação reprovada é 422 com `errors`.

**Erro de pacote sai no mesmo envelope** (`DECISIONS.md` #293). Cada pacote que responde com formato
próprio é traduzido em `app/exceptions/handler.ts`, um `instanceof` por pacote: VineJS
(`E_VALIDATION_ERROR`, 422), auth (`E_UNAUTHORIZED_ACCESS`, 401), Bouncer
(`E_AUTHORIZATION_FAILURE`, 403) e o limiter. O `@adonisjs/limiter` responde
`{ errors: [{ message, retryAfter }] }`, e o cliente que lê `errors` como `campo → mensagem` mostra
"[object Object]" na tela de login bloqueada. O handler devolve
`{ message, status: 429, code: 'TOO_MANY_REQUESTS' }` e copia os cabeçalhos de
`error.getDefaultHeaders()` (`Retry-After` e os `X-RateLimit-*`), como no exemplo de tratamento global
da página (_doc-lib/adonisjs.md#guides/security/rate-limiting,
https://docs.adonisjs.com/guides/security/rate-limiting, "Handling the exception globally"). A mensagem
sai da tradução, nunca do pacote. *(Fastify)* o mesmo vale para o `errorResponseBuilder` do
`@fastify/rate-limit` (`backend-fastify.md`, tabela da borda).

**Erro esperado não vai para o log de erro** (`DECISIONS.md` #352). O handler declara
`protected ignoreStatuses = [401, 403, 404, 422, 429]` e `ignoreCodes` com os códigos esperados
(`_doc-lib/adonisjs.md`, "Decisões que a doc impõe", `#guides/basics/exception-handling`). O 401 de sessão sai sempre com
`code: 'AUTHENTICATION_REQUIRED'`, venha do guard, do middleware ou do refresh; credencial errada no
sign-in é `INVALID_CREDENTIALS`, também 401, e só o primeiro dispara o refresh no cliente (`DECISIONS.md`
#376).

**Toda resposta passa por schema**, inclusive 201 e 204: o `http.ts` serializa pelo schema de
`shared/src/responses/` e o que não está nele não sai. Resposta montada à mão (`response.created(model)`,
spread de registro) é como o hash de senha e o token chegam ao cliente.

**O que sai do use-case é contrato, nunca modelo.** O tipo de `shared/src/responses/`, montado
pelo presenter a partir da entidade, ou devolvido direto pela consulta de leitura do repository
(`domain.md` §5.1). Entidade, model Lucid ou documento Mongo cru na resposta é acoplamento ao
modelo interno: renomear coluna quebra o frontend. Projeção é por allowlist (o presenter escolhe
cada campo), nunca "tudo menos a senha".

**`deletedAt` na resposta.** `ResponseRule.timestamps()` declara `createdAt`, `updatedAt` e `deletedAt`, e a
lixeira do painel precisa da data em que a linha foi arquivada. O `response-leak.e2e.spec.ts` proíbe
`deletedAt` na leitura sem sessão (a vitrine pública nunca mostra linha apagada, então vê-la ali é o
registro arquivado chegando à rua) e o aceita na leitura de uma sessão, onde é o contrato do painel; os
segredos (`password`, `token`, `hash`...) continuam proibidos para todos (`DECISIONS.md` #438).

**Paginação devolve `Paginated<T>`**, montado pela implementação do repository a partir do
paginator do ORM:

```ts
// app/repositories/post/post.lucid.repository.ts
async paginate(criteria: PostListCriteria): Promise<Paginated<PostListItem>> {
  const page = await PostModel.query({ client: this.transaction.client() })
    .withScopes((scopes) => scopes.trashed(criteria.trashed))
    .where((builder) => this.applySearch(builder, criteria.search))
    .orderBy(criteria.sort, criteria.direction)
    .orderBy('id', criteria.direction)
    .paginate(criteria.page, criteria.perPage)

  return { meta: page.getMeta(), data: page.all().map((row) => this.toListItem(row)) }
}
```

*(Adonis)* A doc do Lucid (`_doc-lib/lucid.md#pagination`) mostra `.serialize()`, que devolve o
mesmo envelope. A montagem à mão é decisão da casa: `toJSON()` devolve `{ meta: any; data:
ModelObject[] }`, perdendo o tipo do item; `all()` mantém `T[]`, e o `any` do `getMeta()` morre
na fronteira do `Paginated<T>` declarado.

- **Filtro, ordenação e paginação na consulta**, nunca em memória depois do `find`. Toda listagem
  é paginada.
- **Desempate por `id`** depois da coluna pedida: sem ele, linhas com o mesmo valor trocam de página
  entre uma consulta e a próxima (`DECISIONS.md` #347).
- **Escape de `%` e `_` no `whereILike`**: o termo do cliente entra como texto, nunca como padrão.
- **`OR` de busca dentro de `where((builder) => …)`**: solto, o `OR` escapa do filtro de lixeira e
  de posse e devolve linha que não deveria.
- **Ordenação por tupla fechada**: `<RECURSO>_SORT_COLUMNS` (`as const`) no arquivo do validator do
  recurso, lida por `Rule.sortFields(tupla)`; a coluna nunca é string livre do cliente.
- O default (`PAGINATION`) mora junto de `Rule.paginationFields()` em `shared/src/validator.ts`; não há
  `const PAGE`/`PER_PAGE` por caso de uso.

**Resposta de arquivo** (exportar CSV) sai de um helper único de resposta (`sendCsv`), que põe
`Content-Type: text/csv`, `Content-Disposition: attachment` e `Cache-Control: no-store`, nunca os
três cabeçalhos à mão por rota *(opinião da casa)*.

### 4.6 Autorização

Quatro barreiras que compõem, e cada regra mora numa só:

| Barreira | Onde | Cobre | Nega com |
|---|---|---|---|
| Sessão | middleware de autenticação; negar por padrão (§4.10) | quem não está logado | 401 |
| Alcance de rota | middleware no grupo, `role(ROLE.ADMINISTRATOR)` | papel errado nem entra | 403 |
| Forma do payload | validator | campo que aquele papel não pode enviar | 422 |
| Tenant | repositório base (`TenantScoped`, ou `CustomerScoped` na tabela de cliente) e policy base, pelo `TenantScope` da requisição (§4.14) | registro de outro cliente, linha de outro cliente final | 404 |
| Registro | escopo de posse na consulta, ou **policy** (`app/policies/<entidade>.policy.ts`) | "só o dono vê", "editor não apaga", "ninguém rebaixa a si mesmo" | 404 ou 403 (abaixo) |

O papel na rota é sempre a constante de `shared/src/enums/` (`ROLE.ADMINISTRATOR`), nunca o
literal `'ADMINISTRATOR'`: literal não quebra o build quando o papel muda de nome.

**404 uniforme quando a existência é segredo** (C4, reescreve `DECISIONS.md` #28). Registro de
outro dono, de outro tenant ou conta oculta responde **exatamente** como registro inexistente:
mesmo status 404, mesmo `code`, mesma mensagem. Responder 403 para "existe mas não é seu" e 404
para "não existe" é o que vaza a existência, e permite enumerar ids. 403 fica para quem **vê** o
registro e não pode agir sobre ele, e para papel errado no alcance de rota, onde não há registro a
revelar. Dois mecanismos, nesta ordem de preferência:

1. **Escopo de posse dentro da consulta** quando a regra é só posse. O contrato do repository tem
   o método por intenção que já filtra: `findOwned(input: { readonly id: string; readonly ownerId:
   string }): Promise<Order | null>` (contrato por intenção, `domain.md` §5.1). Id alheio volta `null` e vira o 404 do próprio use-case; não
   existe leitura cruzada que depois é negada. É o padrão para recurso do `actor` (`/account`).
2. **Policy que recebe `Entidade | null`** quando a regra é mais que posse (papel, tenant, conta
   oculta). Nega com status 404 o que for segredo e com 403 o resto.

*(Adonis)* A policy segue a doc: estende `BasePolicy`, é gerada por `node ace make:policy` (e
renomeada para `<entidade>.policy.ts`), e a checagem passa por `ctx.bouncer`, nunca por chamada
direta de método (`_doc-lib/adonisjs.md#guides/auth/authorization`). O Bouncer é inicializado com
o `actor` do contexto, não com o model (§2.1), e a policy só importa `core/`, `domain/` e
`shared/`. A base `session-scoped-policy.base.ts` concentra o "nulo ou de outro tenant nega com 404" (a regra aqui é tenant + papel; se fosse só posse, o mecanismo 1 bastaria). A base expõe `hidden(code, key)` (404) e `forbidden(code, key)` (403): a policy passa o `code` estável e a chave i18n (`<módulo>.<fato_snake>`, #334), nunca texto traduzido, e quem traduz é o handler (`DECISIONS.md` #346, #358, #387). A chave vai no `.t()` do `AuthorizationResponse`, que a doc reserva para isso, e o `code` na mensagem, que a doc faz de reserva quando falta a tradução (_doc-lib/adonisjs.md#guides/auth/authorization, "When your application uses @adonisjs/i18n"):

```ts
// app/policies/session-scoped-policy.base.ts
export default abstract class SessionScopedPolicy extends BasePolicy {
  // missing and foreign answer the same 404, so the response never reveals existence
  protected hidden(code: string, key: string): AuthorizationResponse {
    return AuthorizationResponse.deny(code, 404).t(key)
  }

  protected forbidden(code: string, key: string): AuthorizationResponse {
    return AuthorizationResponse.deny(code, 403).t(key)
  }
}

// app/policies/post.policy.ts
export default class PostPolicy extends SessionScopedPolicy {
  update(actor: Actor, post: Post | null): true | AuthorizationResponse {
    if (!post || post.snapshot().teamId !== actor.teamId) return this.hidden('POST_NOT_FOUND', 'posts.not_found')
    if (!actor.roles.includes(ROLE.EDITOR)) return this.forbidden('POST_FORBIDDEN', 'posts.forbidden')   // seen but not allowed
    return true
  }
}
```

O `*.policy.unit.spec.ts` chama a policy direto, sem rota nem Bouncer
(`_doc-lib/adonisjs.md`, "Decisões que a doc impõe", policy testada direto).

```ts
// app/features/account/posts/update/update.controller.ts
async handle(context: HttpContext) {
  const { params, ...body } = await context.request.validateUsing(AccountPostUpdateValidator)
  const post = await this.posts.findById(params.id)          // repository contract; never *OrFail
  await context.bouncer.with(PostPolicy).authorize('update', post)

  const result = await this.useCase.execute({ ...body, postId: params.id, actor: context.actor })
  if (result.isLeft()) throw result.value
  return context.response.ok(result.value)
}
```

`bouncer.with(Policy).authorize(acao, registro)` lança `AuthorizationException` quando nega,
com o status que a resposta declarou; `app/exceptions/handler.ts` a converte no envelope com o `code` e a chave traduzida que a base
passou; a negação 404 usa o mesmo `code` e a mesma chave do "não encontrado" do use-case, para a
resposta ser idêntica à do inexistente. `allows`/`denies` servem para quando a negação não deve interromper o fluxo;
`execute` devolve `AuthorizationResponse` para quando mensagem e código variam por regra. Não
existe quinto caminho: nenhum código de produção chama `PostPolicy.update` direto (só o spec da policy). O status no `deny` é da
doc: `AuthorizationResponse.deny('Post not found', 404)`, "útil para esconder a existência do
recurso" (`_doc-lib/adonisjs.md#guides/auth/authorization`, conferida em 2026-10-14).

**Onde a doc e o formato do use-case se encontram.** A doc carrega o registro e autoriza no
controller, porque é lá que existe `ctx`; o AdonisJS não tem conceito de use-case. A casa segue
esse formato em vez de reimplementar o mapeamento para HTTP dentro do use-case. O preço é a
segunda leitura (o controller carrega para autorizar, o use-case carrega para a regra), e vale
pagá-lo; quando a regra é só posse, o mecanismo 1 dispensa a leitura no controller.

- `ctx.bouncer` **é obrigatório** em toda rota com regra por registro que não seja só posse. A
  lista dessas rotas é dado do projeto, em `scripts/pattern-check.config.ts`
  (`BOUNCER_REQUIRED`), e o `pattern:check` a cobra.
- **Leitura escopada por papel é fail-closed** *(opinião da casa)*: lookup
  `SCOPES[role] ?? NOTHING`, onde `NOTHING` devolve nenhuma linha (`whereRaw('1 = 0')` dentro da
  implementação do repository). Papel novo sem escopo vê nada, não tudo.
- Policy serve a qualquer entidade com dono (`TeamPolicy`, `PostPolicy`), não só a `User`.
- **Todo grupo `administrator/*` tem `role()`** na rota; o `authz:check` reprova o grupo sem ele
  (`DECISIONS.md` #358).
- **Compor guard + sanitização num só objeto de decisão** *(opinião da casa)*: quando a
  autorização de escrita e o corte de campos que só certos papéis podem setar vêm da mesma regra,
  uma função devolve `{ decision, reason }` em vez de duas chamadas booleanas que o use-case
  combina.
- Autorização no frontend é UX; quem barra é a API, e o E2E de cada policy prova a negação pela
  rota, sem passar pela tela.
- *(Fastify)* A policy é classe injetável com a mesma assinatura `(actor, target | null)`
  (`backend-fastify.md` §3).

### 4.7 Model

O model só é importado por `repositories/` (`architecture.md` §2): ele descreve a tabela, e a
regra de negócio mora na entidade (`domain.md` §1).

*(Adonis)* O model estende a classe gerada em `database/schema.ts`, que é **reescrita a cada
`migration:run`**. Só estas coisas entram no arquivo do model, porque só elas sobrevivem:

1. Relações.
2. Estreitamento de enum, **com `@column()`**; sem o decorator o Lucid não hidrata.
3. `prepare`/`consume` de coluna `jsonb` ou `bigint`, compartilhados em `app/core/column.ts`
   (`architecture.md` §3.2), recebendo o valor do banco como `unknown` e convertendo pelo schema.
4. Query scopes (§4.8).
5. Hook só de mecânica de persistência: `@beforeCreate` para id, `@beforeSave` para hash de senha
   (`_doc-lib/lucid.md#model-hooks`). Invariante de negócio é da entidade: hook não dispara em
   update em massa, e a doc o chama de "invariante do model", isto é, da linha *(opinião da casa
   sobre a doc)*.

O model de autenticação é a exceção declarada: `withAuthFinder` e `accessTokens` são exigência do
`@adonisjs/auth`. Redeclarar o tipo de uma coluna que o gerador já declara certo é ruído; correção
de tipo que o gerador erra (inclusive o tipo de `jsonb`) vai para `database/schema_rules.ts`
(nome do framework, não se renomeia). `serializeAs: null` para credencial (hash de senha, hash de
token, token de convite) também vive ali, como defesa em profundidade: a resposta já sai pelo
presenter.

Dentro da implementação do repository:

- **`refresh()` depois de `create`** quando a coluna tem `DEFAULT` do banco: `Model.create()` grava a
  linha mas não traz para o objeto em memória o valor que o banco gerou, e a entidade reidratada sai
  com o campo vazio (_doc-lib/lucid.md#models, https://lucid.adonisjs.com/docs/models, "Runtime
  customization", `refresh`: "useful after a write that triggered database-side defaults"). O
  sintoma não é erro, é dado errado em silêncio: no academy o `locale` do convite tinha `DEFAULT` no
  banco, o objeto voltava sem ele e o e-mail saía no idioma de quem convidou, não no do convidado.
  Vale para todo `DEFAULT` que a regra lê logo depois de criar (idioma, status, contador).
- **Relação lida em laço é carregada antes** (`preload`) para não gerar N+1
  (`_doc-lib/lucid.md#relationships`: `query().preload('posts')`, conferida em 2026-10-14).
- **Listagem tem índice no que filtra e ordena** (`deleted_at`, coluna de busca, **toda** coluna que o
  usuário pode escolher como `sort`, a FK do escopo, e a lixeira `trashed=only` com índice parcial próprio
  `deleted_at is not null`, porque o parcial dos ativos não a atende). Índice composto que já começa
  pela coluna e dá Index Scan com volume conta como índice dela. `trashed=with` (ativos e arquivados
  juntos) não pede índice cheio redundante: a medida com volume vai no PR e basta, e o número de queries por rota é fixo: um teste e2e trava a contagem, e a medida com
  volume (`generate_series` e `EXPLAIN ANALYZE`) entra no PR que mexe na listagem (`DECISIONS.md` #382).
  A contagem usa `QueryCount.assert` de `tests/query-count-fixtures.ts` (kit), que escuta o evento
  `db:query`; ele só dispara com `debug` na conexão, e o `config/database.ts` do kit liga `debug` em
  dev e teste (_doc-lib/lucid.md#debugging); sem nenhuma query registrada ele reprova, em vez de passar com 0.
  Lentidão em produção se separa antes de corrigir: `pg_stat_statements`, contagem da tabela e tempo
  da rota na API contra o do proxy.
  Coluna `jsonb` localizada (nome e título nos três idiomas) de catálogo pequeno (dezenas a poucos
  milhares de linhas) não leva índice de expressão nem trigram por idioma: o Seq Scan cabe na página e
  a medida com volume no PR prova. Com volume que a medida mostre lento, um índice de expressão só do
  idioma base (`(name->>'pt-BR')`) (relato do academy).
  Armadilhas medidas nos projetos (interclasse, 51 mil linhas):
  - filtro "pertence a" com `OR EXISTS` estoura o custo estimado e liga o JIT (213 ms); escreva
    `whereIn(col, sub).orWhereIn(outra, sub)` com índice (12 ms) (_doc-lib/postgresql.md#jit-decision);
  - índice parcial só serve com o predicado literal na consulta (`whereNull`/`whereNotNull` do Lucid
    não geram binding) (_doc-lib/postgresql.md#indexes-partial);
  - índice entra sem `CONCURRENTLY`: o Lucid exige `disableTransactions` para ele e a falha deixa índice
    inválido (_doc-lib/lucid.md#migrations); tabela grande o bastante para precisar é decisão do dono;
  - escrita em lote: `createMany` do Lucid faz um `INSERT` por linha; lote grande vai por
    `client.table(...).multiInsert(...)` (_doc-lib/lucid.md), e `updateOrCreate` em laço é N+1 de escrita.
- **SQL só pelo query builder ou `db.rawQuery(sql, bindings)`.** Template literal com valor de fora
  dentro de `rawQuery` é injeção (`_doc-lib/lucid.md#raw-query-builder`); cobrável por
  `no-restricted-syntax`.
- Coluna qualificada pela tabela (`posts.id`) em todo join: a coluna ambígua só falha em runtime.

*(Fastify)* `models/<entidade>.ts` exporta o tipo do documento e o acesso à coleção; a consulta
Mongo se monta campo a campo a partir do validado, nunca `find(request.body)`
(`backend-fastify.md` §4).

### 4.8 Soft delete e ciclo de vida

*Correção sobre a doc: `_doc-lib/lucid.md#model-query-scopes`.*

```ts
export default class PostModel extends PostSchema {
  static notDeleted = scope((query) => {
    query.whereNull('deletedAt')
  })
  static onlyDeleted = scope((query) => {
    query.whereNotNull('deletedAt')
  })
}
```

O filtro de lixeira é scope no model, aplicado **só dentro da implementação do repository**. A
doc define o gatilho: assim que o mesmo filtro aparece pela terceira vez, vira scope, sobretudo
filtro de segurança. O scope vive no arquivo do model, que não é regerado. Descartados:
`@beforeFetch()` (a doc avisa que hook não dispara em update ou delete em massa) e scope global
(não existe no Lucid). Listagem que mostra a lixeira recebe o modo no critério tipado do contrato
(`trashed: TrashedMode`, de `shared/src/enums/`), e a implementação escolhe o scope.
`whereNull('deletedAt')`/`whereNotNull('deletedAt')` fora do model é cobrado por `pattern:check`
(sensor qualificado, que pega também `posts.deleted_at`). `database/migrations/` fica fora do
sensor, porque migration não pode usar scope do model. Outra exceção legítima entra em
`softDeleteExempt` da configuração do `pattern:check`, com o porquê.

**Vocabulário único do ciclo de vida** (C5):

| Ação | Faz | Recusa |
|---|---|---|
| `archive` | grava `deletedAt` (transição da entidade) | já arquivado: 409 `<RECURSO>_ALREADY_ARCHIVED` |
| `unarchive` | limpa `deletedAt` | não arquivado: 409 |
| `delete` | apaga de vez, **só o arquivado** | não arquivado: 409 `<RECURSO>_NOT_ARCHIVED` |
| `bulk-archive`, `bulk-unarchive`, `bulk-delete` | o mesmo em lote | o mesmo, por item |
| `purge` | esvazia a lixeira | — |

**Rota de cada ação** (`DECISIONS.md` #345): nome `<módulo>.<recurso>.<ação>`, igual à pasta, e sem
prefixo de versão (`/v1`). Rota estática antes de `:id`.

| Ação | Verbo e caminho | Status |
|---|---|---|
| `paginate` | `GET /` | 200 |
| `create` | `POST /` | 201 |
| `show` | `GET :id` | 200 |
| `update` | `PUT :id` | 200 |
| `archive`, `unarchive` | `PATCH :id/archive`, `PATCH :id/unarchive` | 200 com o recurso |
| `delete` | `DELETE :id` (só arquivado) | 204 |
| `purge` | `DELETE /trash` | 204 |

`delete` e `purge` ficam restritos por papel no grupo de rotas. Nomes como `send-to-trash`,
`remove-from-trash` e `permanent-delete` migram para estes (a rota pública pode manter o caminho
antigo por compatibilidade, com `ponytail:`, §5.1).

**Revive-on-create** *(opinião da casa)*: quando a chave natural tem `UNIQUE` global e a linha que
a ocupa está arquivada, `create` reaproveita a linha (desarquiva e sobrescreve) em vez de
responder 409 por um registro que o usuário não vê.

### 4.9 Onde mora a lógica *(opinião da casa)*

| A lógica | Mora em |
|---|---|
| invariante, transição, cálculo do agregado | entidade ou value object (`domain.md` §1, §3) |
| consulta, recorte de linhas ou de colunas, "quem usa este arquivo" | método por intenção do repository (`domain.md` §5) |
| falar com o mundo de fora (SMTP, bucket, gateway, API de terceiro) | service com contrato (§5.3) |
| função pura sobre dado já em mãos, usada por 2+ ações | `_shared.<tema>.ts` do módulo; entre módulos, `features/_shared.<tema>.ts` |
| traduzir fato para `HTTPException` em 2+ ações do recurso | `_shared.<recurso>-refusal.ts` (`domain.md` §2) |
| montar a resposta a partir da entidade | presenter do recurso (`architecture.md` §10) |

- **`_shared` é só função pura**: não importa model, `db`, `drive`, repository concreto nem
  service. Função que passou a precisar de dependência migra para a casa dela. O `pattern:check`
  recusa `_shared` que importa model, `db` ou `drive` como valor.
- **Política que constrói a consulta é do repository.** "Posts publicados" (`paginatePublished`)
  é método por intenção, não service sem dependência que monta `Post.query()`, nem `_shared`
  que modifica uma query recebida (a feature não vê query).
- **Recorte de linha e recorte de coluna são perguntas diferentes**: quais registros aparecem é
  critério do repository; quais campos aparecem é o presenter.
- **Referência cruzada de FK é tabela declarativa** dentro da implementação do repository
  (`REFERENCES` coluna → tabela, §5.2), nunca arrays paralelos.
- **Teste de deleção**: se apagar o arquivo só move três linhas para o chamador, ele era
  passagem e não devia existir (`solid.md` §2).

### 4.10 Sessão e borda HTTP

**Autenticação nega por padrão.** Toda rota exige sessão, exceto as declaradas públicas **num
lugar só** (grupo público no registro de rotas do Adonis; marca pública no decorator do Fastify).
O `authz:check` reprova rota nova que não está em nenhum dos dois.

**Sessão por cookie.** *(Adonis)* Par de access tokens opacos (acesso curto, refresh longo) em
cookie `httpOnly`, emitidos pelo guard `cookie-access-tokens`; o refresh é **rotativo**: usar um
refresh apaga-o e emite outro, e o `DELETE` do token antigo é a seção crítica (dois refresh
concorrentes com o mesmo token: um ganha, o outro recebe 401) (`_doc-lib/adonisjs.md#guides/auth/access-tokens-guard`).
Refresh já consumido que volta é reuso: revoga a família inteira da sessão (detecção de reuso, RFC 6819,
opinião da casa fora da `_doc-lib`), e o limite do refresh conta pelo hash do token, não pelo usuário
(`DECISIONS.md` #363).
*(Fastify)* JWT assinado com RS256 e `algorithms: ['RS256']` fixo na verificação, refresh como
registro revogável no banco (`backend-fastify.md`).

- **Nome do cookie de sessão com prefixo**: `__Host-` quando o cookie é host-only (sem
  `COOKIE_DOMAIN`), `__Secure-` quando leva `Domain`, porque `__Host-` recusa `Domain`; nos dois o
  navegador exige `secure` e o `__Host-` exige `path: '/'`. O prefixo impede que um subdomínio
  plante o cookie (cookie tossing), e é o que o README do `@fastify/cookie` manda
  (_doc-lib/fastify-plugins.md#@fastify/cookie, `DECISIONS.md` #320). Em desenvolvimento sem HTTPS
  (`secure` falso) o cookie sai sem prefixo, que o navegador recusaria.
- **Atributos do cookie num lugar só**: em `config/session-token.ts` no Adonis (configuração, não
  service); no Fastify, em getters de `start/env.ts` lidos por `services/session/` (`DECISIONS.md` #339): `httpOnly`,
  `sameSite: 'lax'`, `path: '/'`, `secure` pelo getter de ambiente do leitor de ENV (nunca
  `process.env.NODE_ENV` solto), `domain` só com `COOKIE_DOMAIN` quando app e API ficam em hosts
  irmãos do mesmo domínio-pai. Sem `COOKIE_DOMAIN`, o cookie nasce host-only e o SSR do frontend
  nunca o recebe. `sameSite` é `'lax'`; vira `'none'` (sempre com `secure: true`) só quando o
  deploy põe app e API em **sites diferentes** (domínio registrável distinto, como o domínio
  próprio de cada cliente), decidido no boot por `SameSite.between` (`core/same-site.ts`), que
  compara o domínio registrável das URLs obrigatórias do app e da API e devolve `lax` para entrada
  ausente ou inválida (`DECISIONS.md` #363), nunca derivado de ENV ausente: configuração faltando cai em `lax`, porque `none` por engano
  manda o cookie em toda requisição de outro site. Com `none`, a checagem de origem (CSRF, abaixo)
  é a única barreira e é obrigatória (`_doc-lib/fastify-plugins.md#@fastify/cookie`).
- **Sessão morre no servidor**: logout, troca de senha e mudança de papel apagam os tokens da
  conta. Token que só expira não é logout.
- **Token de sessão nunca no corpo da resposta nem em `localStorage`**: o cookie viaja sozinho. O token de uso único de um rascunho (#367) sai no corpo, porque não é sessão.
- **Sem enumeração de conta.** Login, recuperação de senha, reenvio de confirmação e convite
  respondem igual (status, `code`, mensagem e tempo aproximado) para conta que existe e que não
  existe. "E-mail não cadastrado" é um oráculo de contas. Vale para o **cadastro**: e-mail já em
  uso não devolve 409 a quem não tem sessão; a resposta é a mesma do sucesso e o aviso vai para a
  caixa do dono do e-mail. Login com conta inexistente ainda roda a verificação de hash contra um
  hash fixo, para o tempo de resposta não separar os dois casos.
- **Link compartilhável é token opaco** (pedido, certificado, convite, recuperação): gerado com
  `randomBytes`, guardado como hash, com expiração; nunca o id interno na URL. Id público de
  registro é UUID ou ObjectId, nunca inteiro sequencial.

**CSRF** *(opinião da casa sobre a doc)*. Com sessão em cookie, `SameSite=Lax` é o mínimo e não
basta: um subdomínio irmão comprometido é *same-site* e envia o cookie. Por isso
`app/middleware/origin.middleware.ts` aceita `Origin` na mesma allowlist do CORS, ou `Sec-Fetch-Site`
em `same-origin` ou `none`, em todo método que não é `GET`/`HEAD`, **antes do bodyparser**, e nenhum
`GET` altera estado. Sem os dois, 403. Não há bypass em desenvolvimento, e `same-site` é recusado,
porque reabre a porta do subdomínio irmão (`DECISIONS.md` #353). O middleware lança `HTTPException`:
não é regra de negócio, e o `Either` não chega ali. A checagem não olha `Content-Type` nem presença de corpo: `text/plain`,
`multipart/form-data` e `POST` vazio passam pelo navegador sem preflight e são justamente o vetor.
Requisição de escrita sem `Origin` e sem `Sec-Fetch-Site` é recusada (403 com `code`); cliente
servidor a servidor legítimo (webhook, integração) entra por rota própria com assinatura (§4.11),
não por exceção no middleware. O exemplo da doc desliga o CSRF do Shield pensando em token em cabeçalho
(`_doc-lib/adonisjs.md#guides/security/securing-ssr-applications`); a casa também o desliga, porque
a checagem de origem cobre o caso do cookie sem token de formulário. Token CSRF só entra se houver
formulário HTML servido por outro site do mesmo domínio-pai.

**CORS** com lista explícita de origens vinda do ENV e `credentials: true`; nunca `*`, nunca
refletir `Origin` sem conferir; métodos e `exposeHeaders` só os usados
(`_doc-lib/adonisjs.md#guides/security/cors`).

**Rate limit nomeado**, um `limiter.define` por política, citado na rota
(`_doc-lib/adonisjs.md#guides/security/rate-limiting`; *(Fastify)* `@fastify/rate-limit`, §5 de
`backend-fastify.md`). As políticas das rotas do kit moram em `start/limiter.base.ts`, que o sync
sobrescreve; `start/limiter.ts` só acrescenta as do projeto e nunca redefine uma do kit, e a rota
importa cada política do arquivo que a declara:

- Obrigatório em toda rota que aceita escrita sem sessão: sign-in, sign-up, recuperação de senha,
  reenvio de e-mail, código de verificação (OTP), upload anônimo (onde existir, §5.4).
- Obrigatório também em rota **cara** ou **sensível**, mesmo autenticada: chamada a IA, envio de
  e-mail ou SMS, exportação, geração de relatório, criação de cobrança (pagamento), refresh de
  sessão e troca de e-mail ou senha (`PUT /account`). Limite por usuário, para um usuário não esgotar a cota de todos.
- Sign-in com chave dupla: IP **e** conta (e-mail normalizado), com `blockFor`. Só por IP, quem tem
  muitos IPs passa; só por e-mail, dá para trancar a conta de alguém de propósito.
- Mais de uma réplica: contador em Redis.
- Excedeu: 429 com `code` estável, no envelope de §4.5, e o bloqueio vai para o log com a tag da rota e a chave do
  limite (sem o e-mail em claro, §5.5). Pico de 429 é sinal de ataque e entra no alerta do projeto
  (`docs/SECURITY.md`).
- **`trustProxy` para a topologia real** (sub-rede do proxy, `TRUSTED_PROXIES` no ENV), nunca
  `true` às cegas nem número de saltos, que o Fastify desativou por não validar o vizinho imediato
  (_doc-lib/fastify.md#Reference/Server): sem ele o limite conta o IP do proxy e vira global; com `true`
  exposto, o cliente forja `X-Forwarded-For`.

**Cabeçalhos de segurança na raiz**: Shield (`csp`, `xFrame`, `contentTypeSniffing`) no Adonis,
`@fastify/helmet` no Fastify. HSTS fica no default, sem `preload`; `preload` só com decisão
registrada.

**Ordem da cadeia** *(opinião da casa)*: id de requisição e logger → cabeçalhos de segurança →
CORS → origem (CSRF) → limite global, se houver → parser de corpo com teto → autenticação →
papel (grupo) → limite da rota → policy (controller) → validator → use-case. Cada middleware faz
uma coisa e termina em `await next()`, a forma de todos os exemplos da página
(`_doc-lib/adonisjs.md#guides/basics/middleware`, https://docs.adonisjs.com/guides/basics/middleware).
A saída cedo vira `if` em volta do `throw`, nunca `return next()`: o `NextFn` é
`() => Promise<any> | any` (`@poppinss/middleware` 3.2.7, reexportado por `@adonisjs/core` 7.6.0), e
devolver o resultado dele cai no `no-unsafe-return` do lint do kit; sem `await` no corpo, o
`require-await` reprova o `async`. O parser de corpo tem teto explícito por grupo; corpo cru só na
rota de webhook que confere assinatura (§4.11).

### 4.11 Webhook, idempotência e transação

**Idempotência explícita** em operação atrás de rede não confiável *(opinião da casa)*: finalizar
upload, confirmar pagamento, processar webhook, aceitar convite. A segunda chamada com o mesmo
identificador é sucesso que devolve o mesmo resultado, nunca erro (`complete` duas vezes devolve
o mesmo registro; cancelar um `PENDING` já cancelado não falha).

- **Claim atômico**, nunca "ler e depois gravar": a transição é um `UPDATE … WHERE status =
  'PENDING'` (ou `findOneAndUpdate` condicional no Mongo) num método por intenção do repository
  (`claimPending`), e o número de linhas afetadas diz quem ganhou
  (`_doc-lib/mongodb.md#crud/compound-operations`). `find` antes do `insert` perde a corrida.
- A garantia final é o **índice único** no banco: a violação vira sucesso idempotente, não 500.

**Webhook de entrada** *(opinião da casa; página do provedor não conferida)*:

1. **Assinatura antes de tudo.** HMAC sobre o **corpo cru**, comparado em tempo constante
   (`timingSafeEqual`), com janela de timestamp, antes de qualquer leitura de banco. Assinatura
   inválida: 401, sem tocar em nada.
2. **Inbox de chave única.** O evento é gravado numa tabela-inbox com índice único na chave natural
   do provedor (id do evento) **antes** do efeito; reentrega bate no índice e é no-op 2xx.
3. **Resposta rápida.** 2xx assim que o evento está gravado; o efeito roda fora da requisição
   (fila, §4.12). Falha ao gravar responde 5xx para o provedor reenviar.
4. **Fora de ordem é normal.** Antes de aplicar, o handler compara um watermark (`eventAt` contra
   o último aplicado) ou busca o estado atual na API do provedor; evento velho não desfaz estado
   novo.

**Recurso limitado: corrida resolvida no banco** *(opinião da casa; `DECISIONS.md` #242)*. Todo fluxo
que lê, decide e grava sobre algo finito (estoque, cupom, saldo, crédito, vaga, convite, horário de
agenda, contador) assume que duas requisições iguais chegam no mesmo milissegundo. A proteção mora no
banco, nesta ordem de preferência:

1. **índice único** que impede o registro duplicado (reserva por horário, cupom por usuário);
2. **escrita condicional atômica** num método por intenção do repository
   (`UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0`, ou `findOneAndUpdate` com o filtro no
   Mongo), e o número de linhas afetadas decide: zero vira `left` 409;
3. **transação com lock da linha** (`forUpdate()`, `findByIdForUpdate`) quando a regra precisa ler
   mais de um valor antes de decidir.

Contrato: `forUpdate()` no select query builder e a transação gerenciada do Lucid
(`_doc-lib/lucid.md#select-query-builder`, `#transactions`); no Mongo, operação composta atômica
(`_doc-lib/mongodb.md#crud/compound-operations`: "combine read and write operations in a single atomic
statement") e índice único (`#indexes`).

Redis, fila, lock em memória, mutex no processo e leitura de cache **não** protegem: o lock em memória
não vale com duas réplicas, e o lock com expiração solta antes de a escrita acabar. Só entra se o
banco não resolve, com o motivo em `docs/DECISIONS.md`. Desabilitar o botão no frontend é conforto
de quem clica, não proteção (`frontend.md` §4). Toda escrita dessas tem o E2E de duas requisições
simultâneas (§7).

**Chave de idempotência de entrada**: rota que cria pedido, cobrança ou pagamento aceita o cabeçalho
`Idempotency-Key` (UUID gerado pelo cliente uma vez por intenção de compra, reaproveitado no retry),
grava a chave com índice único junto do actor e devolve a mesma resposta quando ela se repete. Chave
nunca é dado pessoal (e-mail, CPF). A chave de saída para o gateway é a de §5.3. *O cabeçalho
`Idempotency-Key` não tem entrada na `_doc-lib`: não coberto, opinião da casa; o mecanismo de
gravação é o índice único de cima.*

**Transação**: mais de uma escrita, uma unidade de trabalho (`domain.md` §6; neste arquivo, §4.2). Efeito
externo (e-mail, cobrança) nunca fica dentro da transação do banco: ou vai depois do commit, por
evento ou fila, ou o fluxo é idempotente para poder repetir.

### 4.12 Fora da requisição: evento, fila e comando

- **Evento de domínio** é valor que a entidade devolve; o despacho é pelo emitter do framework
  (`emitter.emit('post:archived', { postId })`), **só para efeito colateral que tolera perda**
  (e-mail de boas-vindas, aviso)
  (`_doc-lib/adonisjs.md#guides/digging-deeper/emitter`). Payload só de ids e primitivos, nunca
  entidade nem model; listener idempotente; teste com `emitter.fake()` + `assertEmitted`. Evento
  não é canal entre features: o que uma ação precisa de outra sobe para domínio, repository ou
  service. A doc avisa: evento demais deixa o fluxo impossível de seguir.
- **Efeito que não pode se perder** (cobrança, estoque, entrega de webhook de saída) vai por
  **fila** (`app/jobs/`), nunca por emitter em memória. Payload de job só de ids, validado por
  schema (Zod; VineJS no Adonis) no consumidor (`typescript.md` §2; *(Fastify)* `backend-fastify.md` §9). Falha final do
  job é registrada no registro (`failedAt`, `failureCode`) para reprocessar.
- **Fila só com o worker no ar** (`DECISIONS.md` #295). Ligar a fila (`REDIS_URL` presente, o
  `mail.sendLater()` com messenger persistente, job despachado) só vale junto com o processo
  `node ace queue:work` rodando como serviço próprio; sem ele o job é gravado e ninguém o consome.
  A página manda subir o worker como processo separado do servidor web, mantido pelo orquestrador
  (_doc-lib/adonisjs.md#guides/digging-deeper/queues, https://docs.adonisjs.com/guides/digging-deeper/queues,
  aviso de "Running the worker"); o messenger em memória do mail perde o e-mail no restart e não serve
  em produção (_doc-lib/adonisjs.md#guides/digging-deeper/mail,
  https://docs.adonisjs.com/guides/digging-deeper/mail, "Queueing emails"). No Coolify, o worker é
  um recurso a mais (`tooling.md` §8.3).
- **Redis fora do ar segura a requisição.** Com `REDIS_URL` apontando para um Redis inacessível, o
  `sendLater` de uma ação fica dezenas de segundos em novas tentativas de conexão (o
  `maxRetriesPerRequest` de 20 do ioredis), o frontend desiste antes pelo próprio teto de tempo e
  mostra falha de conexão, e o registro já foi gravado mesmo assim. Fazer o enfileiramento falhar rápido quando o Redis
  cai ainda não tem regra nem doc conferida: pendência registrada em `CHECKLIST.md`.
- **Comando de CLI** reusa o use-case pelo container (nunca regra própria), com a dependência por
  `@inject()` no método `run`, como a página documenta ("Using dependency injection"). Aceita
  `--dry-run` quando grava dado (só loga o que faria): default `false` no que o cron roda, `true` em
  remodelagem manual. Segredo de operador entra por `prompt.secure`, nunca por flag (`DECISIONS.md`
  #348). É repetido pelo **cron do orquestrador**. Nada de
  `setInterval` no processo web: morre no primeiro deploy e roda N vezes com N réplicas
  (`_doc-lib/adonisjs.md#guides/ace/creating-commands`, `#guides/ace/flags`).

### 4.13 Migration de banco *(opinião da casa)*

- **Mudança em produção em dois passos (expandir e contrair).** Coluna nova nasce anulável; backfill
  em lote; `NOT NULL` numa migration seguinte. Coluna removida só sai depois do deploy que parou de
  lê-la. Renomear é adicionar, copiar, trocar a leitura, remover.
- **Perda de dado é explícita**: migration que apaga dado é autorizada à parte, nunca contração
  implícita, e o `down` dela não tem efeito, com um comentário dizendo que o dado não volta. Não
  lança: o teardown de `testUtils.db().migrate()` roda `migration:reset` e chama todo `down`, e um
  `down` que lança quebra a suíte. Em produção o rollback já recusa (`DECISIONS.md` #291, #377).
- **Migration não importa model**: lê e escreve por `this.db.from(...)`/`this.schema` cru. O model
  muda depois (coluna, scope, hook) e a migration antiga, que roda de novo em banco novo, quebra ou
  faz outra coisa (achado do academy, 2026-11-09).
- **Tabela criada na branch tem a forma inteira numa migration só**: antes do merge, corrige-se a
  migration da branch em vez de empilhar migrations corretivas da mesma tabela.
- **A virada é o primeiro dado real** (`DECISIONS.md` #297). Enquanto nenhum banco guarda dado que
  alguém precisa manter, só existem migrations de `create`, uma por tabela com a forma inteira, e
  achatar as que já existem é permitido (`migration:fresh` em cada ambiente depois). Do primeiro
  dado real em diante, toda mudança de schema é migration nova de alteração, em expandir e contrair
  (o primeiro item desta lista, em dois deploys), e migration que já rodou nunca se edita: o Lucid
  registra cada arquivo em `adonis_schema` e roda cada um uma vez só por banco, então a edição não
  chega a banco nenhum que já a aplicou e o schema de produção diverge do de quem sobe do zero
  (_doc-lib/lucid.md#migrations, https://lucid.adonisjs.com/docs/migrations, "Overview"). O projeto
  marca a virada com data numa linha do próprio `docs/DECISIONS.md`.
- **Achatar se prova pelo schema** (`DECISIONS.md` #309). Antes de apagar as migrations de
  alteração, `pg_dump --schema-only` do banco migrado pela série antiga; depois, o mesmo dump do
  banco migrado do zero pela série nova. O `diff` dos dois não mostra nada além das linhas
  `\restrict` e `\unrestrict`, que o pg_dump recente escreve com um token aleatório a cada
  execução: ordem, nomes de índice e de restrição batem. O `database/schema.ts` regenerado também
  sai idêntico. O PR traz o comando e o resultado, e avisa que cada ambiente precisa de um
  `migration:fresh` à mão, uma vez, porque as migrations registradas lá deixaram de existir.
  *(Página do `pg_dump` não conferida: postgresql.org recusado pelo proxy desta sessão; sem entrada
  em `_doc-lib`.)*
- Invariante no banco (índice único, `NOT NULL`, FK, `check`): §4.4.
- O comando de deploy da plataforma roda `migration:run --force` (no Coolify, o
  *Post-deployment command*); o `Dockerfile-production` não tem `ENTRYPOINT` que migra
  (`tooling.md` §8.2).
- **Em produção a migration só anda para frente** (`DECISIONS.md` #291). `config/database.ts` liga
  `migrations.disableRollbacksInProduction: true` em toda conexão: com `NODE_ENV=production`,
  `migration:rollback`, `migration:reset` e `migration:refresh` recusam rodar, mesmo com `--force`.
  Desfazer uma migration já aplicada é escrever outra que a reverte
  (_doc-lib/lucid.md#migrations, https://lucid.adonisjs.com/docs/migrations, "Disable rollback in
  production"). O comando de deploy é só `migration:run`; `refresh`, `reset` e `fresh` nunca entram
  nele, porque rodariam a cada merge na `main`. O `migration:fresh` não chama `down` (apaga as
  tabelas e migra de novo) e por isso escapa da trava: limpar o banco de propósito é `fresh`, uma
  vez, à mão, pelo terminal do container. Um `refresh` no *Post-deployment* reverte toda migration
  a cada deploy, e cada `down` de criação é um `DROP TABLE`.
- *(Fastify)* A migration é script standalone (§7), sem comando de rollback nem de refresh; trava
  equivalente à do Lucid: não coberto. O script de deploy só aplica as pendentes.
- **Multi-tenant em projeto que já tem dado** (`DECISIONS.md` #390, #394). As migrations do kit
  (`cities`, `tenants`, `tenant_memberships`, `tenant_id` em `storages`, `platform_role` e
  `active_tenant_id` em `users`) só chegam a projeto novo; o projeto existente escreve as dele, de
  alteração, nesta ordem e em dois deploys:
  1. **Expandir** (deploy 1): cria `cities`, `tenants` e `tenant_memberships` como no kit, com
     timestamp **depois** do da migration que cria `users` no projeto (a FK de `tenant_memberships`
     aponta para ela; as datas `1700000000005`/`6` do kit só servem a projeto novo, relato do
     adacaibs); em toda
     tabela de tenant (a lista do projeto em `docs/ARCHITECTURE.md`), `tenant_id` **anulável** com FK
     para `tenants` e `onDelete('RESTRICT')`; em `users`, `platform_role` anulável e
     `active_tenant_id`. O código desse deploy já grava `tenant_id` em toda escrita.
  2. **Backfill**, na ordem do *Post-deployment* `migration:run` → `db:seed` → backfill: o backfill
     precisa do tenant que o seed cria, então não é migration que roda no mesmo `migration:run` antes
     do seed; é um comando `ace` do projeto (`node ace tenant:backfill`, idempotente) chamado depois
     do seed, ou uma migration de dado que entra só no deploy seguinte (relatos do curupira e do
     adacaibs). O seeder de cidades e o de tenant rodam com `SEED_TENANT_NAME`,
     `SEED_TENANT_SLUG`, `SEED_TENANT_CITY=benjamin-constant` e `SEED_TENANT_TYPE`, **sem default**
     (#329: um nome escrito no código semearia o cliente errado em todo projeto); o backfill copia o id
     desse tenant para toda linha com `tenant_id` nulo, em lote, cria um vínculo por
     conta com o papel que a conta tinha em `users.role` e põe `OWNER` em `platform_role` só da
     conta do dono. Lê e escreve por `this.db`, nunca por model.
  3. **Contrair** (deploy 2): `tenant_id` e `platform_role` `NOT NULL`; `users.role` sai; todo índice
     e toda unicidade de tabela de tenant passam a começar por `tenant_id` (`unique(['tenant_id',
     'slug'])` no lugar de `unique('slug')`, índice parcial e trigram com `tenant_id` na frente),
     porque toda consulta corta por ele primeiro. O índice de uma FK de coluna única segue a mesma
     regra quando a listagem filtra por ela dentro do tenant (`index(['tenant_id', 'team_id'])`);
     FK usada só por join e por `onDelete` fica com o índice só na coluna (relato do interclasse).
     Arquivo já no bucket não muda de chave: o prefixo
     do tenant (§4.14) vale para o que sobe depois do deploy 1.

- **Identidade por celular em projeto que já tem dado** (`DECISIONS.md` #396). A migration do kit
  (`email` anulável, `phone` anulável e único, os dois `check`) só chega a projeto novo; o projeto
  existente escreve a dele, de alteração, em dois deploys:
  1. **Expandir** (deploy 1): `users.phone` anulável e único (`varchar(14)`); `users.email` perde o
     `NOT NULL`; os `check` `users_phone_e164` e `users_contact_required` (`email is not null or
     phone is not null`), que já vale para toda linha existente, porque nenhuma tem e-mail nulo
     (confira com `select count(*) from users where email is null and phone is null`). O código desse deploy já lê e grava os dois, e
     `POST /authentication/sign-in` aceita `login` **e** o `email` antigo por um período (o
     formulário do deploy 1 ainda pode mandar `email`), para o deploy não derrubar quem está com a
     página aberta.
  2. **Contrair** (deploy 2): o código deixa de aceitar o `email` antigo no sign-in.
  Para a conta que já existe, o celular entra pelo perfil dela (ou por backfill do dono): o formato é
  E.164 e `Rule.normalizePhone` do `shared` é a função que o produz. Quem não tem e-mail não recupera a
  senha sozinho: a equipe redefine, e não há rota nem SMS no kit.

### 4.14 Escopo de tenant *(DECISIONS.md #390, #394)*

O tenant é o cliente dentro de uma cidade; a cidade é dado global (`cities`), nunca constante. A
regra mora no kit, em três peças, e nenhum use-case escreve `where tenant_id` à mão:

- **`TenantScope`** (`app/core/tenant-scope.ts`) diz o que a requisição lê e escreve: `tenantId` (onde
  escreve) e `readable` (o que lê a mais). A rota privada tira o tenant da sessão
  (`auth.middleware.ts`: o vínculo escolhido em `PUT /authentication/tenants/active`, ou o único);
  a rota pública, do segmento `:city` e, quando o produto é por cliente, `:tenant`
  (`public-tenant.middleware.ts`, 404 para cidade ou cliente que não existe). Sem tenant, a
  requisição não lê nem escreve nada; só o dono da plataforma fora de um tenant alcança as linhas
  da plataforma (`tenant_id` nulo), e a rota pública nunca as lê. Fora de requisição (comando,
  job) não há escopo: processo do sistema trabalha entre tenants de propósito, e o que precisa de
  um tenant o recebe por parâmetro.
- **Repositório base** (`app/repositories/shared/tenant-scoped.ts`): toda consulta de tabela de
  tenant passa por `TenantScoped.readable()` ou `TenantScoped.writable()`. Registro de outro tenant
  não é achado, e o use-case responde o mesmo 404 de id inexistente (§4.6). Leitura e escrita são
  métodos distintos no contrato (`findById` e `findWritable`): o tenant pai **lê** os filhos (um
  nível, `childIds` do vínculo) e nunca escreve neles. O repositório em memória filtra pelo mesmo
  `TenantScope.reads()`/`writes()`.
- **Policy base** (`session-scoped-policy.base.ts`): `readsTenant`, `writesTenant` e `isStaffOf`
  conferem o tenant do `actor` pela mesma regra. O papel dentro do tenant é do vínculo
  (`actor.tenant.role`), e `role.middleware.ts` lê dali; acima dos tenants, `platform.middleware.ts`
  deixa entrar só o dono da plataforma (`actor.platformRole`).

**Cliente único (#399).** Produto que por natureza tem um cliente só liga `SINGLE_TENANT_SLUG`
(`config/tenant.ts`, sem default): o `public-tenant.middleware.ts` resolve esse tenant sem segmento
na URL, com o mesmo `TenantScope.ofPublic`, só leitura, e 404 se ele não existe ou está inativo.
Slug de cidade e de tenant não iguala rota fixa do frontend: `Rule.RESERVED_SLUGS` do `shared`.

**Cliente final e escrita pública (#397).** Conta sem vínculo é o cliente final (o morador que pede
no Delivery): `TenantScope.ofAccess` a trata como `ofCustomer`, e ela não alcança nenhuma tabela de
tenant. Tabela **de cliente** (pedido, comprovante, o arquivo que o cliente envia) se declara pelo
repositório: usa `CustomerScoped.readable()`/`writable()` (`app/repositories/shared/customer-scoped.ts`)
no lugar de `TenantScoped`, com a coluna de dono `customer_id`. Nela o dono lê e altera as próprias
linhas em qualquer tenant; linha de cliente alcança, além do dono, só a equipe (`STAFF_USER_ROLES`) do
próprio tenant, nunca membro comum, tenant pai ou público. Quem tem vínculo nunca é cliente: com
vários e sem escolha, escopo nenhum. Linha nova de tabela de cliente sai de
`TenantScope.customerTargetOf()`, a de tabela de tenant de `tenantTargetOf()`, que recusa cliente e
escrita pública: o tenant do vínculo para a equipe, o
tenant da URL para o cliente (rota depois de `middleware.auth()` com
`middleware.publicTenant({ access: 'customer' })`) e para a escrita pública declarada
(`{ access: 'insert' }`, que também entra em `PROJECT_ANONYMOUS_WRITES`); sem tenant na URL, o
cliente não cria nada. A escrita pública só cria linha de tabela de cliente, nunca altera linha
existente. A policy base confere com `ownsRow` e `reachesCustomerRow`. O storage é a tabela de cliente do kit
(`POST /storages/cities/:city/tenants/:tenant`). Mudar senha, papel, vínculo, e-mail, celular ou
status derruba as sessões da conta na mesma transação (`UserRepository.save`,
`TenantRepository.saveMember` e `removeMember`).

Usuário é global (e-mail único); o acesso é vínculo usuário x tenant x papel (`tenant_memberships`).
A chave do arquivo no storage começa pelo id do tenant (`platform/` sem tenant). A prova é
`app/core/tenant-scope.e2e.spec.ts`: dado de outro tenant responde 404 em toda rota que o alcança
por id e não aparece em lista; recurso novo que passa pelo repositório base herda essa prova, e o
projeto repete o teste no recurso dele.

---

### 4.15 Perfil da conta: foto e troca do próprio e-mail *(DECISIONS.md #442)*

- **Foto.** `PUT /account/profile` aceita `avatarId`, o id de um arquivo `UPLOADED` e vivo que a
  própria conta enviou, no tenant da requisição (`StorageRepository.areAttachable(ids, uploadedBy)`:
  `uploaded_by` é a conta e o escopo é o do tenant da sessão). Arquivo de outra conta, da própria conta
  em outro tenant, ainda não confirmado, apagado, ou id que não existe, é `422 AVATAR_INVALID` no
  campo `avatarId`. `GET` e `PUT` devolvem
  `avatar` com a URL assinada (`StorageContract.withOptionalUrl`), `null` sem foto; `users.avatar_id` já
  estava em `STORAGE_REFERENCES`, então o `storages:prune` não apaga a foto em uso. `avatarId: null` remove a foto: o VineJS lê `null` como
  campo ausente, então o "ao menos um campo" e o `currentPassword` obrigatório são regras implícitas
  (`Rule.atLeastOneOf`, `Rule.requiredIfAnyOf`) que contam `null` como presente.
- **E-mail.** `email` no corpo é um pedido, não uma troca, e exige a senha atual. O núcleo depende de
  `EmailChangeContract` (`services/email-change/`): `isAvailable()` é o portão único, e `deliver()` manda o
  token. Sem o bloco `mail`, ou com o bloco e `SMTP_HOST` vazio, o contrato é `EmailChangeUnavailable` ou
  o serviço do bloco com `isConfigured()` falso, e a resposta é `422 EMAIL_CHANGE_UNAVAILABLE` no campo
  `email`: só o administrador troca o e-mail de outra pessoa, no CRUD de usuários, e ninguém troca o
  próprio. Disponível, o caso de uso grava o pedido pendente (`EmailChangeRepository`, tabela
  `email_changes`, uma linha por conta, só o sha256 do token) e o serviço do bloco manda o token de 256
  bits, de uso único e 60 minutos, ao **endereço novo**. A resposta traz `pendingEmail`; o `email` do perfil
  continua o antigo. O mesmo e-mail da conta é `422 EMAIL_SAME_AS_CURRENT` e o de outra conta
  `422 EMAIL_TAKEN`.
- **Confirmação.** `POST /account/email/confirm` (sessão, `accountThrottle`, parte do bloco `mail`) lê o
  token e o consome com um único `DELETE ... RETURNING` da linha da própria conta
  (_doc-lib/lucid.md#update-and-delete-queries, https://lucid.adonisjs.com/docs/update-and-delete-queries):
  token de outra conta, usado, vencido ou inventado é o mesmo `422 EMAIL_TOKEN_INVALID` em `token`, e de
  duas confirmações simultâneas uma vence. A claim, a troca do e-mail e a sessão nova são uma unidade de
  trabalho: `UserRepository.save` derruba todas as sessões da conta (o e-mail é campo de sessão, §4.2), e o
  caso de uso emite um par novo para a sessão que confirmou, então as outras caem e esta segue.
  Endereço que outra conta tomou no meio-tempo é `422 EMAIL_TAKEN` e a claim é desfeita.
- **Onde mora.** Do núcleo: `EmailChangeContract`, `EmailChangeUnavailable`, `EmailChangeFake`,
  `EmailToken`, `EmailChangeRepository` (contrato, Lucid, memória) e a migration. Do bloco `mail`
  (`kit-manifest.mjs`): `services/email-confirmation/` (o serviço que manda o e-mail), `features/account/email/`,
  o validator da confirmação, as mensagens `email.json` e, dentro de arquivos comuns, os trechos
  `optional: mail` (rota, provider do contrato, providers de e-mail e fila no `adonisrc.ts`). O `shared/`
  tem `AccountProfileUpdateResponse` e `AccountEmailConfirmValidator`. O kit não tem peça de perfil no
  frontend: só o contrato e a API; a página de perfil é do projeto até o kit ganhar a peça.

## 5. Módulos de infraestrutura

Os arquivos de `core/`, `exceptions/*`, os services do piso (`storage`, e `mail` quando o produto manda e-mail) e os middlewares
transversais têm **a mesma API pública e a mesma estrutura** em todo projeto da casa; o conteúdo
de domínio varia *(opinião da casa)*. Quem abre um projeto novo já sabe o que `left`,
`HTTPException.NotFound` e `Paginated<T>` fazem.

**Código curto que humano lê ou digita** (convite, lote, passaporte) sai de um gerador com
alfabeto fixo sem caracteres ambíguos (`O`/`0`, `I`/`1`) e um laço de `N` tentativas contra
unicidade, nunca UUID nem sequência crua na tela *(opinião da casa)*. Link que não se digita usa
token opaco (§4.10).

### 5.1 Comentário em módulo de infraestrutura é genérico

O módulo tem a mesma forma em todo projeto, então o texto dentro dele também. Num módulo de
infraestrutura, um comentário **não** cita:

- **instalação, domínio ou cliente**: não "o caso desta instalação, `api.cliente.com` com
  `cliente.com`", e sim "onde os dois estão sob o mesmo domínio-pai";
- **identificador de requisito** (`RN-09`, `AD-010`, `RF-*`): esses vivem no documento de
  requisitos de **um** projeto, e a referência não resolve nos outros. Diga a regra, não o número;
- **contagem que depende do domínio**: "a contagem de uma das dez consultas" vira mentira no
  projeto que tem cinco.

O comentário (em inglês, `typescript.md` §12) explica o mecanismo e o defeito que a regra evita.
Quando o texto só faz sentido num projeto, ou ele é reescrito de forma genérica, ou o código não é
infraestrutura.

**Divergência temporária** *(opinião da casa)*: migração em andamento (troca de biblioteca,
mudança de árvore pela `MIGRATIONS.md`) que deixa código antigo e novo convivendo ganha um
comentário `ponytail: <what is temporary> — <when to remove>`, nomeando o prazo de vida da
divergência.

### 5.2 Tabela declarativa, não arrays paralelos

Onde uma lista de tabelas ou colunas alimenta uma varredura, use **uma tabela de objetos**, nunca
dois arrays casados por índice:

```ts
// wrong: inserting in the middle of one shifts every label after it, and the compiler can't tell
const counts = await Promise.all([q1, q2, q3, q4, q5])
const labels = ['a', 'b', 'c', 'd']

// right
const REFERENCES = [
  { table: 'users', column: 'avatar_id', label: 'user avatar' },
  // ...
] as const
```

Não é preferência estética: a variante com arrays paralelos já produziu um `undefined` numa
resposta 409 de produção. Mais de três parâmetros posicionais vira objeto nomeado pelo mesmo motivo.

### 5.3 Service de I/O externo: adapter

O service é o **adapter** (anticorrupção) entre a aplicação e o fornecedor (`solid.md` §2):

```ts
// app/services/payment-gateway/payment-gateway.contract.ts
export type PaymentGatewayError =
  | { readonly code: 'PAYMENT_GATEWAY_UNAVAILABLE' }
  | { readonly code: 'PAYMENT_GATEWAY_REFUSED'; readonly status: number; readonly reason: string }

export abstract class PaymentGatewayContract {
  abstract createCharge(input: { readonly orderId: string; readonly amountInCents: number }):
    Promise<Either<PaymentGatewayError, { readonly chargeId: string; readonly checkoutUrl: string }>>
}
// never: createCharge(input: Stripe.CheckoutSessionCreateParams): Promise<Stripe.Checkout.Session>
```

- **O contrato fala a língua da aplicação**: capacidade (`createCharge`, `upload`, `lookupCnpj`),
  nunca a forma da API do fornecedor. **Tipo do SDK não sai de `<nome>.service.ts`**: nem na
  assinatura do contrato, nem em `features/`, nem em `domain/`. Trocar de fornecedor é escrever
  outro `.service.ts`.
- **Falha esperada é fato da aplicação em `Either`**, declarado no contrato como união de
  `{ code }` (sem prefixo `E_`). O service nunca importa `HTTPException`; o use-case traduz pela
  tabela de `domain.md` §2.
- **Erro do fornecedor carrega status e motivo** do corpo da resposta; "Request failed" sozinho
  não serve para diagnóstico.
- **Resposta do fornecedor é `unknown` até passar por schema Zod** (`typescript.md` §2).
- **Toda chamada de saída tem teto de tempo**: `AbortSignal.timeout(ms)` (stdlib), estouro vira
  `left`. Sem timeout, um fornecedor lento segura a requisição e o pool até cair.
- **Retry só em operação idempotente** (leitura, ou escrita com chave de idempotência
  `idempotency_key = order.id`), numa camada só, com backoff exponencial e jitter. Disjuntor
  (circuit breaker) só depois que um fornecedor instável já derrubou um fluxo.
- **URL vinda do usuário** (webhook de teste, importação por URL, prévia) passa por allowlist de
  esquema `https:` e bloqueio de IP privado, loopback e metadata (SSRF), com timeout.
- **Processo externo sem shell**: `spawn(binary, [args], { shell: false })`, valor de usuário
  depois de `--`.
- O `.fake.ts` honra o mesmo `Either` da implementação real (`domain.md` §9, L) e é o que o
  unitário do use-case usa; a implementação real tem unitário contra o cliente dublado e E2E
  contra o serviço em container (`architecture.md` §8).

### 5.4 Upload e storage

- **Binário nunca atravessa a API.** Upload em três passos (`create`, `parts`, `complete`) com URL
  pré-assinada multipart, dentro de `services/storage/`; o registro nasce `PENDING` e não é anexável
  até o `complete`; o `storages:prune` limpa o pendente abandonado e o órfão `UPLOADED` que nenhum
  registro anexou. O servidor devolve os `headers` de cada parte junto da URL, e o cliente só os
  repete. O `complete` passa por `claimCompletion`: de dois `complete` simultâneos, um marca e o
  outro devolve o mesmo resultado. A URL de escrita vale 1 h. No R2, `supportsACL: false` no disco
  (`DECISIONS.md` #349).
- **Tamanho e extensão no validator** antes de assinar; a URL de escrita prende **tipo e tamanho** na
  assinatura com `signableHeaders: new Set(['content-type', 'content-length'])` no `getSignedUrl` do
  `@aws-sdk/s3-request-presigner`, e o cliente manda o `Content-Type` do arquivo no `PUT` (no navegador,
  `file.slice(início, fim, file.type)`: `Blob` sem tipo sai sem o header e o S3 recusa). A URL de cada
  parte do multipart prende **só o tamanho** (`new Set(['content-length'])`): o `UploadPart` não tem
  tipo e a parte sobe sem `Content-Type`, então assinar `content-type` ali declara um header ausente e o
  S3 de verdade recusa com "headers present in the request which were not signed" (o moto aceita e
  esconde o erro). Sem isso o storage aceita qualquer tipo: o padrão do SDK não assina `content-type`, e a
  FlyDrive 2.2 (`getSignedUploadUrl` do driver S3) chama o `getSignedUrl` sem `signableHeaders`; com
  ela, a assinatura passa pelo `urlBuilder.generateSignedUploadURL` do disco. Provado no MinIO de teste
  em 2026-10-14: sem a opção, `PUT` de SVG numa URL emitida para PNG deu 200; com ela, tipo errado e
  tamanho errado deram 403 (`_doc-lib/adonisjs.md#guides/basics/file-uploads`, `_doc-lib/flydrive.md`). No multipart cada parte
  tem a própria URL, então a assinatura **não** limita o tamanho total: ele é provado no `complete`,
  lendo o tamanho real do objeto gravado (`getMetaData().contentLength`) e apagando o que passar do
  teto.
- **Conteúdo conferido no `complete`**: magic bytes (ou o `Content-Type` do objeto gravado) contra
  a allowlist, não só a extensão declarada.
- **Chave do objeto gerada no servidor** (`randomUUID()`); nome original só como metadado. Nunca
  caminho montado com entrada do usuário (path traversal).
- **Tipo ativo (HTML, SVG, XML) nunca servido inline da origem do app**: fora da allowlist, ou
  servido com `Content-Disposition: attachment` de bucket ou domínio separado.
- **Bucket privado por padrão**; leitura por URL assinada de expiração curta (`getSignedUrl`).
  Público só o prefixo de mídia de vitrine, declarado. Credencial do bucket com escopo mínimo e
  CORS do bucket com `ETag` exposto ficam em `docs/SECURITY.md` e `docs/ENV.md` do projeto.
- Upload anônimo não existe: todo arquivo tem dono desde o `create`. Quem não tem conta (a denúncia
  do curupira) envia preso a um rascunho, por um token de uso único e curto que só existe como hash no
  banco; sem token válido o upload responde 404, e rascunho vencido sai com os arquivos pelo
  `storages:prune` (`DECISIONS.md` #367, que substitui a exceção da #363).
- **Disco por `DRIVE_DISK`**: `drive.fake()` no unitário, MinIO no e2e e em desenvolvimento
  (_doc-lib/adonisjs.md#guides/digging-deeper/drive, _doc-lib/flydrive.md#drive_manager).
- **Toda regra acima tem teste e2e contra o MinIO local** (`tooling.md` §8.4), e o teste falha se a
  regra quebrar:

  | Regra | Teste |
  |---|---|
  | bucket privado | `GET` anônimo no objeto: 403 |
  | sem upload anônimo | `create` sem sessão: 401 |
  | tamanho e extensão no validator | `create` acima do teto ou fora da allowlist: 422, sem URL gerada |
  | tipo e tamanho na assinatura | `PUT` com `Content-Type` ou tamanho diferente do assinado: 403 do storage |
  | URL expira | `PUT` depois do prazo: 403 |
  | conteúdo conferido | `.png` com bytes de SVG: recusado no `complete` e objeto apagado |
  | tamanho total | soma das partes acima do teto: recusada no `complete` |
  | chave do servidor | nome com `../` vira metadado; a chave é UUID |
  | tipo ativo nunca inline | leitura de SVG/HTML com `Content-Disposition: attachment` |
  | escopo mínimo | usuário da app recebe 403 em outro bucket |
  | pendente abandonado | `storages:prune` marca o `PENDING` velho |
  | órfão gravado | `storages:prune` apaga o `UPLOADED` que nenhum registro anexou |
  | `complete` concorrente | dois `complete` ao mesmo tempo: um marca, o outro devolve o mesmo |
  | prazo da escrita | a URL de escrita expira em 1 h |
  | CORS do upload | resposta com `Origin` permitida traz `ETag` em `Access-Control-Expose-Headers` |

  Resultado contra o MinIO de teste (2026-10-14): GET anônimo 403; URL expirada 403; tipo e tamanho
  fora da assinatura 403 (com `signableHeaders`); leitura assinada com `attachment`; usuário da app
  com 403 em outro bucket e ao criar bucket; `ETag` exposto. O tamanho real do multipart sai no
  `HeadObject` do `complete`.

### 5.4.1 Bloco opcional que o projeto liga por escolha: o Pix

- O Pix sem gateway (cobrança, comprovante, conferência; `DECISIONS.md` #400, #404) é peça opcional
  do kit sem dependência própria, então liga por escolha do projeto: `node <upstream>/scripts/sync-to-project.mjs . --com=pix`
  grava `pix` em `blocos` de `.maiyu/kit-extension-points.json`, e `--sem=pix` tira. Sem a escolha, o
  sync não leva o serviço, as rotas, a migration, os specs, as peças do `shared/` nem a peça de
  frontend do Pix, e o `--check` não acusa `migration-missing` nem `extension-stale` por causa dele
  (`DECISIONS.md` #418).
- **Desligar de volta limpa.** `--sem=pix` com os arquivos do bloco no projeto os trata como `sobra:` e o
  sync os remove, com o mesmo guard de importador do resto (`extra-in-use:` em vez de apagar); a migration
  nunca se apaga (a tabela pode existir em produção): vira `migration-orphan:` até o projeto escrever a
  que a remove ou rodar `--ack-extension=<migration>` (`DECISIONS.md` #431).
- **A tabela e a lista do painel** (`components/common/table/` e `list-shell/`) ligam sozinhas pelas quatro
  dependências, e `--sem=table` as desliga mesmo com elas (`desligados` no manifesto; `--com=table` volta):
  sai a pasta e saem as chaves `kit_table_*`, `kit_list_shell_*`, `kit_filters` e `kit_help` (`DECISIONS.md` #432).
- **Colisão de caminho.** O manifesto guarda em `arquivos` o que o kit já levou ao projeto. Caminho que o kit
  passa a ocupar, que o projeto já tinha com outro conteúdo e que não está na lista, vira `collision:` e não é
  sobrescrito. Para o kit tomar o caminho, o projeto move ou renomeia o arquivo dele e roda o sync;
  `--ack-extension` não resolve colisão, só confirma ponto de extensão (`DECISIONS.md` #433, #471).
- **Costura mínima.** O que o Pix toca fora dos próprios arquivos é pouco, e cada ponto é um trecho entre
  `// --- optional: pix ---` e `// --- end optional ---`: o provider no `adonisrc.ts`, o `bind` e os imports
  do `repository.provider.ts`, o grupo `payments/charges` do `start/routes.ts`, a entrada do
  `core/openapi/response.ts`, a tag do `config/openapi.ts`, `charges.receipt_id` do
  `storage.references.ts`, a classe do `database/schema.ts` e os exports do `shared/src/index.ts`. O trecho sai do
  esqueleto criado e do arquivo comum quando o bloco está desligado; ligado, o ponto de extensão do
  projeto recebe a linha pelo `extension-stale`, que lista as linhas do modelo que o projeto não tem.
- **Fica no núcleo, não é Pix:** o cliente final e `storages.customer_id` (#397), `PLATFORM_ROLE.ADMINISTRATOR`
  e `TenantScope.platformStaff` (#404), os rótulos de campo do `shared/src/validator.ts`.
- O sha de um ponto de extensão é o do modelo sem os trechos de bloco desligado: mudar só o trecho do
  Pix não deixa o projeto sem Pix `extension-stale`.

### 5.5 Log

- **Redação configurada no boot** (`config/logger.ts`): `password`, `*.password`, `token`,
  `*.token`, `refreshToken`, `headers.authorization`, `headers.cookie`, `set-cookie`, documento
  (CPF/CNPJ) (`_doc-lib/adonisjs.md#guides/digging-deeper/logger`). Nunca o body inteiro.
- **Log registra decisão e resultado com identificadores** (`order=… amount=… reason=…`), não
  narra passo. Nível: `info` resultado normal, `warn` sucesso anômalo ou recusa relevante, `error`
  quebra.
- **Evento de segurança tem linha própria e estável** *(opinião da casa)*: login falho, bloqueio
  por limite, negação de policy, troca de senha ou papel, com tag `[security > <event>]`, id da
  requisição e id do ator, sem PII.
- **Handler global único**: produção nunca devolve stack, SQL, caminho de arquivo nem mensagem de
  exceção desconhecida; o 500 sai genérico, o detalhe vai para o log
  (`_doc-lib/adonisjs.md#guides/basics/exception-handling`). Só `HTTPException` e erro de validação
  saem com a própria mensagem; qualquer outro erro vira o envelope 500 com `code` fixo **antes** de
  chegar ao `super.handle` ou ao `reply.send`, porque o renderer padrão do framework repassa
  `error.message` cru (mensagem de driver com nome de tabela, coluna e valor). O mesmo vale para
  worker, job e stream (SSE, chat): o que vai para o cliente é `code` + mensagem traduzida.

### 5.6 Runtime Node *(opinião da casa sobre a doc do Node 24)*

O que o framework não decide e o Node deixa aberto. Contrato: `_doc-lib/nodejs.md`; o roteiro de
uso é a skill `maiyu-node`. Decisões #215 a #223.

1. **Erro relançado leva a causa; decisão é pelo `code`.** Erro de infraestrutura que sobe como
   outro erro nasce com `new Error(mensagem, { cause: erroOriginal })`, nunca concatenando a
   mensagem e nunca perdendo a pilha original. Decisão sobre erro (status, retry, tradução) compara
   `error.code`, nunca `error.message`: a doc diz que `code` é a forma mais estável de identificar o
   erro e que a mensagem pode mudar entre versões. _doc-lib/nodejs.md#api/errors.
2. **Erro que escapou derruba o processo.** O modo padrão de `--unhandled-rejections` (`throw`)
   fica como está. Ouvinte de `uncaughtException` ou `unhandledRejection` só registra no log e sai
   com `process.exitCode = 1`; nunca segue atendendo, porque a doc diz que depois de um
   `uncaughtException` a aplicação está em estado indefinido e não é seguro retomar. Quem sobe de
   novo é o orquestrador. _doc-lib/nodejs.md#api/process.
3. **Stream se encadeia com `pipeline`.** `pipeline` de `node:stream/promises` em todo
   encadeamento (upload, export, descompressão, proxy de arquivo): ele propaga o erro e destrói
   todos os streams quando um falha. `.pipe()` não faz isso e deixa descritor e memória presos; o
   ESLint recusa (`tooling.md` §4, `no-restricted-properties`). _doc-lib/nodejs.md#api/stream,
   #api/stream#streams-promises-api, #learn/modules/backpressuring-in-streams.
4. **Id da requisição chega ao log sem passar de mão em mão.** É o id que a §5.5 exige.
   - Adonis: `generateRequestId: true` no `http` de `config/app.ts` (aceita o `X-Request-Id` que o
     proxy manda) e `useAsyncLocalStorage: true`; o `ctx.logger` já sai marcado com o id, e quem está
     fora do controller lê o contexto por `HttpContext.get()` dentro de um ponto só do `core/`
     (_doc-lib/adonisjs.md, páginas `guides/basics/request` e `guides/basics/http-context`).
   - Fastify: `genReqId` com `randomUUID()` e `requestIdHeader` só quando o proxy de confiança
     manda o cabeçalho (default `false`); fora do handler, `app/core/request-context.ts` guarda o
     `request.log` num `AsyncLocalStorage`, preenchido no hook `onRequest`
     (_doc-lib/fastify.md#Reference/Server, #Reference/Logging).
   - Job e comando, que não têm requisição: logger filho com o id do job.
   - `AsyncLocalStorage`, nunca `async_hooks` cru: a doc recomenda o primeiro por desempenho e
     segurança de memória. _doc-lib/nodejs.md#api/async_context.
5. **Desligamento limpo, com teto.** No Adonis o Ignitor ouve o sinal e chama o `shutdown()` dos
   providers; o que a aplicação abre (fila, cliente externo) fecha ali. No Fastify,
   `bin/server.ts`, nesta ordem, ao receber `SIGTERM` ou `SIGINT`:
   1. `app.close()`: para de aceitar conexão, responde 503 ao que chega depois
      (`return503OnClosing`, default `true`) e fecha as conexões ociosas
      (`forceCloseConnections`, default `"idle"`);
   2. fecha os workers de fila, deixando o job em curso terminar;
   3. fecha banco e Redis;
   4. `process.exitCode = 0` e deixa o processo esvaziar, sem `process.exit()`, que corta escrita
      de log pendente.

   Um `setTimeout(...).unref()` arma o teto: estourado, loga e sai com `exitCode = 1`. O teto fica
   abaixo do prazo de parada do orquestrador. `unref` porque o próprio timer não pode segurar o
   processo vivo. _doc-lib/nodejs.md#api/process, #api/timers, #api/http.
6. **Hash de senha é Argon2 (`argon2id`) nos dois backends** (`DECISIONS.md` #314).
   - Adonis: driver `argon` como `default` em `config/hash.ts`, com o pacote `argon2` instalado,
     que é o que a página manda (_doc-lib/adonisjs.md#guides/security/hashing). Projeto que já tem
     hash em `scrypt` mantém esse driver no `list` até todo hash ser refeito: `hash.verify` não
     reconhece o algoritmo do hash gravado, e o login refaz o hash quando `hash.needsReHash` diz que
     ele está velho. Durante a migração, o hasher que verifica é escolhido pelo que o hash declara
     (`hash.use('scrypt').isValidHash(hash)`, a forma da página em "Migrating between algorithms").
     Com `withAuthFinder`, que recebe um hasher só, o model recebe um driver composto em
     `app/core/legacy-aware-hash-driver.ts`, que grava no algoritmo novo e devolve `needsReHash`
     verdadeiro para o legado. O rehash fica no use-case do sign-in, depois da credencial e de a
     conta poder abrir sessão, por método do repository com escrita condicional (`WHERE password =
     <lido>`) que devolve `boolean`; a falha do banco sobe e o use-case a captura, loga e não recusa o login
     (exceção nomeada ao §4.2: é efeito que tolera perda). O driver composto sai quando o último hash legado for refeito
     (`DECISIONS.md` #370).
   - Fastify: `crypto.argon2` da stdlib (Node 24.7 ou maior), variante `argon2id`, `nonce` de
     `randomBytes(16)` e os parâmetros gravados junto do hash, para poder subir o custo sem
     invalidar senha antiga; comparação por `crypto.timingSafeEqual`; um service injetável
     (`app/services/hash/`), nunca função solta. Biblioteca de hash não entra: a stdlib resolve
     (`ponytail`). _doc-lib/nodejs.md#api/crypto.
7. **Tetos do servidor HTTP.** O `keepAliveTimeout` da API fica **acima** do tempo ocioso do
   proxy na frente: quem fecha a conexão ociosa é o proxy, e não a API no meio de uma requisição
   que o proxy reaproveitou (o sintoma é 502 esporádico). No Fastify, `requestTimeout` diferente de
   zero (o default é `0`, sem limite, e a doc manda definir para não ficar exposto sem proxy). No
   Adonis valem os defaults do Node (`requestTimeout` 300 s, `headersTimeout` 60 s,
   `keepAliveTimeout` 5 s), e o `keepAliveTimeout` sobe em `config/app.ts` (`http.keepAliveTimeout`)
   para acima do tempo ocioso do proxy: a página de deploy dá 55000 contra os 50 s do Nginx
   (_doc-lib/adonisjs.md#deployment). _doc-lib/nodejs.md#api/http,
   _doc-lib/fastify.md#Reference/Server.
8. **Entrada de fora tem teto.** Descompressão de dado que veio de fora (upload `.gz`, corpo
   comprimido, import) passa `maxOutputLength` ao `zlib`; sem ele, um arquivo pequeno vira gigabytes
   em memória. O bloqueio de IP da URL vinda do usuário (§5.3) se faz com `net.BlockList`, sobre o
   endereço **resolvido** pelo `dns`, não sobre o texto da URL: hostname que aponta para
   `127.0.0.1` passa por qualquer filtro de texto. _doc-lib/nodejs.md#api/zlib, #api/net, #api/dns.
9. **Recursos do runtime antes de pacote.**
   - Script de CI ou de manutenção que lê e escreve arquivo roda com `--permission` e só os
     `--allow-fs-*` de que precisa. A doc chama isso de cinto de segurança contra erro de código
     confiável, **não** de proteção contra código malicioso; não substitui o isolamento de
     `isolated-vm`.
   - Observabilidade (tempo de consulta, chamada HTTP de saída) assina `diagnostics_channel`, que é
     estável, em vez de remendar o módulo.
   - Alias de import segue o `"imports"` do `package.json` (`architecture.md` §3). A forma `#/`
     só é aceita a partir da 24.14, e o piso da casa é o 24, então alias novo continua no formato
     `#<nome>/*`.

   _doc-lib/nodejs.md#api/permissions, #api/diagnostics_channel, #api/packages.

### 5.7 Segurança por classe de ataque *(opinião da casa sobre a skill `security-audit`)*

Lacunas que a skill `security-audit` (Cloudflare, `.claude/skills/security-audit/`) aponta para esta
stack e que as seções acima não fechavam. Cada item completa a seção citada, sem repeti-la, e a fonte
é a página da skill entre parênteses. `DECISIONS.md` #230.

**Entrada e dado**

1. **Nome de identificador vindo de fora** (§4.7). Coluna, tabela ou chave de documento criada a
   partir de configuração do usuário tem nome gerado pelo servidor (`f_<uuid>`) ou casa
   `^[a-z][a-z0-9_]{0,62}$` fora de uma lista de reservados (`__proto__`, `constructor`,
   `prototype`, `_id`, prefixo `$`, ponto). Entra no SQL só por binding de identificador do Knex
   (`??`), nunca interpolado. *(ATTACK-CLASSES.md, Injection; segunda ordem.)*
2. **Prototype pollution** (§4.4). Nada de merge recursivo nem atribuição por caminho com chave
   vinda de fora; objeto indexado por chave dinâmica é `Map` ou `Object.create(null)`. *(CLIENT-SIDE.md,
   Prototype pollution.)*
3. **Valor confiado ao cliente** (§4.4, `domain.md` §3). Preço, desconto e total saem do banco
   dentro do use-case, nunca do payload. Dinheiro é inteiro em centavos; quantidade é inteiro `>= 1`
   com teto no validator. Teste com negativo, zero e acima do teto. *(ATTACK-CLASSES.md, Business logic.)*
4. **Fórmula em CSV** (§4.5, `sendCsv`). Célula que começa com `=`, `+`, `-`, `@`, tab ou CR sai
   prefixada com `'`, como já faz o `backend-fastify.md`. *(ATTACK-CLASSES.md, Injection em sistema secundário.)*

**Sessão, conta e borda**

5. **URL absoluta não nasce de cabeçalho** (§4.10). Link de e-mail, recuperação, convite,
   `success_url` de pagamento e sitemap se montam da variável de endereço do site (§6), nunca de
   `request.host()` nem de `X-Forwarded-Host`. E2E com `Host` forjado. *(WEB-PROTOCOL-AND-AUTH.md,
   Host and forwarded-header trust.)*
6. **Token de recuperação e de verificação** (§4.10). Consumo é claim atômico de uso único; o sucesso
   apaga os outros tokens pendentes da conta e encerra as sessões. Reuso responde igual a token
   inválido, com E2E. *(WEB-PROTOCOL-AND-AUTH.md, Password reset.)*
7. **Troca de senha e de e-mail** (§4.10). Exige a senha atual. E-mail novo só vale depois de
   confirmado por link no próprio endereço, com aviso ao antigo e sessões rotacionadas.
   *(WEB-PROTOCOL-AND-AUTH.md, Account linking; Step-up.)*
8. **Resposta autenticada não é cacheável** (§4.10). O `private-cache.middleware.ts`, no `server.use`
   depois do CORS, põe `Cache-Control: private, no-store` em toda resposta com sessão, com E2E
   (`DECISIONS.md` #339, #363). *(WEB-PROTOCOL-AND-AUTH.md,
   Cache deception.)*
9. **SSRF por redirect e DNS rebinding** (§5.3, §5.6 item 8). Busca de URL do usuário com
   `redirect: 'manual'`, revalidando cada salto, e conexão feita ao IP já conferido (resolve uma
   vez e fixa). *(ATTACK-CLASSES.md, Resource and file handling.)*

**Autorização e ciclo de vida**

10. **Exportação, importação e lote** (§4.6). Export usa o mesmo método escopado da listagem (posse,
    tenant, lixeira); import passa cada linha por validator, policy e use-case; lote autoriza item
    por item, com E2E de id alheio no meio do lote. *(DATA-ISOLATION-AND-LIFECYCLE.md, Export and
    backup scope; Import and restore authority.)*
11. **Reaproveitar linha arquivada** (§4.8). Só quando é do mesmo dono e tenant, zerando relações,
    anexos e campos antigos; fora disso, linha nova. *(DATA-ISOLATION-AND-LIFECYCLE.md, Soft-delete
    bypass; Restore.)*
12. **Purge sem cópia derivada** (§4.8). `delete` definitivo e `purge` apagam o objeto do storage,
    cancelam os jobs pendentes do registro e invalidam o cache, com teste de que nada o recria.
    *(DATA-ISOLATION-AND-LIFECYCLE.md, Retention and queued-work overrun.)*

**Fora da requisição** (§4.12)

13. **Job relê antes de agir.** O worker relê registro e actor na execução e aborta se o registro foi
    arquivado ou se o actor perdeu tenant ou papel. Payload só de ids, sem PII; `removeOnFail` com
    retenção finita. Exceção: `send-email.job.ts`, que carrega a mensagem compilada, como a doc do
    mail manda (_doc-lib/adonisjs.md#guides/digging-deeper/mail); a fila fica em Redis privado, com
    retenção curta (`DECISIONS.md` #351). *(DATA-ISOLATION-AND-LIFECYCLE.md, Stale authorization; PROTOCOLS-RPC-AND-MESSAGING.md,
    Dead-letter.)*
14. **Job idempotente.** Efeito não idempotente leva `jobId` determinístico (`charge-<orderId>`; id próprio nunca leva `:`, que o BullMQ usa como separador da chave no Redis, _doc-lib/bullmq.md#guide/jobs/job-ids),
    `attempts` e `backoff` explícitos, e o efeito usa o claim atômico de §4.11.
    *(PROTOCOLS-RPC-AND-MESSAGING.md, Duplicate delivery.)*
15. **Chave de Redis com namespace.** `prefix` da fila, chave de cache e chave de limite levam projeto
    e ambiente; chave de cache por recurso leva tenant e actor. *(DATA-ISOLATION-AND-LIFECYCLE.md,
    Namespace collision.)*
16. **Canal de tempo real autorizado.** Todo canal privado de SSE (Transmit) tem `authorize` que
    chama a policy do actor sobre o id do canal. O proxy exclui `text/event-stream` do gzip
    (_doc-lib/adonisjs.md#guides/digging-deeper/server-sent-events), e o `pingInterval` do Transmit
    fica abaixo do timeout de conexão ociosa do proxy *(opinião da casa: a página não fala do
    intervalo)*. *(PROTOCOLS-RPC-AND-MESSAGING.md, Streaming authorization.)*

**Segredo** (§6)

17. Credencial guardada em banco no Adonis segue a cifra de `backend-fastify.md` §10 (HKDF, AAD,
    `enc:vN`). *(CLOUD-AND-DEPLOYMENT.md, Secret exposure.)*
18. **Unique de dado pessoal não vaza no log do banco** *(DECISIONS.md #408)*. Violação de `UNIQUE`
    faz o Postgres gravar o valor no `DETAIL` do log (`Key (cpf)=(...) already exists`), e o log
    vive mais que a linha. Em tabela com CPF, telefone, e-mail ou outro dado pessoal sob `UNIQUE`,
    o insert de um valor que o cliente escolhe passa por `LucidMapping.insertUnlessUnique`
    (`ON CONFLICT DO NOTHING RETURNING id`): zero linhas é o fato `UNIQUE_CONFLICT`, e o banco não
    registra erro nenhum. O `unlessUnique` continua para o que não é dado pessoal. Como segunda
    trava, o Postgres de produção sobe com `log_error_verbosity=terse`, que tira o `DETAIL` do
    log. O e-mail é único sobre `lower(email)` (índice de expressão), atrás do `Rule.email()` que
    o grava em minúsculas, e o `findByEmail` compara `lower(email) = lower(?)`, que usa o índice.
    Conta antiga ganha o índice em migration PRÓPRIA do projeto (a do kit só vale para projeto
    novo, #401; o `--check` acusa `migration-changed:`, #415): primeiro detecta duplicata por caixa
    (`select lower(email), count(*) from users group by 1 having count(*) > 1`) e falha com
    mensagem clara se houver, depois `update users set email = lower(email)`, cria o índice
    `users_email_lower_key` e derruba o `unique` antigo. `insertUnlessUnique` leva o alvo do
    conflito, uma entrada fechada de `UNIQUE_TARGET` (`(lower(email))`, `(phone)`): sem ele o `DO NOTHING` engolia a colisão de chave
    primária. Os alvos do projeto (`(tenant_id, document)` de um membro) entram no ponto de extensão
    `repositories/shared/unique-targets.ts` (`PROJECT_UNIQUE_TARGET`, `as const`), que o kit funde em `UNIQUE_TARGET`;
    o tipo continua fechado. O update tem o par `LucidMapping.findUnderUniqueLock(trx, alvo, valor, busca)`:
    `pg_advisory_xact_lock` por alvo e valor, então a busca "o valor está livre?" antes do `update` roda
    serializada e a segunda requisição concorrente a vê ocupada em vez de estourar o `UNIQUE` (o tipo pede uma
    transação: fora dela o lock soltaria na hora) (`DECISIONS.md` #435).

---

## 6. Variáveis de ambiente *(opinião da casa)*

Um só leitor, `start/env.ts` (`Env.create` no Adonis; leitor síncrono no Fastify,
`architecture.md` §5), com blocos nesta ordem: `# Node` · `# App` · `# Session` · `# CORS` ·
`# Database` · `# Storage` · `# Seeding` · `# Mail` · `# Queue`. Chave da casa tem o mesmo
nome, validador e comentário em todo projeto. **Nome de bloco e comentário do `.env.example` e do `.env.test` são em inglês**
(`typescript.md` §12, `DECISIONS.md` #260); o texto em português é o `docs/ENV.md`.

**O modelo é a fonte.** `_templates/backend/.env.example` e `_templates/frontend/.env.example` são o
mesmo arquivo em todo projeto: mesmas chaves, mesma ordem, mesmos blocos e comentários. Só o valor de
exemplo é do projeto (porta, banco, bucket). **Nenhum bloco sai** (`DECISIONS.md` #417): e-mail e fila
ficam em todo projeto, com valor vazio onde o recurso não existe. O bloco liga pelo valor da
chave gatilho (`SMTP_HOST`; valor só de espaços é desligado, no `EnvBlocks` e no `config/mail.ts`), nunca por flag à parte e nunca pela ausência da chave; ligado, o
resto do bloco é obrigatório e `EnvBlocks.assert` (`app/core/env-blocks.ts`, chamado no fim do
`start/env.ts`) derruba o boot dizendo qual chave está vazia. No schema, a chave de bloco é
`Env.schema.string.optional()` (_doc-lib/adonisjs.md#configuration, https://docs.adonisjs.com/configuration).
O
`sync-to-project.mjs --check` compara a lista de chaves e reprova chave a mais, a menos (a comentada
`# CHAVE=` não conta onde o modelo a tem ativa) ou fora de ordem (`env-diverge:`), também no perfil
`--perfil=codigo`, e reprova o `start/env.ts` do projeto que tira o `EnvBlocks.assert` ou afrouxa para
opcional uma chave que o modelo declara obrigatória.

**Só entra no catálogo a chave que o kit lê** (código, `config/`, script, compose ou E2E de
`_templates/code/`, `DECISIONS.md` #417): chave declarada sem leitor no kit é chave inventada e sai do
modelo. O modelo Fastify (`_templates/code/backend.fastify`) ainda não tem leitor de ENV no kit nem
catálogo próprio; a leva 10 o define (`DECISIONS.md` #417).
 Chave que o modelo não tem não existe: entra
primeiro no catálogo abaixo e no modelo, depois no projeto (`DECISIONS.md` #271).

Regras:

- **Toda chave lida pelo leitor é declarada no schema**, e vice-versa. Cobrado por
  `pattern:check`.
- **Chave morta sai.** Chave declarada que nenhum código lê é removida. O que nunca passa pelo
  leitor fica listado à parte na configuração do `pattern:check`: `PORT` e `HOST` (lidas em
  `process.env` pelo framework), `NODE_ENV` (lida pelo carregador antes de haver serviço de env)
  e `TZ` (lida pelo próprio Node).
- **Chave opcional por instalação** (integração que só um cliente usa) é obrigatória onde a
  funcionalidade existe e opcional onde não existe.
- **Segredo e credencial não têm default.** A aplicação para em vez de subir com um valor que
  ninguém escolheu: `MAIL_FROM`, `SMTP_HOST`, chave de gateway de pagamento, chave de assinatura
  de webhook. A senha de seed também não tem default, mas a ausência dela desliga o seed em vez de
  parar (§6.2, "Seed ligado pela chave").
- **Default inseguro é declarado no comentário**, com o motivo. `DATABASE_SSL` ausente significa
  TLS desligado, e isso está escrito.
- **Chaves de borda da casa**: `CORS_ORIGINS` (lista explícita, nunca `*`), `COOKIE_DOMAIN`
  (opcional, §4.10), `TRUSTED_PROXIES` (bloco `# App`, §4.10).
- **`config/` só exporta valor.** Decisão sobre configuração (ambiente é produção?) é getter do
  leitor de ENV; configuração que vem do banco (preferência da instância) é repository.
- `.env` e variantes de ambiente real **não são versionados**. Versionam-se `.env.example` e
  `.env.test`; o segundo só tem endereço de container local e senha de banco de teste.

### 6.1 Nome da chave

O nome é o mesmo em todo projeto, backend e frontend. Chave nova que não está no catálogo (§6.2)
entra primeiro aqui, por decisão, e só depois no projeto. Fonte da regra: a doc dá o mecanismo (o
`Env.create` declara e valida, `_doc-lib/adonisjs.md#configuration`, https://docs.adonisjs.com/configuration;
`VITE_` decide o que vai ao navegador, `_doc-lib/vitejs.md#env-and-mode`, https://vite.dev/guide/env-and-mode;
`trustProxy` do Fastify aceita string de IP/CIDR separados por vírgula,
`_doc-lib/fastify.md#Reference/Server`, https://fastify.dev/docs/latest/Reference/Server/). Os nomes e
as regras abaixo são *(opinião da casa)*: nenhuma dessas páginas fixa nome de chave.

- `SCREAMING_SNAKE`: letras maiúsculas, dígitos e `_`.
- **Prefixo por domínio**: `DATABASE_`, `STORAGE_`, `MAIL_`, `SEED_`, `E2E_`, `VITE_` (web). A chave de
  um recurso começa pelo nome do recurso, para agrupar no arquivo e no painel da hospedagem.
- **Nada de fornecedor no nome.** `STORAGE_*`, não `R2_*` nem `S3_*`; `DATABASE_URL`, não `NEON_URL`;
  `MAIL_*`, não `MAILTRAP_*`. O código depende do protocolo (S3, Postgres, SMTP), e trocar de
  fornecedor muda o valor, nunca o nome.
- **Lista no plural, separada por vírgula, sem espaço**: `CORS_ORIGINS`, `TRUSTED_PROXIES`.
- **Booleano é `true` ou `false`**, minúsculo. `1`, `yes` e `on` não existem.
- **Tamanho em bytes**, inteiro (`UPLOAD_MAX_SIZE=1073741824`); a unidade não vai no nome nem no valor.
- **URL sem barra final.** O código concatena caminhos que começam com `/`.
- **`VITE_` só para o que pode ir ao navegador** (`frontend.md` §3.3). O que o servidor do frontend lê
  em tempo de execução e não pode ir ao bundle não leva o prefixo (`SERVER_API_URL`).
- **Mesma coisa, mesmo nome.** O teto de upload é `UPLOAD_MAX_SIZE` na API e `VITE_UPLOAD_MAX_SIZE` no
  web (espelho); a conta do semeador é `SEED_OWNER_*`; o E2E não a reusa, cria as dele (#443). Sinônimo
  (`CORS_ORIGIN`, `VITE_API_BASE_URL`, `TRUST_PROXY`) é desvio.
- **Chave removida sai do `.env.example`, do `.env.test`, do `env.ts` e do `docs/ENV.md` no mesmo
  commit.**

### 6.2 Catálogo

Uma tabela por bloco, na ordem em que o `start/env.ts` lê (a do `.env.example`). Colunas: App é quem
lê (`api`, `web`, `e2e`); Obrigatória é o que derruba o boot quando falta; Segredo é o que nunca vai
para o Git. O `docs/ENV.md` do projeto repete as linhas que ele usa, com exemplo e valor de produção;
nome e significado vêm daqui.

**`# Node`**

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `NODE_ENV` | api | sim | não | `development`, `production` ou `test` |
| `PORT` | api | sim | não | porta HTTP |
| `HOST` | api | sim | não | interface de escuta; `0.0.0.0` em container |
| `TZ` | api | não | não | fuso de todo sistema da casa, processo e sessão do banco: `America/Eirunepe` em todo ambiente (`DECISIONS.md` #393) |

**`# App`**

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `LOG_LEVEL` | api | sim | não | nível do logger |
| `APP_KEY` | api | sim | sim | chave de cifra (Adonis) |
| `APP_SERVER_URL` | api | sim | não | endereço público da API |
| `APP_CLIENT_URL` | api | só com app e API em sites diferentes | não | origem pública do web; decide o `sameSite` do cookie (§4.10) |
| `TRUSTED_PROXIES` | api | em produção atrás de proxy | não | proxies cujo `X-Forwarded-For` vale; lista de endereços, CIDR e `loopback`, `linklocal`, `uniquelocal`, `cloudflare`; ausente vale `loopback`; nunca `true` |

O leitor é um só, `app/core/trusted-proxies.ts`, igual em todo projeto e levado pelo sync de
`_templates/code/` (`DECISIONS.md` #280): o `proxy-addr` não divide string por vírgula, e entregar
`loopback,uniquelocal` cru ao `trustProxy` derruba o boot com `invalid IP address` (o 503 do aporta em
2026-11-03). O `start/env.ts` valida com `TrustedProxies.validate` e o `config/app.ts` usa
`TrustedProxies.compile(env.get('TRUSTED_PROXIES'))`; string crua no `trustProxy` é desvio.

`TRUSTED_PROXIES=uniquelocal` é o valor da casa para a rede interna do Coolify/Traefik: cobre as
faixas privadas (10/8, 172.16/12, 192.168/16, fc00::/7) sem listar a rede de cada servidor. Com a
**Cloudflare** na frente do Traefik, o `X-Forwarded-For` chega com o IP da Cloudflare no meio da
cadeia, e `uniquelocal` sozinho para antes dela: o `request.ip()` sai como IP da borda, todo mundo
que passa pela mesma borda divide um balde só do limiter, e uma sala de aula ou um escritório inteiro
fica trancado fora do login pelas senhas erradas de uma pessoa. Nesse caso o valor é `uniquelocal,cloudflare` (`DECISIONS.md` #294): a palavra
`cloudflare` vira, no leitor, as faixas publicadas em https://www.cloudflare.com/ips-v4 e
https://www.cloudflare.com/ips-v6 (conferidas em 2026-11-08). A confiança vai nas faixas, nunca no
cabeçalho `CF-Connecting-IP`: a requisição que chega à origem sem passar pela Cloudflare escreve o
cabeçalho que quiser e escolhe o próprio balde; pela faixa, ela não é confiada.
A página do Adonis mostra a leitura do `CF-Connecting-IP` por `getIp`
(_doc-lib/adonisjs.md#guides/basics/request, https://docs.adonisjs.com/guides/basics/request,
"Custom IP address extraction"); a casa fica com o `trustProxy` por faixa, que a mesma página aceita
*(opinião da casa)*. Faixa nova da Cloudflare só devolve aqueles clientes ao balde da borda, sem
abrir brecha; a lista se atualiza no `_templates/code/` e volta pelo sync.
As palavras `loopback`, `linklocal` e `uniquelocal` são do `proxy-addr` por baixo do Adonis e do Fastify;
a página do Fastify consultada só documenta IP/CIDR, então o uso das palavras é *(opinião da casa)*.

**`# Session`** e **`# CORS`** (a borda do navegador)

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `COOKIE_DOMAIN` | api | em produção com web e API em hosts irmãos | não | `Domain` do cookie de sessão; o domínio pai que cobre os dois hosts (`.exemplo.com.br` para `app.exemplo.com.br` e `api.exemplo.com.br`); sem ela o SSR do frontend não vê a sessão (§4.10) |
| `CORS_ORIGINS` | api | sim, em todo ambiente | não | origens do navegador aceitas, separadas por vírgula, nunca `*`; a barreira de origem recusa escrita de origem fora da lista também em dev (#353), e vazia em produção derruba o boot |

**`# Database`**

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `DATABASE_URL` | api | sim | sim | conexão com o Postgres |
| `DATABASE_SSL` | api | não | não | TLS na conexão; ausente é **desligado**; `true` em banco gerenciado |

**`# Storage`** (bucket S3-compatível, o mesmo em todo ambiente; MinIO no e2e e em dev, `drive.fake()` no
unitário, `DRIVE_DISK` escolhe o disco, `supportsACL: false` no R2; `DECISIONS.md` #349)

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `UPLOAD_MAX_SIZE` | api | sim | não | teto por arquivo, em bytes, sem default |
| `STORAGE_KEY` | api | sim | sim | chave de acesso; no MinIO local, o usuário de escopo mínimo, nunca o root |
| `STORAGE_SECRET` | api | sim | sim | segredo de acesso |
| `STORAGE_BUCKET` | api | sim | não | nome do bucket, privado |
| `DRIVE_DISK` | api | sim | não | disco do `config/drive.ts`: `s3` em produção (R2, S3) e em dev e e2e (MinIO), porque o upload multipart presignado só existe no S3 (o unitário usa `drive.fake()`, §7); `fs` só para rodar sem MinIO, sem upload; sem default, porque um `fs` esquecido em produção grava no container e some no próximo deploy |
| `STORAGE_ENDPOINT` | api | sim | não | endpoint S3-compatível |
| `STORAGE_FORCE_PATH_STYLE` | api | não | não | `true` só para MinIO; em R2, S3 e Spaces fica ausente |

**`# Seeding`**

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `SEED_OWNER_EMAIL` | api | junto com a senha | não | e-mail do primeiro administrador criado pelo seeder; senha sem e-mail para o seeder |
| `SEED_OWNER_PASSWORD` | api | não | sim | **liga** o seed do dono; vazia, o seed do dono é pulado com uma linha de log |

**Seed ligado pela chave.** Cada seed liga pela presença do valor da sua chave, em qualquer ambiente,
nunca por flag à parte (`SEED_ENABLED`, `SEED_DEMO=true`) nem pelo `NODE_ENV`: o `static environment`
do seeder não restringe o seed do dono, e o da demonstração só o exclui de produção (abaixo). Dado de referência que o app precisa
para funcionar (bairros, categorias) não tem chave e roda sempre. Conteúdo de exemplo (anúncio, notícia,
partida de mentira) é parte da demonstração; conta extra de exemplo
não reusa `SEED_OWNER_PASSWORD`. O mesmo vale para todo recurso do catálogo: valor presente liga,
ausente desliga (`DECISIONS.md` #276).

**O seed roda a cada deploy** (o *Post-deployment* do Coolify, `tooling.md` §8.3), então todo seeder
é idempotente e não desfaz o que o usuário mudou (`DECISIONS.md` #292). O do dono só cria:
`firstOrCreate` com `{ email }` como chave de busca e a senha só no payload de criação. Achando a
linha, o Lucid devolve o registro como está e ignora o segundo payload
(_doc-lib/lucid.md#crud-operations, https://lucid.adonisjs.com/docs/crud-operations, "firstOrCreate").
`updateOrCreate` no dono é desvio: devolveria a senha da variável a cada deploy e desfaria a troca
feita no painel. Sem `SEED_OWNER_PASSWORD`, o seed do dono pula com uma linha de log e nunca lança,
porque a variável só é necessária no primeiro deploy e o erro reprovaria o deploy inteiro. Dado de
referência segue com `updateOrCreate`/`updateOrCreateMany` pela chave natural
(https://lucid.adonisjs.com/docs/seeders, "Idempotent seeders").

**A demonstração nunca roda em produção.** Além de ligar pela chave, o seeder de demonstração
declara `static environment = ['development', 'test']`, que é o uso que a página dá à flag: manter
fixture de desenvolvimento e de teste fora da execução de produção
(_doc-lib/lucid.md#seeders, https://lucid.adonisjs.com/docs/seeders, "Environment-specific seeders").
Nenhuma senha de seed mora no código, e a demonstração não liga em produção. Se as contas de demonstração já chegaram a
produção, elas saem por migration de alteração (§4.13), nunca por edição de seeder: a migration
arquiva as contas (soft delete, para matrícula e nota presas a elas manterem a referência) e apaga
os tokens, para a sessão aberta morrer agora. O `down` dela não reativa conta.

**Forma da demonstração.** Um seeder só, `database/seeders/dev/demo.ts`, idempotente (`updateOrCreate`
pela chave natural), que roda no `node ace db:seed` e pelo atalho `pnpm db:seed:demo`. Uma conta por
papel do `USER_ROLE` do `shared/`, fora o dono, com e-mail `<papel em minúsculo>@example.com`
(`advisor@example.com`); segunda conta do mesmo papel `<papel>-2@example.com`. Quando o seed dispara e-mail real
(convite, confirmação), o domínio é um próprio do projeto em vez de `@example.com` (`DECISIONS.md` #354). A lista de e-mails mora
em `shared/src/records/demo-accounts.ts` (`DEMO_ACCOUNTS`), lida pelo seeder e pelo
`frontend/e2e/support/env.ts`; não se repete. O conteúdo de exemplo cobre toda tela de todo papel
(cada status de cada recurso) e é reconhecível como exemplo.

`OWNER` aqui é "dono da instalação", o primeiro administrador, e o nome não muda com o papel que o
projeto der a ele. As contas de demonstração (um usuário por papel, para testar e mostrar cada perfil)
dividem uma senha só; o e-mail de cada uma sai do próprio seeder, determinístico. A chave dessa
senha (`SEED_DEMO_PASSWORD`, e `E2E_DEMO_PASSWORD` no E2E) só entra no catálogo junto com o seeder de
demonstração do kit, que será o leitor dela: hoje o kit não o tem (`DECISIONS.md` #275, #417).

**`# Mail`** e **`# Queue`** (em todo projeto; vazios onde o recurso não existe, e ligados pelo valor da chave gatilho)

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `MAIL_FROM` | api | onde há e-mail | não | remetente |
| `SMTP_HOST` | api | onde há e-mail | não | servidor SMTP |
| `SMTP_PORT` | api | onde há e-mail | não | porta do servidor SMTP: 587 com STARTTLS, 465 com TLS implícito (`DECISIONS.md` #286) |
| `SMTP_USERNAME` | api | onde o relay pede login | não | usuário do relay autenticado (Resend, SES, Postmark); vazio onde o relay não pede, como o Mailpit local |
| `SMTP_PASSWORD` | api | onde o relay pede login | sim | senha ou chave de API do relay; nunca no repositório |
| `REDIS_URL` | api | não | sim | cache, fila e store do rate limit; ausente usa o banco |

**Web** (`frontend/src/env.ts`, `frontend.md` §3.3)

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `VITE_API_URL` | web | sim no build | não | raiz pública da API no bundle; ausente só vale em dev |
| `SERVER_API_URL` | web | não | não | endereço da API visto pelo SSR (rede interna), lido por requisição, sem `VITE_`; ausente usa `VITE_API_URL` |
| `VITE_SITE_URL` | web | sim no build, se o site tem `sitemap.xml` | não | origem pública do site, para as URLs absolutas do `sitemap.xml` e do `robots.txt` |
| `SITE_ENV` | web | não | não | onde o site roda, lido por requisição, sem `VITE_`; só `production` indexa, o resto responde `noindex` e `Disallow: /` (`frontend.md` §9.7); ausente não é produção |
| `STORAGE_PUBLIC_URL` | web | com upload ou leitura assinada pelo navegador | não | origem de onde o navegador lê a URL assinada: com `STORAGE_FORCE_PATH_STYLE=true` (MinIO), o `STORAGE_ENDPOINT` visto do navegador; sem ela (R2, S3, Spaces), `https://<bucket>.<host do STORAGE_ENDPOINT>`, porque o SDK põe o bucket no subdomínio e o CSP compara a origem inteira (#285), lida por requisição, sem `VITE_`, para abrir `img-src` e `connect-src` do CSP (`frontend.md` §3.3); ausente, o CSP só libera a API |
| `VITE_UPLOAD_MAX_SIZE` | web | não | não | espelho de `UPLOAD_MAX_SIZE`; ausente, o cliente não recusa por tamanho e o `422` do servidor diz o limite |

**E2E** (`e2e/support/env.ts`, Playwright; sem default: falta uma e a execução para dizendo qual)

| Nome | App | Obrigatória | Segredo | Significado |
|---|---|---|---|---|
| `E2E_BASE_URL` | e2e | ao rodar o E2E | não | origem do web sob teste |
| `E2E_API_URL` | e2e | ao rodar o E2E | não | raiz da API, para as fixtures |
| `E2E_CHROMIUM_PATH` | e2e | não | não | binário do Chromium para o Playwright onde o baixado não roda (container da nuvem); ausente, o Playwright usa o dele. Script do projeto que precise de navegador (gerar ícone) lê a mesma chave |

O E2E não tem chave por papel (`E2E_ADMIN_*`, `E2E_ADVISOR_*`) **nem de senha**: as contas por papel
nascem na hora, pelo comando `node ace e2e:accounts` (`commands/e2e-accounts.command.ts`), que o
`e2e/auth.setup.ts` chama. Ele cria uma conta para o dono da plataforma, o administrador da plataforma, o
`staff`, o `nonStaff` (quando o projeto tem papel fora do staff) e o cliente final, lendo os papéis de
`tests/role-fixtures.ts` e sem literal de enum; sorteia a senha a cada execução, a imprime só na saída do
comando (`E2E_ACCOUNTS=<json>`) e **recusa `NODE_ENV=production`**. Nada disso é chave de ambiente: não há
`SEED_DEMO_PASSWORD`, `E2E_DEMO_PASSWORD` nem seeder de demonstração com senha fixa, e o catálogo segue
com 35 chaves no backend e 10 no frontend (`DECISIONS.md` #443). O spec de papel pede a sessão com
`test.use({ storageState: E2eAccountsStore.stateOf('staff') })`. Nem porta solta
(`E2E_PORT`): a origem inteira é `E2E_BASE_URL`. Ajuste de execução (workers, matriz) fica no
`playwright.config.ts` e no comando da rodada (`tooling.md` §7), não em chave.

**Mesmo número de chaves, mesmos nomes.** Todo projeto da casa tem o mesmo `.env.example` chave por
chave e na mesma ordem (backend e frontend); o que muda entre eles é só o valor de exemplo. Não há bloco
opcional: chave que o projeto não usa fica no lugar dela, com valor vazio, nunca apagada (`DECISIONS.md`
#417, que fecha a exceção de `mail`, `queue` e `jwt` do #276). Chave de uso pontual de um projeto (importação
única, flag de funcionalidade só dele) não entra no catálogo: sai do projeto. O `.env.test`, o `.env.e2e.example` e o `.env.production` usam só chaves do catálogo, e o
`sync-to-project.mjs --check` cobra (`DECISIONS.md` #276).

**Fora do leitor de ENV**: `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD`, lidas por `infra/minio/minio-setup.sh`
(o leitor delas está no kit). As portas do `docker-compose.yml` (`DB_PORT`, `STORAGE_PORT`,
`STORAGE_CONSOLE_PORT`) não são chave do catálogo: o kit não tem compose, e o número da porta é o da
tabela de `tooling.md` §8.1, escrito no compose do projeto. O CORS do MinIO local sai de `CORS_ORIGINS`. **Não existe chave de domínio do projeto**: o que o catálogo não cobre entra primeiro
aqui e no modelo (§6, `DECISIONS.md` #271).

### 6.3 Migração dos nomes antigos

Cada linha vira item em `_findings/<projeto>.md` (seção "Chaves de ambiente") e tarefa no sync do projeto.

| Nome antigo | Nome da casa | Por quê | Onde aparece |
|---|---|---|---|
| `CORS_ORIGIN` | `CORS_ORIGINS` | lista é plural | academy, interclasse, simple-hub |
| `VITE_API_BASE_URL` | `VITE_API_URL` | um nome para o endereço da API no navegador | lowcodejs, matiscraft |
| `TRUST_PROXY` (`'true'`) | `TRUSTED_PROXIES` (lista) | `true` confia em qualquer um e o cliente forja o IP | exemplo de `_doc-lib/fastify.md#Reference/Server`; nenhum projeto o lê hoje |
| `SESSION_DRIVER` | (sai) | sem sessão no servidor a chave é morta | adacaibs, já removida |
| `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | `STORAGE_BUCKET`, `STORAGE_KEY`, `STORAGE_SECRET` | sem fornecedor no nome | exemplo antigo de `tooling.md` §8 (corrigido) |
| `APP_URL` | `APP_SERVER_URL` | a API é o servidor; o web é `APP_CLIENT_URL` | modelo antigo de `_templates/docs/ENV.md` (corrigido) |
| `SEED_OWNER_*` renomeado pelo papel do projeto | `SEED_OWNER_*` | `OWNER` é a conta da instalação, não um papel | interclasse (I5 deixa de valer) |
| `SEED_ADMINISTRATOR_EMAIL`, `SEED_ADMINISTRATOR_PASSWORD` | `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD` | mesmo motivo da linha acima | interclasse |
| `E2E_ADMIN_*`, `E2E_<PAPEL>_*` | (sai) | sem leitor: as contas por papel nascem no `auth.setup.ts`, pelo `e2e:accounts` (#443) | interclasse |
| `E2E_PORT` | `E2E_BASE_URL` | a origem inteira, não só a porta | interclasse |
| `VITE_STORAGE_URL` (build) | `STORAGE_PUBLIC_URL` (runtime) | lida por requisição, a mesma imagem serve qualquer ambiente | interclasse, curupira |
| `CHROMIUM_PATH` | `E2E_CHROMIUM_PATH` | um nome para o mesmo binário | aporta, curupira |
| `VITE_DATA_SOURCE` (`mock`/`api`) | (sai) | o frontend fala só com a API; dado de exemplo é o seeder de demonstração | curupira |
| `E2E_WORKERS`, `E2E_FULL_MATRIX` | (sai) | execução é do `playwright.config.ts` e do comando da rodada | curupira |
| `API_URL`, `APP_URL`, `URL_API`, `UUID_API`, `COOLIFY_*`, `DOCKERHUB_*` no workflow de deploy | (sai) | não há workflow de deploy: o Coolify constrói da `main` (`tooling.md` §8.3, #290) | adacaibs, aporta, interclasse, curupira |
| `CLIENT_URL`, `SERVER_URL` | `APP_CLIENT_URL`, `APP_SERVER_URL` | prefixo `APP_` da origem pública (#417) | matiscraft |
| `ADMINISTRATOR_EMAIL`, `ADMINISTRATOR_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD` | a conta do semeador é uma só (#417) | matiscraft, manganga.api |
| `EMAIL_PROVIDER_HOST`, `_PORT`, `_USER`, `_PASSWORD` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` | protocolo, não fornecedor (#417) | matiscraft |
| `COOKIE_SECRET` | `APP_KEY` | uma só chave de cifra (#417) | matiscraft, manganga.api |
| `JWT_PUBLIC_KEY`, `JWT_PRIVATE_KEY` (Fastify) | pendente | o catálogo Fastify é próprio e fica para a leva 10 (#417); no Adonis não há JWT | matiscraft, manganga.api |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` | `DATABASE_URL` | uma URL só (#417) | manganga.api |
| `SITE_INDEXABLE` | `SITE_ENV` | só `production` indexa (#417) | simple-hub |
| `CHECKOUT_ENABLED`, `LEGACY_DATABASE_URL` | (sai) | uso pontual de um projeto não entra no catálogo (#417) | simple-hub, manganga |

---

## 7. Testes

Onde cada teste mora e o que cada camada leva é de `architecture.md` §8; o ciclo TDD, os dublês e
o critério de aceite em EARS são de `domain.md` §10. Japa no Adonis (suítes `unit` e
`functional`), Vitest no Fastify (configs `unit` e `e2e`). Aqui fica o que é próprio da borda
HTTP.

**Matriz mínima do E2E por tipo de ação** *(opinião da casa)*:

| Tipo | Casos |
|---|---|
| leitura pública | 200; 404 |
| leitura privada | 200; 401; 404 para inexistente **e** para alheio, com corpo idêntico (§4.6) |
| criação | 201; 401; 403 de papel; 422 com o campo; 409 de unicidade |
| atualização | 200; 401; 403; 404 (inexistente e alheio); 422; 409 |
| ciclo de vida | 200; 401; 403; 404; 409 de estado (`ALREADY_ARCHIVED`, `NOT_ARCHIVED`) |
| sign-in e afins | 200; 401 uniforme para conta inexistente e senha errada; 429 na N+1-ésima tentativa |
| webhook, job, comando | duas execuções com o mesmo identificador deixam o mesmo estado, em sequência **e** simultâneas (`Promise.all`) |
| recurso limitado e pagamento | duas requisições simultâneas iguais: só uma tem efeito, a outra recebe 409 ou a mesma resposta (`Idempotency-Key`); estoque, saldo e contador nunca ficam negativos (§4.11) |

- **Depois de todo 4xx de escrita, a asserção "não gravou"**: o estado no banco é o de antes.
- **Par recusa + aceita** para toda regra de recusa: só o teste da recusa passa também contra um
  endpoint que recusa tudo.
- **Toda correção de segurança nasce com uma spec que falha antes do fix.**
- **Spec que prova a redação de log**: loga um sign-up e afirma que a senha não aparece.
- **Factory nasce com o papel menos privilegiado**; privilégio é `state` explícito
  (`_doc-lib/lucid.md#model-factories`). Dublê de I/O trocado no container (`swap`/`restore`,
  `_doc-lib/adonisjs.md#guides/testing/test-doubles`).
- **Fixtures por tema em `tests/<tema>-fixtures.ts`** (`session-fixtures.ts`,
  `database-fixtures.ts`), nenhum `helpers.ts` (C12, `typescript.md` §6). Helper usado por uma
  spec fica nela; por duas ou mais, sobe. O mesmo vale para `tests-e2e/support/<tema>.ts`.
- Objeto real em teste E2E vem do container (§2.1).
- **E2E nunca toca banco de produção.** O bootstrap dos testes chama `tests/database-guard.ts`
  (classe `DatabaseGuard`), que recusa subir se o banco não tiver o sufixo `_test` no nome **e**
  host local (o do compose de teste, §8.4 de `tooling.md`), e sai com erro antes da primeira
  migration (`DECISIONS.md` #350). A doc do Adonis manda banco e storage separados, com `.env.test`, e
  limpeza entre testes por `testUtils.db().truncate()` (`_doc-lib/adonisjs.md#guides/testing/resetting-state-between-tests`);
  no Fastify a guarda mora no `globalSetup` do Vitest (`_doc-lib/vitest.md#config/globalsetup`). Mock só do que é externo (gateway, e-mail, API de terceiro); banco,
  regra e policy rodam de verdade.
- **O `it` é a frase do comportamento**, em inglês (`typescript.md` §12), no formato "when …, …"
  ("when the same event arrives twice, releases the plan once"). Onde o projeto tem requisitos
  numerados, o título começa pelo id: `RF-NN: when …, …` (`DECISIONS.md` #350). O dono lê e aprova
  a frase; o corpo é do agente (`_doc-lib/japa.md#docs/grouping-tests`, `_doc-lib/vitest.md#api/test`).
- Meta: **≥ 2,0 specs de asserção por controller**, medida por relatório *(opinião da casa)*.

**Redes obrigatórias** (meta-specs que cobram o que ninguém lembra), ao lado do que cobrem:

| Spec | Reprova |
|---|---|
| `core/validator.unit.spec.ts` | as quatro checagens de §4.4 |
| `core/openapi/openapi.e2e.spec.ts` | rota fora do documento, operação sem resposta, id duplicado |
| `middleware/<nome>.middleware.e2e.spec.ts` | matriz de papéis, cookie, CORS, origem (CSRF), idioma |
| `core/response-leak.e2e.spec.ts` | resposta de `GET` que contém chave proibida (`password`, hash de token) ou valor com cara de hash, em qualquer nível da árvore, para cada papel e sem sessão |
| coluna qualificada | join com coluna ambígua |
| SDK só no adaptador | import de SDK de fornecedor fora de `services/<nome>/<nome>.service.ts` |
| vitrine só leitura | rota pública que não é `GET` sem estar na lista declarada |
| mensagens i18n | chave faltando ou sobrando em `pt-BR`/`es`/`en` (`i18n.md` §4) |

Piso de specs de ação: autenticação, conta, papéis, cookie, CORS, documentação, mensagens,
storage, validator, limite de login.

- **Migration standalone** (perfil sem runner do framework) *(opinião da casa)*: processo próprio,
  sem subir kernel/container, idempotente, `process.exit(1)` na falha. A spec roda o arquivo por
  `child_process` contra banco isolado, nunca `import` direto, que derruba o runner se falhar.
- **Spec de script de guard-rail** (§10) fica ao lado do script: `scripts/<nome>.unit.spec.ts`,
  sem container (`architecture.md` §8).
- **Suíte E2E sequencial** *(opinião da casa)*: só quando o cenário é caro de montar (tenant,
  extensões, dado dinâmico). Mora em `tests-e2e/`, arquivos com prefixo numérico de ordem
  (`01-<tema>.e2e.spec.ts`) e `zz-` para o que roda por último; estado compartilhado entre
  arquivos é explícito. A spec ao lado da ação continua obrigatória: a sequencial soma.

---

## 8. Documentação

Onde moram `AGENTS.md`, `CLAUDE.md` e `docs/` é de `documentation.md` §3 (raiz com `AGENTS.md` e
`CLAUDE.md` = `@AGENTS.md`); o que cada arquivo de `docs/` guarda, de `documentation.md` §1. Não
existe `CLAUDE.md`/`AGENTS.md` por camada, módulo, recurso ou operação *(opinião da casa)*: a
árvore é a mesma em todo projeto, e a pasta da ação já é autoexplicativa.

**Doc de operação é derivada do OpenAPI, por comando.** Endpoint, auth, permissão, payload e
tabela de erros saem do `openapi.json`, gerado do router de verdade (`openapi.md`). O porquê de uma
regra mora no comentário do use-case, ao lado do código. Tabela redigida à parte envelhece na
primeira mudança. Número que um comando gera (rotas, controllers) não se escreve à mão.

---

## 9. Commits

Formato, idioma, autoria e hooks: `tooling.md` §6. O que é próprio do backend:

- Um commit é uma mudança lógica completa que compila e passa nos testes.
- Todo `fix` leva o teste de regressão escrito antes da correção (`tooling.md` §10.3).
- O tipo reflete o que mudou: correção de bug é `fix`, não `chore`; rearranjo sem mudança de
  comportamento é `refactor`, não `feat`.
- **`refactor` não muda contrato.** Rota, status, `code` de erro, forma de resposta e ordem ficam
  iguais; a prova é o mesmo E2E verde antes e depois e o `openapi:check` sem diff. Uma fronteira
  de dono por commit (mover um recurso, extrair um repository), cada estado intermediário
  compilando e verde *(opinião da casa)*.

```
feat(posts): aceita anexo de imagem na publicacao
fix(files): exige sessao e posse no download
refactor(posts): extrai o repository de post
```

---

## 10. Guard-rails *(opinião da casa)*

A fórmula do `check` de cada app é uma só e mora em `tooling.md` §7 (`DECISIONS.md` #338); a tabela
abaixo diz o que cada script do backend reprova.

| Script | O que reprova |
|---|---|
| `lint` | as regras de §2, `new` fora da allowlist (§2.1), ordem de import e `eslint-disable` sem motivo (bloco comum de `tooling.md` §4.1) |
| `typecheck` | `tsc --noEmit` |
| `openapi:check` | `openapi:generate --check --strict`: documento desatualizado, ou operação sem resposta descrita |
| `pattern:check` | o que o ESLint não alcança porque depende de *onde* o arquivo está: a árvore inteira de `architecture.md` §6; nomes derivados do caminho (§3); camada que importa outra (§1.3); `@vinejs/vine` e subpaths fora do `vine` configurado do Adonis; validator do Adonis sem par no `shared/`; spread de corpo cru em controller (§4.1); `throw` e `*OrFail()` em use-case e repository; `actor` com outro nome; policy fora do mecanismo do framework e `BOUNCER_REQUIRED` (§4.6); filtro de `deletedAt` fora do model, inclusive qualificado (§4.8); `_shared` com I/O (§4.9); diretórios obrigatórios; as checagens de ENV (§6) |
| `authz:check` | mudança na cadeia de autorização de qualquer rota, e rota nova fora da lista pública e sem sessão (§4.10), contra `app/core/openapi/authz-baseline.json`; a proteção sai como `anonymous`, `authenticated` ou os papéis, e o `public-routes.unit.spec.ts` lê o mesmo rótulo contra a lista do projeto em `app/core/openapi/public-routes.ts` (escrita anônima por desenho e prefixo público só de leitura) |
| `test:unit` | a suíte `unit`, sem banco |
| `di:check` | constrói todo service, repository e policy pelo container e reprova o que não sobe; **reprova também se encontrar zero alvos** (varredura vazia é guard que não guarda) |

O hook de `pre-commit` é de `tooling.md` §6. `di:check` e a suíte E2E ficam fora do `check`
porque bootam a aplicação com banco: a rodada antes do PR os roda com o compose de pé
(`tooling.md` §7). *(Fastify)* `di:check` resolve cada registro do registry, e `openapi:verify`
não existe: com o `setSerializerCompiler` do Zod (`backend-fastify.md` §2) a resposta já passa
pelo schema publicado, e o verificador não tem o que verificar (`DECISIONS.md` #360). *(Adonis)* `openapi:verify`
não existe: o `--strict` e a spec de documentação cobrem o caso comum, e ele entra quando um
defeito real passar pelas duas.

`boot:check` não existe: toda spec E2E boota a aplicação, e uma que não sobe reprova a suíte
inteira antes de qualquer asserção.

**Catálogo do `pattern:check`** (`DECISIONS.md` #359): o motor é um só, do kit (`scripts/pattern-check.ts`),
e cada `rule` do catálogo (`scripts/pattern-check.rules.ts`, que mantém os ids do lowcodejs, de onde
veio a base) aponta a seção da régua que cobra. O projeto só tem `pattern-check.config.ts`. As regras
novas:

| `rule` | Seção que cobra |
|---|---|
| `http-exception-default` | §4.1 (fábrica sem default) |
| `request-logger` | §4.2 (log pelo `ctx.logger`) |
| `route-name` | §4.8 (nome `<módulo>.<recurso>.<ação>`) |
| `migration-turning-line`, `rollbacks-in-production` | §4.13 |
| `multipart-content-type` | §5.4 (parte assina só `content-length`) |
| `env-outside-config` | §6 (ENV só em `config/`, `DECISIONS.md` #314) |
| `refusal-name`, `shared-no-vine` | `architecture.md` §3 e §9 |
| `spec-name` | `architecture.md` §3.4 |
| `index-barrel`, `kit-import`, `boolean-layout-prop` | `architecture.md` §4, `frontend.md` §6 |
| `query-exact-version` | `tooling.md` §0.1 |
| `common-prefix` | `i18n.md` §4 |

**Formato de saída de todo `scripts/<nome>-check.ts`** *(opinião da casa)*: cada achado é
`{ file, line, rule, section, message }` (`section` = seção do `_standards` violada); a saída
agrupa por `section` e o processo sai com código 1 se a lista não for vazia. Exceção de qualquer
check entra em `scripts/pattern-check.config.ts` tipado, cada uma com `reason`; exceção sem uso
reprova (`architecture.md` §6). Os nomes dos campos são inglês por `typescript.md` §12
(`DECISIONS.md` #258).

**Revisão de diff de backend** (o que nenhum guard pega): a lista de segurança comum está em
`tooling.md` §10.2. Próprio do backend: rota pública nova sem limite e resposta que expõe campo fora
do presenter.

---

## 11. Mudar o padrão

Este repositório é o upstream único. Projeto não edita a própria cópia de `_standards/`,
`_doc-lib/` nem das skills da casa: a próxima sincronização sobrescreve.

**Nada do projeto depende deste repositório** *(opinião da casa)*: nenhum hook, script
de `package.json`, Dockerfile ou deploy do projeto clona, baixa ou chama `maiyu-pattern`. A cópia
de `_standards/`/`_doc-lib/`/skills é commitada no projeto e basta para ele construir, testar e
publicar sozinho. A conferência `node scripts/sync-to-project.mjs <dir> --check` roda **à mão,
daqui**, quando a régua muda. **Por quê:** build que depende de outro repositório quebra quando ele
muda, sai do ar ou fecha o acesso, e trava o deploy de um projeto por causa de um documento que
nem afeta o código dele.

1. A necessidade aparece num projeto → a mudança é feita **aqui**, com linha nova em
   `_standards/DECISIONS.md` (o quê, onde, por quê).
2. `node scripts/sync-to-project.mjs <dir-do-projeto>` copia para cada projeto.
3. Um commit por projeto, Conventional (`docs(standards): …`).
4. Código do projeto que passa a divergir migra pelo roteiro de `MIGRATIONS.md`, que tem uma seção
   por projeto (`DECISIONS.md` #362); enquanto convive,
   leva o comentário `ponytail:` da §5.1.

Divergência permanente de projeto não existe: ou a régua muda para todos, ou o projeto migra.

### 11.1 Migrar model direto para repository *(opinião da casa)*

Projeto que usa o model no use-case migra **por módulo, ao mexer** (`DECISIONS.md` #111), por
Branch by Abstraction:

1. **Caracterização**: o E2E da ação existente registra o comportamento atual, bug incluso, sem
   corrigir nada.
2. **Contrato + implementação ORM** que embrulha as consultas atuais, sem mudar o que fazem.
3. **Use-cases trocados um a um** para o contrato, cada troca num commit verde.
4. **Implementação em memória + teste de contrato** nas duas (`domain.md` §5.3–§5.4); o unitário do
   use-case passa a existir.
5. **Remove a exceção** do `pattern-check.config.ts` que permitia o model na feature.

Enquanto convivem, o código antigo leva `ponytail:` (§5.1). Correção de bug achado na caracterização
é um `fix` separado, depois.
