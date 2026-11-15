# Design system

**Maiyu** · editorial, ribeirinho, de confiança

> Registra a **decisão**: que valor, por quê, onde usar. O valor que o código lê mora no tema
> (`styles.css`, `components.json`); componente usa token semântico, nunca hex nem valor arbitrário
> em classe (`_standards/frontend.md` §6). Token mudou aqui, muda no tema no mesmo commit.
> Os anti-padrões que valem para todo projeto estão em `_standards/frontend.md` §10.8; aqui só se aponta.

## 1. Visão geral

- Direção "Editorial ribeirinho" (decisão do dono, `DECISIONS.md` #12): a vitrine se lê como uma
  publicação séria da região, e não como um site ilustrado. Fotografia do lugar (rio, cidade,
  fronteira), tipografia grande e a cestaria como assinatura. Transmite uma empresa de tecnologia
  profissional, feita por indígenas e originários do Alto Solimões, para organizações de qualquer
  setor e para povos e organizações indígenas de qualquer país.
- Substitui a direção anterior (céu, mata e folha em SVG): o `SkyBackdrop` e o `Forest` de
  `components/common/sky.tsx` saem das páginas.
- Modo dominante: Convencer (home), Experiência (portfólio), Ler (diário). Não há tela de operação.
- Tema: claro e escuro. O `next-themes` escreve a classe `dark` no `<html>` antes da hidratação, com
  `defaultTheme="system"`.

## 2. Cores

Dois níveis: os nomes do shadcn (`--primary`, `--card`, `--border`) trocam entre claro e escuro; as
cores da marca (`--color-brand-*`) são fixas nos dois temas, são assinatura e não superfície.

| Token semântico | Claro | Escuro | Papel (onde e por quê) |
|---|---|---|---|
| `primary` | `#01111b` | `#88ff9a` | ação principal, no máximo uma por área |
| `secondary` | `#ede6d8` | `#14241e` | ação secundária |
| `accent` | `#88ff9a` | `#88ff9a` | destaque da marca |
| `destructive` | `#d6336c` | `#fb80c1` | erro e ação que apaga |
| `background` | `#f6f2ea` | `#07120e` | fundo da página: papel de fibra no claro, mata à noite no escuro |
| `card` | `#fffdf8` | `#0e1a15` | superfície elevada |
| `foreground` | `#01111b` | `#e8f6ff` | texto principal |
| `muted-foreground` | `#4a3f36` | `#a6b5aa` | texto de apoio |
| `highlight` | `#0bafc7` | ver `styles.css` | destaque de título; o ciano da marca escurecido, porque `#31e1f7` puro não tem contraste sobre papel claro |

Cores fixas da marca: verde `#88ff9a`, azul-água `#77eed7`, ciano `#31e1f7`, azul `#3168f7`, lilás
`#a480f5`, rosa `#fb80c1`, sobre o navy-noite `#01111b`. Pastéis `--tint-*` servem de fundo de cartão
e viram superfícies noturnas no escuro. Céu, mata e rio (`--sky-*`, `--forest-*`, `--river`) pintam o
fundo da vitrine: é o chão visual amazônico do site. O rio é barrento (`--river` `#d6bf98`), porque o
Solimões é rio de água branca, e a mata vai do `--forest-back` `#a5d0b3` ao `--forest-front` `#2c7652`.

Cores da terra, só para o trançado e detalhes, nunca superfície nem texto corrido: urucum
`--urucum` `#b5402a` (escuro `#e0704f`), açaí `--acai` `#4b1f45` (escuro `#c58bc0`) e terra
`--terra` `#a8643d` (escuro `#c08a5c`), que é o `--clay` do aporta, a mesma região.

O trançado (`@utility trancado`) é a faixa de losangos em urucum, terra e mata que costura a faixa
escura da home (topo e base). É geometria de cestaria genérica, e não o grafismo de um povo: grafismo
tem dono, e só entra no site com a autorização de quem o pinta.

O destaque da segunda linha do título da home é cor sólida (`text-forest`, `#2c7652`; no escuro o
verde da marca), não gradiente.

Contraste conferido (AA), por cálculo de luminância relativa WCAG em 2026-11-04: `foreground` sobre
`background` 17,1:1; `muted-foreground` sobre `background` 9,2:1 e sobre `secondary` 8,2:1;
`muted-foreground` escuro sobre `background` escuro 8,9:1; `text-forest` sobre o céu da hero 4,9:1.

## 3. Tipografia

Famílias servidas do próprio bundle (`@fontsource`), para não depender de domínio de terceiro:
Raleway Variable (voz da marca, títulos e corpo; h1 e h2 no peso 800, h3 a h6 no 700), Michroma (só o
wordmark MAIYU) e Geist Mono (número e código). A serifa editorial (Fraunces) que entrou no redesign
saiu a pedido do dono (`DECISIONS.md` #16).

| Papel | Token | Tamanho | Onde |
|---|---|---|---|
| Display | `--text-display`, `--text-display-xl` | `clamp` de 3rem a 6rem | capa da home e frase do convite |
| Título | `--text-h1`, `--text-h2` | `clamp` de 1.9rem a 4rem | título da página e de capítulo |
| Subtítulo | `--text-h3`, `--text-h4` | `clamp` de 1.2rem a 1.85rem | título de bloco e de item |
| Corpo | `--text-body`, `--text-body-lg`, `--text-lead` | `clamp` de 0.95rem a 1.4rem | texto e input, medida de 60 a 75 caracteres |
| Secundário | `--text-small` | `clamp` de 0.8rem a 0.9rem | apoio, legenda de foto |
| Legenda | `--text-micro`, `--text-2xs` | de 0.625rem a 0.78rem | rótulo pequeno |

## 3.1 Fotografia

- Só paisagem e lugar da região, de licença livre (Wikimedia Commons, CC0 e CC BY-SA), registradas
  em `frontend/src/lib/photos.ts` com autor, licença e página de origem. A legenda do `Photo`
  (`routes/_public/-components/photo.tsx`) mostra o crédito, que a CC BY-SA exige.
- Rosto de pessoa indígena de banco de imagem não entra: não traz o consentimento de quem aparece.
  Foto do time e das comunidades entra quando for da Maiyu, com autorização.
- Arquivos WebP em 640, 1280 e 1920 px (`src/assets/photos/<nome>-<largura>.webp`, importados para ganhar hash), com
  `srcset`, `width` e `height` (sem pulo de layout) e `loading="lazy"`, exceto a foto da primeira
  dobra (`priority`: `eager` e `fetchpriority="high"`).
- Produto aparece por captura real da tela (`src/assets/<projeto>.webp`).

## 4. Layout

- Celular primeiro: base sem prefixo, camadas em `md:` e `lg:`. A barra do desktop mostra Portfólio, Diário e Carreiras; Contato é botão ao lado; o painel do celular lista tudo.
- Sem rolagem horizontal da página a 320 px.

## 5. Elevação e camadas

- Superfícies planas com borda fina (`--border`); sombra pelo token `--shadow-tint`.

## 6. Formas

- Raio base `--radius: 1rem`, com `--radius-sm` a `--radius-2xl` derivados; botões em pílula (`PillButton`).

## 7. Componentes

Vêm de `components/ui/` (shadcn sobre Base UI; editável só com a linha `// casa:` e o motivo em inglês) e do kit `components/common/`.

| Componente | Variantes usadas | Regra |
|---|---|---|
| `PillButton` | primário e secundário | um primário por área; mora em `_public/-components/` |
| `PageHero` | por página | abre cada página interna |
| `Field`, `Input`, `Textarea` | padrão, com erro | rótulo visível; erro abaixo, ligado por `aria-describedby` via `invalidProps` e `FieldError` |
| `NotFoundPage` | 404 e 500 | compound, em `components/common/` |
| `Sky` | | céu da vitrine e da página de erro, em `components/common/` |
| `ThemeToggle`, `LanguageSwitcher` | | trocam tema e idioma |
| Badge | `neutral`, `info`, `success`, `warning` | cor nunca sozinha: sempre com rótulo |

Estados de todo controle: default, hover, focus-visible, active, disabled, error.

### Componentes do shadcn

O registry inteiro fica instalado (`_standards/frontend.md` §6, `DECISIONS.md` #299 da régua); cada componente é avaliado aqui. Decisões: **já usado** (algum arquivo fora de `components/ui/` o importa), **aplicado** (entra nesta revisão) e **não se aplica**. Nesta revisão (reinstalação do registry, #451) nenhum componente passou a ter uso novo.

| Componente | Decisão | Onde se usa ou por quê |
|---|---|---|
| `accordion` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `alert-dialog` | já usado | `common/form-shell/form-shell-leave-guard.tsx`, `common/confirm-dialog/confirm-dialog-header.tsx`, `common/confirm-dialog/confirm-dialog.tsx` e mais 1 |
| `alert` | já usado | `_public/-components/channels-notice.tsx` |
| `aspect-ratio` | já usado | `_public/-components/photo.tsx`, `_public/portfolio/-components/portfolio.tsx` |
| `attachment` | já usado | `common/multi-file-upload/multi-file-upload-list.tsx` |
| `avatar` | já usado | `common/image-field/image-field-preview.tsx`, `_public/blog/-components/article.tsx` |
| `badge` | já usado | `common/filters/filter-chip-grid.tsx`, `_public/-components/home/navy-band.tsx`, `_public/-components/home/work.tsx` e mais 4 |
| `breadcrumb` | já usado | `_public/blog/-components/article.tsx` |
| `bubble` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `button-group` | já usado | `common/image-field/image-field-actions.tsx`, `common/page-shell/page-header.tsx` |
| `button` | já usado | `common/sheet-on-demand/sheet-on-demand.tsx`, `common/row-actions/row-actions.tsx`, `common/image-field/image-field-actions.tsx` e mais 18 |
| `calendar` | já usado | `common/date-picker/date-picker.tsx` |
| `card` | já usado | `common/form-shell/form-shell-content.tsx` |
| `carousel` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `chart` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `checkbox` | já usado | `common/field/field-checkbox.tsx` |
| `code-block` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `collapsible` | já usado | `common/filters/filter-section.tsx` |
| `combobox` | já usado | `common/option-combobox/option-combobox.tsx` |
| `command` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `context-menu` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `dialog` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `direction` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `drawer` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `dropdown-menu` | já usado | `common/row-actions/row-actions.tsx`, `common/row-actions/row-actions-items.tsx`, `common/theme/theme-toggle.tsx` |
| `empty` | já usado | `common/empty-state/empty-state.tsx`, `common/route-status/route-error.tsx`, `common/route-status/load-error.tsx` e mais 1 |
| `field` | já usado | `common/field/field-number.tsx`, `common/field/field-select.tsx`, `common/field/field-mask.tsx` e mais 15 |
| `hover-card` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `input-group` | já usado | `common/field/field-number.tsx`, `common/field/field-mask.tsx`, `common/field/secret-input.tsx` e mais 3 |
| `input-otp` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `input` | já usado | `common/image-field/image-field.tsx`, `common/input-password/input-password.tsx` |
| `item` | já usado | `_public/-components/home/navy-band.tsx`, `_public/-components/home/audience.tsx`, `_public/-components/home/capabilities.tsx` |
| `kbd` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `label` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `marker` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `menubar` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `message-scroller` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `message` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `native-select` | já usado | `common/city-switcher/city-switcher.tsx`, `common/locale-switcher/locale-switcher.tsx` |
| `navigation-menu` | já usado | `_public/-components/header.tsx` |
| `pagination` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `popover` | já usado | `common/date-picker/date-picker.tsx` |
| `progress` | já usado | `common/multi-file-upload/multi-file-upload-list.tsx` |
| `questionnaire` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `radio-group` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `resizable` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `scroll-area` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `select` | já usado | `common/field/field-select.tsx` |
| `separator` | já usado | `common/filters/filter-section.tsx` |
| `sheet` | já usado | `_public/-components/header.tsx` |
| `sidebar` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `skeleton` | já usado | `common/page-shell/page-shell-skeleton.tsx`, `common/form-shell/form-shell-skeleton.tsx` |
| `slider` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `sonner` | já usado | `common/theme/theme-provider-toaster.tsx` |
| `spinner` | já usado | `common/image-field/image-field-actions.tsx`, `common/route-status/route-pending.tsx`, `common/multi-file-upload/multi-file-upload-list.tsx` e mais 2 |
| `switch` | já usado | `common/field/field-switch.tsx`, `common/filters/filter-toggle.tsx` |
| `table` | já usado | `common/platform-overview/platform-overview.tsx` |
| `tabs` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `textarea` | já usado | `common/field/field-textarea.tsx` |
| `toast` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |
| `toggle-group` | já usado | `common/filters/filter-segmented.tsx`, `common/filters/filter-chip-grid.tsx` |
| `toggle` | já usado | `common/rich-editor/rich-editor-toolbar.tsx` |
| `tooltip` | já usado | `common/filters/filter-chip-grid.tsx`, `__root.tsx` |
| `trace` | não se aplica | nenhuma tela do site precisa dele hoje; fica instalado pelo registry inteiro (`frontend.md` §6, #299) e entra quando uma tela pedir |

O toque de 44 px no celular vem do `ui/` (`max-sm:min-h-11`, `max-sm:min-w-11` nos tamanhos de ícone; `max-sm:text-base` nos campos de digitação), sem altura nem largura de controle ajustada na tela (`frontend.md` §10.2, #461).

## 8. Estados de tela

| Estado | Como aparece |
|---|---|
| Carregando | as rotas são `.lazy` com SSR; a primeira pintura já vem renderizada |
| Vazio | filtro do diário sem resultado mostra a lista inteira, porque categoria inválida cai para "tudo" |
| Erro | `NotFoundPage` com código 500, "Tentar de novo" e "Voltar ao início" |
| Sucesso | toast curto (sonner) com `id` fixo, para dois envios seguidos trocarem o aviso |

## 9. Movimento

- Animação é CSS: `REVEAL` e `STAGGER` de `reveal.ts`, com `motion-reduce:` em tudo. Curva `--ease-out-expo`.
- Anima `transform` e `opacity`; nunca `transition: all`.
- `prefers-reduced-motion` tira deslocamento e mantém opacidade. `vitrine-contract.test.ts` cobra.

## 10. Acessibilidade

- Meta: WCAG 2.1 AA.
- Foco visível em todo interativo; ordem de foco igual à visual.
- Ícones: `@phosphor-icons/react`, uma família; botão só de ícone tem `aria-label` por chave i18n.
- Imagem com sentido tem `alt` que diz a informação; decorativa `alt=""`.
- Campo de formulário liga erro e campo por `aria-describedby`.

## 11. Fazer / não fazer

| Fazer | Não fazer |
|---|---|
| Representar a Amazônia com céu, mata e rio do tema | Usar grafismo indígena como enfeite sem autoria e sem consentimento de quem o criou |
| Pôr a equipe pelo ofício | Pôr foto de pessoa sem autorização (as fotos do time estão ocultas) |

## 12. Referências

Referência é direção, não cópia (`frontend.md` §6.4).

| Referência | Onde | O que se tirou | Data |
|---|---|---|---|
| Guia da marca Maiyu | arquivo do dono | paleta verde, azul-água, ciano, azul, lilás, rosa e navy-noite | 2026-11-04 |

Componentes trazidos de fora: Não se aplica: nenhum.
