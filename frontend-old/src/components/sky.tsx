import { cn } from "@/lib/utils";
import { useId } from "react";

/** Painterly cloud: overlapping puffs roughed up by an SVG turbulence filter. */
export function Cloud({ className, seed = 3 }: { className?: string; seed?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 180" aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" style={{ stopColor: "var(--cloud)" }} />
          <stop offset="1" style={{ stopColor: "var(--cloud-shade)" }} />
        </linearGradient>
        <filter id={`f${id}`} x="-20%" y="-30%" width="140%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="34" />
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <g filter={`url(#f${id})`} fill={`url(#g${id})`}>
        <ellipse cx="200" cy="140" rx="180" ry="34" />
        <circle cx="120" cy="112" r="46" />
        <circle cx="185" cy="88" r="62" />
        <circle cx="262" cy="104" r="48" />
        <circle cx="318" cy="128" r="30" />
        <circle cx="72" cy="134" r="28" />
      </g>
    </svg>
  );
}

/** Dawn sky with drifting clouds. Night variant comes from dark tokens. */
export function SkyBackdrop({ className, fade = true }: { className?: string; fade?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("sky absolute inset-0 overflow-hidden", className)}>
      <Cloud seed={2} className="cloud-drift -left-[6%] top-[52%] w-[38%] min-w-[260px] opacity-95" />
      <Cloud seed={7} className="cloud-drift-2 -right-[4%] top-[20%] w-[18%] min-w-[150px] opacity-90" />
      <Cloud seed={11} className="cloud-drift -right-[8%] top-[64%] w-[34%] min-w-[240px]" />
      <Cloud seed={5} className="cloud-drift-2 left-[34%] top-[84%] w-[30%] min-w-[220px] opacity-90" />
      {fade && (
        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-b from-transparent to-background" />
      )}
    </div>
  );
}
