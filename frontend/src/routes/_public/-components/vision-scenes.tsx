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

/** O Solimões, de oeste (Peru) a leste, subindo para São Paulo de Olivença. */
const RIVER =
  'M -20 168 C 50 150, 90 185, 140 172 S 220 108, 290 140 S 360 218, 396 244 S 452 300, 500 286 S 552 170, 620 46'

/** O Javari, que desce de Benjamin Constant e é a fronteira Peru-Brasil. */
const JAVARI =
  'M 384 254 C 364 284, 330 304, 296 316 S 200 336, 130 326 S 40 344, -20 352'

/** As linhas secas da Colômbia: a do oeste até o rio, a de Tabatinga ao norte. */
const BORDERS = ['M 150 -10 L 104 172', 'M 398 238 L 438 -10'] as const

/** O ponto onde os três países se encontram, entre Letícia, Tabatinga e Santa Rosa. */
const TRIPOINT = { x: 392, y: 250 } as const

/** Os três países, cada um com a bandeira e o nome na própria língua. */
const COUNTRIES = [
  { x: 262, y: 52, name: 'COLOMBIA', flag: 'co' },
  { x: 120, y: 254, name: 'PERÚ', flag: 'pe' },
  { x: 470, y: 392, name: 'BRASIL', flag: 'br' },
] as const

type Flag = (typeof COUNTRIES)[number]['flag']

/** Bandeira de 18 por 12, desenhada a partir do canto superior esquerdo. */
const FLAGS: Record<Flag, React.JSX.Element> = {
  co: (
    <>
      <rect width="18" height="6" fill="#FCD116" />
      <rect y="6" width="18" height="3" fill="#003893" />
      <rect y="9" width="18" height="3" fill="#CE1126" />
    </>
  ),
  pe: (
    <>
      <rect width="18" height="12" fill="#D91023" />
      <rect x="6" width="6" height="12" fill="#FFFFFF" />
    </>
  ),
  br: (
    <>
      <rect width="18" height="12" fill="#009C3B" />
      <path d="M 9 1.5 L 16.5 6 L 9 10.5 L 1.5 6 Z" fill="#FFDF00" />
      <circle cx="9" cy="6" r="2.6" fill="#002776" />
    </>
  ),
}

/**
 * As cidades da fronteira, de um lado e do outro do rio; Benjamin Constant é a
 * casa. `dy` leva o rótulo para baixo onde em cima ele bateria no vizinho.
 */
const TOWNS = [
  {
    x: 346,
    y: 300,
    name: 'Benjamin Constant',
    dx: 0,
    dy: 30,
    anchor: 'middle',
    kind: 'home',
  },
  {
    x: 384,
    y: 230,
    name: 'Letícia',
    dx: -10,
    dy: -10,
    anchor: 'end',
    kind: 'town',
  },
  {
    x: 414,
    y: 258,
    name: 'Tabatinga',
    dx: 12,
    dy: 4,
    anchor: 'start',
    kind: 'town',
  },
  {
    x: 366,
    y: 262,
    name: 'Santa Rosa',
    dx: -10,
    dy: 4,
    anchor: 'end',
    kind: 'town',
  },
  {
    x: 246,
    y: 334,
    name: 'Atalaia do Norte',
    dx: 0,
    dy: 22,
    anchor: 'middle',
    kind: 'town',
  },
  {
    x: 206,
    y: 118,
    name: 'Puerto Nariño',
    dx: 0,
    dy: -12,
    anchor: 'middle',
    kind: 'town',
  },
  {
    x: 112,
    y: 182,
    name: 'Caballococha',
    dx: 0,
    dy: 22,
    anchor: 'middle',
    kind: 'town',
  },
  {
    x: 560,
    y: 104,
    name: 'São Paulo de Olivença',
    dx: -10,
    dy: 4,
    anchor: 'end',
    kind: 'town',
  },
] as const

/** A rede sai de casa para os três países. */
const LINKS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 5],
  [3, 6],
  [2, 7],
] as const

/** Como cada ponto se desenha, pelo `kind`. */
const TOWN_STYLE = {
  home: { r: 8, fill: GREEN, opacity: 0.95, size: 17, weight: 700 },
  town: { r: 5, fill: INK, opacity: 0.7, size: 14, weight: 500 },
} as const

/** Sinal fraco: uma barra acesa, três apagadas. */
const SIGNAL_BARS = [
  { fill: GREEN, opacity: 1 },
  { fill: INK, opacity: 0.18 },
  { fill: INK, opacity: 0.18 },
  { fill: INK, opacity: 0.18 },
] as const

/**
 * 1 · Pensado para a borda: a tríplice fronteira Brasil, Colômbia e Peru, com
 * as cidades dos três lados do Solimões ligadas a partir de casa, mesmo com
 * sinal ruim. O desenho segue o mapa real (Letícia ao norte do rio, Santa Rosa
 * na ilha, Benjamin Constant na boca do Javari), simplificado.
 */
function EdgeScene(): React.JSX.Element {
  return (
    <svg viewBox="0 0 600 420" className="size-full">
      {BORDERS.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={INK}
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeDasharray="6 5"
        />
      ))}
      <path
        d={JAVARI}
        fill="none"
        stroke={CYAN}
        strokeOpacity="0.2"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d={JAVARI}
        fill="none"
        stroke={INK}
        strokeOpacity="0.35"
        strokeWidth="1.2"
        strokeDasharray="6 5"
      />
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
      {COUNTRIES.map((country, i) => (
        <g key={country.flag} className={APPEAR} style={delay(0.1 + i * 0.1)}>
          <g transform={`translate(${country.x - 40} ${country.y - 10})`}>
            <rect
              x="-1"
              y="-1"
              width="20"
              height="14"
              rx="2"
              fill={NAVY}
              stroke={INK}
              strokeOpacity="0.3"
            />
            {FLAGS[country.flag]}
          </g>
          <text
            x={country.x - 14}
            y={country.y}
            fill={INK}
            fillOpacity="0.6"
            fontSize="16"
            fontWeight="600"
            letterSpacing="3"
            fontFamily="var(--font-sans)"
          >
            {country.name}
          </text>
        </g>
      ))}
      <g className={APPEAR} style={delay(0.15)}>
        <circle
          cx={TRIPOINT.x}
          cy={TRIPOINT.y}
          r="40"
          fill={CYAN}
          fillOpacity="0.1"
          className="vision-pulse"
        />
        <circle
          cx={TRIPOINT.x}
          cy={TRIPOINT.y}
          r="40"
          fill={CYAN}
          fillOpacity="0.08"
          stroke={CYAN}
          strokeOpacity="0.9"
          strokeWidth="1.6"
          strokeDasharray="4 5"
        />
        <line
          x1={TRIPOINT.x + 28}
          y1={TRIPOINT.y - 29}
          x2="446"
          y2="174"
          stroke={CYAN}
          strokeOpacity="0.9"
          strokeWidth="1.4"
        />
        <rect
          x="446"
          y="158"
          width="128"
          height="32"
          rx="16"
          fill={PANEL}
          stroke={CYAN}
          strokeOpacity="0.9"
        />
        <text
          x="510"
          y="179"
          textAnchor="middle"
          fill={CYAN}
          fontSize="15"
          fontWeight="700"
          letterSpacing="1.5"
          fontFamily="var(--font-sans)"
        >
          BR · CO · PE
        </text>
      </g>
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
              y={town.y + town.dy}
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
      <g transform="translate(24 352)">
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
