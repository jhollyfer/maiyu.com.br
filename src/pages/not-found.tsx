import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { ArrowLeft } from "lucide-react";

export function NotFound() {
  const location = useLocation();
  const { t } = useLanguage();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="relative min-h-[100dvh] flex items-center bg-background overflow-hidden">
      <div className="absolute inset-0 bg-gradient-paper pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full grid grid-cols-12 gap-8 items-center py-24">
        <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-4">
          <p className="font-mono text-small tracking-[0.22em] uppercase text-muted-foreground mb-6">
            — {t("notFound.code")}
          </p>
          <p className="font-sans text-body text-foreground/60 max-w-xs">
            <span className="font-mono text-micro text-muted-foreground block mb-1">
              {location.pathname}
            </span>
          </p>
        </AnimateInView>

        <AnimateInView
          variant="fadeUp"
          delay={0.1}
          className="col-span-12 md:col-span-8"
        >
          <h1 className="font-display text-display font-400 leading-[0.95] tracking-[-0.035em] text-foreground max-w-3xl">
            {t("notFound.title")}
          </h1>
          <p className="font-sans text-body-lg text-foreground/75 leading-[1.65] mt-10 max-w-xl">
            {t("notFound.description")}
          </p>

          <Link
            to="/"
            className="group inline-flex items-center gap-1 pl-6 pr-1 py-1 rounded-full bg-foreground text-background font-sans text-[13px] font-medium tracking-[0.02em] mt-12 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color:var(--color-forest)] hover:text-[color:var(--color-canvas-cream)] dark:hover:bg-[color:var(--color-forest-bright)] active:scale-[0.97]"
          >
            <span className="py-2.5">{t("notFound.returnHome")}</span>
            <span className="ml-2 flex size-9 items-center justify-center rounded-full bg-background/15 group-hover:bg-background/25 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-0.5">
              <ArrowLeft size={14} strokeWidth={1.6} />
            </span>
          </Link>
        </AnimateInView>
      </div>
    </div>
  );
}
