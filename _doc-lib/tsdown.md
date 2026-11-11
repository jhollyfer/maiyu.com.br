# tsdown

Bundler de TypeScript sobre Rolldown e Oxc, sucessor do tsup.

Última verificação: 2026-11-08 (fonte: navegação oficial `docs/.vitepress/config/theme.ts` de `rolldown/tsdown`, branch padrão `main`, commit `0ff51f0`; o `https://tsdown.dev/llms.txt` foi bloqueado pela rede da sessão)

> Conferido contra `tsdown@0.23.7` (latest).

**O que é:** um empacotador de TypeScript e JavaScript construído sobre o Rolldown (bundler em
Rust), com transformação pelo Oxc. Lê `package.json` e `tsconfig.json` para inferir padrões (target
pelo `engines.node`, dependências externas, `.d.ts`), aceita `tsdown.config.ts` e tem guia e
comando próprios de migração a partir do tsup.

**Para que serve:** o build do backend Fastify (`tooling.md`, tsconfig do Fastify;
`architecture.md`, árvore do Fastify), no lugar do tsup, cujo README declara o projeto sem
manutenção ativa e aponta o tsdown (`_doc-lib/tsup.md`).

**Como usar:**

```bash
pnpm add -D tsdown
npx tsdown-migrate --dry-run   # a partir de um tsup.config.ts existente
```

