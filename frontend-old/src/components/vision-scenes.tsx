import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const INK = "#E8F6FF";
const GREEN = "#88FF9A";
const CYAN = "#31E1F7";
const BLUE = "#77EED7";
const PURPLE = "#A480F5";

/** 1 · Built for the edge: the tri-border towns along the Solimões, linked even on weak signal. */
function EdgeScene({ draw }: { draw: boolean }) {
  const towns = [
    { x: 150, y: 150, name: "Atalaia do Norte" },
    { x: 262, y: 236, name: "Benjamin Constant", home: true },
    { x: 404, y: 196, name: "Tabatinga" },
    { x: 446, y: 262, name: "Letícia" },
    { x: 352, y: 318, name: "Santa Rosa" },
  ];
  const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [1, 4], [4, 3]];
  return (
    <svg viewBox="0 0 600 420" className="size-full">
      {/* the river */}
      <path
        d="M -20 110 C 90 140, 160 250, 262 262 S 420 230, 470 300 S 560 400, 640 380"
        fill="none"
        stroke={CYAN}
        strokeOpacity="0.28"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d="M -20 110 C 90 140, 160 250, 262 262 S 420 230, 470 300 S 560 400, 640 380"
        fill="none"
        stroke={CYAN}
        strokeOpacity="0.7"
        strokeWidth="2"
      />
      {/* links that survive a bad network */}
      {links.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={towns[a].x}
          y1={towns[a].y}
          x2={towns[b].x}
          y2={towns[b].y}
          stroke={GREEN}
          strokeOpacity="0.7"
          strokeWidth="1.5"
          strokeDasharray="4 7"
          initial={draw ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.2 + i * 0.12, ease: EASE }}
        />
      ))}
      {towns.map((t, i) => (
        <g key={t.name}>
          {t.home && (
            <circle cx={t.x} cy={t.y} r="22" fill={GREEN} fillOpacity="0.14" className="vision-pulse" />
          )}
          <circle cx={t.x} cy={t.y} r={t.home ? 8 : 5} fill={t.home ? GREEN : INK} />
          <text
            x={t.x + (i === 0 ? -8 : 12)}
            y={t.y - 12}
            textAnchor={i === 0 ? "end" : "start"}
            fill={INK}
            fillOpacity={t.home ? 0.95 : 0.6}
            fontSize={t.home ? 14 : 12}
            fontWeight={t.home ? 700 : 500}
            fontFamily="var(--font-sans)"
          >
            {t.name}
          </text>
        </g>
      ))}
      {/* weak signal, still working: one bar lit and a synced check */}
      <g transform="translate(236 290)">
        <rect x="0" y="0" width="92" height="50" rx="12" fill="#0B1E2B" stroke={INK} strokeOpacity="0.15" />
        {[0, 1, 2, 3].map((b) => (
          <rect key={b} x={14 + b * 9} y={30 - b * 5} width="5" height={8 + b * 5} rx="1.5" fill={b === 0 ? GREEN : INK} fillOpacity={b === 0 ? 1 : 0.18} />
        ))}
        <circle cx="68" cy="25" r="11" fill={GREEN} />
        <path d="M 62.5 25 l 4 4 l 7 -8" fill="none" stroke="#01111B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

const PEOPLE: [number, number, string][] = [
  [170, 350, GREEN],
  [240, 362, BLUE],
  [310, 350, PURPLE],
  [380, 362, CYAN],
];

