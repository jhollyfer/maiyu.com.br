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
      <AnimateInView className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center md:px-8">
        {pill && <span className="pill mb-7">{pill}</span>}
        <h1 className="text-[clamp(2.4rem,5vw,4.75rem)] leading-[1.02] tracking-[-0.045em]">{title}</h1>
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
