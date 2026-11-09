# swc-node

Executa TypeScript no Node transpilando com SWC na carga do módulo, sem compilar antes nem checar
tipo.

Última verificação: 2026-11-08 (fonte: README de swc-project/swc-node e `packages/register/README.md`, branch `master`)

> Conferido contra `@swc-node/register@1.12.1` (latest).

**O que é:** o `@swc-node/register`, alternativa mais rápida ao `ts-node/register/transpile-only`.
Ele se registra como hook de carga (`-r` no CommonJS, `--import` no ESM), lê o `tsconfig.json`
(com `extends` resolvido) e traduz as opções para a configuração do SWC, inclusive
`experimentalDecorators` e `emitDecoratorMetadata`. Não faz checagem de tipo: isso continua com o
`tsc` do `typecheck`.

**Para que serve:** rodar o backend Fastify em dev, os scripts `.ts` (seed, checks, geração do
OpenAPI) e a transpilação de teste com a mesma emissão de decorator do dev, que o
`fastify-decorators` exige (`backend-fastify.md` §8; _doc-lib/fastify-decorators.md#Testing).
O backend Adonis não usa: o `ace` já tem o próprio carregador.

**Como usar:**

```bash
pnpm add -D @swc-node/register
```

```json
{
  "scripts": {
    "dev": "node --import @swc-node/register/esm-register --enable-source-maps --watch bin/server.ts",
    "openapi:generate": "node --import @swc-node/register/esm-register --enable-source-maps scripts/openapi-generate.ts"
  }
}
```

```bash
# tsconfig próprio para o script ou o teste
SWC_NODE_PROJECT=./tsconfig.test.json node --import @swc-node/register/esm-register scripts/seed.ts
```

**Links:** 4.

**Skills:** `maiyu-backend`, `maiyu-node`, `maiyu-typescript`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com swc-node: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Registro

- **Projeto ESM em Node 24 registra por `--import @swc-node/register/esm-register` com `--enable-source-maps`; `--loader @swc-node/register/esm` não entra.** O `--loader` é o caminho de Node 20.5 ou menor e está marcado como depreciado, e o README manda passar `--enable-source-maps` em projeto ESM. [`#README/usage`](https://github.com/swc-project/swc-node/blob/master/README.md#usage)
- **Checagem de tipo fica com o `tsc`; o register só transpila.** O README o descreve como execução "without compilation or typechecking". [`#README/usage`](https://github.com/swc-project/swc-node/blob/master/README.md#usage)

### tsconfig

- **O tsconfig que o register lê tem `experimentalDecorators` e `emitDecoratorMetadata` ligados quando o código usa decorator com injeção.** O register respeita o valor booleano do tsconfig e não liga nada por conta própria. [`#packages/register/README/read-tsconfigjson`](https://github.com/swc-project/swc-node/blob/master/packages/register/README.md#read-tsconfigjson)
- **tsconfig diferente do padrão se aponta por `SWC_NODE_PROJECT` (ou `TS_NODE_PROJECT`), e o aviso de falha ao ler o tsconfig quer dizer que as opções dele não valeram.** Sem tsconfig legível o register transforma todo arquivo exigido e só imprime um aviso com o motivo. [`#packages/register/README/read-tsconfigjson`](https://github.com/swc-project/swc-node/blob/master/packages/register/README.md#read-tsconfigjson)
- **Alias por import dinâmico fica em `.ts`/`.mts` ou vira import estático.** Arquivo `.js` que o Node já executa passa sem transformação, e o alias de `paths` dentro de `import()` nele não é reescrito. [`#packages/register/README/performance-tuning`](https://github.com/swc-project/swc-node/blob/master/packages/register/README.md#performance-tuning)

---

## Monorepo swc-node

#### README/usage
[doc](https://github.com/swc-project/swc-node/blob/master/README.md#usage) | [markdown](https://raw.githubusercontent.com/swc-project/swc-node/master/README.md)

**O que é:** as formas de registrar: `-r @swc-node/register` (CommonJS), `--import
@swc-node/register/esm-register` (ESM, Node 20.6 ou maior), `--loader @swc-node/register/esm`
(depreciado), `--enable-source-maps`, `SWCRC=true` para ler `.swcrc` e o uso em shebang.
**Para que serve:** escolher o comando certo para o tipo de módulo e a versão do Node.
**Quando usar:** ao escrever os scripts `dev`, de seed e de check do backend Fastify.

## @swc-node/register

#### packages/register/README/usage
[doc](https://github.com/swc-project/swc-node/blob/master/packages/register/README.md#usage) | [markdown](https://raw.githubusercontent.com/swc-project/swc-node/master/packages/register/README.md)

**O que é:** o registro programático (`register()` de `@swc-node/register/register`), a CLI e o uso
com Mocha e AVA.
**Para que serve:** ligar o register num runner que aceita `--require`.
**Quando usar:** quando o runner não é o Vitest (o Vitest usa o plugin SWC dele).

#### packages/register/README/read-tsconfigjson
[doc](https://github.com/swc-project/swc-node/blob/master/packages/register/README.md#read-tsconfigjson) | [markdown](https://raw.githubusercontent.com/swc-project/swc-node/master/packages/register/README.md)

**O que é:** `SWC_NODE_PROJECT`/`TS_NODE_PROJECT` e como cada opção do tsconfig vira opção do SWC:
`extends`, `target` (ES2020 em diante vira `es2020`), `jsx`, `module`, `experimentalDecorators`,
`emitDecoratorMetadata`, `esModuleInterop`, `include`/`exclude`.
**Para que serve:** saber o que o SWC emite a partir do tsconfig e por que um decorator pode perder
a metadata.
**Quando usar:** ao configurar o tsconfig de dev e de teste e ao depurar injeção que não acontece.

#### packages/register/README/performance-tuning
[doc](https://github.com/swc-project/swc-node/blob/master/packages/register/README.md#performance-tuning) | [markdown](https://raw.githubusercontent.com/swc-project/swc-node/master/packages/register/README.md)

**O que é:** o cache de transformação em memória e disco (`SWC_NODE_CACHE`, `SWC_NODE_CACHE_DIR`,
`SWC_NODE_CACHE_MEMORY_LIMIT`, `clearTransformCache()`), o modo de source map
(`SWC_NODE_SOURCE_MAP_MODE`) e a passagem direta de `.js` sem transformar, com os dois limites
conhecidos.
**Para que serve:** acelerar a partida e entender saída velha vinda do cache.
**Quando usar:** quando o dev ou o script demora para subir, ou quando a mudança no fonte não aparece.
