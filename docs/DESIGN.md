# Design system

**Maiyu** · editorial, ribeirinho, de confiança

> Registra a **decisão**: que valor, por quê, onde usar. O valor que o código lê mora no tema
> (`styles.css`, `components.json`); componente usa token semântico, nunca hex nem valor arbitrário
> em classe (`_standards/frontend.md` §6). Token mudou aqui, muda no tema no mesmo commit.
> Os anti-padrões que valem para todo projeto estão em `_standards/frontend.md` §10.8; aqui só se aponta.

## 1. Visão geral

**Direção: sóbria e editorial** (decisão do dono, 2026-11-20; substitui a #12 "Editorial ribeirinho" e a #16 do
Raleway pesado, `DECISIONS.md` #18). A vitrine se lê como uma publicação séria da região e como trabalho de estúdio de design,
não como um template: tipografia forte com escala clara, muito respiro, **uma cor de acento só** e fotografia
real do lugar. Transmite uma empresa de tecnologia profissional, feita por indígenas e originários do Alto
Solimões, para organizações de qualquer setor e para povos e organizações indígenas de qualquer país.

- **Regra (vale para qualquer projeto):** uma família display e uma de texto; papel e tinta mais **um**
  acento; formas retas e planas; hierarquia pela tipografia e pelo espaço, nunca por efeito; foto real do
  lugar ou placeholder marcado "foto a definir", nunca banco de imagem genérico. O que o tema não faz
  está em §11.
- **Valores do Maiyu:** Newsreader + Instrument Sans, urucum como acento, raio de 4 px, a foto da cidade no hero.
- Modo dominante: Convencer (home), Experiência (portfólio), Ler (diário). Não há tela de operação.
- Tema: claro e escuro. O `next-themes` escreve a classe `dark` no `<html>` antes da hidratação, com
  `defaultTheme="system"`.

## 2. Cores

**Regra:** dois níveis. Os nomes do shadcn (`--primary`, `--card`, `--border`) trocam entre claro e
escuro. O papel é neutro quente, a tinta é quase preta, e existe **um** acento (`--highlight`), usado em
pouco: fio sob o título, números, estado "em validação", seta de ação, link ativo. Cor nunca sozinha
carrega sentido (sempre com rótulo ou forma). Superfície colorida (pastel, gradiente, vidro) não existe.

**Valores do Maiyu:**

| Token semântico | Claro | Escuro | Papel (onde e por quê) |
|---|---|---|---|
| `background` | `#f6f2ea` | `#07120e` | fundo da página: papel de fibra no claro, mata à noite no escuro |
| `foreground` | `#01111b` | `#e8f6ff` | tinta, texto principal |
| `primary` | `#01111b` | `#f1ece2` | a ação principal: botão de tinta, no máximo um por área |
| `secondary`, `muted` | `#ede6d8` | `#14241e` | superfície quieta, o mesmo tom de papel (os `--tint-*` apontam para ele) |
| `accent` | `#ece6d8` | `#1b2a24` | só o fundo de hover do `ui/` |
| `card` | `#fffdf8` | `#0e1a15` | superfície elevada, com borda fina |
| `muted-foreground` | `#4a3f36` | `#a6b5aa` | texto de apoio |
| **`highlight` (o acento)** | `#b5402a` | `#e0704f` | **urucum**: o único acento; `--highlight-bar` é o mesmo valor |
| `destructive` | `#d6336c` | `#fb80c1` | erro e ação que apaga |

Verde `#88ff9a`, ciano, azul, lilás e rosa da marca **saem da interface**: ficam só no logotipo. O faixa
escura (`navy` `#01111b`) é a única superfície escura do tema claro, e leva o texto `on-navy` `#e8f6ff`.
Contraste mínimo de 4.5:1 no texto corrido e de 3:1 nos controles, nos dois temas (axe sem serious nem critical).

## 3. Tipografia

**Regra:** uma família display (títulos e texto de abertura) e uma de texto (corpo, controles, rótulos),
mais a mono para número e código. Peso calmo nos títulos (500), tracking levemente negativo, `text-balance`
nos títulos, itálico só para um verso de destaque. Escala fluida em `clamp`, com nomes próprios (`--text-*`)
para não alterar o tamanho dos componentes do `ui/`.

**Valores do Maiyu:** Newsreader Variable (display e `font-serif`, com itálico), Instrument Sans Variable
(texto), Michroma (só o wordmark MAIYU) e Geist Mono. Servidas do bundle (`@fontsource`), para não depender
de domínio de terceiro; a Newsreader e a Instrument Sans têm preload no `__root.tsx`.

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

**Regra:** superfície plana com borda fina (`--border`) e divisória de 1 px. Sem sombra decorativa, sem
brilho, sem grão, sem vidro. Sombra só onde o `ui/` a traz para sobrepor (menu, diálogo).

## 6. Formas

**Regra:** forma reta. **Valor do Maiyu:** `--radius: 0.25rem`, com `--radius-sm` a `--radius-2xl` derivados; sem pílula, sem
círculo colorido, sem canto de 16 a 20 px. Foto, captura e cartão ficam retos.

## 7. Componentes

Vêm de `components/ui/` (shadcn sobre Base UI; editável só com a linha `// casa:` e o motivo em inglês) e do kit `components/common/`.

| Componente | Variantes usadas | Regra |
|---|---|---|
| `Link` com `buttonVariants()` | primário (tinta) e `link` (texto com seta) | link com cara de botão é `<Link className={buttonVariants(...)}>`, nunca `Button render={<Link />}` (#440); um primário por área |
| `PageHero` | por página | abre cada página interna |
| `Field`, `Input`, `Textarea` | padrão, com erro | rótulo visível; erro abaixo, ligado por `aria-describedby` via `invalidProps` e `FieldError` |
| `NotFoundPage` | 404 e 500 | compound, em `components/common/` |
| `ThemeToggle`, `LanguageSwitcher` | | trocam tema e idioma |
| Badge | `ghost` no estado do projeto; `neutral` | texto em caixa-alta pequena com um ponto quadrado; tecnologia e tempo de leitura são texto corrido, não chip |

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

**Regra:** movimento discreto e com função (revelar em ordem de leitura), nunca decoração que roda sozinha.

- Animação é CSS: `REVEAL` e `STAGGER` de `reveal.ts`, com `motion-reduce:` em tudo. Curva `--ease-out-expo`.
- Sem marquee, sem rolagem automática, sem brilho que pulsa. O traço que se desenha e o pulso das cenas da seção "visão" param com `prefers-reduced-motion`.
- Anima `transform` e `opacity`; nunca `transition: all`.
- `prefers-reduced-motion` tira deslocamento e mantém opacidade. `vitrine-contract.test.ts` cobra.

## 10. Acessibilidade

- Meta: WCAG 2.1 AA.
- Foco visível em todo interativo; ordem de foco igual à visual.
- Ícones: `@phosphor-icons/react`, uma família; botão só de ícone tem `aria-label` por chave i18n.
- Imagem com sentido tem `alt` que diz a informação; decorativa `alt=""`.
- Campo de formulário liga erro e campo por `aria-describedby`.

## 11. Fazer / não fazer

**Regra (estrutura que vale para todo projeto):** a lista de "cara de IA" abaixo é cobrança de revisão, e o
que for detectável vira regra de lint no kit.

| Fazer | Não fazer |
|---|---|
| Uma família display e uma de texto; hierarquia por escala, peso 500 e espaço | Título em peso 800 em tudo, ou várias famílias |
| Um acento só (urucum), em fio, número e estado | Mais de um acento, neon, gradiente, pastel, vidro (`backdrop-blur`) |
| Botão de tinta e link de texto com seta; um primário por área | CTA neon com brilho, botão em pílula, sombra exagerada |
| Estado do projeto e tecnologia como texto | Chip arredondado para tudo, ícone dentro de círculo ou quadrado colorido |
| Divisória de 1 px e muito respiro | Faixa de ornamento repetida, grão, silhueta gigante de fundo |
| Lista editorial numerada ou com fio, com tamanhos diferentes | Grade de três cartões iguais com ícone ("features") |
| Foto real do lugar com crédito, ou placeholder "foto a definir" | Banco de imagem genérico, emoji, bandeira ou ilustração de template |
| Texto lido de verdade e verso de destaque em itálico | Texto de marketing vazio, "revolucione", "soluções de ponta" |
| Representar a Amazônia por foto, rio e mata do lugar | Usar grafismo indígena como enfeite sem autoria e sem consentimento de quem o criou |
| Pôr a equipe pelo ofício | Pôr foto de pessoa sem autorização (as fotos do time estão ocultas) |

## 12. Referências

Referência é direção, não cópia (`frontend.md` §6.4).

| Referência | Onde | O que se tirou | Data |
|---|---|---|---|
| Guia da marca Maiyu | arquivo do dono | o navy-noite do logotipo e o verde do símbolo (só no logotipo) | 2026-11-04 |
| Direção "sóbria e editorial" | decisão do dono | uma família display e uma de texto, um acento, foto real, sem efeito | 2026-11-20 |

Componentes trazidos de fora: Não se aplica: nenhum.
