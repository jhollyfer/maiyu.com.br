import { CtaLink } from "@/components/cta-link";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { SkyBackdrop } from "@/components/sky";
import { useLanguage } from "@/contexts/language";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { useLocation } from "react-router-dom";

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
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden px-4 pt-16">
      <SkyBackdrop />
      <AnimateInView className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="pill mb-7">{t("notFound.code")}</span>
        <h1 className="text-display tracking-[-0.02em]">{t("notFound.title")}</h1>
        <p className="mt-7 max-w-[44ch] font-serif text-lead text-foreground/80">
          {t("notFound.description")}
        </p>
        <CtaLink to="/" className="mt-10">
          <ArrowLeft size={15} strokeWidth={1.75} />
          {t("notFound.returnHome")}
        </CtaLink>
      </AnimateInView>
    </section>
  );
}
