# Leaflet e React Leaflet

Mapa interativo com camadas de tiles, marcadores e GeoJSON, e os componentes React que o embrulham.

Última verificação: 2026-11-08 (fonte: menu de https://leafletjs.com/examples.html e `docs/` de Leaflet/Leaflet no branch `main`; sitemap de https://react-leaflet.js.org/sitemap.xml)

> Conferido contra `leaflet@1.9.4` (latest) e `react-leaflet@5.0.0` (latest).

> **Aviso (2026-11-08):** o site leafletjs.com já documenta o **Leaflet 2.0** (`2.0.0-beta.2`, tag
> `beta` no npm): ES modules, classes com `new` (`new LeafletMap`, `new TileLayer`), Pointer Events e
> CSS em `leaflet/styles.css`. O `latest` do npm continua `1.9.4`, e o `react-leaflet@5.0.0` pede
> `leaflet: ^1.9.0` no `peerDependencies`. Fique no 1.9.4 até o React Leaflet aceitar o 2.0: a API
> de referência da casa é a [`#reference-1.9.4`](https://leafletjs.com/reference-1.9.4.html), e os
> tutoriais abaixo valem pelo conceito (os trechos de código estão na sintaxe 2.0). Fonte:
> [`#install`](https://leafletjs.com/install.html), seção "Leaflet 1.9".

**O que é:** o Leaflet desenha o mapa direto no DOM (tiles, marcadores, popups, vetores, controles
de zoom e de atribuição). O React Leaflet não o substitui: expõe as camadas como componentes
(`MapContainer`, `TileLayer`, `Marker`, `Popup`, `GeoJSON`) e o mapa por contexto (`useMap`,
`useMapEvents`). O React só renderiza o `<div>` do `MapContainer` e o conteúdo dos componentes de UI.

**Para que serve:** mapa em tela pública ou de painel (localização de ocorrência, anúncio por
região, escolha de ponto) sem SDK pago nem chave de API no frontend (`frontend.md` §3.3).

**Como usar:**

```bash
pnpm add leaflet react-leaflet
pnpm add -D @types/leaflet
```

```tsx
// components/common/report-map/report-map.tsx: a casca, que roda no servidor
const ReportMapCanvas = React.lazy(async () => {
  const module = await import('./report-map-canvas')
  return { default: module.ReportMapCanvas }
})

export function ReportMap({ label }: Readonly<{ label: string }>): React.JSX.Element {
  const placeholder = <Skeleton role="status" aria-label={label} className="size-full" />
  return (
    <ClientOnly fallback={placeholder}>
      <React.Suspense fallback={placeholder}>
        <ReportMapCanvas label={label} />
      </React.Suspense>
    </ClientOnly>
  )
}
```

```tsx
// components/common/report-map/report-map-canvas.tsx: só o cliente importa este módulo
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'

export function ReportMapCanvas({ label }: Readonly<{ label: string }>): React.JSX.Element {
  return (
    <MapContainer center={[-4.38, -70.03]} zoom={14} className="h-96">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  )
}
```

**Links:** 17.

**Skills:** `maiyu-frontend`, `import-on-visibility`, `accessibility`. Dispare junto com a leitura da entrada; a entrada é o contrato, a skill executa (`SKILLS-MAP.md`).

## Decisões que a doc impõe

O que as páginas oficiais mandam fazer, lido página a página (`DECISIONS.md` #313). Vale antes de
qualquer decisão ou implementação com Leaflet ou React Leaflet: projeto segue, e regra de
`_standards/` que contradiga uma destas linhas está errada. Cada linha aponta a entrada e a página
de onde saiu.

### SSR e montagem

- **Nunca renderize o mapa no servidor: o módulo que importa `leaflet` ou `react-leaflet` só carrega no cliente.** O Leaflet chama o DOM no momento em que é carregado, e por isso o React Leaflet não é compatível com SSR. A doc não diz como carregar; na casa é `ClientOnly` + `lazy` ou rota `ssr: false` (`frontend.md` §9.2). [`#react-leaflet/start-introduction`](https://react-leaflet.js.org/docs/start-introduction/)
- **Não ponha o `MapContainer` dentro de `<Activity>` do React.** O `Activity` roda os efeitos mantendo o elemento do contêiner, o que é incompatível com o ciclo do React Leaflet; para recriar o mapa, troque a `key` do `MapContainer`. [`#react-leaflet/start-introduction`](https://react-leaflet.js.org/docs/start-introduction/)
- **Carregue o CSS do Leaflet e dê altura definida ao contêiner do mapa.** São as duas causas que a página de setup aponta para o mapa que não aparece. [`#react-leaflet/start-setup`](https://react-leaflet.js.org/docs/start-setup/)
- **Instale `@types/leaflet` como devDependency e importe do ponto de entrada `react-leaflet`, não dos subcaminhos.** As definições de tipo só são exportadas pela entrada do pacote, e dependem dos tipos do Leaflet. [`#react-leaflet/start-installation`](https://react-leaflet.js.org/docs/start-installation/)

### Props e acesso ao mapa

- **Trate as props do `MapContainer` como imutáveis: só `children` muda depois do primeiro render.** Mudar `center`, `zoom` ou `className` depois não afeta a instância; para mover o mapa, chame o método do Leaflet pelo `useMap()`. [`#react-leaflet/api-map`](https://react-leaflet.js.org/docs/api-map/)
- **Nos demais componentes, só a prop documentada como mutável atualiza a camada; o resto pede `key` nova.** As props criam a instância do Leaflet no primeiro render e não são reaplicadas. [`#react-leaflet/api-components`](https://react-leaflet.js.org/docs/api-components/)
- **`useMap`, `useMapEvents` e `useMapEvent` só em descendente do `MapContainer`.** O mapa chega por contexto, criado pelo `MapContainer`. [`#react-leaflet/api-map`](https://react-leaflet.js.org/docs/api-map/)

### Tiles, atribuição e acessibilidade

- **Todo `TileLayer` leva `attribution` com o crédito exigido pelo provedor; com OpenStreetMap, `&copy; OpenStreetMap` com link para `openstreetmap.org/copyright`.** A atribuição é obrigatória pelo aviso de copyright do OSM, e a maioria dos outros provedores exige o mesmo. [`#examples/quick-start`](https://leafletjs.com/examples/quick-start/)
- **Antes de usar os tiles do OSM em produção, leia e siga a Tile Usage Policy da OSM Foundation.** A página diz que os tiles do OSM servem para programar, e manda ler a política antes de produção. [`#examples/quick-start`](https://leafletjs.com/examples/quick-start/)
- **Todo marcador tem `alt` ou `title` único e descritivo; em `DivIcon`, o rótulo vai no HTML do ícone.** É o nome acessível que o leitor de tela anuncia. [`#examples/accessibility`](https://leafletjs.com/examples/accessibility/)
- **Mantenha o teclado e os padrões interativos do mapa; mapa só decorativo leva `inert` no contêiner.** O contêiner e os marcadores são operáveis por teclado por padrão, e mapa decorativo não pode ter descendente focável. [`#examples/accessibility`](https://leafletjs.com/examples/accessibility/)
- **Mapa em tela de celular tem `<meta name="viewport" content="width=device-width, initial-scale=1">`.** Sem ele o navegador móvel não mostra a página no tamanho real. [`#examples/mobile`](https://leafletjs.com/examples/mobile/)

---

## Leaflet: primeiros passos

#### install
[doc](https://leafletjs.com/install.html) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/install.md)

**O que é:** instalação pelo npm e pelo CDN, o aviso de que o site está no 2.0 beta e a seção "Leaflet 1.9" (último 1.x, o que `npm install leaflet` instala até o 2.0 sair).
**Para que serve:** escolher a versão certa para o React Leaflet.
**Quando usar:** ao adicionar a dependência e a cada atualização de versão.

#### examples/quick-start
[doc](https://leafletjs.com/examples/quick-start/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/quick-start/index.md)

**O que é:** o mapa mínimo: contêiner com altura, camada de tiles com atribuição e `maxZoom`, marcador, círculo, polígono, popup e evento de clique.
**Para que serve:** a base que o React Leaflet pressupõe ("siga o Quick Start do Leaflet antes").
**Quando usar:** antes do primeiro mapa do projeto, e ao escolher o provedor de tiles.

#### examples/mobile
[doc](https://leafletjs.com/examples/mobile/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/mobile/index.md)

**O que é:** mapa em tela cheia no celular, `viewport` e localização do usuário (`locate`).
**Para que serve:** tela de mapa no celular e o botão "minha localização".
**Quando usar:** em tela de mapa pensada para o toque.

#### examples/accessibility
[doc](https://leafletjs.com/examples/accessibility/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/accessibility/index.md)

**O que é:** padrões acessíveis do mapa, rótulo de marcador, tradução dos textos internos (só 2.0), teste com leitor de tela, mapa decorativo com `inert`.
**Para que serve:** passar o mapa na auditoria de acessibilidade (`frontend.md` §10).
**Quando usar:** em todo mapa com marcador ou controle.

## Leaflet: tutoriais

#### examples/custom-icons
[doc](https://leafletjs.com/examples/custom-icons/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/custom-icons/index.md)

**O que é:** ícone próprio de marcador: imagem, sombra, `iconSize`, `iconAnchor`, `popupAnchor`.
**Para que serve:** pin com a identidade do projeto, ancorado no ponto certo.
**Quando usar:** ao trocar o marcador padrão (no 1.9 com bundler, o ícone padrão perde as imagens; ver [`#MIGRATION`](https://github.com/Leaflet/Leaflet/blob/main/MIGRATION.md), item 5).

#### examples/geojson
[doc](https://leafletjs.com/examples/geojson/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/geojson/index.md)

**O que é:** camada GeoJSON com `style`, `pointToLayer`, `onEachFeature` e `filter`.
**Para que serve:** desenhar bairro, rota ou área vinda da API.
**Quando usar:** quando o dado geográfico chega em GeoJSON.

#### examples/layers-control
[doc](https://leafletjs.com/examples/layers-control/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/layers-control/index.md)

**O que é:** grupos de camadas e o controle que liga e desliga camadas base e sobrepostas.
**Para que serve:** filtro de camada no mapa sem estado paralelo.
**Quando usar:** com mais de uma camada que o usuário escolhe.

#### examples/zoom-levels
[doc](https://leafletjs.com/examples/zoom-levels/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/zoom-levels/index.md)

**O que é:** como o zoom funciona, zoom fracionário, `zoomSnap` e `zoomDelta`, `fitBounds`.
**Para que serve:** enquadrar o conjunto de pontos e controlar o passo do zoom.
**Quando usar:** ao ajustar o enquadramento inicial ou o zoom por gesto.

#### examples/map-panes
[doc](https://leafletjs.com/examples/map-panes/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/map-panes/index.md)

**O que é:** panes (camadas de DOM com `z-index`) para controlar o que fica por cima.
**Para que serve:** rótulo acima de vetor, pin acima de polígono, sem `z-index` solto no CSS.
**Quando usar:** quando a ordem de empilhamento padrão não serve.

#### examples/overlays
[doc](https://leafletjs.com/examples/overlays/) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/docs/examples/overlays/index.md)

**O que é:** imagem, vídeo e SVG sobrepostos ao mapa por limites geográficos.
**Para que serve:** planta, mapa histórico ou figura presa às coordenadas.
**Quando usar:** ao sobrepor mídia em vez de tiles.

## Leaflet: referência e migração

#### reference-1.9.4
[doc](https://leafletjs.com/reference-1.9.4.html)

**O que é:** a API completa da versão 1.9.4 (`Map`, `TileLayer`, `Marker`, `DivIcon`, `GeoJSON`, eventos, opções). Gerada pelo Leafdoc, sem markdown.
**Para que serve:** a referência da versão que o React Leaflet 5 aceita; `reference.html` já é a do 2.0.
**Quando usar:** ao passar opção ou chamar método do Leaflet por `useMap()` ou `ref`.

#### MIGRATION
[doc](https://github.com/Leaflet/Leaflet/blob/main/MIGRATION.md) | [markdown](https://raw.githubusercontent.com/Leaflet/Leaflet/main/MIGRATION.md)

**O que é:** o guia de migração do 1.x para o 2.0: módulos, classes com `new`, Pointer Events, fim do contorno do ícone padrão, tipos embutidos.
**Para que serve:** planejar a migração quando o React Leaflet aceitar o 2.0.
**Quando usar:** ao avaliar a troca de major.

## React Leaflet

#### react-leaflet/start-introduction
[doc](https://react-leaflet.js.org/docs/start-introduction/)

**O que é:** como o React Leaflet funciona: render feito pelo Leaflet, props imutáveis, `ref` para a instância, contexto por `MapContainer`, ciclo de vida e as limitações (sem SSR, sem `Activity`).
**Para que serve:** entender por que o componente não se comporta como um componente React comum.
**Quando usar:** antes do primeiro mapa e ao depurar prop que "não atualiza".

#### react-leaflet/start-installation
[doc](https://react-leaflet.js.org/docs/start-installation/)

**O que é:** dependências de par (React, React DOM, Leaflet), o pacote, os tipos de `@types/leaflet` e o import pela entrada do pacote.
**Para que serve:** instalar com tipos funcionando.
**Quando usar:** ao adicionar a dependência.

#### react-leaflet/start-setup
[doc](https://react-leaflet.js.org/docs/start-setup/)

**O que é:** o exemplo mínimo (`MapContainer`, `TileLayer` com atribuição, `Marker`, `Popup`) e a lista do que conferir quando o mapa não aparece.
**Para que serve:** validar a instalação.
**Quando usar:** no primeiro mapa e quando ele renderiza cinza ou cortado.

#### react-leaflet/api-map
[doc](https://react-leaflet.js.org/docs/api-map/)

**O que é:** `MapContainer` e suas props extras (`bounds`, `placeholder`, `whenReady`), e os hooks `useMap`, `useMapEvents`, `useMapEvent`.
**Para que serve:** criar o mapa e falar com ele de dentro.
**Quando usar:** ao montar o mapa e ao reagir a clique, movimento ou zoom.

#### react-leaflet/api-components
[doc](https://react-leaflet.js.org/docs/api-components/)

**O que é:** cada componente (camadas, vetores, controles, `Pane`) com as props mutáveis e os comportamentos (evented, pane, attribution).
**Para que serve:** saber qual prop atualiza a camada e qual exige `key` nova.
**Quando usar:** ao usar qualquer componente além do `MapContainer`.
