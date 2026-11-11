# Prettier

Formatador de código opinativo: reimprime o arquivo inteiro numa forma só.

Última verificação: 2026-11-08 (fonte: `website/sidebars.json` de prettier/prettier, branch `main`; `https://prettier.io/llms.txt` recusado pela rede da sessão)

> Conferido contra `prettier@3.9.10` (latest).
>
> **Sem `[doc]` nesta versão do arquivo.** A rede desta sessão recusou `prettier.io` (CONNECT 403 no
> proxy), então nenhuma URL do site foi testada, e a régua não escreve link não testado. Cada
> entrada aponta o fonte `.md` no GitHub, lido e testado. Os `[doc]` entram na próxima conferência
> com `prettier.io` liberado, a partir do `llms.txt`.

**O que é:** um formatador que lê o código, monta a árvore sintática e a imprime de novo do zero,
com poucas opções de propósito. Cobre JavaScript, TypeScript, JSX, CSS, JSON, Markdown, YAML,
HTML e outros. Lê a config do arquivo mais próximo do arquivo formatado (`prettier.config.js`,
`.prettierrc`), respeita `.prettierignore` e `.gitignore` do diretório onde roda e converte o
`.editorconfig` em opção.

**Para que serve:** tirar a formatação da revisão e do lint. A régua tem um `prettier.config.js`
por pacote, igual em todo projeto, e o `format:check` (`prettier --check .`) no `check` de cada
pacote e no CI (`tooling.md` §5 e §7); o `.prettierignore` de cada pacote segue
`architecture.md` §3.4.

**Como usar:**

```bash
pnpm add -D --save-exact prettier
```

```js
// prettier.config.js
//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
}

export default config
```

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

**Links:** 20.

**Skills:** `code-pattern` (formatação da casa), `setup-pre-commit` (hook que formata o stage). Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com Prettier: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Instalação e versão

- **Instale o Prettier no projeto com versão exata (`--save-exact`), nunca global.** Até um patch muda a formatação, e cada pessoa reformataria o código da outra. [`#install`](https://raw.githubusercontent.com/prettier/prettier/main/docs/install.md)
- **CI que formata ou confere exige o Prettier fixado no repositório.** A página de CI pede a versão pinned antes do workflow. [`#ci`](https://raw.githubusercontent.com/prettier/prettier/main/docs/ci.md)

### Configuração

- **A config mora no projeto, num arquivo que o Prettier acha subindo a árvore a partir do arquivo formatado.** Não existe config global, de propósito: o resultado é o mesmo em qualquer máquina. [`#configuration`](https://raw.githubusercontent.com/prettier/prettier/main/docs/configuration.md)
- **`prettier.config.js` com `export default` só em pacote `"type": "module"`; fora disso, `module.exports` ou a extensão `.mjs`.** O formato do `.js` segue o `type` do `package.json`. [`#configuration`](https://raw.githubusercontent.com/prettier/prettier/main/docs/configuration.md)
- **Config em `.ts` só no Node 22.6 ou acima, e com `--experimental-strip-types` antes do Node 24.3.** É o requisito da página para arquivo de config TypeScript. [`#configuration`](https://raw.githubusercontent.com/prettier/prettier/main/docs/configuration.md)
- **Opção diferente por pasta ou extensão vai em `overrides`, no mesmo arquivo.** É o mecanismo oficial para variar a config dentro do projeto. [`#configuration`](https://raw.githubusercontent.com/prettier/prettier/main/docs/configuration.md)
- **`.editorconfig` presente vira opção do Prettier, e o `prettier.config.js` vence.** A busca do `.editorconfig` para na raiz do projeto. [`#configuration`](https://raw.githubusercontent.com/prettier/prettier/main/docs/configuration.md)
- **Não peça opção nova: o conjunto é fechado.** O projeto diz que não acrescenta mais opções. [`#option-philosophy`](https://raw.githubusercontent.com/prettier/prettier/main/docs/option-philosophy.md)

### O que se formata

- **Tenha um `.prettierignore` (sintaxe do `.gitignore`) para gerado e saída de build, para que `prettier --write .` não estrague nada.** É a recomendação da página de ignore e do resumo da instalação. [`#ignore`](https://raw.githubusercontent.com/prettier/prettier/main/docs/ignore.md)
- **O Prettier lê o `.gitignore` e o `.prettierignore` só do diretório onde roda; `--ignore-path` troca esse padrão, não soma.** Pacote que roda o Prettier na própria pasta precisa do próprio ignore. [`#cli`](https://raw.githubusercontent.com/prettier/prettier/main/docs/cli.md)
- **No CI, `prettier --check .`.** O `--check` não escreve e sai com erro se algum arquivo não está formatado. [`#install`](https://raw.githubusercontent.com/prettier/prettier/main/docs/install.md)

### Com ESLint e hooks

- **Use `eslint-config-prettier` para desligar as regras de estilo do ESLint que conflitam com o Prettier.** Formatação é do Prettier, qualidade de código é do linter. [`#integrating-with-linters`](https://raw.githubusercontent.com/prettier/prettier/main/docs/integrating-with-linters.md)
- **Não rode o Prettier dentro do ESLint (`eslint-plugin-prettier`).** A página o chama de não recomendado: mais lento, sublinhado no editor e mais uma camada que quebra. [`#integrating-with-linters`](https://raw.githubusercontent.com/prettier/prettier/main/docs/integrating-with-linters.md)
- **Hook que formata no commit roda o ESLint antes do Prettier.** É a ordem que a página de instalação manda no lint-staged. [`#install`](https://raw.githubusercontent.com/prettier/prettier/main/docs/install.md)

---

## Sobre

#### index
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/index.md)

**O que é:** o que o Prettier faz e as linguagens que cobre.
**Para que serve:** saber o que entra no `prettier --check .` do pacote.
**Quando usar:** ao decidir o que o `.prettierignore` deixa de fora.

#### why-prettier
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/why-prettier.md)

**O que é:** o motivo de adotar: encerrar a discussão de estilo com um guia automático.
**Para que serve:** justificar a config única da casa.
**Quando usar:** quando alguém pede para mudar a formatação de um projeto só.

#### comparison
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/comparison.md)

**O que é:** regra de formatação contra regra de qualidade de código nos linters.
**Para que serve:** separar o que é do Prettier e o que é do ESLint.
**Quando usar:** ao escrever ou revisar o `eslint.config.js`.

#### option-philosophy
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/option-philosophy.md)

**O que é:** por que o Prettier tem poucas opções e não aceita novas.
**Para que serve:** encerrar pedido de opção que não existe.
**Quando usar:** quando um formato desejado não tem opção.

#### rationale
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/rationale.md)

**O que é:** as escolhas de formatação (correção, strings, linhas vazias, ponto e vírgula, JSX) e
o que o Prettier não faz.
**Para que serve:** entender a saída antes de achar que é bug.
**Quando usar:** quando a formatação surpreende.

## Uso

#### install
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/install.md)

**O que é:** instalação com versão exata, config, `.prettierignore`, `--write` e `--check`, ESLint
e hook de commit.
**Para que serve:** o roteiro mínimo para um pacote novo.
**Quando usar:** ao adicionar o Prettier a um pacote.

#### ignore
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/ignore.md)

**O que é:** `.prettierignore` e os comentários `prettier-ignore` por linguagem (JS, JSX, HTML,
CSS, Markdown, YAML).
**Para que serve:** tirar gerado e trecho pontual da formatação.
**Quando usar:** ao montar o `.prettierignore` do pacote (`architecture.md` §3.4).

#### integrating-with-linters
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/integrating-with-linters.md)

**O que é:** `eslint-config-prettier` e por que não usar `eslint-plugin-prettier`.
**Para que serve:** ESLint e Prettier sem regra brigando.
**Quando usar:** ao configurar o ESLint do pacote.

#### precommit
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/precommit.md)

**O que é:** formatar no commit com lint-staged, pretty-quick, Lefthook, git-format-staged ou
script de shell.
**Para que serve:** escolher como o hook formata o stage.
**Quando usar:** ao escrever o `.husky/pre-commit` (`husky.md`).

#### plugins
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/plugins.md)

**O que é:** como carregar plugin (`--plugin`, `plugins` na config) e a API para escrever um.
**Para que serve:** ligar plugin como o `prettier-plugin-tailwindcss` (`tailwindcss.md`).
**Quando usar:** ao adicionar plugin ao `prettier.config.js`.

#### cli
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/cli.md)

**O que é:** padrões de arquivo, `--check`, `--write`, `--ignore-path`, `--ignore-unknown`,
`--cache` e as outras flags.
**Para que serve:** montar os scripts `format` e `format:check`.
**Quando usar:** ao escrever script ou passo de CI que chama o Prettier.

#### api
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/api.md)

**O que é:** `format`, `check`, `resolveConfig`, `getFileInfo` e afins, em Node.
**Para que serve:** formatar código gerado por script (OpenAPI, cliente) com a config do projeto.
**Quando usar:** quando um gerador grava arquivo que o `format:check` vai conferir.

#### browser
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/browser.md)

**O que é:** a versão standalone, sem Node, sem config, sem ignore e sem carregar plugin sozinha.
**Para que serve:** formatar código no navegador (editor, playground).
**Quando usar:** só em tela que formata código do usuário.

#### ci
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/ci.md)

