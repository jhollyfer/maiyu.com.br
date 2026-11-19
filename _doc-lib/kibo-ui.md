# Kibo UI

> Conferido em 2026-11-19 contra as páginas `docs` e `docs/setup` do site, a página do componente
> `dropzone` e os arquivos `license.md`, `package.json` e `components.json` do repositório
> `haydenbleasel/kibo` (crus). O site não publica `llms.txt` (404). Nada foi instalado.

Registry de componentes maiores sobre shadcn/ui: tabela, dropzone, Gantt, primitivos de chat de IA.

**O que é:** biblioteca e registry próprio sobre o shadcn/ui, que o site descreve como "MIT" e
aberta no GitHub. Instalação pelo CLI do Kibo (`npx kibo-ui add <nome>`) ou pelo CLI do shadcn
(duas abas na página de setup). Exige shadcn já iniciado, só no modo de **variáveis CSS**.

**Para que serve:** só **vitrine e efeito de marketing** (`_standards/frontend.md` §6.4,
`DECISIONS.md` #789). Atenção: o Kibo é feito de componentes **funcionais** (tabela, dropzone,
Gantt, editor), não de efeito. Tabela e formulário do produto já têm casa no kit; esses blocos
**não entram**, e o que sobra para vitrine é pouco.

**Como usar:** consultar por componente de vitrine; qualquer bloco que traga lógica de dados ou
entrada de usuário fica de fora.

**Links:** 4

**Skills:** `maiyu-frontend`, `design-taste-frontend`, `impeccable`. Dispare junto com a leitura da
entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313).

### Instalação e licença

- **shadcn/ui precisa estar iniciado antes; o Kibo UI só suporta o modo de variáveis CSS do shadcn.** [`#docs/setup`](https://www.kibo-ui.com/docs/setup)
- **Instalação pelo CLI do Kibo (`npx kibo-ui add <nome>`) ou pelo do shadcn**, que escrevem o código e as dependências. A forma exata do comando do shadcn não foi conferida no texto da página. [`#docs/setup`](https://www.kibo-ui.com/docs/setup)
- **Licença MIT**, conforme o site; o `license.md` do repositório traz o texto da MIT com "Copyright (c) 2023 — Present shadcnblocks". Anote o titular que consta no arquivo. [`#license`](https://raw.githubusercontent.com/haydenbleasel/kibo/main/license.md)

### Conflito com a régua

- **O repositório usa `radix-ui`, `@radix-ui/react-icons` e `lucide-react`** (`package.json` e `components.json` com `iconLibrary: lucide`): o código copiado traz Radix e lucide. Radix vira Base UI ou o bloco não entra; ícone vira Phosphor (`DECISIONS.md` #195).
- **Componentes puxam bibliotecas headless extras** (a doc cita lógica de "bibliotecas headless adicionais"): cada uma é dependência nova, só com `_doc-lib/<lib>.md` e `docs/DECISIONS.md`.
- **Tabela, dropzone e editor** concorrem com o kit e com o `tanstack-table` da casa: não entram.

---

## Começo

#### docs
[doc](https://www.kibo-ui.com/docs)
**O que é:** introdução: o que é o Kibo UI, benefícios, uso e contribuição.
**Para que serve:** saber que é registry sobre o shadcn/ui, MIT, com componentes funcionais.
**Quando usar:** para entender o escopo antes de procurar algo de vitrine.

#### docs/setup
[doc](https://www.kibo-ui.com/docs/setup)
**O que é:** pré-requisitos e instalação, pelo CLI do Kibo ou do shadcn.
**Para que serve:** as condições (shadcn iniciado, só variáveis CSS) e o comando.
**Quando usar:** antes de qualquer componente do Kibo.

#### components/dropzone
[doc](https://www.kibo-ui.com/components/dropzone)
**O que é:** a página do componente de upload `dropzone`.
**Para que serve:** exemplo do tipo de bloco funcional que **não** entra: upload tem casa no kit.
**Quando usar:** só como leitura do formato; no catálogo, ele é o oposto de "efeito de marketing".

#### license
[markdown](https://raw.githubusercontent.com/haydenbleasel/kibo/main/license.md)
**O que é:** o `license.md` do repositório: texto MIT com "Copyright (c) 2023 — Present shadcnblocks".
**Para que serve:** a licença anotada no topo do arquivo copiado.
**Quando usar:** antes de copiar.
