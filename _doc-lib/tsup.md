# tsup

Bundler de TypeScript sobre esbuild, sem configuração obrigatória.

> **Aviso de status (2026-11-08):** o README oficial abre com "This project is not actively
> maintained anymore. Please consider using tsdown instead", e aponta o guia de migração
> ([README](https://raw.githubusercontent.com/egoist/tsup/main/README.md),
> [tsdown, migrate-from-tsup](https://tsdown.dev/guide/migrate-from-tsup)). O pacote continua
> publicado (a 9.0.0 saiu em 2026-10-14), mas a recomendação do próprio autor é migrar. Projeto
> novo não adota tsup; o que já usa migra pelo `_doc-lib/tsdown.md#guide/migrate-from-tsup`.

Última verificação: 2026-11-08 (fonte: README do repositório `egoist/tsup`, branch padrão `main`, lido por `git ls-remote --symref`)

> Conferido contra `tsup@9.0.0` (latest).

**O que é:** um empacotador de TypeScript e JavaScript movido a esbuild. Lê `.ts`, `.tsx`, `.js`,
`.mjs` e `.json`, escreve em `dist/` por padrão e aceita `tsup.config.ts`. A doc inteira é uma
página única; as opções completas estão na doc de API gerada do pacote.

**Para que serve:** hoje, só para entender e migrar o build do backend Fastify que ainda o usa
(`tooling.md` §tsconfig, `architecture.md`, árvore do Fastify). O sucessor é o tsdown.

**Como usar:** não adote. Para o que já existe, a migração é:

```bash
npx tsdown-migrate --dry-run   # mostra o que muda, sem tocar em nada
```

**Links:** 2.

**Skills:** `maiyu-backend`, `migration`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313).

- **Não comece build novo com tsup; migre o existente para o tsdown.** O README declara o projeto sem manutenção ativa e indica o tsdown e o guia de migração. [`#README`](https://raw.githubusercontent.com/egoist/tsup/main/README.md)

---

## Documentação

#### README
[doc](https://github.com/egoist/tsup/blob/main/README.md) | [markdown](https://raw.githubusercontent.com/egoist/tsup/main/README.md)

**O que é:** o aviso de status, a instalação e o uso mínimo (`tsup src/index.ts src/cli.ts`).
**Para que serve:** confirmar o status do projeto e o ponteiro para o tsdown.
**Quando usar:** antes de qualquer decisão sobre o build que ainda usa tsup.

#### /
[doc](https://tsup.egoist.dev/) | [markdown](https://raw.githubusercontent.com/egoist/tsup/main/docs/README.md)

**O que é:** a doc de página única: excluir pacotes, configuração (`tsup.config.ts`), múltiplas
entradas, declaração, sourcemap, formatos, extensão de saída, code splitting, target, variáveis de
compilação, `onSuccess`, minificação, tree shaking, CSS e metafile.
**Para que serve:** ler o que cada opção do `tsup.config.ts` atual faz, para achar a equivalente
no tsdown.
**Quando usar:** durante a migração, opção por opção, junto com a tabela de diferenças do tsdown.
