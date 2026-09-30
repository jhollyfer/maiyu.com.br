import type * as React from 'react'

import { cn } from '#/lib/utils'

/**
 * O céu da Maiyu: o dia amazônico no tema claro, o céu estrelado no escuro, e a
 * mata ribeirinha embaixo nos dois.
 *
 * Tudo é SVG gerado por código, e não imagem: a mata e as estrelas saem de um
 * sorteio com semente fixa, então servidor e navegador desenham exatamente a
 * mesma coisa e a hidratação não reclama. Qual dos dois céus aparece é CSS
 * (`.dark .day` e `.galaxy`, em `styles.css`), sem ler o tema em JavaScript.
 *
 * Mora em `components/common/` porque a página de erro, que o router desenha
 * fora da casca pública, também o usa.
 */

/** Gerador pseudoaleatório com semente, para a mata e as estrelas saírem iguais em todo render. */
function rng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const W = 1440
const H = 400
function f(n: number): string {
  return n.toFixed(1)
}

/** A linha do dossel: copas largas feitas de lóbulos sobrepostos, como a mata se lê de longe. */
function canopyPath(seed: number, base: number, lobe: number): string {
  const r = rng(seed)
  let d = `M0 ${base}`
  let x = 0
  while (x < W) {
    const w = lobe * (2 + r() * 2.4)
    const h = lobe * (0.45 + r() * 0.55)
    const lobes = 3 + Math.floor(r() * 3)
    const lw = w / lobes
    for (let j = 0; j < lobes; j++) {
      const t = (j + 1) / lobes
      // O último lóbulo fecha na linha de base, que é onde a copa seguinte começa.
      let ny = base
      if (j < lobes - 1)
        ny =
          base - h * Math.pow(Math.sin(Math.PI * t), 0.55) - r() * lobe * 0.12
      d += ` A ${f(lw * 0.56)} ${f(lw * 0.5)} 0 0 1 ${f(x + lw * (j + 1))} ${f(ny)}`
    }
    x += w
  }
  return `${d} L ${f(x)} ${H} L 0 ${H} Z`
}

/** A copa em guarda-chuva: uma fileira de lóbulos sobre uma base levemente curva. */
function crown(cx: number, top: number, h: number, w: number): string {
  const lobes = 6
  const y0 = top + h * 0.28
  function at(t: number): number {
    return y0 - h * 0.26 * Math.pow(Math.sin(Math.PI * t), 0.7)
  }
  let d = `M ${f(cx - w / 2)} ${f(y0)}`
  for (let j = 1; j <= lobes; j++) {
    const t = j / lobes
    const lw = w / lobes
    let y = at(t)
    if (j === lobes) y = y0
    d += ` A ${f(lw * 0.62)} ${f(lw * 0.55)} 0 0 1 ${f(cx - w / 2 + lw * j)} ${f(y)}`
  }
  return `${d} Q ${f(cx)} ${f(y0 + h * 0.1)}, ${f(cx - w / 2)} ${f(y0)} Z`
}

/** A samaúma: a gigante emergente, tronco alto com sapopemas e copa achatada. */
function samaumaPath(cx: number, base: number, h: number, w: number): string {
  const top = base - h
  const tw = w * 0.05
  return [
    `M ${f(cx - tw * 3)} ${base} C ${f(cx - tw * 1.2)} ${f(base - h * 0.08)}, ${f(cx - tw)} ${f(base - h * 0.2)}, ${f(cx - tw)} ${f(top + h * 0.2)}`,
    `L ${f(cx + tw)} ${f(top + h * 0.2)}`,
    `C ${f(cx + tw)} ${f(base - h * 0.2)}, ${f(cx + tw * 1.2)} ${f(base - h * 0.08)}, ${f(cx + tw * 3)} ${base} Z`,
    crown(cx, top, h, w),
  ].join(' ')
}

/** O açaizeiro: estipe fino e curvo, com as folhas caídas desenhadas em traço. */
function palm(
  cx: number,
  base: number,
  h: number,
  lean: number,
): { stem: string; fronds: Array<string> } {
  const tx = cx + lean
  const ty = base - h
  const stem = `M ${f(cx)} ${base} Q ${f(cx + lean * 0.2)} ${f(base - h * 0.55)}, ${f(tx)} ${f(ty)}`
  const fronds = [-160, -128, -96, -64, -32, 0, 25].map((deg) => {
    const a = (deg * Math.PI) / 180
    const len = h * 0.36
    const ex = tx + Math.cos(a) * len
    const ey = ty + Math.sin(a) * len * 0.5 + len * 0.5
    // A folha: vai pela borda de cima e volta pela de baixo.
    const n = 7
    const ux = tx + Math.cos(a) * len * 0.5 - Math.sin(a) * n
    const uy = ty + Math.sin(a) * len * 0.55 - n
    const lx = tx + Math.cos(a) * len * 0.5 + Math.sin(a) * n
    const ly = ty + Math.sin(a) * len * 0.55 + n
    return `M ${f(tx)} ${f(ty)} Q ${f(ux)} ${f(uy)}, ${f(ex)} ${f(ey)} Q ${f(lx)} ${f(ly)}, ${f(tx)} ${f(ty)} Z`
  })
  return { stem, fronds }
}

