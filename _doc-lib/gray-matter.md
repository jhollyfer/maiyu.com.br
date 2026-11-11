# gray-matter

Separa o front matter (YAML, JSON ou outra linguagem) do corpo de um arquivo de texto.

Última verificação: 2026-11-08 (fonte: README de jonschlinkert/gray-matter, branch `master`, e `lib/engines.js` do mesmo branch)

> Conferido contra `gray-matter@4.0.3` (latest).

**O que é:** `matter(texto, options?)` devolve `{ data, content }`: `data` é o objeto lido do bloco
entre `---`, `content` é o resto. YAML é a linguagem padrão (`js-yaml`, pelo `safeLoad`), e JSON e
JavaScript também vêm ligados. A linguagem pode vir escrita logo depois do primeiro delimitador
(`---toml`, `---js`), e o pacote escolhe a engine por ela.

**Para que serve:** ler o cabeçalho de arquivo Markdown na importação de conteúdo. No academy, o
`scripts/lessons-import.ts` lê `database/content/**`, tira `slug`, título e módulo do `data` e grava
`database/data/lessons.ts`; o pacote fica fora da produção porque a leitura acontece no script, não
no seeder. Pela `DECISIONS.md` #323 o `content` (Markdown) vira JSON do Tiptap ali mesmo, na
importação, por `MarkdownManager.parse` (`_doc-lib/tiptap.md#editor/markdown/api/markdown-manager`);
o gray-matter só separa cabeçalho e corpo, e não converte nada.

**Como usar:**

```bash
pnpm add -D gray-matter
```

```ts
import fs from 'node:fs'
import matter from 'gray-matter'

// o front matter de arquivo nunca executa código: as duas chaves, porque o
// pacote procura o nome escrito (`js`) e depois o alias (`javascript`)
const noScript = (): never => {
  throw new Error('front matter em JavaScript não é aceito')
}

const { data, content } = matter(fs.readFileSync(file, 'utf8'), {
  engines: { js: noScript, javascript: noScript },
})
```

**Links:** 6.

**Skills:** `maiyu-backend`, `security-best-practices`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com `gray-matter`: projeto segue, e regra de `_standards/` que
contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Engine e segurança

- **Desligue a engine JavaScript (`engines.js` e `engines.javascript`) quando o arquivo não é escrito pelo time.** A doc diz que JavaScript vem ligado por padrão e que a linguagem é detectada pelo que vem depois do primeiro delimitador, e a engine padrão faz `eval` do bloco (`lib/engines.js`): um `---js` executa código no processo que importa (conferido contra 4.0.3, e só sobrescrever `js` deixa `---javascript` passar). [`#README/optionsengines`](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#optionsengines), [`#README/optionslanguage`](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#optionslanguage), [fonte](https://raw.githubusercontent.com/jonschlinkert/gray-matter/master/lib/engines.js)
- **Linguagem fora de YAML, JSON e JavaScript entra por `engines`, como função de parse ou objeto `{ parse, stringify }`.** É o formato de engine que a doc define; sem ela, a linguagem detectada não está registrada e a leitura falha. [`#README/optionsengines`](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#optionsengines)

### Opções

- **Use `language`, `delimiters` e `engines`; nunca `lang`, `delims` nem `parsers`.** As três antigas estão depreciadas na doc em favor das novas. [`#README/deprecated-options`](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#deprecated-options)
- **Front matter vazio se confere por `isEmpty`, não por `data` vazio.** A doc separa o caso "só espaço ou comentário" em `empty` e `isEmpty`. [`#README/returned-object`](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#returned-object)

---

## README

#### README/usage
[doc](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#usage) | [markdown](https://raw.githubusercontent.com/jonschlinkert/gray-matter/master/README.md)

**O que é:** `matter(string, options)` e o objeto devolvido no caso mínimo, com o import em
TypeScript (`import * as matter` ou `import matter = require`; com `esModuleInterop`, que o
tsconfig do Adonis liga, o `import matter from` também resolve).
**Para que serve:** ler o cabeçalho de um Markdown num script de importação.
**Quando usar:** ao escrever ou revisar o leitor de conteúdo em arquivo.

#### README/returned-object
[doc](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#returned-object) | [markdown](https://raw.githubusercontent.com/jonschlinkert/gray-matter/master/README.md)

**O que é:** `data`, `content`, `excerpt`, `empty`, `isEmpty` e os não enumeráveis `orig`,
`language`, `matter` e `stringify`.
**Para que serve:** saber o que validar depois do parse (o `data` é `unknown` na prática e passa por
narrowing antes de virar dado do seeder).
**Quando usar:** ao tratar o resultado do parse.

#### README/optionsengines
[doc](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#optionsengines) | [markdown](https://raw.githubusercontent.com/jonschlinkert/gray-matter/master/README.md)

**O que é:** as engines padrão (JSON, YAML e JavaScript) e o formato de engine própria, função de
parse ou objeto com `parse` e `stringify` opcional.
**Para que serve:** desligar a engine JavaScript e acrescentar outra linguagem.
**Quando usar:** em todo leitor de front matter, antes do primeiro arquivo de fora.

#### README/optionslanguage
[doc](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#optionslanguage) | [markdown](https://raw.githubusercontent.com/jonschlinkert/gray-matter/master/README.md)

**O que é:** `language` (padrão `yaml`) e a detecção pela palavra depois do primeiro delimitador.
**Para que serve:** saber que o próprio arquivo escolhe a engine, e por isso a engine JavaScript
precisa estar desligada.
**Quando usar:** ao fixar a linguagem e ao revisar a segurança do leitor.

#### README/optionsdelimiters
[doc](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#optionsdelimiters) | [markdown](https://raw.githubusercontent.com/jonschlinkert/gray-matter/master/README.md)

**O que é:** delimitador padrão `---` e o par de abertura e fechamento por array.
**Para que serve:** ler arquivo que usa outro delimitador.
**Quando usar:** só quando o conteúdo não usa `---`.

#### README/deprecated-options
[doc](https://github.com/jonschlinkert/gray-matter/blob/master/README.md#deprecated-options) | [markdown](https://raw.githubusercontent.com/jonschlinkert/gray-matter/master/README.md)

**O que é:** `lang`, `delims` e `parsers`, substituídas por `language`, `delimiters` e `engines`.
**Para que serve:** reconhecer código antigo e trocar pela opção atual.
**Quando usar:** ao revisar um leitor escrito antes da v3.
