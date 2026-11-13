# OpenAPI

Gerador de documentação da API, próprio do repositório. Não é biblioteca de terceiro.

> **Padrão, não biblioteca.** Descreve o gerador de contrato de todo backend da casa. Os caminhos
> seguem `architecture.md`: o que roda em produção (tipos, registro, correções de schema) e os
> conversores (`vine-schema`, `zod-schema`, `field-patches`) moram em `app/core/openapi/`, porque a
> meta-spec importa deles; o que só roda em desenvolvimento e na conferência (introspecção, emissão)
> mora em `scripts/openapi/` (`DECISIONS.md` #357). Os exemplos de código usam o adaptador Fastify (o `schema` da rota é
> consumido pelo framework); no Adonis os scripts são chamados por um comando ace
> (`commands/openapi-generate.command.ts`) e o documento é servido pela rota de documentação
> (`backend.md` §4.1 e §10). A regra vale nos dois: o contrato é **derivado** do código e conferido
> por `openapi:check` no `check`, nunca redigido à mão. O corpo de cada resposta vem do schema Zod
> de `shared/src/responses/` (`architecture.md` §10); o gerador não lê model.

**O que é:** um par de scripts que lê o AST dos controllers, dos use-cases e dos middlewares, mais os
schemas de resposta de `shared/` em runtime, e escreve dois artefatos: `app/core/openapi/schema.generated.ts`
(os `schema` que cada rota registra no Fastify) e `openapi.json` (o documento completo, obtido
subindo o kernel e perguntando ao `@fastify/swagger`). A referência navegável é servida pelo Scalar
em `/documentation`. Em produção essa rota fica desligada ou atrás de sessão de administrador: rota escondida
continua alcançável (skill `security-audit`, ATTACK-CLASSES.md).

**Para que serve:** ter o contrato da API — rota, payload, resposta e erros — como artefato
commitado e diffável, sem manter documentação em paralelo ao código. A alternativa — um `*.schema.ts` por rota mantido
à mão — redesenha o que schema de resposta, validator, middleware e use-case já dizem, e envelhece separado deles.

**Como usar:**

```bash
pnpm openapi:generate           # reescreve os dois artefatos
pnpm openapi:check              # no `check`: sai 1 se algum estiver desatualizado
pnpm openapi:generate --strict  # trata aviso como erro
pnpm check                      # tsc + os de cima + pattern:check + authz:check (backend.md §10)
```

