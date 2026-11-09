# React Compiler

Memoização automática em tempo de build: o compilador analisa componentes e hooks e insere o cache
que antes se escrevia à mão com `useMemo`, `useCallback` e `memo`.

Última verificação: 2026-11-08 (fonte: https://react.dev/llms.txt, seção "React Compiler" e as
páginas `reference/react-compiler`)

> Conferido contra `babel-plugin-react-compiler@1.0.0` (latest), com `@rolldown/plugin-babel@0.3.0`
> e `@vitejs/plugin-react@6.2.1`.

**O que é:** um plugin de Babel (`babel-plugin-react-compiler`) que entende as Regras do React e
reescreve cada componente e hook com cache por valor (`react/compiler-runtime`). Estável, com React
19 como alvo padrão (17 e 18 por `target`). O que ele não consegue compilar com segurança é pulado,
não quebra o build.

**Para que serve:** desempenho de atualização sem memo manual (`frontend.md` §9.1): o filho não
re-renderiza quando o pai muda e nada do que ele recebe mudou, e o cálculo caro não se repete a cada
render.

**Como usar:** no Vite 8 com `@vitejs/plugin-react` 6, a Babel não fica mais dentro do plugin do
React; ela entra por `@rolldown/plugin-babel`, com o preset que o próprio plugin do React exporta:

```bash
pnpm add -D babel-plugin-react-compiler @rolldown/plugin-babel @babel/core
```

```ts
// vite.config.ts
import babel from '@rolldown/plugin-babel'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // ...tanstackStart(), nitro(), tailwindcss()
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
```

As regras de lint do compilador vêm no `eslint-plugin-react-hooks` (`_doc-lib/eslint.md`,
`tooling.md` §4).

**Links:** 17.

**Skills:** `maiyu-frontend`, `react-render-optimization`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). Versão nova: `deprecation-and-migration`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com React Compiler: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Montagem

