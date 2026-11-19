# Cult UI

> Conferido em 2026-11-19 contra `www.cult-ui.com/llms.txt`, a página de instalação e a de um
> componente (versão `.md`) e contra o `LICENSE.md` do repositório `nolly-studio/cult-ui` (cru).
> Nada foi instalado nem executado.

Registry de componentes animados "de nicho" para projetos shadcn/ui.

**O que é:** componentes React com Tailwind v4, tokens do tema do shadcn e, em geral, `motion`,
publicados como registry: `npx shadcn@latest add @cult-ui/<nome>`. O namespace `@cult-ui` está no
diretório de registries do shadcn, sem editar o `components.json`. As dependências aparecem em
cada página.

**Para que serve:** só **vitrine e efeito de marketing** (`_standards/frontend.md` §6.4,
`DECISIONS.md` #789). Há também blocos de IA e templates; formulário, painel e primitivo
interativo seguem o shadcn sobre Base UI do kit.

**Como usar:** componente avulso e a régua inteira depois. O `halo-button` da doc já usa
`@base-ui/react` + `motion`, mas importa `Loader2` do `lucide-react`.

**Links:** 4

**Skills:** `maiyu-frontend`, `design-taste-frontend`, `impeccable`. Dispare junto com a leitura da
entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313).

### Instalação e licença

- **Pré-requisito: `npx shadcn@latest init`** (`components.json`, helper `cn`, alias `@/`, tokens de tema). O Cult UI usa o que o `init` cria. [`#docs/installation`](https://www.cult-ui.com/docs/installation.md)
- **Instalação por `npx shadcn@latest add @cult-ui/<nome>`**; o CLI escreve em `components/ui/` e instala as dependências npm. [`#docs/installation`](https://www.cult-ui.com/docs/installation.md)
- **Dependências por componente**: o `halo-button` instala `@base-ui/react` e `motion`. [`#docs/components/halo-button`](https://www.cult-ui.com/docs/components/halo-button.md)
- **Licença MIT** ("Copyright (c) 2023 Jordan-Gilliam") no `LICENSE.md` do repositório; anote no topo do arquivo copiado. [`#license`](https://raw.githubusercontent.com/nolly-studio/cult-ui/main/LICENSE.md)

### Conflito com a régua

- **`lucide-react`** (`Loader2` no `halo-button`): troca por Phosphor, e o spinner da casa já é peça do kit (`DECISIONS.md` #195).
- **`motion/react` direto**: envolva em `LazyMotion` `strict` + `m` e `MotionConfig reducedMotion="user"` (`_doc-lib/motion.md`, `DECISIONS.md` #192).
- **Botão, input, switch** do Cult UI (`halo-*`) são primitivos interativos: não entram; o kit tem os dele.
- Tailwind v4 e tokens do shadcn batem com a casa; cores só por token do projeto.

---

## Começo

#### docs/installation
[doc](https://www.cult-ui.com/docs/installation) | [markdown](https://www.cult-ui.com/docs/installation.md)
**O que é:** instalação pelo CLI do shadcn a partir do registry `@cult-ui`.
**Para que serve:** o comando e o que o CLI escreve no projeto.
**Quando usar:** antes do primeiro componente; o projeto da casa já tem o `init` feito pelo kit.

#### llms.txt
[markdown](https://www.cult-ui.com/llms.txt)
**O que é:** índice das páginas de docs (todas disponíveis em `.md`), o registry e o catálogo.
**Para que serve:** achar o componente de vitrine e a página dele.
**Quando usar:** ao procurar fundo, texto ou card animado.

#### docs/components/halo-button
[doc](https://www.cult-ui.com/docs/components/halo-button) | [markdown](https://www.cult-ui.com/docs/components/halo-button.md)
**O que é:** botão com halo animado: usa `@base-ui/react`, `motion`, `useReducedMotion` e `lucide-react`.
**Para que serve:** exemplo de conflito típico (ícone `lucide`, `motion` sem `LazyMotion`) e de botão interativo que não entra.
**Quando usar:** só como leitura do formato de página; o botão do produto é o do kit.

#### license
[markdown](https://raw.githubusercontent.com/nolly-studio/cult-ui/main/LICENSE.md)
**O que é:** o `LICENSE.md` do repositório: MIT, "Copyright (c) 2023 Jordan-Gilliam".
**Para que serve:** a licença anotada no topo do arquivo copiado.
**Quando usar:** antes de copiar.
