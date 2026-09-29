import { cn } from "@/lib/utils";

/** Small deterministic PRNG so the forest and the stars are stable across renders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const W = 1440;

/** Rainforest canopy ridge: broad cauliflower crowns built from overlapping lobes,
 *  with a few emergent giants rising above the rest, as the Amazon reads from afar. */
function canopyPath(seed: number, base: number, crown: number, emergents: number) {
  const r = rng(seed);
  const giants = new Set(Array.from({ length: emergents }, () => Math.floor(r() * 18)));
  let d = `M0 ${base}`;
  let x = 0;
  let i = 0;
  while (x < W) {
    const giant = giants.has(i);
    const w = crown * (giant ? 2.6 + r() * 1.2 : 2 + r() * 2.4);
    const h = crown * (giant ? 1.5 + r() * 0.6 : 0.45 + r() * 0.55);
    const lobes = 3 + Math.floor(r() * 3);
    const lw = w / lobes;
    const y = (f: number) => base - h * Math.pow(Math.sin(Math.PI * f), 0.55) - (f > 0 && f < 1 ? r() * crown * 0.12 : 0);
    for (let j = 0; j < lobes; j++) {
      const nx = x + lw * (j + 1);
      const ny = j === lobes - 1 ? base : y((j + 1) / lobes);
      d += ` A ${lw * 0.56} ${lw * 0.5} 0 0 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`;
    }
    x += w;
    i++;
  }
  return `${d} L ${x.toFixed(1)} 400 L 0 400 Z`;
}

const RIDGES = [
  { d: canopyPath(7, 250, 46, 3), fill: "var(--forest-back)" },
  { d: canopyPath(19, 305, 52, 2), fill: "var(--forest-mid)" },
  { d: canopyPath(31, 360, 40, 2), fill: "var(--forest-front)" },
];

/** Amazon canopy silhouette, three ridges fading into the page. */
export function Forest({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} 400`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-[30%] w-full", className)}
    >
      {RIDGES.map((ridge, i) => (
        <path key={i} d={ridge.d} fill={ridge.fill} />
      ))}
    </svg>
  );
}

const STARS = (() => {
  const r = rng(42);
  return Array.from({ length: 140 }, (_, i) => ({
    x: r() * 100,
    y: r() * 70,
    s: r() < 0.12 ? 1.8 : 0.6 + r() * 0.8,
    d: (r() * 6).toFixed(2),
    k: i,
  }));
})();

/** Starfield and nebula, only at night. */
export function Galaxy({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("galaxy pointer-events-none absolute inset-0", className)}>
      <svg className="size-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900">
        {STARS.map((st) => (
          <circle
            key={st.k}
            cx={st.x * 14.4}
            cy={st.y * 9}
            r={st.s}
            className="twinkle"
            style={{ animationDelay: `-${st.d}s` }}
            fill={st.s > 1.5 ? "#31E1F7" : "#E8F6FF"}
          />
        ))}
      </svg>
    </div>
  );
}

/** Sky over the rainforest: cyan day, starry galaxy at night. */
export function SkyBackdrop({ className, fade = true }: { className?: string; fade?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("sky absolute inset-0 overflow-hidden", className)}>
      <Galaxy />
      <Forest />
      {fade && (
        <div className="absolute inset-x-0 bottom-0 h-[8%] bg-gradient-to-b from-transparent to-background" />
      )}
    </div>
  );
}
