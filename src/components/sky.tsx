import { cn } from "@/lib/utils";

/** Pastel dawn sky with drifting CSS clouds. Night variant comes from dark tokens. */
export function SkyBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("sky absolute inset-0 overflow-hidden", className)}
    >
      <div className="cloud cloud-drift left-[-10%] top-[58%] h-[38%] w-[55%]" />
      <div className="cloud cloud-drift-2 right-[-12%] top-[48%] h-[42%] w-[60%]" />
      <div className="cloud cloud-drift left-[30%] top-[78%] h-[30%] w-[45%] opacity-80" />
      {/* Fade into page background so the next section joins seamlessly */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
