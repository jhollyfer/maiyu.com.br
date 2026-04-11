import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { useLanguage } from "@/contexts/language";
import { projects } from "@/data/projects";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Database,
  Globe,
  Leaf,
  Palette,
  Server,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const { t, language } = useLanguage();

  const services = [
    {
      icon: Globe,
      title: t("home.serviceWeb"),
      desc: t("home.serviceWebDesc"),
      num: "01",
    },
    {
      icon: Smartphone,
      title: t("home.serviceMobile"),
      desc: t("home.serviceMobileDesc"),
      num: "02",
    },
    {
      icon: Server,
      title: t("home.serviceBackend"),
      desc: t("home.serviceBackendDesc"),
      num: "03",
    },
    {
      icon: Database,
      title: t("home.serviceDatabase"),
      desc: t("home.serviceDatabaseDesc"),
      num: "04",
    },
    {
      icon: Palette,
      title: t("home.serviceDesign"),
      desc: t("home.serviceDesignDesc"),
      num: "05",
    },
    {
      icon: Leaf,
      title: t("home.serviceImpact"),
      desc: t("home.serviceImpactDesc"),
      num: "06",
    },
  ];

  const selectedWork = projects.slice(0, 3);

  return (
    <div className="bg-background relative">
      {/* ═══════════════════════════════════════════════════════
         HERO — editorial asymmetric split
      ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 md:pt-40 pb-20 md:pb-28">
        <div className="absolute inset-0 bg-gradient-paper pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-12 gap-6 md:gap-8 items-end">
          {/* Eyebrow meta — left column, offset */}
          <AnimateInView
            variant="fadeUp"
            className="col-span-12 md:col-span-3 md:pt-6"
          >
            <div className="flex md:flex-col gap-3 md:gap-5 items-start">
              <div className="inline-flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[color:var(--color-amber)] opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[color:var(--color-amber)]" />
                </span>
                <span className="eyebrow">{t("home.eyebrow")}</span>
              </div>
              <div className="hairline hidden md:block" />
              <p className="eyebrow max-w-[18ch] leading-relaxed">
                {t("home.badge")}
              </p>
            </div>
          </AnimateInView>

          {/* Display headline — 9-col span */}
          <div className="col-span-12 md:col-span-9">
            <AnimateInView variant="fadeUp" delay={0.1}>
              <h1 className="font-display font-400 text-display-xl leading-[0.92] tracking-[-0.035em] text-foreground">
                <span className="block">{t("home.heroTitle1")}</span>
                <span className="block italic font-300 text-[color:var(--color-forest)] dark:text-[color:var(--color-forest-bright)]">
                  {t("home.heroTitle2")}
                </span>
                <span className="block">{t("home.heroTitle3")}</span>
              </h1>
            </AnimateInView>
          </div>

          {/* Description + CTA — breaks grid, lower-right */}
          <AnimateInView
            variant="fadeUp"
            delay={0.25}
            className="col-span-12 md:col-span-5 md:col-start-8 mt-12 md:mt-16"
          >
            <p className="font-sans text-body-lg text-foreground/75 leading-[1.65] max-w-lg mb-8">
              {t("home.heroDescription")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-1 pl-6 pr-1.5 py-1.5 rounded-full bg-foreground text-background font-sans text-[13px] font-medium tracking-[0.02em] transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color:var(--color-forest)] hover:text-[color:var(--color-canvas-cream)] dark:hover:bg-[color:var(--color-forest-bright)] active:scale-[0.97]"
              >
                <span className="py-2">{t("home.startProject")}</span>
                <span className="ml-2 flex size-9 items-center justify-center rounded-full bg-background/15 group-hover:bg-background/25 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight size={14} strokeWidth={1.6} />
                </span>
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-foreground/20 text-foreground font-sans text-[13px] font-medium tracking-[0.02em] transition-[color,border-color,background-color] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-foreground/40 hover:bg-foreground/[0.04]"
              >
                {t("home.viewWork")}
              </Link>
            </div>
          </AnimateInView>
        </div>

        {/* Full-bleed photo band breaking below hero text */}
        <AnimateInView
          variant="scaleIn"
          delay={0.3}
          duration={1.2}
          className="relative max-w-7xl mx-auto px-6 md:px-10 mt-20 md:mt-28"
        >
          <div className="bezel-shell">
            <div className="bezel-core relative overflow-hidden aspect-[21/9] md:aspect-[21/8]">
              <img
                src="/images/adacaibs.webp"
                alt="Maiyu craft"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img
                      src="/jhollyfer.png"
                      alt="Jhollyfer"
                      className="size-9 rounded-full ring-2 ring-background object-cover"
                    />
                    <img
                      src="/lenny.png"
                      alt="Lenny"
                      className="size-9 rounded-full ring-2 ring-background object-cover"
                    />
                    <img
                      src="/matheus.png"
                      alt="Matheus"
                      className="size-9 rounded-full ring-2 ring-background object-cover"
                    />
                  </div>
                  <p className="font-sans text-small text-foreground/90">
                    {t("career.teamCount")}
                  </p>
                </div>
                <span className="eyebrow hidden md:inline-block">
                  Benjamin Constant · AM · BR
                </span>
              </div>
            </div>
          </div>
        </AnimateInView>
      </section>

      {/* ═══════════════════════════════════════════════════════
         STATS — woven into prose, not cards
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 border-t border-foreground/[0.06]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-12 gap-8">
          <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-3">
            <p className="eyebrow">{t("home.statsLabel")}</p>
          </AnimateInView>
          <AnimateInView
            variant="fadeUp"
            delay={0.1}
            className="col-span-12 md:col-span-9"
          >
            <p className="font-display text-h2 leading-[1.15] text-foreground/85 max-w-4xl">
              {t("home.statsProse")
                .split(/(\{team\}|\{count\}|\{location\})/)
                .map((part, i) => {
                  if (part === "{team}")
                    return (
                      <span
                        key={i}
                        className="text-[color:var(--color-forest)] dark:text-[color:var(--color-forest-bright)] italic"
                      >
                        {t("home.statsTeam")}
                      </span>
                    );
                  if (part === "{count}")
                    return (
                      <span
                        key={i}
                        className="text-[color:var(--color-amber)] tabular-nums"
                      >
                        {t("home.statsCount")}
                      </span>
                    );
                  if (part === "{location}")
                    return (
                      <span
                        key={i}
                        className="underline decoration-2 decoration-[color:var(--color-amber)]/60 underline-offset-[6px]"
                      >
                        {t("home.statsLocation")}
                      </span>
                    );
                  return <span key={i}>{part}</span>;
                })}
            </p>
          </AnimateInView>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SERVICES — forest narrative block (cream-on-forest)
      ═══════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 bg-canvas-forest dark:bg-canvas-night text-[color:var(--color-canvas-cream)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(216,138,43,0.08),_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          {/* Section header */}
          <div className="grid grid-cols-12 gap-8 mb-16 md:mb-24">
            <AnimateInView
              variant="fadeUp"
              className="col-span-12 md:col-span-3"
            >
              <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/55">
                — {t("home.servicesLabel")}
              </p>
            </AnimateInView>
            <AnimateInView
              variant="fadeUp"
              delay={0.1}
              className="col-span-12 md:col-span-9"
            >
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-[color:var(--color-canvas-cream)] max-w-4xl">
                {t("home.servicesHeading")}
              </h2>
              <p className="font-sans text-body-lg text-[color:var(--color-canvas-cream)]/70 mt-6 max-w-xl leading-relaxed">
                {t("home.servicesSubheading")}
              </p>
            </AnimateInView>
          </div>

          {/* Alternating rows — editorial list, not card grid */}
          <StaggerContainer className="flex flex-col">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                variants={staggerItemVariants}
                className={`group grid grid-cols-12 gap-4 md:gap-8 py-8 md:py-10 border-t border-[color:var(--color-canvas-cream)]/[0.1] ${
                  i === services.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="col-span-2 md:col-span-1">
                  <span className="font-mono text-small text-[color:var(--color-amber)] tabular-nums">
                    {service.num}
                  </span>
                </div>
                <div className="col-span-10 md:col-span-4">
                  <div className="flex items-center gap-3">
                    <service.icon
                      size={18}
                      strokeWidth={1.4}
                      className="text-[color:var(--color-amber)] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[-8deg]"
                    />
                    <h3 className="font-display text-h3 font-400 tracking-[-0.02em] text-[color:var(--color-canvas-cream)]">
                      {service.title}
                    </h3>
                  </div>
                </div>
                <div className="col-span-12 md:col-span-6 md:col-start-7">
                  <p className="font-sans text-body text-[color:var(--color-canvas-cream)]/70 leading-relaxed max-w-md">
                    {service.desc}
                  </p>
                </div>
                <div className="col-span-12 md:col-span-1 flex md:justify-end">
                  <ArrowUpRight
                    size={18}
                    strokeWidth={1.2}
                    className="text-[color:var(--color-canvas-cream)]/40 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-[color:var(--color-amber)] group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SELECTED WORK — asymmetric 1-wide + 2 stacked
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 bg-canvas-bone dark:bg-canvas-moss">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-12 gap-8 mb-16">
            <AnimateInView
              variant="fadeUp"
              className="col-span-12 md:col-span-3"
            >
              <p className="eyebrow">— {t("home.selectedWork")}</p>
            </AnimateInView>
            <AnimateInView
              variant="fadeUp"
              delay={0.1}
              className="col-span-12 md:col-span-9"
            >
              <h2 className="font-display text-h1 font-400 leading-[0.98] tracking-[-0.025em] text-foreground max-w-3xl">
                {t("home.selectedWorkDesc")}
              </h2>
            </AnimateInView>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* Featured big */}
            <AnimateInView
              variant="fadeUp"
              className="md:col-span-8 md:row-span-2"
            >
              <a
                href={selectedWork[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative overflow-hidden rounded-[2rem] aspect-[4/3] bg-canvas-sand dark:bg-canvas-moss">
                  <img
                    src={selectedWork[0].image}
                    alt={selectedWork[0].title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-background/5 to-transparent" />
                  <div className="absolute top-6 left-6">
                    <span className="inline-flex items-center gap-2 rounded-full bg-background/85 backdrop-blur-md px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-medium text-foreground">
                      <span className="size-1 rounded-full bg-[color:var(--color-amber)]" />
                      {selectedWork[0].year}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-h2 font-400 tracking-[-0.02em] text-foreground group-hover:text-[color:var(--color-forest)] dark:group-hover:text-[color:var(--color-forest-bright)] transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                      {selectedWork[0].title}
                    </h3>
                    <p className="font-sans text-body text-foreground/70 mt-2 max-w-md">
                      {selectedWork[0].summary[language]}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={20}
                    strokeWidth={1.3}
                    className="text-muted-foreground mt-2 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-[color:var(--color-amber)] group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </a>
            </AnimateInView>

            {/* Two stacked */}
            {selectedWork.slice(1).map((project, i) => (
              <AnimateInView
                key={project.slug}
                variant="fadeUp"
                delay={0.1 + i * 0.1}
                className="md:col-span-4"
              >
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-[1.5rem] aspect-[5/4] bg-canvas-sand dark:bg-canvas-moss">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-micro text-muted-foreground tabular-nums">
                        {project.year}
                      </p>
                      <h4 className="font-display text-h3 font-400 tracking-[-0.02em] text-foreground mt-1 group-hover:text-[color:var(--color-forest)] dark:group-hover:text-[color:var(--color-forest-bright)] transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                        {project.title}
                      </h4>
                    </div>
                    <ArrowUpRight
                      size={16}
                      strokeWidth={1.3}
                      className="text-muted-foreground mt-2 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-[color:var(--color-amber)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </a>
              </AnimateInView>
            ))}
          </div>

          <AnimateInView variant="fadeUp" delay={0.2} className="mt-16">
            <Link
              to="/portfolio"
              className="group inline-flex items-center gap-2 font-sans text-body text-foreground hover:text-[color:var(--color-forest)] dark:hover:text-[color:var(--color-forest-bright)] transition-colors duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <span className="border-b border-current pb-0.5">
                {t("portfolio.loadMore")}
              </span>
              <ArrowUpRight
                size={15}
                strokeWidth={1.4}
                className="transition-transform duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </AnimateInView>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         CTA — full-bleed forest section
      ═══════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-40 bg-canvas-forest dark:bg-canvas-night text-[color:var(--color-canvas-cream)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-paper opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[60%] h-full bg-[radial-gradient(ellipse_at_right,_rgba(216,138,43,0.12),_transparent_60%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-12 gap-8">
          <AnimateInView variant="fadeUp" className="col-span-12 md:col-span-3">
            <p className="font-sans text-micro tracking-[0.22em] uppercase font-medium text-[color:var(--color-canvas-cream)]/60">
              — {t("home.ctaDescription")}
            </p>
          </AnimateInView>

          <AnimateInView
            variant="fadeUp"
            delay={0.12}
            className="col-span-12 md:col-span-9"
          >
            <h2 className="font-display text-display font-400 leading-[0.95] tracking-[-0.03em] text-[color:var(--color-canvas-cream)] max-w-5xl">
              {t("home.ctaTitle")}
            </h2>

            <div className="mt-12 md:mt-16 flex flex-wrap items-center gap-4">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-1 pl-7 pr-1.5 py-1.5 rounded-full bg-[color:var(--color-amber)] text-[color:var(--color-canvas-night)] font-sans text-[14px] font-medium tracking-[0.02em] transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color:var(--color-amber-warm)] active:scale-[0.97]"
              >
                <span className="py-2.5">{t("home.ctaButton1")}</span>
                <span className="ml-2 flex size-10 items-center justify-center rounded-full bg-[color:var(--color-canvas-night)]/15 group-hover:bg-[color:var(--color-canvas-night)]/25 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight size={15} strokeWidth={1.6} />
                </span>
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-[color:var(--color-canvas-cream)]/25 text-[color:var(--color-canvas-cream)] font-sans text-[14px] font-medium tracking-[0.02em] transition-[color,border-color,background-color] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[color:var(--color-canvas-cream)]/50 hover:bg-[color:var(--color-canvas-cream)]/[0.04]"
              >
                {t("home.ctaButton2")}
              </Link>
            </div>
          </AnimateInView>
        </div>
      </section>
    </div>
  );
};

export default Home;
