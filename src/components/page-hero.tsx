import { AnimateInView } from "@/components/motion/animate-in-view";
import { SkyBackdrop } from "@/components/sky";
import type { ReactNode } from "react";

/** Centered sky header shared by the inner pages. */
export function PageHero({
  pill,
  title,
  lead,
  children,
}: {
  pill?: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      <SkyBackdrop />
      <div className="rails pointer-events-none absolute inset-0 opacity-60" />
      <AnimateInView className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center md:px-8">
        {pill && <span className="pill mb-7">{pill}</span>}
        <h1 className="text-[clamp(2.4rem,5.5vw,5.25rem)] leading-[0.98] tracking-[-0.05em] text-[#253241] dark:text-foreground">{title}</h1>
        {lead && (
          <p className="mt-7 max-w-[46ch] font-serif text-lead leading-snug text-foreground/80">
            {lead}
          </p>
        )}
        {children}
      </AnimateInView>
    </section>
  );
}
