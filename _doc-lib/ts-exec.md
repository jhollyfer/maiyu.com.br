# @poppinss/ts-exec

Loader JIT de TypeScript para Node.js, sobre SWC, que o AdonisJS 7 usa em desenvolvimento.

Última verificação: 2026-11-08 (fonte: README de poppinss/ts-exec, branch `1.x`, e a página `dev-environment` da doc do AdonisJS)

> Conferido contra `@poppinss/ts-exec@1.5.2` (latest).

**O que é:** um hook de módulo que compila `.ts` e `.tsx` na hora do import, sem passo de build. Cobre
o TypeScript inteiro (enum, decorator legado, `namespace`, JSX), lê o `tsconfig.json` sozinho e
segue a resolução de módulos do Node à risca: import sem extensão ou de diretório falha em
desenvolvimento do mesmo jeito que falharia depois de compilado. Exige Node 24 ou mais
(`engines.node >= 24.0.0`).

**Para que serve:** é o que roda o `ace`, o dev server e os testes do Adonis antes do build
(`ace.js` faz `import '@poppinss/ts-exec'`), e o que a casa usa para rodar script TypeScript solto
em `scripts/` (`pattern:check`, `authz:check`, importação de conteúdo). Em produção não entra: o
`node ace build` compila com `tsc` e o processo final é `node bin/server.js`.

**Como usar:**

```bash
pnpm add -D @poppinss/ts-exec
```

```jsonc
// package.json: script TypeScript fora do ace
{
  "scripts": {
    "pattern:check": "node --import @poppinss/ts-exec scripts/pattern-check.ts"
  },
  // alias de subpath aponta para .js: o package.json não é reescrito pelo tsc
  "imports": {
    "#core/*": "./app/core/*.js"
  }
}
```

```ts
// import relativo com a extensão do arquivo; o tsconfig do Adonis liga
// rewriteRelativeImportExtensions, e o tsc troca .ts por .js no build
import { ShowUseCase } from './show.use-case.ts'
```

**Links:** 6.

**Skills:** `maiyu-backend`, `maiyu-node`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com `@poppinss/ts-exec`: projeto segue, e regra de `_standards/`
que contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Papel no AdonisJS

