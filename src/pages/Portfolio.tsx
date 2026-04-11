import { useLanguage } from "@/contexts/language";
import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { projects, featuredProject } from "@/data/projects";

const Portfolio = () => {
  const { t, language } = useLanguage();

  const rest = projects.filter((p) => p.slug !== featuredProject.slug);

  return (
    <div className="bg-background min-h-screen">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-paper pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-12 gap-8">
          <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-4">
            <p className="eyebrow">— {t("portfolio.eyebrow")}</p>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.1}
            className="col-span-12 md:col-span-8"
          >
            <h1 className="font-display text-display font-400 leading-[0.92] tracking-[-0.035em] text-foreground">
              <span className="block">{t("portfolio.heroTitle1")}</span>
              <span className="block italic font-300 text-[color:var(--color-forest)] dark:text-[color:var(--color-forest-bright)]">
                {t("portfolio.heroTitle2")}
              </span>
              <span className="block">{t("portfolio.heroTitle3")}</span>
            </h1>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.2}
            className="col-span-12 md:col-span-6 md:col-start-7 mt-10"
          >
            <p className="font-sans text-body-lg text-foreground/75 leading-[1.65] max-w-xl">
              {t("portfolio.heroDescription")}
            </p>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Featured case study — full-bleed magazine ─────────── */}
      <section className="pt-12 md:pt-16 pb-24 md:pb-32 bg-canvas-sand dark:bg-canvas-shale">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <AnimateInView variant="fadeUp">
            <a
              href={featuredProject.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              {(() => {
                const featuredMeta = (
                  <>
                    <p className="font-mono text-micro text-foreground/70 mb-3 tabular-nums">
                      {featuredProject.year} ·{" "}
                      {featuredProject.client[language]}
                    </p>
                    <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-foreground">
                      {featuredProject.title}
                    </h2>
                    <p className="font-sans text-body text-foreground/75 mt-4 max-w-xl">
                      {featuredProject.summary[language]}
                    </p>
                  </>
                );
                return (
                  <>
                    <div className="relative overflow-hidden rounded-[2.5rem] aspect-[4/3] md:aspect-[21/9] bg-canvas-sand dark:bg-canvas-moss">
                      <img
                        src={featuredProject.image}
                        alt={featuredProject.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                      />
                      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

                      <div className="absolute top-5 md:top-8 left-5 md:left-8">
                        <span className="inline-flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-md px-4 py-1.5 text-[10px] tracking-[0.22em] uppercase font-medium text-foreground">
                          <span className="size-1 rounded-full bg-[color:var(--color-amber)]" />
                          {t("portfolio.featuredLabel")}
                        </span>
                      </div>

                      <div className="hidden md:block absolute bottom-0 left-0 right-0 p-12">
                        <div className="grid grid-cols-12 gap-8 items-end">
                          <div className="col-span-8">{featuredMeta}</div>
                          <div className="flex col-span-4 justify-end">
                            <span className="inline-flex items-center gap-1.5 pl-5 pr-1 py-1 rounded-full bg-background/90 backdrop-blur-md text-foreground text-[12px] font-medium tracking-[0.06em] font-sans transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-[color:var(--color-amber)] group-hover:text-[color:var(--color-canvas-night)]">
                              {t("portfolio.visitSite")}
                              <span className="ml-1 flex size-7 items-center justify-center rounded-full bg-foreground/10 group-hover:bg-[color:var(--color-canvas-night)]/15 transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                                <ArrowUpRight size={12} strokeWidth={1.6} />
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="md:hidden mt-6 px-1">{featuredMeta}</div>
                  </>
                );
              })()}
            </a>
          </AnimateInView>

          {/* Featured meta row */}
          <AnimateInView variant="fadeUp" delay={0.1} className="mt-10 md:mt-14">
            <div className="grid grid-cols-12 gap-6 md:gap-10 pt-10 border-t border-foreground/[0.08]">
              <div className="col-span-12 md:col-span-4">
                <p className="eyebrow mb-3">— Case Study</p>
                <p className="font-sans text-body text-foreground/80 leading-[1.65]">
                  {featuredProject.description[language]}
                </p>
              </div>
              <div className="col-span-6 md:col-span-4 md:col-start-7">
                <p className="eyebrow mb-3">— Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {featuredProject.tech.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-full border border-foreground/15 px-2.5 py-0.5 text-micro font-sans text-foreground/80"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-6 md:col-span-3 md:col-start-11 md:justify-self-end">
                <p className="eyebrow mb-3">— Year</p>
                <p className="font-display text-h3 font-400 text-foreground tabular-nums">
                  {featuredProject.year}
                </p>
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* ─── Other projects — forest editorial block ──────────── */}
      <section className="relative pb-32 md:pb-40 bg-canvas-forest dark:bg-canvas-night text-[color:var(--color-canvas-cream)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(216,138,43,0.09),_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-24 md:pt-32">
          <div className="grid grid-cols-12 gap-8 mb-16">
            <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-4">
              <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/55">
                — More work
              </p>
            </AnimateInView>
            <AnimateInView
              variant="fadeUp"
              delay={0.1}
              className="col-span-12 md:col-span-8"
            >
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-[color:var(--color-canvas-cream)] max-w-3xl">
                {t("home.selectedWorkDesc")}
              </h2>
            </AnimateInView>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            {rest.map((project, idx) => (
              <motion.div
                key={project.slug}
                variants={staggerItemVariants}
                className={
                  idx % 2 === 0
                    ? "md:col-span-7"
                    : "md:col-span-5 md:mt-24"
                }
              >
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div
                    className={`relative overflow-hidden rounded-[2rem] bg-canvas-night/50 ring-1 ring-[color:var(--color-canvas-cream)]/10 ${
                      idx % 2 === 0 ? "aspect-[16/10]" : "aspect-[4/5]"
                    }`}
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0B]/40 via-transparent to-transparent" />
                  </div>
                  <div className="mt-6 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-micro text-[color:var(--color-canvas-cream)]/55 tabular-nums">
                          {project.year}
                        </span>
                        <span className="size-0.5 rounded-full bg-[color:var(--color-canvas-cream)]/40" />
                        <span className="font-sans text-micro text-[color:var(--color-amber)] tracking-[0.1em] uppercase">
                          {project.client[language]}
                        </span>
                      </div>
                      <h3 className="font-display text-h2 font-400 tracking-[-0.02em] text-[color:var(--color-canvas-cream)] group-hover:text-[color:var(--color-amber)] transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                        {project.title}
                      </h3>
                      <p className="font-sans text-body text-[color:var(--color-canvas-cream)]/70 mt-3 max-w-lg leading-relaxed">
                        {project.summary[language]}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {project.tech.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center rounded-full border border-[color:var(--color-canvas-cream)]/20 px-2.5 py-0.5 text-micro font-sans text-[color:var(--color-canvas-cream)]/70"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowUpRight
                      size={20}
                      strokeWidth={1.3}
                      className="text-[color:var(--color-canvas-cream)]/40 mt-1 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-[color:var(--color-amber)] group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </div>
                </a>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
