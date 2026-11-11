---
name: doc-lib-check
description: Use when checking or refreshing the official documentation links in _doc-lib/, when the owner asks to verify doc links, find new or removed pages, detect a deprecated or archived library, or list libraries the house rule uses without a _doc-lib file. In maiyu-pattern it updates the files; in a project it only reports, because the project copy of _doc-lib is a mirror of the upstream.
---

# Conferir e atualizar os links de `_doc-lib/`

**REQUIRED:** `maiyu-standards` (ordem de consulta). `_doc-lib/` é o contrato da régua (`AGENTS.md`,
"Autoridade"); esta skill o mantém vivo, completo e fiel à doc oficial (`DECISIONS.md` #321).

## Onde roda e o que pode mudar

| Onde | Pode editar | Faz |
|---|---|---|
| `maiyu-pattern` | `_doc-lib/*.md` e `_doc-lib.md` (índice) | os passos abaixo, numa branch `docs/doc-lib-<assunto>`, com PR; o merge é do dono |
| projeto da casa | nada em `_doc-lib/` (cópia do upstream, o sync a sobrescreve) | roda `node <maiyu-pattern>/scripts/sync-to-project.mjs . --check`; se a cópia está atrás, avisa o dono; o relatório desta skill vai para o upstream, nunca vira edição local |

## Formato de cada arquivo

O de toda a régua, que o `scripts/doc-lib/audit.mjs` lê:

```
#### <caminho da página na doc>
[doc](<url>) | [markdown](<url do md>)          (ou só [doc](<url>) quando não existe md)

**O que é:** ...
**Para que serve:** ...
**Quando usar:** ...
```

No topo: `**Links:** N` (bate com o número de `####` e com a tabela de `_doc-lib.md`), a seção
`## Decisões que a doc impõe` e a linha `Última verificação: AAAA-MM-DD (fonte: <índice usado>)`.

## Fonte de verdade da lista de páginas, nesta ordem

1. Índice oficial para LLMs: `https://<site>/llms.txt` (TanStack `/<lib>/latest/llms.txt`, tsdown,
   prettier, Coolify).
2. Config de navegação do repositório da doc (`docs/config.json` do TanStack, `.vitepress/config` do
   shiki e do husky).
3. Listagem da pasta de docs no GitHub (`repos/<owner>/<repo>/contents/<pasta>`).
4. Menu lateral do site, lido no navegador, só se nada acima existir.

Link de markdown: o site que serve `.md` usa a mesma URL com `.md` (TanStack, tsdown, Coolify;
Cloudflare usa `/index.md`). O que não serve usa o fonte em
`raw.githubusercontent.com/<owner>/<repo>/<branch padrão>/<caminho>.md`, com o branch padrão lido da
API, nunca suposto `main`. Sem md em lugar nenhum (PostgreSQL, AWS): só o `[doc]`.

Escopo: Get Started, Tutorial e Guides, ou o equivalente da lib. API Reference e Examples ficam de
fora, salvo se o arquivo já os tiver. Lib com várias frameworks: só React e as páginas agnósticas.

## Passos

1. Liste `_doc-lib/*.md`; para cada um, a lib, a fonte de verdade e o branch padrão do repositório.
2. Busque o índice oficial atual e compare com o arquivo: página nova, página que sumiu, página
   renomeada ou movida.
3. Teste os links com `node scripts/doc-lib/audit.mjs` (status, redirect, HTML vazio, conteúdo
   mudado); para o `md`, confira que é markdown de verdade (não começa com `<!DOCTYPE` nem `<html>`).
4. Confira o status da lib no repositório e no README: depreciada, arquivada, em maintenance mode,
   substituída, nova major.
5. Atualize o arquivo:
   - página nova entra na seção e na ordem do menu oficial, no formato acima;
   - link renomeado ou redirecionado vai para a URL final;
   - página removida não se apaga: vai para `## Removidas da doc oficial`, com a data;
   - lib depreciada ou arquivada ganha aviso no topo, com a data e o link da fonte;
   - `**Links:**` e a linha da lib em `_doc-lib.md` acompanham a contagem.
6. Leia o markdown de cada página nova ou alterada. Se ela muda uma regra de "Decisões que a doc
   impõe", **proponha** no relatório, citando a página; a seção só muda com o "sim" do dono.
7. Atualize `Última verificação` de cada arquivo tocado.

## Regras

- Nunca invente URL: todo link escrito foi testado nesta execução.
- Não reformate nem reescreva o que não mudou.
- Fonte que falha (timeout, 403, bloqueio do proxy) vai para o relatório; não troque de fonte calado.
- Sem emoji e sem travessão no texto.
- Pesquisa e leitura vão para subagente, uma lib ou um grupo por subagente, com relatório curto
  (`AGENTS.md`, "Economia de tokens").

## Relatório final

1. Tabela por lib: páginas antes, depois, novas, removidas, renomeadas, links quebrados.
2. Links que falharam e por quê.
3. Libs com mudança de status (depreciada, arquivada, nova major).
4. Propostas de mudança em "Decisões que a doc impõe", cada uma com a página que a justifica.
5. Libs que a régua usa sem arquivo em `_doc-lib/`: procure em `_standards/frontend.md`,
   `backend.md`, `backend-fastify.md`, `tooling.md`, `typescript.md` e `architecture.md`.

**Próxima etapa:** com o relatório aprovado, `superpowers:finishing-a-development-branch` (PR).
