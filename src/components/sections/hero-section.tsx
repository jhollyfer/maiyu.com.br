import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";

export function HeroSection() {
  const { t } = useLanguage();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: "#080f0b" }}
    >
      {/* Subtle horizontal grid lines — industrial texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(transparent 95%, rgba(255,255,255,0.04) 95%)",
          backgroundSize: "100% 48px",
        }}
      />

      {/* AMAZÔNIA watermark — the differentiation anchor */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none select-none overflow-hidden pb-0">
        <span
          className="font-heading font-black text-white leading-none tracking-tighter uppercase whitespace-nowrap"
          style={{ fontSize: "clamp(80px, 17vw, 300px)", opacity: 0.028 }}
        >
          AMAZÔNIA
        </span>
      </div>

      {/* Vertical editorial rule — right side */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-px h-28 bg-white/10" />
        <span
          className="text-white/20 font-body text-[9px] tracking-[0.35em] uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          maiyu.com.br
        </span>
        <div className="w-px h-28 bg-white/10" />
      </div>

      <div className="container mx-auto px-6 pt-32 pb-24 relative z-10">
        <div className="max-w-5xl">

          {/* Coordinate location badge */}
          <AnimateInView delay={0}>
            <div className="flex items-center gap-3 mb-10">
              <span className="w-8 h-px bg-maiyu-amber inline-block" />
              <span className="text-maiyu-amber font-body text-xs tracking-[0.22em] uppercase">
                04°22'S 70°01'W · Benjamin Constant, AM
              </span>
            </div>
          </AnimateInView>

          {/* Main headline — Fraunces mixed weights */}
          <AnimateInView delay={0.1}>
            <h1
              className="font-heading leading-[0.88] mb-10 tracking-tight"
              style={{ fontSize: "clamp(52px, 8vw, 116px)" }}
            >
              <span className="block font-black text-foreground">Software</span>
              <span className="block font-light italic text-foreground/50">
                from the
              </span>
              <span className="block font-black text-maiyu-amber">Amazon.</span>
            </h1>
          </AnimateInView>

          <div className="flex flex-col lg:flex-row gap-12 lg:items-end">
            <div className="flex-1">
              {/* Description */}
              <AnimateInView delay={0.2}>
                <p className="font-body text-sm text-foreground/50 max-w-sm mb-10 leading-[1.9]">
                  {t("hero.description")}
                </p>
              </AnimateInView>

              {/* CTAs — square, intentional */}
              <AnimateInView delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => scrollTo("projects")}
                    className="py-3.5 px-8 bg-maiyu-amber text-maiyu-dark font-body text-sm font-bold tracking-wider uppercase transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t("hero.seeWork")} →
                  </button>
                  <button
                    onClick={() => scrollTo("contact")}
                    className="py-3.5 px-8 border border-white/15 text-foreground/60 font-body text-sm tracking-wider uppercase transition-all duration-200 hover:border-white/30 hover:text-foreground"
                  >
                    {t("hero.talkToUs")}
                  </button>
                </div>
              </AnimateInView>
            </div>

            {/* Editorial aside — metrics */}
            <AnimateInView delay={0.45} className="hidden lg:block">
              <div className="border-l border-white/10 pl-8 space-y-6">
                <div>
                  <div
                    className="font-heading font-black text-foreground"
                    style={{ fontSize: "2rem" }}
                  >
                    3+
                  </div>
                  <div className="text-white/35 font-body text-[10px] tracking-widest uppercase mt-1">
                    Produtos lançados
                  </div>
                </div>
                <div>
                  <div
                    className="font-heading font-black text-foreground"
                    style={{ fontSize: "2rem" }}
                  >
                    4
                  </div>
                  <div className="text-white/35 font-body text-[10px] tracking-widest uppercase mt-1">
                    Engenheiros
                  </div>
                </div>
                <div>
                  <div
                    className="font-heading font-black text-maiyu-green"
                    style={{ fontSize: "2rem" }}
                  >
                    AM
                  </div>
                  <div className="text-white/35 font-body text-[10px] tracking-widest uppercase mt-1">
                    Amazônia
                  </div>
                </div>
              </div>
            </AnimateInView>
          </div>
        </div>
      </div>
    </section>
  );
}