Backend Fastify em Node 24, ESM, um arquivo de saída por arquivo de fonte:

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['bin/**/*.ts', 'app/**/*.ts', 'config/**/*.ts', 'start/**/*.ts', '!**/*.spec.ts'],
  outDir: 'build',
  platform: 'node',
  format: 'esm',
  unbundle: true,
  // platform node liga fixedExtension (.mjs); desligado, `type: module` gera .js e o start não muda
  fixedExtension: false,
  sourcemap: true,
  copy: [{ from: 'templates/**/*', to: 'build/templates', flatten: false }],
})
```

O `target` fica de fora de propósito: sai do `engines.node` do `package.json`. O `clean` já é
`true` por padrão.

**Links:** 36.

**Skills:** `maiyu-backend`, `migration`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com tsdown: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Migração a partir do tsup

- **Migre com `npx tsdown-migrate`, com o trabalho commitado antes.** O comando reescreve a configuração e instala dependências; em CI, `--yes --no-install`. [`#guide/migrate-from-tsup`](https://tsdown.dev/guide/migrate-from-tsup)
- **Migre em dois estágios: build na `tsdown@0.22.14` até zerar os avisos de depreciação, e só então suba para a latest.** As versões a partir da 0.23 não aceitam mais os nomes do tsup: falham no typecheck e são ignorados em runtime, calados. [`#guide/migrate-from-tsup`](https://tsdown.dev/guide/migrate-from-tsup)
- **Renomeie as opções do tsup: `bundle: false` vira `unbundle: true`, `esbuildPlugins` vira `plugins` (Rolldown), `entryPoints` vira `entry`, `outExtension` vira `outExtensions`, `publicDir` vira `copy`, `skipNodeModulesBundle` vira `deps: { neverBundle: true }`.** O nome antigo não funciona na latest. [`#guide/migrate-from-tsup`](https://tsdown.dev/guide/migrate-from-tsup)
- **Troque `external` e `noExternal` por `deps.neverBundle` e `deps.alwaysBundle`.** Os antigos ainda rodam com aviso e serão removidos. [`#guide/migrate-from-tsup`](https://tsdown.dev/guide/migrate-from-tsup)
- **Plugin de esbuild não migra: use plugin de Rolldown, ou o de unplugin pelo caminho `/rolldown`.** O tsdown não executa plugin de esbuild. [`#guide/migrate-from-tsup`](https://tsdown.dev/guide/migrate-from-tsup)
- **Não conte com `splitting: false`, `metafile`, `swc` nem `legacyOutput`.** Não existem no tsdown; o code splitting é sempre ligado e a análise de bundle é `devtools: true`. [`#guide/migrate-from-tsup`](https://tsdown.dev/guide/migrate-from-tsup)

### Saída para Node 24 ESM

- **Rode o build em Node `^22.18.0 || ^24.11.0 || >=26.0.0`.** É o requisito do tsdown em tempo de build; versão ímpar não é suportada. [`#guide/getting-started`](https://tsdown.dev/guide/getting-started)
- **Deixe o target sair do `engines.node`; declare `target` só para sobrescrever.** O padrão lê o `engines.node` do `package.json`; sem ele, nada é rebaixado. [`#options/target`](https://tsdown.dev/options/target)
- **Decorator de DI é o legado: `experimentalDecorators: true` no `tsconfig.json`.** O tsdown (Rolldown e Oxc) não suporta os decorators Stage 3. [`#options/target`](https://tsdown.dev/options/target)
- **Saída ESM é o padrão; não declare CJS no backend.** O formato padrão é `esm`, e o CJS está em modo só manutenção. [`#options/output-format`](https://tsdown.dev/options/output-format)
- **Com `platform: 'node'` a extensão é fixa (`.mjs`); com `type: module` e saída `.js`, desligue `fixedExtension`.** O `platform` node, que é o padrão, liga o `fixedExtension`; desligado, `type: module` usa `.js`. [`#guide/how-it-works`](https://tsdown.dev/guide/how-it-works)
- **Para espelhar a árvore do fonte no build, `unbundle: true`.** Cada arquivo alcançável das entradas sai compilado no mesmo caminho relativo; a raiz é o diretório comum das entradas, ou `root`. [`#options/unbundle`](https://tsdown.dev/options/unbundle)
- **O `outDir` é limpo antes de cada build; o que precisa sobreviver não mora nele.** `clean` é `true` por padrão (no tsup era `false`). [`#options/cleaning`](https://tsdown.dev/options/cleaning)
- **Source map é opt-in: `sourcemap: true` gera o `.map` ao lado.** O padrão é `false`. [`#options/sourcemap`](https://tsdown.dev/options/sourcemap)
- **`__dirname` e `__filename` em ESM só com `shims: true`; `require` em ESM no Node já tem shim automático.** Sem `shims`, as duas variáveis não existem na saída ESM. [`#options/shims`](https://tsdown.dev/options/shims)

### Dependências e arquivos estáticos

- **Dependência de runtime fica em `dependencies`; devDependency importada pelo código entra no bundle.** `dependencies`, `peerDependencies` e `optionalDependencies` são externas; devDependency e dependência fantasma usadas são embutidas. [`#options/dependencies`](https://tsdown.dev/options/dependencies)
- **Para travar o que pode ser embutido, `deps.onlyBundle`.** Dependência fora da lista que acabe no bundle derruba o build. [`#options/dependencies`](https://tsdown.dev/options/dependencies)
- **Arquivo estático (template, manifest, `package.json`) vai para o build por `copy`, não por script.** A cópia roda depois da saída do bundle; `flatten: false` preserva a estrutura, e os caminhos são relativos à raiz do projeto. [`#options/copy`](https://tsdown.dev/options/copy)
- **Pós-build que não é cópia vai para o hook `build:done`.** É o gancho oficial depois de cada build. [`#advanced/hooks`](https://tsdown.dev/advanced/hooks)

---

## Guia

#### guide/index
[doc](https://tsdown.dev/guide/) | [markdown](https://tsdown.dev/guide.md)

**O que é:** a apresentação: tsdown sobre Rolldown, o que acrescenta ao Rolldown, ecossistema de
plugins e o que empacota.
**Para que serve:** entender a relação entre tsdown, Rolldown e Oxc.
**Quando usar:** antes da primeira adoção.

#### guide/getting-started
[doc](https://tsdown.dev/guide/getting-started) | [markdown](https://tsdown.dev/guide/getting-started.md)

**O que é:** instalação, requisito de Node para o build, primeiro bundle pela CLI, script no
`package.json` e arquivo de configuração.
**Para que serve:** subir o build mínimo e conferir a versão de Node do CI.
**Quando usar:** ao instalar.

#### guide/how-it-works
[doc](https://tsdown.dev/guide/how-it-works) | [markdown](https://tsdown.dev/guide/how-it-works.md)

**O que é:** a tabela de padrões inferidos de `package.json` e `tsconfig.json` (dependências,
`.d.ts`, target, extensão `.js` ou `.mjs`, entrada padrão) e a opção que ajusta cada um.
**Para que serve:** saber o que o tsdown faz sem configuração antes de escrever opção.
**Quando usar:** ao estranhar a extensão, a dependência embutida ou o target da saída.

#### guide/migrate-from-tsup
[doc](https://tsdown.dev/guide/migrate-from-tsup) | [markdown](https://tsdown.dev/guide/migrate-from-tsup.md)

**O que é:** o comando `tsdown-migrate`, a migração em dois estágios (0.22.14 e depois a latest),
os padrões que mudam (`format`, `clean`, `dts`, `target`), as opções renomeadas, as depreciadas, as
sem suporte e os plugins.
**Para que serve:** levar o `tsup.config.ts` do backend Fastify para `tsdown.config.ts` sem perder
opção calada.
**Quando usar:** em toda migração de tsup; é a entrada principal deste arquivo.

#### guide/faq
[doc](https://tsdown.dev/guide/faq) | [markdown](https://tsdown.dev/guide/faq.md)

**O que é:** por que não há stub mode, diferença para o tsup, monorepo, dependência embutida sem
querer e geração de `.d.ts`.
**Para que serve:** responder a dúvida comum antes de abrir issue.
**Quando usar:** quando o comportamento surpreende.

#### guide/skills
[doc](https://tsdown.dev/guide/skills) | [markdown](https://tsdown.dev/guide/skills.md)

**O que é:** as skills oficiais para agentes, inclusive a de migração (`tsdown-migrate`).
**Para que serve:** saber o que existe; a régua decide skill pelo `SKILLS-MAP.md`.
**Quando usar:** só ao avaliar skill nova para o upstream.

## Opções

#### options/entry
[doc](https://tsdown.dev/options/entry) | [markdown](https://tsdown.dev/options/entry.md)

**O que é:** entrada como string, array, objeto com alias e glob, com negação (`!`).
**Para que serve:** listar as pastas do backend como entradas e excluir spec e helper de teste.
**Quando usar:** ao montar ou mudar o `entry`.

#### options/config-file
[doc](https://tsdown.dev/options/config-file) | [markdown](https://tsdown.dev/options/config-file.md)

**O que é:** nomes aceitos (`tsdown.config.ts` e variantes), campo `tsdown` no `package.json`,
array de configurações, `--config`, `--no-config` e os loaders (`native` exige Node 22.18+).
**Para que serve:** escolher onde a configuração mora e como é carregada.
**Quando usar:** ao criar o arquivo de configuração.

#### options/dts
[doc](https://tsdown.dev/options/dts) | [markdown](https://tsdown.dev/options/dts.md)

**O que é:** geração e empacotamento de `.d.ts`, ligada sozinha quando o `package.json` tem `types`.
**Para que serve:** pacote publicado; backend que não publica tipos não liga.
**Quando usar:** ao estranhar `.d.ts` no build ou ao publicar pacote.

#### options/output-format
[doc](https://tsdown.dev/options/output-format) | [markdown](https://tsdown.dev/options/output-format.md)

**O que é:** `esm` (padrão), `cjs`, `iife` e `umd`, e configuração por formato.
**Para que serve:** confirmar a saída ESM do backend.
**Quando usar:** ao declarar `format`.

#### options/output-directory
[doc](https://tsdown.dev/options/output-directory) | [markdown](https://tsdown.dev/options/output-directory.md)

**O que é:** `outDir`, `dist` por padrão.
**Para que serve:** manter o `build/` que o `start` e o Dockerfile esperam.
**Quando usar:** ao migrar de um build que não sai em `dist/`.

#### options/cleaning
[doc](https://tsdown.dev/options/cleaning) | [markdown](https://tsdown.dev/options/cleaning.md)

**O que é:** limpeza do `outDir` antes de cada build, ligada por padrão; `--no-clean` desliga.
**Para que serve:** evitar arquivo velho no build.
**Quando usar:** quando algo dentro do `outDir` precisa sobreviver ao build.

#### options/copy
[doc](https://tsdown.dev/options/copy) | [markdown](https://tsdown.dev/options/copy.md)

**O que é:** cópia de arquivos estáticos para a saída, com glob, negação, `to`, `flatten`,
`rename` e forma dinâmica.
**Para que serve:** substituir o `onSuccess` que copiava template, manifest e `package.json`.
**Quando usar:** quando o build precisa de arquivo que não é código.

#### options/dependencies
[doc](https://tsdown.dev/options/dependencies) | [markdown](https://tsdown.dev/options/dependencies.md)

**O que é:** o que é externo e o que é embutido por padrão, e o namespace `deps`
(`neverBundle`, `alwaysBundle`, `onlyBundle`, `onlyImport`, `resolveDepSubpath`).
**Para que serve:** garantir que dependência de produção fica externa e nada de dev entra no build.
**Quando usar:** ao ver pacote de `node_modules` embutido ou ao migrar `external`.

#### options/watch-mode
[doc](https://tsdown.dev/options/watch-mode) | [markdown](https://tsdown.dev/options/watch-mode.md)

**O que é:** `--watch` e caminhos observados.
**Para que serve:** rebuild em desenvolvimento.
**Quando usar:** só se o dev do backend rodar sobre o build e não sobre o fonte.

#### options/target
[doc](https://tsdown.dev/options/target) | [markdown](https://tsdown.dev/options/target.md)

**O que é:** rebaixamento de sintaxe pelo Oxc, target lido do `engines.node`, `target: false`,
lista de alvos e suporte a decorators (só o legado).
**Para que serve:** saída para Node 24 sem rebaixamento inútil, e decorators da DI funcionando.
**Quando usar:** ao declarar `target` ou ao usar decorator.

#### options/platform
[doc](https://tsdown.dev/options/platform) | [markdown](https://tsdown.dev/options/platform.md)

**O que é:** `node` (padrão), `browser` e `neutral`, e os `mainFields` de cada um.
**Para que serve:** confirmar `node` para o backend.
**Quando usar:** ao declarar `platform` ou ao ver erro de resolução de pacote.

#### options/tree-shaking
[doc](https://tsdown.dev/options/tree-shaking) | [markdown](https://tsdown.dev/options/tree-shaking.md)

**O que é:** eliminação de código morto, ligada por padrão.
**Para que serve:** saber que existe e como desligar.
**Quando usar:** quando código com efeito colateral some do build.

#### options/sourcemap
[doc](https://tsdown.dev/options/sourcemap) | [markdown](https://tsdown.dev/options/sourcemap.md)

**O que é:** `false` (padrão), `true`, `'inline'` e `'hidden'`.
**Para que serve:** stack trace apontando para o fonte em produção.
**Quando usar:** ao decidir o source map do backend.

#### options/minification
[doc](https://tsdown.dev/options/minification) | [markdown](https://tsdown.dev/options/minification.md)

**O que é:** `--minify`.
**Para que serve:** reduzir saída; no backend raramente compensa.
**Quando usar:** só com motivo medido.

#### options/log-level
[doc](https://tsdown.dev/options/log-level) | [markdown](https://tsdown.dev/options/log-level.md)

**O que é:** níveis de log, falhar em aviso e suprimir aviso.
**Para que serve:** fazer o CI reprovar aviso, inclusive o de depreciação na migração.
**Quando usar:** no script de build do CI.

#### options/shims
[doc](https://tsdown.dev/options/shims) | [markdown](https://tsdown.dev/options/shims.md)

**O que é:** `__dirname` e `__filename` em ESM com `shims: true`, shim automático de `require` em
ESM no Node e de `import.meta` em CJS.
**Para que serve:** código que ainda usa variável de CJS rodar em ESM.
**Quando usar:** quando o fonte usa `__dirname`; o preferido é `import.meta.dirname`.

#### options/package-exports
[doc](https://tsdown.dev/options/package-exports) | [markdown](https://tsdown.dev/options/package-exports.md)

**O que é:** geração do campo `exports` do `package.json`.
**Para que serve:** pacote publicado; backend não usa.
**Quando usar:** só ao publicar pacote.

#### options/unbundle
[doc](https://tsdown.dev/options/unbundle) | [markdown](https://tsdown.dev/options/unbundle.md)

**O que é:** modo em que cada arquivo do fonte vira um arquivo na saída, no mesmo caminho.
**Para que serve:** o equivalente do `bundle: false` do tsup no backend.
**Quando usar:** quando o build precisa espelhar a árvore do fonte.

#### options/root
[doc](https://tsdown.dev/options/root) | [markdown](https://tsdown.dev/options/root.md)

**O que é:** a raiz das entradas, como o `rootDir` do TypeScript; padrão é o diretório comum.
**Para que serve:** manter `build/bin/server.js` quando as entradas vêm de várias pastas.
**Quando usar:** com `unbundle` e entradas em mais de uma pasta da raiz.

#### options/cjs-default
[doc](https://tsdown.dev/options/cjs-default) | [markdown](https://tsdown.dev/options/cjs-default.md)

**O que é:** transformação do export default único em `module.exports` na saída CJS.
**Para que serve:** pacote CJS; o backend ESM não usa.
**Quando usar:** só com saída CJS.

#### options/css
[doc](https://tsdown.dev/options/css) | [markdown](https://tsdown.dev/options/css.md)

**O que é:** pipeline de CSS experimental.
**Para que serve:** pacote de componente; fora do backend.
**Quando usar:** não se aplica à stack hoje.

#### options/exe
[doc](https://tsdown.dev/options/exe) | [markdown](https://tsdown.dev/options/exe.md)

**O que é:** executável único do Node (SEA), experimental.
**Para que serve:** CLI distribuída como binário.
**Quando usar:** não se aplica à stack hoje.

#### options/lint
[doc](https://tsdown.dev/options/lint) | [markdown](https://tsdown.dev/options/lint.md)

**O que é:** validação do pacote com publint e attw.
**Para que serve:** pacote publicado.
**Quando usar:** só ao publicar pacote.

## Avançado

#### advanced/plugins
[doc](https://tsdown.dev/advanced/plugins) | [markdown](https://tsdown.dev/advanced/plugins.md)

**O que é:** plugins de Rolldown, unplugin, Rollup e Vite, e os ganchos próprios do tsdown.
**Para que serve:** substituir plugin de esbuild do build antigo.
**Quando usar:** quando o build precisa de transformação que o tsdown não faz.

#### advanced/hooks
[doc](https://tsdown.dev/advanced/hooks) | [markdown](https://tsdown.dev/advanced/hooks.md)

**O que é:** `build:prepare`, `build:before` e `build:done`.
**Para que serve:** passo antes ou depois do build que não é cópia.
**Quando usar:** ao migrar `onSuccess` que faz mais que copiar.

#### advanced/rolldown-options
[doc](https://tsdown.dev/advanced/rolldown-options) | [markdown](https://tsdown.dev/advanced/rolldown-options.md)

**O que é:** `inputOptions` e `outputOptions` repassadas ao Rolldown.
**Para que serve:** ajuste que o tsdown não expõe (nome de arquivo, resolução, banner do chunk).
**Quando usar:** só quando nenhuma opção do tsdown resolve.

#### advanced/programmatic-usage
[doc](https://tsdown.dev/advanced/programmatic-usage) | [markdown](https://tsdown.dev/advanced/programmatic-usage.md)

**O que é:** `build()` chamado de código, com saída em memória (`write: false`).
**Para que serve:** script de build próprio ou teste do build.
**Quando usar:** raramente; a CLI cobre o backend.

#### advanced/ci
[doc](https://tsdown.dev/advanced/ci) | [markdown](https://tsdown.dev/advanced/ci.md)

**O que é:** detecção de CI pela variável `CI` e opções que mudam conforme o ambiente.
**Para que serve:** ligar validação ou falha em aviso só no CI.
**Quando usar:** ao configurar o build no pipeline.

#### advanced/benchmark
[doc](https://tsdown.dev/advanced/benchmark) | [markdown](https://tsdown.dev/advanced/benchmark.md)

**O que é:** comparação de desempenho (cerca de 2 vezes o tsup no build comum, até 8 na geração de
`.d.ts`).
**Para que serve:** dado para a decisão de migrar.
**Quando usar:** ao justificar a migração.

## Referência

#### reference/cli
[doc](https://tsdown.dev/reference/cli) | [markdown](https://tsdown.dev/reference/cli.md)

**O que é:** todas as flags da CLI (`--config`, `--tsconfig`, `--format`, `--target`,
`--platform`, `--sourcemap`, `--shims`, `--out-dir`, `--root`, `--deps.never-bundle` e as demais).
**Para que serve:** script de build no `package.json` sem arquivo de configuração, ou sobrescrita
pontual.
**Quando usar:** ao escrever ou revisar o script `build`.