- **TypeScript do Adonis em desenvolvimento roda pelo `@poppinss/ts-exec`, não pelo loader nativo do Node.** O nativo não suporta decorator experimental (injeção de dependência, decorators do Lucid) nem JSX, e o ts-exec é a camada de compatibilidade. [`#dev-environment`](https://docs.adonisjs.com/dev-environment.md)
- **Produção roda o JavaScript do `node ace build`, nunca o ts-exec.** O build de produção compila com `tsc` para `build/`, e só essa pasta é entregue. [`#dev-environment`](https://docs.adonisjs.com/dev-environment.md)
- **Não troque o ts-exec por `tsx`.** O `tsx` não suporta decorator legado e aceita import que quebra depois de compilado. [`#README/-why-not-tsx`](https://github.com/poppinss/ts-exec/blob/1.x/README.md#-why-not-tsx)

### Script e import

- **Script TypeScript solto roda com `node --import=@poppinss/ts-exec <arquivo>.ts`.** É o uso documentado para executar um arquivo direto, sem build. [`#README/-usage`](https://github.com/poppinss/ts-exec/blob/1.x/README.md#-usage)
- **Import relativo leva a extensão do arquivo (`./x.ts` com `rewriteRelativeImportExtensions`, ou `./x.js`); nunca sem extensão nem de diretório.** O ts-exec segue a resolução do Node, e o que roda nele roda igual depois de compilado. [`#README/-imports-with-ts-file-extension`](https://github.com/poppinss/ts-exec/blob/1.x/README.md#-imports-with-ts-file-extension)
- **Alias de `imports` no `package.json` aponta para `.js`.** O `package.json` não passa pelo compilador e vale igual em desenvolvimento e depois do build; o `rewriteRelativeImportExtensions` não toca alias. [`#README/subpath-import-aliases`](https://github.com/poppinss/ts-exec/blob/1.x/README.md#subpath-import-aliases)
- **Arquivo `.ts` carregado por `require` (`createRequire`) exige `rewriteRelativeImportExtensions`, e `.tsx` carregado assim não usa `module.exports`.** As mesmas regras de resolução valem para o `require`, e `.jsx`/`.tsx` sempre compilam como ES module. [`#README/files-loaded-using-require`](https://github.com/poppinss/ts-exec/blob/1.x/README.md#files-loaded-using-require)

---

## README

#### README/-usage
[doc](https://github.com/poppinss/ts-exec/blob/1.x/README.md#-usage) | [markdown](https://raw.githubusercontent.com/poppinss/ts-exec/1.x/README.md)

**O que é:** a instalação como dependência de desenvolvimento, a execução por
`node --import=@poppinss/ts-exec ./src/index.ts` e o uso programático (`import '@poppinss/ts-exec'`
antes de `await import('./x.ts')`).
**Para que serve:** rodar script TypeScript sem build e entender o que o `ace.js` faz.
**Quando usar:** ao criar um script em `scripts/` e ao ligar o comando no `package.json`.

#### README/-imports-with-ts-file-extension
[doc](https://github.com/poppinss/ts-exec/blob/1.x/README.md#-imports-with-ts-file-extension) | [markdown](https://raw.githubusercontent.com/poppinss/ts-exec/1.x/README.md)

**O que é:** por que o import relativo carrega extensão, e como o `rewriteRelativeImportExtensions`
deixa escrever `.ts` e o `tsc` reescreve para `.js`.
**Para que serve:** escolher a extensão do import sem quebrar o build.
**Quando usar:** ao escrever import relativo e ao revisar `tsconfig.json`.

#### README/subpath-import-aliases
[doc](https://github.com/poppinss/ts-exec/blob/1.x/README.md#subpath-import-aliases) | [markdown](https://raw.githubusercontent.com/poppinss/ts-exec/1.x/README.md)

**O que é:** alias `#x/*` do campo `imports` do `package.json`, sempre com `.js`, e o fato de o
`rewriteRelativeImportExtensions` não alcançar alias.
**Para que serve:** manter `#core/*`, `#features/*` e afins resolvendo igual antes e depois do build.
**Quando usar:** ao criar ou mudar um alias no `package.json`.

#### README/files-loaded-using-require
[doc](https://github.com/poppinss/ts-exec/blob/1.x/README.md#files-loaded-using-require) | [markdown](https://raw.githubusercontent.com/poppinss/ts-exec/1.x/README.md)

**O que é:** o ts-exec também compila `.ts` carregado por `require`, com a mesma resolução e a
exigência de `rewriteRelativeImportExtensions`; `.jsx` e `.tsx` são sempre ES module.
**Para que serve:** usar `createRequire` em TypeScript sem perder enum e decorator.
**Quando usar:** só quando um módulo precisa ser carregado por `require`.

#### README/-why-not-tsx
[doc](https://github.com/poppinss/ts-exec/blob/1.x/README.md#-why-not-tsx) | [markdown](https://raw.githubusercontent.com/poppinss/ts-exec/1.x/README.md)

**O que é:** o caso do import sem extensão e de diretório que o `tsx` aceita e o build quebra, a
falta de decorator legado no `tsx` e a tabela que compara ts-exec, `tsx`, `ts-node` e o Node nativo.
**Para que serve:** responder por que o projeto não usa `tsx` nem `ts-node`.
**Quando usar:** quando alguém propõe trocar o loader.

## Na doc do AdonisJS

#### dev-environment
[doc](https://docs.adonisjs.com/dev-environment#development-mode-jit-compilation) | [markdown](https://docs.adonisjs.com/dev-environment.md)

**O que é:** "Development mode (JIT compilation)" e "Production mode (ahead-of-time compilation)":
o Adonis usa o `@poppinss/ts-exec` em desenvolvimento porque o loader nativo do Node não tem
decorator experimental nem JSX, e compila com `tsc` (`node ace build`) para produção.
**Para que serve:** saber onde o ts-exec entra e onde ele não entra no ciclo do Adonis.
**Quando usar:** ao montar o `Dockerfile-production`, ao discutir o loader nativo do Node e ao
mexer no `tsconfig.json` (a mesma página lista as opções obrigatórias, `_doc-lib/adonisjs.md#dev-environment`).
