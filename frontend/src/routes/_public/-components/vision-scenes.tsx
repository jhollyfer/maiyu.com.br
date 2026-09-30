import type * as React from 'react'

import { cn } from '#/lib/utils'

/**
 * As três ilustrações da seção "A visão", uma por passo, trocadas em fade
 * conforme a leitura desce.
 *
 * As cores são literais e não tokens: a cena mora sempre sobre o palco navy,
 * nos dois temas, então o `--foreground` do tema claro a apagaria.
 *
 * Nada de ternário: o que muda de um ponto para outro (raio, peso, âncora do
 * rótulo) vem nos próprios dados, e a escolha de estilo do anel sai de uma
 * função com retorno antecipado.
 *
 * A animação é CSS, como toda entrada do site: `tw-animate-css` para o que
 * aparece e a utilidade `vision-draw` para o traço que se desenha. O site
 * antigo usava o `motion` só para isto. Cada cena remonta pela `key` quando o
 * passo muda, e remontar é o que reinicia a animação.
 *
 * `motion-reduce:animate-none` em cada peça: quem pediu menos movimento vê a
 * cena pronta, sem o traço se desenhando.
 */

/** A entrada de uma peça da cena, com o atraso passado por `style`. */
const APPEAR =
  'animate-in fade-in-0 duration-700 [animation-fill-mode:both] motion-reduce:animate-none'

/** O mesmo, subindo um pouco: o editor e o README chegam de baixo. */
const RISE = cn(APPEAR, 'slide-in-from-bottom-3')

/**
 * O traço que se desenha. `pathLength={1}` vai junto, no elemento. Sem
 * animação o deslocamento precisa voltar a zero à mão, senão o anel some.
 */
const DRAW =
  'vision-draw motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]'

/** O atraso de uma peça, em segundos, como o `style` o recebe. */
function delay(seconds: number): React.CSSProperties {
  return { animationDelay: `${seconds}s` }
}

const INK = '#E8F6FF'
const NAVY = '#01111B'
const PANEL = '#0B1E2B'
const GREEN = '#88FF9A'
const CYAN = '#31E1F7'
const BLUE = '#77EED7'
const PURPLE = '#A480F5'

const RIVER =
  'M -20 110 C 90 140, 160 250, 262 262 S 420 230, 470 300 S 560 400, 640 380'

/** As cidades da tríplice fronteira; Benjamin Constant é a casa. */
const TOWNS = [
  {
    x: 150,
    y: 150,
    name: 'Atalaia do Norte',
    dx: -8,
    anchor: 'end',
    kind: 'town',
  },
  {
    x: 262,
    y: 236,
    name: 'Benjamin Constant',
    dx: 12,
    anchor: 'start',
    kind: 'home',
  },
  { x: 404, y: 196, name: 'Tabatinga', dx: 12, anchor: 'start', kind: 'town' },
  { x: 446, y: 262, name: 'Letícia', dx: 12, anchor: 'start', kind: 'town' },
  { x: 352, y: 318, name: 'Santa Rosa', dx: 12, anchor: 'start', kind: 'town' },
] as const

const LINKS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [1, 4],
  [4, 3],
] as const

/** Como cada ponto se desenha, pelo `kind`. */
const TOWN_STYLE = {
  home: { r: 8, fill: GREEN, opacity: 0.95, size: 14, weight: 700 },
  town: { r: 5, fill: INK, opacity: 0.6, size: 12, weight: 500 },
} as const

/** Sinal fraco: uma barra acesa, três apagadas. */
const SIGNAL_BARS = [
  { fill: GREEN, opacity: 1 },
  { fill: INK, opacity: 0.18 },
  { fill: INK, opacity: 0.18 },
  { fill: INK, opacity: 0.18 },
] as const

