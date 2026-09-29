import { CtaLink } from "@/components/cta-link";
import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { SkyBackdrop } from "@/components/sky";
import { useLanguage } from "@/contexts/language";
import { articles } from "@/data/articles";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import {
  ArrowUpRight,
  Compass,
  Globe,
  Hammer,
  Leaf,
  Lightbulb,
  PenTool,
  Palette,
  RefreshCw,
  Server,
  Smartphone,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const EASE = [0.16, 1, 0.3, 1] as const;
const TINTS = ["bg-tint-mint", "bg-tint-peach", "bg-tint-mist", "bg-tint-lime"];

const team = [
  { name: "Jhollyfer", img: "/jhollyfer.png" },
  { name: "Lenny", img: "/lenny.png" },
  { name: "Matheus", img: "/matheus.png" },
];

/* ─── Hero ──────────────────────────────────────────────────── */
function Hero() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 1, delay, ease: EASE },
  });

  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden pt-16">
      <SkyBackdrop />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center md:px-8">
        <motion.span {...enter(0)} className="pill mb-8">
          {t("home.pill")}
        </motion.span>
        <motion.h1
          {...enter(0.1)}
          className="text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.98] tracking-[-0.045em] text-foreground"
        >
          {t("home.heroTitle1")}
          <br />
          {t("home.heroTitle2")}
        </motion.h1>
        <motion.p
          {...enter(0.25)}
          className="mt-8 max-w-[44ch] font-serif text-lead leading-snug text-foreground/80"
        >
          {t("home.heroDescription")}
        </motion.p>
        <motion.div {...enter(0.4)} className="mt-10">
          <CtaLink to="/contact" arrow>
            {t("home.startProject")}
          </CtaLink>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Work: tabbed showcase ─────────────────────────────────── */