/** 2 · Owned by the people who use it: code and docs handed over to the community. */
function OwnedScene({ draw }: { draw: boolean }) {
  const code: [number, number, string][] = [
    [0, 120, PURPLE], [18, 170, BLUE], [18, 90, INK], [36, 140, GREEN], [36, 60, INK], [18, 110, CYAN], [0, 80, PURPLE],
  ];
  return (
    <svg viewBox="0 0 600 420" className="size-full">
      {/* editor */}
      <motion.g initial={draw ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
        <rect x="60" y="60" width="300" height="230" rx="18" fill="#0B1E2B" stroke={INK} strokeOpacity="0.14" />
        {[0, 1, 2].map((d) => (
          <circle key={d} cx={84 + d * 16} cy="84" r="5" fill={INK} fillOpacity="0.25" />
        ))}
        {code.map(([indent, w, c], i) => (
          <rect key={i} x={86 + indent} y={112 + i * 22} width={w} height="9" rx="4.5" fill={c} fillOpacity={c === INK ? 0.3 : 0.75} />
        ))}
      </motion.g>
      {/* README page */}
      <motion.g initial={draw ? { opacity: 0, y: 20 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: EASE }}>
        <rect x="300" y="120" width="210" height="190" rx="16" fill="#E8F6FF" />
        <text x="322" y="154" fill="#01111B" fontSize="15" fontWeight="800" fontFamily="var(--font-sans)">README.md</text>
        {[150, 120, 160, 90, 140].map((w, i) => (
          <rect key={i} x="322" y={172 + i * 22} width={w} height="8" rx="4" fill="#01111B" fillOpacity={i === 0 ? 0.55 : 0.18} />
        ))}
      </motion.g>
      {/* the people who keep it running */}
      {PEOPLE.map(([x, y, c], i) => (
        <motion.g
          key={i}
          initial={draw ? { opacity: 0, scale: 0.6 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35 + i * 0.08, ease: EASE }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <circle cx={x} cy={y} r="22" fill={c} />
          <circle cx={x} cy={y - 5} r="7" fill="#01111B" fillOpacity="0.55" />
          <path d={`M ${x - 11} ${y + 13} a 11 9 0 0 1 22 0`} fill="#01111B" fillOpacity="0.55" />
        </motion.g>
      ))}
      <path d="M 440 330 q 40 -10 50 -40" fill="none" stroke={GREEN} strokeWidth="2" strokeDasharray="4 6" />
      <circle cx="492" cy="284" r="14" fill={GREEN} />
      <path d="M 485.5 284 l 4.5 4.5 l 8 -9" fill="none" stroke="#01111B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 3 · Made to last: growth rings of a samaúma, one ring per year ahead. */
function LastScene({ draw }: { draw: boolean }) {
  const rings = 9;
  const years = [
    { ring: 2, label: "2026" },
    { ring: 5, label: "2028" },
    { ring: 8, label: "2030" },
  ];
  const ringPath = (i: number) => {
    const base = 22 + i * 17;
    // slightly wobbly ring, like real wood
    const pts = Array.from({ length: 72 }, (_, k) => {
      const a = (k / 72) * Math.PI * 2;
      const rr = base * (1 + Math.sin(a * 3 + i) * 0.035 + Math.cos(a * 5 - i) * 0.02);
      return `${(300 + Math.cos(a) * rr * 1.08).toFixed(1)} ${(210 + Math.sin(a) * rr).toFixed(1)}`;
    });
    return `M ${pts[0]} L ${pts.slice(1).join(" L ")} Z`;
  };
  return (
    <svg viewBox="0 0 600 420" className="size-full">
      <circle cx="300" cy="210" r="180" fill={GREEN} fillOpacity="0.04" />
      {Array.from({ length: rings }, (_, i) => (
        <motion.path
          key={i}
          d={ringPath(i)}
          fill="none"
          stroke={i % 3 === 2 ? GREEN : i % 2 ? CYAN : INK}
          strokeOpacity={i % 3 === 2 ? 0.9 : 0.35}
          strokeWidth={i % 3 === 2 ? 2.5 : 1.5}
          strokeLinejoin="round"
          initial={draw ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: i * 0.06, ease: EASE }}
        />
      ))}
      <circle cx="300" cy="210" r="8" fill={GREEN} />
      <line x1="300" y1="210" x2="480" y2="210" stroke={INK} strokeOpacity="0.25" strokeDasharray="3 5" />
      {years.map((y) => (
        <g key={y.label}>
          <circle cx={300 + (22 + y.ring * 17) * 1.08} cy="210" r="4" fill={GREEN} />
          <rect x={300 + (22 + y.ring * 17) * 1.08 - 20} y="222" width="40" height="20" rx="10" fill="#01111B" />
          <text
            x={300 + (22 + y.ring * 17) * 1.08}
            y="236"
            textAnchor="middle"
            fill={INK}
            fillOpacity="0.8"
            fontSize="13"
            fontWeight="700"
            fontFamily="var(--font-sans)"
          >
            {y.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Illustration for each vision step, crossfading as the reader scrolls. */
export function VisionScene({ step }: { step: number }) {
  const reduce = useReducedMotion();
  const draw = !reduce;
  const Scene = [EdgeScene, OwnedScene, LastScene][step] ?? EdgeScene;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className="absolute inset-0 flex items-center justify-center p-6 md:p-10"
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Scene draw={draw} />
      </motion.div>
    </AnimatePresence>
  );
}