- **Instale `babel-plugin-react-compiler` como dependência de desenvolvimento, na última versão.** A página de instalação manda `-D` e `@latest`. [`#learn/react-compiler/installation`](https://react.dev/learn/react-compiler/installation)
- **No Vite com `@vitejs/plugin-react` 6 ou mais novo, ligue o compilador por `@rolldown/plugin-babel` com `reactCompilerPreset()`, não pela opção `babel` do plugin do React.** A opção de Babel embutida saiu na 6.0.0. [`#learn/react-compiler/installation`](https://react.dev/learn/react-compiler/installation)
- **O compilador roda primeiro na cadeia de Babel.** Ele precisa do código original para analisar; outra transformação antes dele estraga a análise. [`#learn/react-compiler/installation`](https://react.dev/learn/react-compiler/installation)
- **As opções da Babel vão no próprio `babel({ ... })`; `babel.config.js` e `.babelrc` não são lidos.** O plugin não carrega arquivo de configuração da Babel. [`#rolldown/plugins/packages/babel`](https://github.com/rolldown/plugins/blob/main/packages/babel/README.md)
- **Com React 19, não defina `target`.** O padrão é `'19'`, sem runtime extra; `'17'` e `'18'` existem só para versões antigas e pedem `react-compiler-runtime`. [`#reference/react-compiler/target`](https://react.dev/reference/react-compiler/target)
- **Mantenha a configuração padrão; opção avançada só com necessidade concreta.** A página de configuração diz que o padrão serve para a maioria das aplicações. [`#reference/react-compiler/configuration`](https://react.dev/reference/react-compiler/configuration)
- **`compilationMode` fica em `'infer'`; `'all'` não.** `'all'` compila toda função de topo, inclusive o que não é React. [`#reference/react-compiler/compilationMode`](https://react.dev/reference/react-compiler/compilationMode)
- **Build de produção usa `panicThreshold: 'none'` (o padrão).** Componente que não compila é pulado e o build segue; limiar mais estrito só temporário, para achar problema. [`#reference/react-compiler/panicThreshold`](https://react.dev/reference/react-compiler/panicThreshold)

### Memo manual

- **Código novo confia no compilador; `useMemo` e `useCallback` só como válvula de escape para controle preciso (ex.: valor usado como dependência de efeito).** É a recomendação da página de introdução para código novo. [`#learn/react-compiler/introduction`](https://react.dev/learn/react-compiler/introduction)
- **Memo manual que já existe fica, ou sai só com teste.** Removê-lo pode mudar a saída da compilação. [`#learn/react-compiler/introduction`](https://react.dev/learn/react-compiler/introduction)
- **Não escreva código que depende de memoização para estar correto (efeito que exige a mesma referência, `===` como cache).** É o caso mais comum de o compilador quebrar a aplicação, porque ele pode memoizar diferente. [`#learn/react-compiler/debugging`](https://react.dev/learn/react-compiler/debugging)

### Diretivas

- **`"use no memo"` é temporário, para isolar um problema, nunca solução permanente.** A página da diretiva a descreve como ferramenta de depuração, de uso raro. [`#reference/react-compiler/directives/use-no-memo`](https://react.dev/reference/react-compiler/directives/use-no-memo)
- **Componente ou hook que o modo `infer` não compila se corrige no nome (PascalCase, prefixo `use`), não com `"use memo"`.** A página manda corrigir a convenção de nome em vez de forçar a compilação. [`#reference/react-compiler/directives/use-memo`](https://react.dev/reference/react-compiler/directives/use-memo)
- **A diretiva é a primeira instrução do corpo da função, com aspas simples ou duplas, grafada exatamente.** Fora disso ela é ignorada sem aviso. [`#reference/react-compiler/directives`](https://react.dev/reference/react-compiler/directives)

### Conferência

- **Confirme que o compilador está ligado pelo selo "Memo ✨" no React DevTools ou pelo `react/compiler-runtime` no build.** É a verificação que a página de instalação manda fazer depois de configurar. [`#learn/react-compiler/installation`](https://react.dev/learn/react-compiler/installation)
- **Diagnóstico do lint não exige correção imediata.** O compilador já pula o componente com violação e segue otimizando o resto. [`#learn/react-compiler/installation`](https://react.dev/learn/react-compiler/installation)

---

## Fundamentos

#### learn/react-compiler
[doc](https://react.dev/learn/react-compiler) | [markdown](https://react.dev/learn/react-compiler.md)

**O que é:** a página de entrada da seção, com o índice das quatro páginas de guia.
**Para que serve:** saber o que existe antes de abrir cada guia.
**Quando usar:** no primeiro contato com o compilador.

#### learn/react-compiler/introduction
[doc](https://react.dev/learn/react-compiler/introduction) | [markdown](https://react.dev/learn/react-compiler/introduction.md)

**O que é:** o que o compilador faz, que casos de memoização ele cobre, o status (estável) e o que
fazer com `useMemo`, `useCallback` e `memo`.
**Para que serve:** decidir quando ainda vale memo manual e o que fazer com o que já existe.
**Quando usar:** antes de escrever ou remover memo manual.

#### learn/react-compiler/installation
[doc](https://react.dev/learn/react-compiler/installation) | [markdown](https://react.dev/learn/react-compiler/installation.md)

**O que é:** instalação, ordem na cadeia de Babel, configuração por ferramenta (Vite com
`@rolldown/plugin-babel` e `reactCompilerPreset`), integração com ESLint e como conferir que está
ligado.
**Para que serve:** ligar o compilador no `vite.config.ts` do jeito que a versão atual do plugin do
React aceita.
**Quando usar:** ao montar o frontend e ao subir o major do `@vitejs/plugin-react`.

#### learn/react-compiler/incremental-adoption
[doc](https://react.dev/learn/react-compiler/incremental-adoption) | [markdown](https://react.dev/learn/react-compiler/incremental-adoption.md)

**O que é:** ligar o compilador por pasta (`overrides` da Babel), por anotação
(`compilationMode: 'annotation'`) ou por feature flag (`gating`).
**Para que serve:** introduzir o compilador num projeto grande sem trocar tudo de uma vez.
**Quando usar:** em projeto existente com muito código fora das Regras do React.

#### learn/react-compiler/debugging
[doc](https://react.dev/learn/react-compiler/debugging) | [markdown](https://react.dev/learn/react-compiler/debugging.md)

**O que é:** a diferença entre erro de compilação e problema de runtime, os padrões que quebram
com o compilador e o roteiro de depuração.
**Para que serve:** isolar se um bug vem do compilador e achar a violação das Regras do React.
**Quando usar:** quando um componente se comporta diferente com o compilador ligado.

## Referência: configuração

#### reference/react-compiler/configuration
[doc](https://react.dev/reference/react-compiler/configuration) | [markdown](https://react.dev/reference/react-compiler/configuration.md)

**O que é:** a lista de opções do compilador e a configuração padrão.
**Para que serve:** saber o que cada opção muda antes de mexer.
**Quando usar:** antes de passar qualquer opção ao `reactCompilerPreset()`.

#### reference/react-compiler/compilationMode
[doc](https://react.dev/reference/react-compiler/compilationMode) | [markdown](https://react.dev/reference/react-compiler/compilationMode.md)

**O que é:** `'infer'` (padrão), `'annotation'`, `'syntax'` e `'all'`.
**Para que serve:** escolher como o compilador decide o que é componente ou hook.
**Quando usar:** na adoção incremental, ou quando um componente não está sendo compilado.

#### reference/react-compiler/gating
[doc](https://react.dev/reference/react-compiler/gating) | [markdown](https://react.dev/reference/react-compiler/gating.md)

**O que é:** compilar as duas versões de cada componente e escolher em runtime por uma função de
feature flag.
**Para que serve:** testar o compilador em produção para parte do tráfego.
**Quando usar:** só em rollout controlado de projeto grande.

#### reference/react-compiler/logger
[doc](https://react.dev/reference/react-compiler/logger) | [markdown](https://react.dev/reference/react-compiler/logger.md)

**O que é:** a função que recebe os eventos da compilação (sucesso, falha, diagnóstico).
**Para que serve:** listar os componentes que o compilador pulou e por quê.
**Quando usar:** ao investigar cobertura do compilador.

#### reference/react-compiler/panicThreshold
[doc](https://react.dev/reference/react-compiler/panicThreshold) | [markdown](https://react.dev/reference/react-compiler/panicThreshold.md)

**O que é:** se erro de compilação falha o build ou só pula o componente.
**Para que serve:** manter o build de produção de pé (`'none'`) e endurecer só na investigação.
**Quando usar:** ao configurar o build e ao caçar componente não compilado.

#### reference/react-compiler/target
[doc](https://react.dev/reference/react-compiler/target) | [markdown](https://react.dev/reference/react-compiler/target.md)

**O que é:** a versão de React para a qual o código é gerado (`'19'` padrão, `'18'`, `'17'`).
**Para que serve:** saber que no React 19 nada precisa ser configurado.
**Quando usar:** só em projeto ou biblioteca abaixo do React 19.

#### reference/react-compiler/compiling-libraries
[doc](https://react.dev/reference/react-compiler/compiling-libraries) | [markdown](https://react.dev/reference/react-compiler/compiling-libraries.md)

**O que é:** publicar biblioteca já compilada, com `react-compiler-runtime` como dependência.
**Para que serve:** pacote interno compartilhado entre apps.
**Quando usar:** só ao publicar componente como pacote.

## Referência: diretivas

#### reference/react-compiler/directives
[doc](https://react.dev/reference/react-compiler/directives) | [markdown](https://react.dev/reference/react-compiler/directives.md)

**O que é:** as diretivas de função e de módulo, onde ficam e por que podem ser ignoradas.
**Para que serve:** usar a diretiva certa no lugar certo.
**Quando usar:** antes de escrever qualquer diretiva do compilador.

#### reference/react-compiler/directives/use-memo
[doc](https://react.dev/reference/react-compiler/directives/use-memo) | [markdown](https://react.dev/reference/react-compiler/directives/use-memo.md)

**O que é:** `"use memo"`, que marca a função para compilar.
**Para que serve:** o modo `annotation`; no `infer` quase nunca é preciso.
**Quando usar:** só com `compilationMode: 'annotation'`.

#### reference/react-compiler/directives/use-no-memo
[doc](https://react.dev/reference/react-compiler/directives/use-no-memo) | [markdown](https://react.dev/reference/react-compiler/directives/use-no-memo.md)

**O que é:** `"use no memo"`, que tira a função da compilação.
**Para que serve:** isolar, de forma temporária, se um defeito vem do compilador.
**Quando usar:** na depuração, com comentário do porquê e prazo de saída.

## Integração com o Vite

#### rolldown/plugins/packages/babel
[doc](https://github.com/rolldown/plugins/blob/main/packages/babel/README.md) | [markdown](https://raw.githubusercontent.com/rolldown/plugins/main/packages/babel/README.md)

**O que é:** o README do `@rolldown/plugin-babel`: instalação com `@babel/core`, opções
(`include`, `exclude`, `presets`, `plugins`, `parallel`) e os presets com filtro por arquivo.
**Para que serve:** entender onde a Babel entra no Vite 8 e como restringir os arquivos que ela
processa.
**Quando usar:** ao ligar o compilador e ao ajustar o filtro do preset.

#### vitejs/vite-plugin-react/packages/plugin-react#react-compiler
[doc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#react-compiler) | [markdown](https://raw.githubusercontent.com/vitejs/vite-plugin-react/main/packages/plugin-react/README.md)

**O que é:** a seção "React Compiler" do README do `@vitejs/plugin-react`: o `reactCompilerPreset`
(com `compilationMode` e `target`, e o filtro `rolldown.filter`) e a opção `compiler`, que usa o
porte em Rust (`oxc-transform-react`), marcada como experimental.
**Para que serve:** saber o que o preset já configura e o que é experimental.
**Quando usar:** ao montar o `vite.config.ts` e ao avaliar trocar a Babel pelo compilador nativo.