**O que é:** workflow de GitHub Actions que corrige a formatação pelo `autofix.ci`.
**Para que serve:** saber o que a página exige (versão fixada) antes de ligar o Prettier no CI.
**Quando usar:** ao mexer no passo de formatação do workflow.

## Configuração

#### options
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/options.md)

**O que é:** cada opção, com default, flag de CLI e chave de API (`semi`, `singleQuote`,
`trailingComma`, `printWidth`, `endOfLine`...).
**Para que serve:** conferir o default antes de escrever uma opção na config.
**Quando usar:** ao mexer no `prettier.config.js` de `_templates/code/<app>/`.

#### configuration
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/configuration.md)

**O que é:** os formatos de arquivo de config e a precedência, `overrides`, `parser`, o schema e
o `.editorconfig`.
**Para que serve:** saber qual arquivo o Prettier lê e em que ordem.
**Quando usar:** ao criar ou mover config, e quando a formatação não segue o arquivo esperado.

#### sharing-configurations
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/sharing-configurations.md)

**O que é:** criar, publicar e consumir uma config compartilhada como pacote.
**Para que serve:** avaliar config publicada contra a cópia espelhada pelo sync (`tooling.md` §5).
**Quando usar:** ao discutir onde mora a config da casa.

## Editores

#### editors
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/editors.md)

**O que é:** a integração de cada editor e o aviso de instalar o Prettier local em cada projeto.
**Para que serve:** o editor usar a mesma versão e a mesma config do `format:check`.
**Quando usar:** ao configurar o editor no projeto.

#### watching-files
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/watching-files.md)

**O que é:** formatar ao salvar pela linha de comando, com `onchange`.
**Para que serve:** editor sem integração.
**Quando usar:** raramente; o editor resolve.

## Diversos

#### technical-details
[markdown](https://raw.githubusercontent.com/prettier/prettier/main/docs/technical-details.md)

**O que é:** o algoritmo do impressor (Wadler) e a representação intermediária.
**Para que serve:** entender por que a quebra de linha depende da largura.
**Quando usar:** ao investigar uma formatação que muda com `printWidth`.
