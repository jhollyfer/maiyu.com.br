# Husky

Hooks do Git a partir de arquivos em `.husky/`, instalados pelo script `prepare`.

Última verificação: 2026-11-08 (fonte: `docs/.vitepress/config.mts` de typicode/husky, branch `main`)

> Conferido contra `husky@9.1.7` (latest).

**O que é:** um pacote de 2 kB, sem dependência, que aponta o `core.hooksPath` do Git para
`.husky/_` e roda o arquivo `.husky/<nome-do-hook>` como shell POSIX. Cobre os 13 hooks do lado do
cliente; o hook é só um arquivo com o nome do hook do Git.

**Para que serve:** cobrar antes do commit o que a régua cobra (`tooling.md` §6): `commit-msg` com
commitlint e o autor único, `pre-commit` com `check` e `test:unit` do pacote que o commit toca. O CI
repete tudo, porque o hook se desliga com `-n` ou `HUSKY=0`.

**Como usar:**

```bash
pnpm add -D -w husky
pnpm exec husky init   # cria .husky/pre-commit e grava "prepare": "husky"
```

```sh
# .husky/pre-commit (shell POSIX, sem shebang)
pnpm --filter ./backend check
```

**Links:** 5.

**Skills:** `setup-pre-commit`, `git-guardrails-claude-code`, `code-pattern` (convenção de commit da casa). Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`). O par com commitlint (hook `commit-msg`) está em `commitlint.md`.

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com Husky: projeto segue, e regra de `_standards/` que contradiga
uma destas linhas está errada. Cada linha aponta a entrada e a página de onde saiu.

### Instalação

- **Instale com `pnpm exec husky init` ou com `"prepare": "husky"` no `package.json`.** O `prepare` roda o `husky` depois de cada install, e é o caminho que a doc recomenda. [`#get-started.html`](https://typicode.github.io/husky/get-started.html)
- **Hook novo é um arquivo em `.husky/` com o nome exato do hook do Git (`pre-commit`, `commit-msg`).** `precommit` ou `pre-commit.sh` não rodam. [`#troubleshoot.html`](https://typicode.github.io/husky/troubleshoot.html)
- **Escreva o hook em shell POSIX; Bash só dentro de `bash << EOF`, e só se ninguém da equipe usa Windows.** Nem toda máquina tem `bash`. [`#how-to.html`](https://typicode.github.io/husky/how-to.html)
- **Hook em Node fica num `.js` chamado pelo arquivo do hook (`node .husky/pre-commit.js`).** O arquivo do hook continua sendo shell. [`#how-to.html`](https://typicode.github.io/husky/how-to.html)

### Fora da máquina do desenvolvedor

- **Em CI e Docker, `HUSKY=0`.** Lá o hook não serve e não deve ser instalado. [`#how-to.html`](https://typicode.github.io/husky/how-to.html)
- **Install só de `dependencies` precisa de `prepare` que não falha (`husky || true` ou `.husky/install.mjs`).** Sem o Husky instalado, `"prepare": "husky"` quebra o install. [`#how-to.html`](https://typicode.github.io/husky/how-to.html)

### Estrutura do repositório

- **O Husky não instala em diretório pai; pacote fora da raiz do Git usa `"prepare": "cd .. && husky <pasta>/.husky"` e o hook volta para a pasta.** Restrição de segurança do próprio Husky. [`#how-to.html`](https://typicode.github.io/husky/how-to.html)

### Manutenção

- **Hook que não roda: confira `git config core.hooksPath` (deve ser `.husky/_`) e Git 2.9 ou acima.** É o que o Husky configura. [`#troubleshoot.html`](https://typicode.github.io/husky/troubleshoot.html)
- **Depois de desinstalar, `git config --unset core.hooksPath`.** Senão `.git/hooks/` continua ignorado. [`#troubleshoot.html`](https://typicode.github.io/husky/troubleshoot.html)
- **Na migração da v4, comandos de binário local passam a rodar pelo gerenciador (`pnpm exec`).** A página manda chamar o binário instalado no projeto pelo gerenciador de pacotes. [`#migrate-from-v4.html`](https://typicode.github.io/husky/migrate-from-v4.html)

---

## Começo

#### index
[doc](https://typicode.github.io/husky/) | [markdown](https://raw.githubusercontent.com/typicode/husky/main/docs/index.md)

**O que é:** a apresentação: tamanho, `core.hooksPath`, os 13 hooks, monorepo, desligamento global.
**Para que serve:** saber o que o Husky faz e o que deixa para o Git.
**Quando usar:** ao decidir hook de commit num projeto novo.

#### get-started.html
[doc](https://typicode.github.io/husky/get-started.html) | [markdown](https://raw.githubusercontent.com/typicode/husky/main/docs/get-started.md)

**O que é:** a instalação, o `husky init` e o exemplo de `pre-commit` que formata só o que está
no stage.
**Para que serve:** montar o primeiro hook com o `prepare` certo.
**Quando usar:** ao adicionar o Husky na raiz do repositório.

## Guias

#### how-to.html
[doc](https://typicode.github.io/husky/how-to.html) | [markdown](https://raw.githubusercontent.com/typicode/husky/main/docs/how-to.md)

**O que é:** hook novo, `init.sh` de inicialização, pular hook (`-n`, `HUSKY=0`), CI e Docker,
testar hook sem commitar, projeto fora da raiz do Git, hook em Node ou Bash, gerenciador de versão
do Node em GUI, instalação manual.
**Para que serve:** os casos que o `husky init` não resolve sozinho.
**Quando usar:** ao configurar CI ou Docker, e quando o hook falha numa GUI.

#### troubleshoot.html
[doc](https://typicode.github.io/husky/troubleshoot.html) | [markdown](https://raw.githubusercontent.com/typicode/husky/main/docs/troubleshoot.md)

**O que é:** `command not found`, hook que não roda, `.git/hooks/` parado depois de desinstalar,
Yarn no Windows.
**Para que serve:** diagnosticar hook que não dispara.
**Quando usar:** quando o commit passa sem o hook rodar.

#### migrate-from-v4.html
[doc](https://typicode.github.io/husky/migrate-from-v4.html) | [markdown](https://raw.githubusercontent.com/typicode/husky/main/docs/migrate-from-v4.md)

**O que é:** a troca do bloco `hooks` do `package.json` (v4) por arquivos em `.husky/` (v9).
**Para que serve:** migrar projeto antigo sem perder hook.
**Quando usar:** em projeto com `"husky": { "hooks": ... }` no `package.json`.