/** 1 · Pensado para a borda: as cidades ao longo do Solimões, ligadas mesmo com sinal ruim. */
function EdgeScene(): React.JSX.Element {
  return (
    <svg viewBox="0 0 600 420" className="size-full">
      <path
        d={RIVER}
        fill="none"
        stroke={CYAN}
        strokeOpacity="0.28"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d={RIVER}
        fill="none"
        stroke={CYAN}
        strokeOpacity="0.7"
        strokeWidth="2"
      />
      {LINKS.map(([a, b], i) => (
        <line
          key={`${a}-${b}`}
          x1={TOWNS[a].x}
          y1={TOWNS[a].y}
          x2={TOWNS[b].x}
          y2={TOWNS[b].y}
          stroke={GREEN}
          strokeOpacity="0.7"
          strokeWidth="1.5"
          strokeDasharray="4 7"
          className={APPEAR}
          style={delay(0.2 + i * 0.12)}
        />
      ))}
      {TOWNS.map((town) => {
        const style = TOWN_STYLE[town.kind]
        return (
          <g key={town.name}>
            {town.kind === 'home' && (
              <circle
                cx={town.x}
                cy={town.y}
                r="22"
                fill={GREEN}
                fillOpacity="0.14"
                className="vision-pulse"
              />
            )}
            <circle cx={town.x} cy={town.y} r={style.r} fill={style.fill} />
            <text
              x={town.x + town.dx}
              y={town.y - 12}
              textAnchor={town.anchor}
              fill={INK}
              fillOpacity={style.opacity}
              fontSize={style.size}
              fontWeight={style.weight}
              fontFamily="var(--font-sans)"
            >
              {town.name}
            </text>
          </g>
        )
      })}
      <g transform="translate(236 290)">
        <rect
          x="0"
          y="0"
          width="92"
          height="50"
          rx="12"
          fill={PANEL}
          stroke={INK}
          strokeOpacity="0.15"
        />
        {SIGNAL_BARS.map((bar, b) => (
          <rect
            key={b}
            x={14 + b * 9}
            y={30 - b * 5}
            width="5"
            height={8 + b * 5}
            rx="1.5"
            fill={bar.fill}
            fillOpacity={bar.opacity}
          />
        ))}
        <circle cx="68" cy="25" r="11" fill={GREEN} />
        <path
          d="M 62.5 25 l 4 4 l 7 -8"
          fill="none"
          stroke={NAVY}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

/** As linhas de código do editor: recuo, largura, cor e opacidade. */
const CODE = [
  { indent: 0, width: 120, color: PURPLE, opacity: 0.75 },
  { indent: 18, width: 170, color: BLUE, opacity: 0.75 },
  { indent: 18, width: 90, color: INK, opacity: 0.3 },
  { indent: 36, width: 140, color: GREEN, opacity: 0.75 },
  { indent: 36, width: 60, color: INK, opacity: 0.3 },
  { indent: 18, width: 110, color: CYAN, opacity: 0.75 },
  { indent: 0, width: 80, color: PURPLE, opacity: 0.75 },
] as const

/** As linhas do README; a primeira é o título, mais escura. */
const README_LINES = [
  { width: 150, opacity: 0.55 },
  { width: 120, opacity: 0.18 },
  { width: 160, opacity: 0.18 },
  { width: 90, opacity: 0.18 },
  { width: 140, opacity: 0.18 },
] as const

const PEOPLE = [
  { x: 170, y: 350, color: GREEN },
  { x: 240, y: 362, color: BLUE },
  { x: 310, y: 350, color: PURPLE },
  { x: 380, y: 362, color: CYAN },
] as const

/** 2 · De quem usa: código e documentação entregues à comunidade. */
function OwnedScene(): React.JSX.Element {
  return (
    <svg viewBox="0 0 600 420" className="size-full">
      <g className={RISE}>
        <rect
          x="60"
          y="60"
          width="300"
          height="230"
          rx="18"
          fill={PANEL}
          stroke={INK}
          strokeOpacity="0.14"
        />
        {[0, 1, 2].map((dot) => (
          <circle
            key={dot}
            cx={84 + dot * 16}
            cy="84"
            r="5"
            fill={INK}
            fillOpacity="0.25"
          />
        ))}
        {CODE.map((line, i) => (
          <rect
            key={i}
            x={86 + line.indent}
            y={112 + i * 22}
            width={line.width}
            height="9"
            rx="4.5"
            fill={line.color}
            fillOpacity={line.opacity}
          />
        ))}
      </g>
      <g className={RISE} style={delay(0.15)}>
        <rect x="300" y="120" width="210" height="190" rx="16" fill={INK} />
        <text
          x="322"
          y="154"
          fill={NAVY}
          fontSize="15"
          fontWeight="800"
          fontFamily="var(--font-sans)"
        >
          README.md
        </text>
        {README_LINES.map((line, i) => (
          <rect
            key={i}
            x="322"
            y={172 + i * 22}
            width={line.width}
            height="8"
            rx="4"
            fill={NAVY}
            fillOpacity={line.opacity}
          />
        ))}
      </g>
      {PEOPLE.map((person, i) => (
        <g
          key={person.color}
          className={cn(APPEAR, 'zoom-in-50')}
          style={{
            ...delay(0.35 + i * 0.08),
            transformBox: 'fill-box',
            transformOrigin: 'center',
          }}
        >
          <circle cx={person.x} cy={person.y} r="22" fill={person.color} />
          <circle
            cx={person.x}
            cy={person.y - 5}
            r="7"
            fill={NAVY}
            fillOpacity="0.55"
          />
          <path
            d={`M ${person.x - 11} ${person.y + 13} a 11 9 0 0 1 22 0`}
            fill={NAVY}
            fillOpacity="0.55"
          />
        </g>
      ))}
      <path
        d="M 440 330 q 40 -10 50 -40"
        fill="none"
        stroke={GREEN}
        strokeWidth="2"
        strokeDasharray="4 6"
      />
      <circle cx="492" cy="284" r="14" fill={GREEN} />
      <path
        d="M 485.5 284 l 4.5 4.5 l 8 -9"
        fill="none"
        stroke={NAVY}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const RINGS = 9
const RING_YEARS = [
  { ring: 2, label: '2026' },
  { ring: 5, label: '2028' },
  { ring: 8, label: '2030' },
] as const

/** O raio-base do anel `i`, e o `x` onde ele cruza o eixo horizontal. */
function ringRadius(i: number): number {
  return 22 + i * 17
}

/** Um anel levemente torto, como madeira de verdade. */
function ringPath(i: number): string {
  const base = ringRadius(i)
  const points = Array.from({ length: 72 }, (_, k) => {
    const a = (k / 72) * Math.PI * 2
    const r =
      base * (1 + Math.sin(a * 3 + i) * 0.035 + Math.cos(a * 5 - i) * 0.02)
    return `${(300 + Math.cos(a) * r * 1.08).toFixed(1)} ${(210 + Math.sin(a) * r).toFixed(1)}`
  })
  return `M ${points[0]} L ${points.slice(1).join(' L ')} Z`
}

/** A cada três anéis, um verde marcado; entre eles, ciano e tinta alternados. */
function ringStyle(i: number): {
  stroke: string
  opacity: number
  width: number
} {
  if (i % 3 === 2) return { stroke: GREEN, opacity: 0.9, width: 2.5 }
  if (i % 2 === 1) return { stroke: CYAN, opacity: 0.35, width: 1.5 }
  return { stroke: INK, opacity: 0.35, width: 1.5 }
}

/** 3 · Feito para durar: os anéis de uma samaúma, um por ano à frente. */
function LastScene(): React.JSX.Element {
  return (
    <svg viewBox="0 0 600 420" className="size-full">
      <circle cx="300" cy="210" r="180" fill={GREEN} fillOpacity="0.04" />
      {Array.from({ length: RINGS }, (_, i) => {
        const style = ringStyle(i)
        return (
          <path
            key={i}
            d={ringPath(i)}
            pathLength={1}
            fill="none"
            stroke={style.stroke}
            strokeOpacity={style.opacity}
            strokeWidth={style.width}
            strokeLinejoin="round"
            className={DRAW}
            style={delay(i * 0.06)}
          />
        )
      })}
      <circle cx="300" cy="210" r="8" fill={GREEN} />
      <line
        x1="300"
        y1="210"
        x2="480"
        y2="210"
        stroke={INK}
        strokeOpacity="0.25"
        strokeDasharray="3 5"
      />
      {RING_YEARS.map((year) => {
        const x = 300 + ringRadius(year.ring) * 1.08
        return (
          <g key={year.label}>
            <circle cx={x} cy="210" r="4" fill={GREEN} />
            <rect
              x={x - 20}
              y="222"
              width="40"
              height="20"
              rx="10"
              fill={NAVY}
            />
            <text
              x={x}
              y="236"
              textAnchor="middle"
              fill={INK}
              fillOpacity="0.8"
              fontSize="13"
              fontWeight="700"
              fontFamily="var(--font-sans)"
            >
              {year.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const SCENES = [EdgeScene, OwnedScene, LastScene] as const

export type VisionStep = 0 | 1 | 2

/**
 * A cena do passo atual.
 *
 * A `key` é o passo: trocar de passo remonta a cena, e a remontagem é o que
 * refaz a entrada. Sem saída animada, e é decisão: a cena anterior some no
 * mesmo quadro em que a próxima começa a aparecer, o que em 500ms de fade lê
 * como troca, e poupa manter duas cenas montadas ao mesmo tempo.
 */
export function VisionScene({ step }: { step: VisionStep }): React.JSX.Element {
  const Scene = SCENES[step]

  return (
    <div
      key={step}
      data-slot="vision-scene"
      className={cn(
        APPEAR,
        'absolute inset-0 flex items-center justify-center p-6 zoom-in-95 duration-500 md:p-10',
      )}
    >
      <Scene />
    </div>
  )
}