`openapi:verify` não existe em nenhum perfil. No Fastify a resposta passa pelo `setSerializerCompiler`
do `fastify-type-provider-zod` (`backend-fastify.md` §2), que valida pelo schema Zod publicado, e o
verificador não teria o que comparar (`DECISIONS.md` #360). No Adonis o schema de resposta não passa
por serializador, e o `--strict` do `openapi:check` mais a meta-spec `app/core/openapi/openapi.e2e.spec.ts`
cobrem o caso (`backend.md` §10).

Scripts fora da suite de teste precisam de `NODE_ENV=test` para achar o `.env.test`; sem isso morrem
com `Invalid environment variables` antes de chegar ao gerador.

**Quando mexer:** depois de qualquer mudança em rota, middleware, validator, use-case **ou schema de
resposta** (`shared/src/responses/`). Prefixo de rota novo pede uma tag em `config/openapi.ts`;
ação nova pede uma entrada no registro de resposta. O resto sai sozinho.

**A ideia central, e a regra que decide onde cada informação mora:**

> O que o código já diz, o gerador lê; o que só uma pessoa sabe, o controller declara.

Isso é o oposto de um gerador dirigido por JSDoc, onde cada operação depende de alguém lembrar de
anotá-la e a anotação envelhece separada do código. Aqui mudar o validator do controller muda a
documentação na próxima geração.

**A pegadinha:** `additionalProperties: true` na raiz de toda resposta não é frouxidão. No Fastify o
`response` **não é documentação, é whitelist de serialização** — propriedade não declarada some da
resposta em produção. A derivação descreve o contrato; ela não tem autoridade para apagar um campo
que não enxergou.

**Links:** 13 (todos internos, apontando para arquivos do repositório).

---

## Uso

#### fluxo-de-trabalho
código: `scripts/openapi/generate.ts` (Fastify); no Adonis, `commands/openapi-generate.command.ts`

**O que é:** o script `openapi:generate`, com `--check` e `--strict`.
**Para que serve:** produzir os dois artefatos e recusar um contrato desatualizado no `check`.
**Quando usar:** depois de qualquer mudança em rota, validator, use-case, middleware ou schema de
resposta.
**Sempre commite os dois artefatos junto com a mudança que os alterou** — é o que faz o contrato
aparecer no diff do PR.

```bash
NODE_ENV=test pnpm openapi:generate   # desenvolvimento
NODE_ENV=test pnpm openapi:check      # no `check`: falha se alguém esqueceu de regerar
```

A geração é determinística: rodar duas vezes produz bytes idênticos, e é isso que faz o `--check`
funcionar. O campo `servers` é relativo, `[{ url: '/' }]`, escrito pelo gerador
(`scripts/openapi/emit.ts`), e não lê ENV nem `config/openapi.ts`: a especificação permite URL de
servidor relativa "to the location where the OpenAPI document is being served" (OpenAPI 3.1.0,
Server Object, https://spec.openapis.org/oas/v3.1.0#server-object), e a API serve o próprio
`/openapi.json`. Gravar o valor concreto do `.env` de quem gerou deixaria o documento commitado
errado em todo outro ambiente e faria o `--check` acusar divergência só por isso. Cliente gerado
fora da API recebe o endereço base na configuração dele, não no documento.

#### dois-artefatos
código: `app/core/openapi/schema.generated.ts`

**O que é:** por que a leitura de AST não basta e existe um segundo artefato.
**Para que serve:** pegar a mudança de contrato que o primeiro artefato não consegue mostrar.
**Quando usar:** ao se perguntar por que o `openapi.json` está commitado se o `schema.generated.ts`
já existe.

| Artefato | Como sai | Precisa de banco |
| --- | --- | --- |
| `app/core/openapi/schema.generated.ts` | leitura de AST | não |
| `openapi.json` (raiz do backend) | subindo o kernel e perguntando ao `@fastify/swagger` | sim |

O registro guarda uma **referência** ao schema de resposta (`AdministratorUserShowResponse`), não o
schema expandido. Então acrescentar um campo ao schema em `shared/` muda o contrato de todas as rotas
que o usam **sem alterar um byte** do `schema.generated.ts`: o `--check` passaria e o diff do PR
sairia vazio. O documento commitado é
o que fecha isso, e é também o que permite gerar cliente tipado sem subir o servidor.

*(Fastify)* Ele **não vai para o build**: `/openapi.json` é servido em memória pelo `@fastify/swagger`,
e nada lê o arquivo do disco. *(Adonis)* O arquivo vai para o build por `metaFiles` no `adonisrc.ts`, e
a ação de documentação o lê do disco a cada requisição; sem o `metaFiles`, a rota responde 500 no
servidor construído (_doc-lib/adonisjs.md#reference/adonisrc-rcfile, `DECISIONS.md` #357).

O caminho é `app/core/openapi/schema.generated.ts` (`architecture.md` §3.3), não
`start/schema.generated.ts`: `start/` guarda só boot (ENV, kernel). Projeto com o artefato em
`start/` migra (`MIGRATIONS.md`).

#### rota-nova
código: `app/features/administrator/users/create/create.controller.ts`

**O que é:** o caso mais comum — acrescentar uma operação numa fatia que já existe.
**Para que serve:** nada. É o ponto do desenho.
**Quando usar:** sempre que a rota nova usar os padrões que o gerador já reconhece.

```ts
@Controller()
export default class {
  @POST({
    url: '/users',
    options: {
      onRequest: [
        AuthenticationMiddleware.hook({ optional: false }),
        PermissionMiddleware.hook(AREA_CAPABILITY.MANAGE_USERS),
      ],
      schema: SCHEMAS['POST /users'],
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> { /* … */ }
}
```

Nome da rota é `<módulo>.<recurso>.<ação>`, igual à pasta, e o `operationId` sai dele; caminho sem
prefixo de versão (`/v1`); prosa da operação em pt-BR (`backend.md` §4.8, `DECISIONS.md` #345).

O `@Controller()` aceita um `route` que prefixa as rotas da classe
(`@Controller({ route: 'users' })`); sem ele o `url` de cada método é o caminho inteiro. O gerador
lê as duas formas.

A linha que fecha o ciclo é o `schema: SCHEMAS['POST /users']`: o gerador escreve o
`schema.generated.ts`, e o controller **consome** o que foi gerado, indexado por `"MÉTODO /caminho"`.
Rota nova sem a entrada correspondente sai do gerador e volta ao controller na mesma rodada.

```bash
NODE_ENV=test pnpm openapi:generate   # a operação aparece completa
```

Método, caminho, payload, status, erros, resumo, tag e segurança saem sozinhos. O que **não** sai
sozinho é o corpo da resposta, se a fatia ainda não tiver entrada no registro.

---

## O que é derivado

#### introspeccao
código: `scripts/openapi/introspect.ts`

**O que é:** a leitura do AST do controller com o compilador do TypeScript, mais a do use-case irmão
e a dos services que ele chama.
**Para que serve:** extrair payload, origem do payload, status de sucesso e erros do domínio sem
nenhuma declaração.
**Quando usar:** ao entender por que uma rota apareceu do jeito que apareceu, ou ao ensinar um padrão
novo ao gerador. **É o coração do sistema** — se algo não foi derivado, é aqui que se olha.

| Informação | Fonte |
| --- | --- |
| método + caminho | `@Controller({route})` (opcional) + `@GET({url})` |
| `security` + 401 | `AuthenticationMiddleware.hook(...)` na cadeia `onRequest` |
| 403 + qual barreira | `PermissionMiddleware` · `RoleMiddleware` · middleware de domínio que barra por registro |
| `body` / `querystring` / `params` | o `<Módulo><Recurso><Ação>Validator` de `@<projeto>/shared` que o handler chama |
| status e corpo vazio | `response.status(N).send(X)` |
| erros de domínio | `HTTPException.<Fábrica>(t('<chave>'), '<CODE>')` do use-case, da tabela de tradução de fatos (`domain.md` §2) e do `_shared.<recurso>-refusal.ts` que ele importa |
| 429 | o limitador da rota: no Adonis, `start/limiter.base.ts` para as rotas do kit (arquivo do kit, o sync sobrescreve) e `start/limiter.ts` para as do projeto (ponto de extensão, `scripts/kit-manifest.mjs` `EXTENSION_POINTS`; `architecture.md` §3); no Fastify, `@fastify/rate-limit` ou o limitador próprio (`DECISIONS.md` #357, #770) |
| 400 / 500 | `app/exceptions/handler.ts` |
| envelope da resposta | `type Response = Either<HTTPException, X>` |
| corpo da resposta | o registro, pela chave do diretório da ação, apontando o schema de `shared/src/responses/` |
| `tags` + `summary` | `config/openapi.ts` + nome da pasta da ação |

Padrão que não estiver nessa lista não é adivinhado: a rota sai sem payload e o aviso aparece.

**O escopo de leitura muda conforme o arquivo, e tem motivo.** Use-case de uma ação: arquivo
inteiro, porque um método público costuma delegar a métodos privados, e são eles que devolvem o
`left`. Tradutor `_shared.<recurso>-refusal.ts`: só as entradas dos fatos que o use-case pode
receber. Service de I/O não é lido: ele devolve fato, nunca `HTTPException` (`domain.md` §2). Classe
com várias operações públicas: só o método que o handler chama, senão a listagem sai documentando
os erros da remoção.

#### schema-de-resposta
código: `shared/src/responses/<módulo>/<recurso>.response.ts` (fonte) + `app/core/openapi/zod-schema.ts` (conversão)

**O que é:** a conversão do schema Zod de resposta (`<Módulo><Recurso><Ação>Response`,
`architecture.md` §10) em JSON Schema, **sem AST**, por `z.toJSONSchema(schema, { io: 'output' })`.
Tipo sem representação em JSON Schema (`z.date()`, `z.bigint()`, `transform`) o Zod recusa em vez
de calar; o schema de resposta usa o tipo de transporte (`z.iso.datetime()`, `z.string()`), e quem
precisar de `unrepresentable: 'any'` diz o porquê no comentário. No Fastify o
`@fastify/swagger` recebe o mesmo schema pelo `jsonSchemaTransform` de `fastify-type-provider-zod`
(_doc-lib/fastify-plugins.md#fastify-type-provider-zod). _doc-lib/zod.md#json-schema (`DECISIONS.md`
#241).
**Para que serve:** descrever o que a rota devolve com o mesmo schema que o frontend usa para tipar a
resposta, sem reescrever campo à mão.
**Quando usar:** ao acrescentar campo a uma resposta. Edita-se o schema em `shared/` e regera.

O gerador **não lê model nem entidade.** Model é a forma gravada e só `repositories/` o importa
(`architecture.md` §2); `core/openapi/` importa só `shared/`. A resposta pública é o que o presenter
do recurso monta (`<recurso>.presenter.ts`), e o presenter é tipado pelo mesmo schema: campo que não
está no schema (o hash de senha, o `_id` cru) não tem como chegar ao documento nem à resposta. Some o
`omit` por rota e o risco de expandir estruturalmente um `User` e publicar `password`.

Projeto que ainda descreve a resposta pelo model (`defineModel`, `FieldSpec`, schema gerado do Lucid)
migra para o schema de `shared/` ação por ação (`MIGRATIONS.md`).

#### erros-do-use-case
código: `scripts/openapi/introspect.ts` (coleta) + `HTTPException` (fábricas, `backend.md` §4.2)

**O que é:** a coleta de `HTTPException.<Fábrica>(t('<chave>'), '<CODE>')` do use-case irmão, da
tabela de tradução de fatos dele e do `_shared.<recurso>-refusal.ts` que ele importa.
**Para que serve:** documentar status, código **e** mensagem de cada falha do domínio, sem declarar.
**Quando usar:** ao adicionar um `left(...)` ou um fato novo. Não precisa fazer nada, mas só
argumentos literais são lidos: código e chave de mensagem montados em variável ficam de fora, de
propósito. Melhor faltar do que documentar um palpite.

**O `code` vira `enum`, a mensagem não.** O `code` é o que o cliente usa para decidir, e sai
restrito aos valores que aquela operação devolve. A mensagem é a da chave em `pt-BR` (`i18n.md`
§1), resolvida em `resources/lang/pt-BR/`; o documento não lista as traduções, porque o texto
muda com o `Accept-Language` e o `code` não.

Por isso o código é literal no use-case; catálogo central só nas condições de `backend.md` §3
(linha "código de erro de negócio").

**Componente de erro compartilhado** *(opinião da casa)*: operações que falham com o mesmo
status e o mesmo conjunto de `code` apontam para um componente só, nomeado
`Error<Status><Codes em PascalCase, ordenados>` (`Error404PostNotFound`) — não um schema anônimo
repetido por rota. O nome, o schema e a descrição desses componentes moram em
`scripts/openapi/errors.ts`, para o `emit.ts` não crescer com eles (`DECISIONS.md` #256). Se o
kernel registra esses componentes em runtime (Fastify, `addSchema`), eles moram em
`app/core/openapi/`, que o gerador também importa; `app/` nunca importa de `scripts/` (#264).

#### seguranca-e-papeis
código: `scripts/openapi/emit.ts`

**O que é:** a leitura da cadeia `onRequest` de cada rota.
**Para que serve:** `security`, 401, 403 e qual barreira barrou, sem declarar.
**Quando usar:** ao mover uma rota de grupo, ou ao trocar um middleware por outro.

O esquema de segurança é `apiKey` em cookie, com o nome lido da constante de `config/session-token.ts`
(já com o prefixo `__Host-` ou `__Secure-`, `DECISIONS.md` #320, #357), não `bearer`: o middleware lê o cookie e
não tem fallback para o header `Authorization`. Documentar bearer faria o "Test Request" do Scalar
falhar sempre. `apiKey`/`in: cookie` é tipo real da spec OpenAPI 3
(swagger.io/docs/specification/authentication/api-keys/ — `securitySchemes` aceita
`type: apiKey` com `in: header | query | cookie`); não há `_doc-lib` de OpenAPI/Swagger nesta
casa, então a citação é direta à spec, não a um doc-lib.

**Auth opcional sai como `security: [{ cookieAuth: [] }, {}]`.** Não é detalhe: são rotas que se
comportam diferente com e sem cookie, e omitir o bloco faria o Scalar nunca mandá-lo.

---

## Escrito à mão

#### registro-de-resposta
código: `app/core/openapi/response.ts`

**O que é:** o registro de qual schema de resposta responde por cada ação da API.
**Para que serve:** ligar a rota ao schema `…Response` de `shared/src/responses/` (`architecture.md`
§10, `DECISIONS.md` #113, C7). O registro **aponta**; o schema não mora aqui, e `core/` não importa
`models/`.
**Quando usar:** uma vez por ação que devolve corpo.

```ts
import {
  AdministratorUserPaginateResponse,
  AdministratorUserShowResponse,
} from '@<projeto>/shared'

import type { FeatureResponse } from '#core/openapi/types'

export const RESPONSES: Record<string, FeatureResponse> = {
  'administrator/users': AdministratorUserShowResponse,
  'administrator/users/paginate': AdministratorUserPaginateResponse,
}
```

O tipo vem anotado, não por `satisfies`: o gerador busca a chave por uma string montada em runtime, e
o `satisfies` deixaria o tipo literal do objeto, sem assinatura de índice. O esqueleto do kit
(`_templates/code/backend/app/core/openapi/response.ts`) traz as entradas de `storages/files`; o
projeto acrescenta as dele e o sync não sobrescreve o arquivo.

A chave é o caminho da ação sob `app/features/` e a busca **sobe**:
`administrator/users/update` tenta a chave inteira, depois `administrator/users`. Uma entrada cobre
as ações do recurso que devolvem a mesma forma; a que foge da forma ganha a própria chave, sem caso
especial no gerador. O mesmo schema tipa o `Either` do use-case e o `queryOptions` do frontend. A
conferência de que registro e use-case apontam o mesmo schema ainda não existe em nenhum projeto, e
não se promete até existir (`DECISIONS.md` #357).

#### prosa-no-controller
código: `app/core/openapi/types.ts`

**O que é:** o bloco opcional `docs`, com o helper `OpenApiDocs.defineDocs` (método estático: função tem casa, `typescript.md` §6).
**Para que serve:** a prosa que explica a regra de negócio, e a correção de uma derivação errada.
**Quando usar:** só quando houver o que dizer. **Rota sem `docs` sai documentada do mesmo jeito.**

```ts
// Fastify: export no módulo do controller
export const docs = OpenApiDocs.defineDocs({
  handle: {
    description: 'Cria uma nova conta de usuário com nome, email e grupo.',
  },
});

// Adonis: propriedade estática do controller
static docs = OpenApiDocs.defineDocs({ handle: { description: 'Cria uma nova conta de usuário com nome, email e grupo.' } })
```

A prosa é em pt-BR (`DECISIONS.md` #357).

É chaveado pelo nome do método porque o adaptador permite mais de uma rota por classe; com uma
pasta por ação (`architecture.md` §3), a chave é quase sempre `handle`.

`summary` só quando a ação não está na tabela de resumos derivados (`create`, `show`, `paginate`,
`update`, `delete`, `bulk-*`…); fora dela a rota cai no fallback `"MÉTODO /caminho"`, e é aí que vale
escrever um. `errors` é o escape para a falha que o gerador não alcança, e `body` para o payload que
o controller não declara — tipicamente rota multipart, cujo corpo o handler consome por
`request.file()`.

Se você está declarando `body` ou `responses` aqui, provavelmente o gerador deveria ter derivado e
vale investigar por quê.

#### tags
código: `config/openapi.ts`

**O que é:** os prefixos de rota, cada um com rótulo, descrição, singular e plural.
**Para que serve:** agrupar a barra lateral do Scalar e derivar os resumos.
**Quando usar:** quando um prefixo de rota novo aparece — sem a entrada ele cai em "Sem grupo".

Os substantivos viram os resumos: `create` → "Criar usuário", `paginate` → "Listar usuários".

---

## Lacunas do VineJS *(só o request do backend Adonis)*

O schema de resposta é Zod e não passa por aqui (#schema-de-resposta). Esta camada só vale para o
validator de request do Adonis, que continua VineJS (`architecture.md` §9).

#### correcoes-de-schema
código: `app/core/openapi/vine-schema.ts`

**O que é:** a travessia que conserta o que `toJSONSchema()` do VineJS perde.
**Para que serve:** impedir que um campo entre no documento sem contrato.
**Quando usar:** ao ver um aviso de campo sem tipo, ou ao aparecer um tipo VineJS novo no projeto.
**As lacunas são silenciosas** — o schema sai válido e errado, então nada denuncia sozinho além
desta camada.

| Escrito | O que `toJSONSchema()` devolve |
| --- | --- |
| `vine.date()` | `{}` — "qualquer coisa" |
| `vine.date().nullable()` | `{"type":"null"}` — "só pode ser nulo" |
| `vine.boolean()` | `enum` com as nove representações que ele aceita |
| `vine.string().regex(a).regex(b)` | um `pattern` só, o último |

A correção é possível porque o VineJS expõe **duas** saídas: `toJSONSchema()` produz o schema
publicável, e `toJSON()` abre a árvore interna, com a mesma forma — objeto tem `properties`, array
tem `each` — e nela o `subtype` do campo sobrevive. Percorrer as duas em paralelo devolve o tipo.

O booleano é o caso que mais engana: o tipo é `boolean`, e a tolerância a formulário HTML (`"on"`,
`"1"`, `"true"`…) vira **descrição**, não união de nove literais no cliente tipado.

Campo que continuar sem tipo vira aviso nomeando rota e caminho, e nunca sai silencioso.

#### correcoes-por-campo
código: `app/core/openapi/field-patches.ts`

**O que é:** correções aplicadas por **nome de campo**, em qualquer payload onde o campo apareça.
**Para que serve:** consertar de uma vez o que um helper compartilhado de validação quebra.
**Quando usar:** quando a divergência é do helper, e não da operação. **Vários validators usam o
mesmo helper de senha; declarar o conserto em cada controller era garantir que o próximo nascesse
errado.**

O caso clássico: os `.regex()` encadeados viram um `pattern` só na saída do VineJS, e o
`.confirmed()` lê o campo do input cru — então o companheiro `passwordConfirmation` não existe no
schema gerado e precisa ser reintroduzido aqui.

---

## Saída

#### documento-e-referencia
código: `start/kernel.ts`

**O que é:** o registro do `@fastify/swagger` e do `@scalar/fastify-api-reference` no kernel.
**Para que serve:** `/openapi.json` e a referência navegável em `/documentation`, montados a partir
dos mesmos schemas — o documento não é construído duas vezes.
**Quando usar:** ao mudar título, versão, tema ou o esquema de segurança.

```ts
components: {
  securitySchemes: {
    cookieAuth: { type: 'apiKey', in: 'cookie', name: SESSION_COOKIE },   // config/session-token.ts
  },
},
```

As duas rotas são fechadas por uma guarda que casa pelo `request.routeOptions.url`, e não pela URL
crua — casar a URL deixava `/openapi%2Ejson` passar por fora.

Contagem de caminhos e operações não se escreve à mão: sai do `openapi.json` (`backend.md` §8).

`/openapi.json` é uma ação como outra qualquer (`features/documentation/openapi/show/`,
`architecture.md` §3), nunca handler inline no kernel: o use-case devolve o documento que o
`@fastify/swagger` montou em memória, e o Scalar aponta para essa rota. Plugins registrados uma vez
no kernel (`backend-fastify.md` §5).