const BACK = canopyPath(7, 285, 40)
const MID = canopyPath(19, 320, 46)
const GIANTS = [
  samaumaPath(230, 300, 135, 230),
  samaumaPath(1010, 305, 125, 200),
  samaumaPath(1330, 300, 110, 160),
]
const PALMS = [
  palm(70, 348, 150, 14),
  palm(124, 348, 125, -10),
  palm(470, 348, 115, 14),
  palm(640, 348, 145, -8),
  palm(1400, 348, 130, -12),
]
const FRONT = canopyPath(31, 352, 30)

const RIPPLES = (() => {
  const r = rng(5)
  return Array.from(
    { length: 22 },
    () => `M ${f(r() * W)} ${f(362 + r() * 30)} h ${f(30 + r() * 90)}`,
  )
})()

/** A margem do rio: dossel, samaúmas emergentes e açaizeiros sobre a água. */
export function Forest({
  className,
}: {
  className?: string
}): React.JSX.Element {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(165px,17vw,250px)] w-full',
        className,
      )}
    >
      <defs>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--river)" />
          <stop offset="1" stopColor="var(--background)" />
        </linearGradient>
      </defs>
      <path d={BACK} fill="var(--forest-back)" />
      {GIANTS.map((d, i) => (
        <path key={i} d={d} fill="var(--forest-back)" />
      ))}
      <path d={MID} fill="var(--forest-mid)" />
      {PALMS.map((p, i) => (
        <g key={i} fill="var(--forest-front)">
          <path
            d={p.stem}
            stroke="var(--forest-front)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {p.fronds.map((fr, j) => (
            <path key={j} d={fr} />
          ))}
        </g>
      ))}
      <path d={FRONT} fill="var(--forest-front)" />
      <rect x="0" y="356" width={W} height={H - 356} fill="url(#river)" />
      <g stroke="var(--river-glint)" strokeWidth="2" strokeLinecap="round">
        {RIPPLES.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}

const BIRDS = [
  [10, 30, 1],
  [50, 18, 0.8],
  [80, 36, 0.7],
  [120, 12, 0.9],
] as const

/** O dia: sol macio e araras planando. Some à noite. */
export function Day({ className }: { className?: string }): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn('day pointer-events-none absolute inset-0', className)}
    >
      <div className="absolute right-[12%] top-[12%] size-[clamp(70px,9vw,130px)] rounded-full bg-white shadow-[0_0_0_14px_rgba(255,255,255,0.35),0_0_80px_40px_rgba(255,255,255,0.75),0_0_200px_100px_rgba(49,225,247,0.22)]" />
      <svg
        viewBox="0 0 200 60"
        className="birds absolute left-[52%] top-[10%] w-[min(180px,26vw)]"
      >
        {BIRDS.map(([x, y, s], i) => (
          <path
            key={i}
            d={`M ${x} ${y} q ${6 * s} ${-7 * s} ${12 * s} 0 q ${6 * s} ${-7 * s} ${12 * s} 0`}
            fill="none"
            stroke="#01111B"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  )
}

/**
 * As estrelas: uma em oito é grande e ciano, o resto pequeno e branco-azulado.
 * A cor sai junto com o tamanho, no mesmo sorteio, para as duas nunca
 * discordarem.
 */
const STARS = (() => {
  const r = rng(42)
  return Array.from({ length: 160 }, (_, i) => {
    const x = r() * 100
    const y = r() * 72
    let s = 0.6 + r() * 0.8
    let fill = '#E8F6FF'
    if (r() < 0.12) {
      s = 1.8
      fill = '#31E1F7'
    }
    return { x, y, s, fill, d: (r() * 6).toFixed(2), k: i }
  })
})()

/** O céu estrelado, só à noite. */
export function Galaxy({
  className,
}: {
  className?: string
}): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn('galaxy pointer-events-none absolute inset-0', className)}
    >
      <svg
        className="size-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        {STARS.map((st) => (
          <circle
            key={st.k}
            cx={st.x * 14.4}
            cy={st.y * 9}
            r={st.s}
            className="twinkle"
            style={{ animationDelay: `-${st.d}s` }}
            fill={st.fill}
          />
        ))}
      </svg>
    </div>
  )
}

/**
 * O céu inteiro sobre a mata. `fade` desbota a base para o fundo da página, e
 * sai no rodapé, onde a mata é o fim e não uma transição.
 */
export function SkyBackdrop({
  className,
  fade = true,
}: {
  className?: string
  fade?: boolean
}): React.JSX.Element {
  return (
    <div
      data-slot="sky-backdrop"
      aria-hidden="true"
      className={cn('sky absolute inset-0 overflow-hidden', className)}
    >
      <Day />
      <Galaxy />
      <Forest />
      {fade && (
        <div className="absolute inset-x-0 bottom-0 h-[6%] bg-gradient-to-b from-transparent to-background" />
      )}
    </div>
  )
}
