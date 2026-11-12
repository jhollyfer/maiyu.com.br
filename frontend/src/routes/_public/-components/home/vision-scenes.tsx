import type * as React from 'react'

import { cn } from '#/lib/utils'

/**
 * The three illustrations of the "The vision" section, one per step, swapped with a fade
 * as the reading goes down.
 *
 * The colors are literals and not tokens: the scene always lives over the navy stage,
 * in both themes, so the light theme's `--foreground` would erase it.
 *
 * No ternary: what changes from one point to another (radius, weight, label
 * anchor) comes in the data itself, and the ring's style choice comes from a
 * function with an early return.
 *
 * The animation is CSS, like every entrance on the site: `tw-animate-css` for what
 * appears and the `vision-draw` utility for the stroke that draws itself. The old
 * site used `motion` only for this. Each scene remounts through the `key` when the
 * step changes, and remounting is what restarts the animation.
 *
 * `motion-reduce:animate-none` on every piece: whoever asked for less motion sees the
 * finished scene, without the stroke drawing itself.
 */

/** The entrance of a scene piece, with the delay passed through `style`. */
const APPEAR =
  'animate-in fade-in-0 duration-700 [animation-fill-mode:both] motion-reduce:animate-none'

/** The same, rising a little: the editor and the README arrive from below. */
const RISE = cn(APPEAR, 'slide-in-from-bottom-3')

/**
 * The stroke that draws itself. `pathLength={1}` goes along, on the element. Without
 * animation the offset has to go back to zero by hand, or the ring disappears.
 */
const DRAW =
  'vision-draw motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]'

/** A piece's delay, in seconds, as `style` receives it. */
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

/** The Solimões, from west (Peru) to east, going up toward São Paulo de Olivença. */
const RIVER =
  'M -20 168 C 50 150, 90 185, 140 172 S 220 108, 290 140 S 360 218, 396 244 S 452 300, 500 286 S 552 170, 620 46'

/** The Javari, which comes down from Benjamin Constant and is the Peru-Brazil border. */
const JAVARI =
  'M 384 254 C 364 284, 330 304, 296 316 S 200 336, 130 326 S 40 344, -20 352'

/** Colombia's dry lines: the west one to the river, the one from Tabatinga to the north. */
const BORDERS = ['M 150 -10 L 104 172', 'M 398 238 L 438 -10'] as const

/** The point where the three countries meet, between Leticia, Tabatinga and Santa Rosa. */
const TRIPOINT = { x: 392, y: 250 } as const

/** The three countries, each with its flag and the name in its own language. */
const COUNTRIES = [
  { x: 262, y: 52, name: 'COLOMBIA', flag: 'co' },
  { x: 120, y: 254, name: 'PERÚ', flag: 'pe' },
  { x: 470, y: 392, name: 'BRASIL', flag: 'br' },
] as const

type Flag = (typeof COUNTRIES)[number]['flag']

/** An 18 by 12 flag, drawn from the top left corner. */
const FLAGS = {
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
} satisfies Record<Flag, React.JSX.Element>

/**
 * The border's cities, on one side and the other of the river; Benjamin Constant is
 * home. `dy` takes the label down where up top it would hit its neighbor.
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

/** The network leaves home for the three countries. */
const LINKS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 5],
  [3, 6],
  [2, 7],
] as const

/** How each point is drawn, by `kind`. */
const TOWN_STYLE = {
  home: { r: 8, fill: GREEN, opacity: 0.95, size: 17, weight: 700 },
  town: { r: 5, fill: INK, opacity: 0.7, size: 14, weight: 500 },
} as const

/** Weak signal: one bar lit, three off. */
const SIGNAL_BARS = [
  { fill: GREEN, opacity: 1 },
  { fill: INK, opacity: 0.18 },
  { fill: INK, opacity: 0.18 },
  { fill: INK, opacity: 0.18 },
] as const

/**
 * 1 · Designed for the edge: the Brazil, Colombia and Peru triple border, with
 * the cities on the three sides of the Solimões connected from home, even with a
 * bad signal. The drawing follows the real map (Leticia north of the river, Santa Rosa
 * on the island, Benjamin Constant at the mouth of the Javari), simplified.
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

/** The editor's code lines: indent, width, color and opacity. */
const CODE = [
  { indent: 0, width: 120, color: PURPLE, opacity: 0.75 },
  { indent: 18, width: 170, color: BLUE, opacity: 0.75 },
  { indent: 18, width: 90, color: INK, opacity: 0.3 },
  { indent: 36, width: 140, color: GREEN, opacity: 0.75 },
  { indent: 36, width: 60, color: INK, opacity: 0.3 },
  { indent: 18, width: 110, color: CYAN, opacity: 0.75 },
  { indent: 0, width: 80, color: PURPLE, opacity: 0.75 },
] as const

/** The README's lines; the first is the title, darker. */
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

/** 2 · Of whoever uses it: code and documentation delivered to the community. */
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

/** Ring `i`'s base radius, and the `x` where it crosses the horizontal axis. */
function ringRadius(i: number): number {
  return 22 + i * 17
}

/** A slightly crooked ring, like real wood. */
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

/** Every third ring, a marked green one; between them, cyan and ink alternate. */
function ringStyle(i: number): {
  stroke: string
  opacity: number
  width: number
} {
  if (i % 3 === 2) return { stroke: GREEN, opacity: 0.9, width: 2.5 }
  if (i % 2 === 1) return { stroke: CYAN, opacity: 0.35, width: 1.5 }
  return { stroke: INK, opacity: 0.35, width: 1.5 }
}

/** 3 · Made to last: the rings of a samauma tree, one per year ahead. */
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
 * The current step's scene.
 *
 * The `key` is the step: changing step remounts the scene, and remounting is what
 * redoes the entrance. No animated exit, and it is a decision: the previous scene vanishes in
 * the same frame in which the next starts to appear, which in a 500ms fade reads
 * as a swap, and spares keeping two scenes mounted at the same time.
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
