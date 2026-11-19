# Aceternity UI

> Conferido em 2026-11-19 contra `ui.aceternity.com/llms.txt`, `llms-full.txt`, a página de licença
> (`/licence`) e as páginas de instalação e de um componente. O repositório não foi consultado; a
> licença vale pelo texto do site. Nada foi instalado nem executado.

Registry de componentes animados com camada gratuita e camada paga.

**O que é:** componentes React com Tailwind e Motion, instalados pelo CLI do shadcn: `npx
shadcn@latest add @aceternity/<nome>`. O `llms-full.txt` diz que o código é copiado para o projeto
e que não há dependência de runtime da biblioteca. Há três camadas: componentes gratuitos (100+),
e blocos, templates e páginas **pagos** (Pro).

**Para que serve:** só **vitrine e efeito de marketing** (`_standards/frontend.md` §6.4,
`DECISIONS.md` #789): fundo, hero, card 3D, texto animado. Formulário, painel e primitivo
interativo seguem o shadcn sobre Base UI do kit.

**Como usar:** só a camada **gratuita** entra por esta régua. Bloco, template e página Pro
(licença paga por pessoa, 1 ano ou vitalícia) só com decisão do dono em `docs/DECISIONS.md`.

**Links:** 4

**Skills:** `maiyu-frontend`, `design-taste-frontend` (direção da vitrine), `impeccable`. Dispare
junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão com Aceternity UI.

### Instalação e licença

- **Instalação por `npx shadcn@latest add @aceternity/<nome>`, com Tailwind configurado antes.** O guia de instalação do Tailwind é pré-requisito. [`#installation`](https://ui.aceternity.com/llms-full.txt)
- **Componentes animados exigem `motion`; alguns 3D exigem também `three` e `@react-three/fiber`.** `three` é dependência nova: só com `_doc-lib/<lib>.md` e linha em `docs/DECISIONS.md`; sem isso, o componente não entra. [`#installation`](https://ui.aceternity.com/llms-full.txt)
- **Licença própria, não OSS**: componentes gratuitos valem para projeto pessoal e comercial ilimitado; revender ou redistribuir como biblioteca concorrente é proibido. A página de licença trata o Pro: produto final pode ser vendido, mas o item não pode ser revendido em marketplace nem virar template para venda. Anote a fonte e o termo no topo do arquivo. [`#licence`](https://ui.aceternity.com/licence)

### Conflito com a régua

- **Framer Motion/Motion sem `LazyMotion`**: envolva em `LazyMotion` `strict` + `m` e `MotionConfig reducedMotion="user"` (`_doc-lib/motion.md`, `DECISIONS.md` #192).
- **Ícone** que não seja Phosphor (`lucide-react`, `react-icons`) troca por Phosphor (`DECISIONS.md` #195).
- **Primitivo de Radix** no código copiado vira Base UI ou o bloco não entra. Confira por componente.
- **Pro (bloco, template, página)** fora de escopo sem decisão do dono: custo e licença por pessoa.

---

## Começo

#### llms-full.txt
[markdown](https://ui.aceternity.com/llms-full.txt)
**O que é:** corpus longo do site: o que é, instalação, preços, licença e catálogo completo.
**Para que serve:** responder instalação, dependência e escopo gratuito x pago sem abrir cada página.
**Quando usar:** ao escolher um componente. A página do componente continua sendo o contrato dele.

#### licence
[doc](https://ui.aceternity.com/licence)
**O que é:** o contrato de licença do Aceternity UI Pro (concessão, usos permitidos e proibidos).
**Para que serve:** saber o que se pode e o que não se pode fazer com o item copiado.
**Quando usar:** antes de copiar qualquer coisa. O cabeçalho do `llms-full.txt` resume os gratuitos; o Pro segue este texto.

#### components/install-tailwindcss
[doc](https://ui.aceternity.com/components/install-tailwindcss)
**O que é:** configuração do Tailwind no projeto para os componentes.
**Para que serve:** a base antes do `add`. Na casa, o tema e o Tailwind v4 já vêm do kit (`_doc-lib/tailwindcss.md`).
**Quando usar:** só para conferir o pré-requisito; não se refaz a configuração do projeto.

## Componentes

#### components/bento-grid
[doc](https://ui.aceternity.com/components/bento-grid)
**O que é:** página de um componente do catálogo gratuito, com instalação e código.
**Para que serve:** exemplo do formato: comando `add @aceternity/<nome>`, dependências e props na própria página.
**Quando usar:** modelo de leitura de qualquer componente antes de trazer. Seção de landing, cor por token.