function Work() {
  const { t, language } = useLanguage();
  const [active, setActive] = useState(0);
  const project = projects[active];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AnimateInView className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-h1">{t("home.workTitle")}</h2>
          <p className="mt-5 font-serif text-lead text-foreground/75">{t("home.workLead")}</p>
        </AnimateInView>

        <div
          role="tablist"
          aria-label={t("home.workTitle")}
          className="no-scrollbar mb-8 flex justify-start gap-2 overflow-x-auto md:justify-center"
        >
          {projects.map((p, i) => (
            <button
              key={p.slug}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2 text-small font-medium transition-colors duration-300",
                i === active
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/20 text-foreground/70 hover:border-foreground/45 hover:text-foreground",
              )}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] bg-tint-mist">
          <AnimatePresence mode="wait">
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="grid grid-cols-1 md:grid-cols-12"
            >
              <div className="relative aspect-[4/3] md:col-span-7 md:aspect-auto md:min-h-[480px]">
                <img
                  src={project.image}
                  alt={project.title}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between gap-10 p-6 md:col-span-5 md:p-10">
                <div>
                  <p className="text-small text-foreground/65">{project.client[language]}</p>
                  <h3 className="mt-2 text-h2">{project.title}</h3>
                  <p className="mt-6 font-serif text-lead leading-snug text-foreground/85">
                    {project.description[language]}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <ul className="flex flex-wrap gap-1.5">
                    {project.tech.slice(0, 3).map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full bg-background/60 px-3 py-1 text-micro text-foreground/80"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                  <CtaLink to={project.url} variant="ghost" arrow>
                    {t("home.workVisit")}
                  </CtaLink>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─── Vision: sticky scroll on desktop, stack on mobile ─────── */
function Vision() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) =>
    setStep(Math.min(2, Math.floor(v * 3))),
  );

  const items = [1, 2, 3].map((n) => ({
    title: t(`home.vision${n}Title`),
    desc: t(`home.vision${n}Desc`),
  }));

  return (
    <section ref={ref} className={cn("relative bg-surface", !reduce && "md:h-[260vh]")}>
      <div
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-24 md:grid-cols-12 md:gap-16 md:px-8",
          !reduce && "md:sticky md:top-0 md:h-[100dvh] md:pt-16 md:pb-0",
        )}
      >
        <div className="md:col-span-6">
          <span className="pill mb-6">{t("home.visionLabel")}</span>
          <h2 className="text-h1">{t("home.visionTitle")}</h2>
          <ol className="mt-10 space-y-6">
            {items.map((item, i) => (
              <li
                key={item.title}
                className={cn(
                  "border-l-2 pl-5 transition-[opacity,border-color] duration-500",
                  i === step || reduce
                    ? "border-foreground opacity-100"
                    : "border-foreground/15 md:opacity-40",
                )}
              >
                <h3 className="text-h4">{item.title}</h3>
                <p className="mt-2 max-w-[48ch] text-body text-foreground/75">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] md:col-span-6 md:aspect-[4/5] md:max-h-[78dvh]">
          <img
            src="/images/matis.webp"
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div
            className={cn(
              "absolute inset-0 opacity-35 transition-colors duration-700 dark:opacity-20",
              TINTS[step],
            )}
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Process: 4 steps, selectable ──────────────────────────── */
function Process() {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const icons = [Compass, PenTool, Hammer, RefreshCw];
  const steps = icons.map((icon, i) => ({
    icon,
    title: t(`home.step${i + 1}Title`),
    desc: t(`home.step${i + 1}Desc`),
  }));
  const Icon = steps[active].icon;

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AnimateInView className="mb-12 max-w-2xl">
          <h2 className="text-h1">{t("home.processTitle")}</h2>
          <p className="mt-5 font-serif text-lead text-foreground/75">{t("home.processDesc")}</p>
        </AnimateInView>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <ul className="flex flex-col gap-2 md:col-span-5">
            {steps.map((s, i) => (
              <li key={s.title}>
                <button
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors duration-300",
                    i === active ? "bg-surface" : "hover:bg-foreground/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "text-h4 font-medium tracking-[-0.02em]",
                      i === active ? "text-foreground" : "text-foreground/55",
                    )}
                  >
                    {s.title}
                  </span>
                  <s.icon
                    size={18}
                    strokeWidth={1.5}
                    className={i === active ? "text-foreground" : "text-foreground/35"}
                  />
                </button>
                {/* Mobile: description inline under the active step */}
                {i === active && (
                  <p className="px-5 pt-2 pb-3 text-body text-foreground/75 md:hidden">{s.desc}</p>
                )}
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "relative hidden min-h-[360px] overflow-hidden rounded-[1.75rem] p-10 transition-colors duration-500 md:col-span-7 md:flex md:flex-col md:justify-between",
              TINTS[active],
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="flex h-full flex-col justify-between gap-16"
              >
                <Icon size={36} strokeWidth={1.25} />
                <div>
                  <h3 className="text-h2">{steps[active].title}</h3>
                  <p className="mt-4 max-w-[40ch] font-serif text-lead leading-snug text-foreground/85">
                    {steps[active].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Capabilities bento: 4+2 / 2+2+2 / 6 ───────────────────── */
function Capabilities() {
  const { t } = useLanguage();
  const cells = [
    { icon: Lightbulb, key: "Consulting", span: "md:col-span-4", tone: "bg-tint-mint" },
    { icon: Globe, key: "Web", span: "md:col-span-2", tone: "bg-tint-peach" },
    { icon: Smartphone, key: "Mobile", span: "md:col-span-2", tone: "bg-surface" },
    { icon: Server, key: "Backend", span: "md:col-span-2", tone: "bg-tint-mist" },
    { icon: Palette, key: "Design", span: "md:col-span-2", tone: "bg-tint-lime" },
  ];

  return (
    <section className="pb-24 md:pb-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AnimateInView className="mb-12">
          <h2 className="max-w-2xl text-h1">{t("home.servicesHeading")}</h2>
        </AnimateInView>

        <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {cells.map((c) => (
            <motion.div
              key={c.key}
              variants={staggerItemVariants}
              className={cn(
                "flex min-h-[240px] flex-col justify-between gap-8 rounded-[1.75rem] p-7",
                c.span,
                c.tone,
              )}
            >
              <c.icon size={24} strokeWidth={1.5} />
              <div>
                <h3 className="text-h3">{t(`home.service${c.key}`)}</h3>
                <p className="mt-3 max-w-[46ch] text-body text-foreground/75">
                  {t(`home.service${c.key}Desc`)}
                </p>
              </div>
            </motion.div>
          ))}

          <motion.div
            variants={staggerItemVariants}
            className="relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[1.75rem] p-7 text-[#F4F7EC] md:col-span-6 md:p-10"
          >
            <img
              src="/images/manganga.webp"
              alt=""
              className="absolute inset-0 -z-10 size-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0E1613]/95 via-[#0E1613]/70 to-[#0E1613]/20" />
            <Leaf size={24} strokeWidth={1.5} className="mb-6" />
            <h3 className="text-h2">{t("home.serviceImpact")}</h3>
            <p className="mt-3 max-w-[52ch] text-body text-[#F4F7EC]/85">
              {t("home.serviceImpactDesc")}
            </p>
          </motion.div>
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ─── Team ──────────────────────────────────────────────────── */
function Team() {
  const { t } = useLanguage();
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-12 px-4 md:grid-cols-12 md:px-8">
        <AnimateInView className="md:col-span-5">
          <h2 className="text-h1">{t("home.teamTitle")}</h2>
          <p className="mt-5 max-w-[40ch] font-serif text-lead text-foreground/75">
            {t("home.teamDesc")}
          </p>
          <CtaLink to="/career" variant="ghost" arrow className="mt-8">
            {t("nav.career")}
          </CtaLink>
        </AnimateInView>
        <StaggerContainer className="grid grid-cols-3 gap-3 md:col-span-7 md:gap-4">
          {team.map((m, i) => (
            <motion.figure
              key={m.name}
              variants={staggerItemVariants}
              className={cn(i === 1 && "md:-translate-y-10")}
            >
              <div className={cn("overflow-hidden rounded-[1.25rem]", TINTS[i])}>
                <img
                  src={m.img}
                  alt={m.name}
                  className="aspect-[3/4] w-full object-cover mix-blend-multiply dark:mix-blend-normal"
                />
              </div>
              <figcaption className="mt-3 text-small text-foreground/80">{m.name}</figcaption>
            </motion.figure>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* ─── Journal ───────────────────────────────────────────────── */
function Journal() {
  const { t, language } = useLanguage();
  const [lead, ...rest] = articles.slice(0, 3);

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AnimateInView className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-h1">{t("home.notesTitle")}</h2>
          <CtaLink to="/blog" variant="ghost" arrow>
            {t("home.notesAll")}
          </CtaLink>
        </AnimateInView>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <AnimateInView className="md:col-span-7">
            <Link to={`/blog/${lead.slug}`} className="group block">
              <div className="overflow-hidden rounded-[1.75rem] bg-tint-peach">
                <img
                  src={lead.image}
                  alt=""
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />
              </div>
              <h3 className="mt-6 max-w-[28ch] text-h2 transition-opacity group-hover:opacity-75">
                {lead.title[language]}
              </h3>
              <p className="mt-3 max-w-[56ch] text-body text-foreground/70">
                {lead.excerpt[language]}
              </p>
            </Link>
          </AnimateInView>

          <div className="flex flex-col divide-y divide-foreground/10 md:col-span-5">
            {rest.map((a, i) => (
              <AnimateInView key={a.slug} delay={0.1 * (i + 1)}>
                <Link
                  to={`/blog/${a.slug}`}
                  className="group flex items-start justify-between gap-6 py-6 first:pt-0"
                >
                  <div>
                    <p className="text-small text-muted-foreground">{a.readTime[language]}</p>
                    <h3 className="mt-2 text-h4 font-medium transition-opacity group-hover:opacity-75">
                      {a.title[language]}
                    </h3>
                  </div>
                  <ArrowUpRight
                    size={18}
                    strokeWidth={1.5}
                    className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </AnimateInView>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Closing CTA ───────────────────────────────────────────── */
function ClosingCta() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      <SkyBackdrop className="[mask-image:linear-gradient(to_bottom,transparent,black_30%)]" />
      <AnimateInView className="relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
        <h2 className="text-display tracking-[-0.045em]">{t("home.ctaTitle")}</h2>
        <p className="mt-6 max-w-[40ch] font-serif text-lead text-foreground/80">
          {t("home.ctaDesc")}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <CtaLink to="/contact" arrow>
            {t("home.startProject")}
          </CtaLink>
          <CtaLink to="/portfolio" variant="ghost">
            {t("home.viewWork")}
          </CtaLink>
        </div>
      </AnimateInView>
    </section>
  );
}

const Home = () => (
  <>
    <Hero />
    <Work />
    <Vision />
    <Process />
    <Capabilities />
    <Team />
    <Journal />
    <ClosingCta />
  </>
);

export default Home;
