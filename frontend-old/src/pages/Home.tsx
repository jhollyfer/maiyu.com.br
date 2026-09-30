import { CtaLink } from "@/components/cta-link";
import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { Cloud, SkyBackdrop } from "@/components/sky";
import { useLanguage } from "@/contexts/language";
import { articles } from "@/data/articles";
import { projects } from "@/data/projects";
import { team } from "@/data/team";
import { CALL_URL, cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Globe,
  Hammer,
  Leaf,
  Lightbulb,
  Palette,
  PenTool,
  RefreshCw,
  Server,
  Smartphone,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

const EASE = [0.16, 1, 0.3, 1] as const;
const CARD_TINTS = ["bg-tint-peach-soft", "bg-tint-mint", "bg-tint-mist"];
const TEAM_TINTS = ["bg-tint-peach", "bg-tint-mint", "bg-tint-lime", "bg-tint-mist", "bg-tint-green"];
const STACK = [
  "React",
  "React Native",
  "Next.js",
  "AdonisJS",
  "Fastify",
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "TypeScript",
  "Figma",
];


function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mb-4 text-small opacity-60", className)}>{children}</p>;
}

/** Glider: a leaf riding the wind, the hero's focal point. */
function Glider() {
  return (
    <svg viewBox="0 0 260 200" aria-hidden="true" className="float h-auto w-full">
      <defs>
        <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE4CD" />
          <stop offset="0.6" stopColor="#F2C6A2" />
          <stop offset="1" stopColor="#E9A57E" />
        </linearGradient>
        <linearGradient id="trail" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#DDE88A" stopOpacity="0" />
          <stop offset="1" stopColor="#DDE88A" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d="M8 196 C 50 170, 80 150, 118 118" stroke="url(#trail)" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray="1 14" />
      <path d="M112 124 C 130 60, 190 20, 252 8 C 238 70, 196 124, 112 124 Z" fill="url(#leaf)" />
      <path d="M112 124 C 160 88, 206 46, 252 8" stroke="#253241" strokeOpacity="0.35" strokeWidth="2" fill="none" />
      <path d="M150 96 L 168 104 M 176 70 L 196 76 M 200 46 L 220 50" stroke="#253241" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Hero ──────────────────────────────────────────────────── */
function Hero() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 1.1, delay, ease: EASE },
  });

  return (
    <section className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden pt-28 pb-12">
      <SkyBackdrop className="-z-10" />
      <div className="rails pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 md:px-8">
        <motion.span {...enter(0)} className="pill mx-auto bg-surface/40 backdrop-blur-sm">
          {t("home.pill")}
        </motion.span>

        <h1 className="relative mt-10 text-[clamp(2.8rem,8.4vw,7.75rem)] leading-[0.95] tracking-[-0.05em] text-[#253241] dark:text-foreground md:mt-14">
          <motion.span {...enter(0.1)} className="block md:pl-[4%]">
            {t("home.heroTitle1")}
          </motion.span>
          <motion.span {...enter(0.2)} className="block text-right md:pr-[4%]">
            {t("home.heroTitle2")}
          </motion.span>
        </h1>

        <motion.div
          {...enter(0.35)}
          className="pointer-events-none mx-auto -mt-2 w-[46vw] max-w-[300px] md:absolute md:left-[10%] md:top-[46%] md:mt-0 md:w-[18vw]"
        >
          <Glider />
        </motion.div>

        <motion.div
          {...enter(0.45)}
          className="mt-auto flex flex-col items-start gap-6 pt-10 md:ml-auto md:max-w-md"
        >
          <p className="font-serif text-lead leading-snug text-[#253241] dark:text-foreground/85">
            {t("home.heroDescription")}
          </p>
          <div className="flex flex-wrap gap-2">
            <CtaLink to="/contact" className="rounded-xl">
              {t("home.startProject")}
            </CtaLink>
            <CtaLink to="/portfolio" variant="light" className="rounded-xl">
              {t("home.viewWork")}
            </CtaLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Work: marquee + carousel ──────────────────────────────── */
function Work() {
  const { t, language } = useLanguage();
  const [active, setActive] = useState(0);
  const project = projects[active];
  const go = (d: number) => setActive((i) => (i + d + projects.length) % projects.length);
  const names = [...projects, ...projects, ...projects, ...projects];

  return (
    <section className="overflow-hidden py-24 md:py-32">
      <AnimateInView className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-h2">{t("home.workTitle")}</h2>
      </AnimateInView>

      <div className="relative mt-10 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <ul className="marquee flex w-max gap-16 pr-16">
          {[...names, ...names].map((p, i) => (
            <li key={i} className="font-display text-h3 font-medium tracking-[-0.03em] text-foreground/45">
              {p.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-14 max-w-7xl px-4 md:px-8">
        <div className={cn("relative overflow-hidden rounded-[1.75rem] transition-colors duration-700", CARD_TINTS[active % CARD_TINTS.length])}>
          <div className="flex items-center justify-between px-6 pt-6 text-small text-foreground/60 md:px-10 md:pt-8">
            <span>{project.client[language]}</span>
            <span>
              {String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="grid grid-cols-1 gap-8 p-6 md:grid-cols-12 md:gap-10 md:p-10"
            >
              <div className="flex flex-col justify-between gap-8 md:col-span-6">
                <div>
                  <h3 className="text-h1">{project.title}</h3>
                  <p className="mt-6 max-w-[48ch] font-serif text-lead leading-snug text-foreground/85">
                    “{project.description[language]}”
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <CtaLink to={project.url} variant="peach" className="rounded-xl" arrow>
                    {t("home.workVisit")}
                  </CtaLink>
                  <ul className="flex flex-wrap gap-1.5">
                    {project.tech.slice(0, 3).map((tech) => (
                      <li key={tech} className="rounded-full bg-surface/60 px-3 py-1 text-micro text-foreground/80">
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:col-span-6">
                <img src={project.image} alt={project.title} className="absolute inset-0 size-full object-cover" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => go(-1)}
            aria-label="Previous project"
            className="inline-flex size-10 items-center justify-center rounded-full border border-foreground/15 transition-colors hover:bg-foreground/[0.05]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex gap-1.5">
            {projects.map((p, i) => (
              <button
                key={p.slug}
                onClick={() => setActive(i)}
                aria-label={p.title}
                aria-current={i === active}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === active ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25",
                )}
              />
            ))}
          </div>
          <button
            onClick={() => go(1)}
            aria-label="Next project"
            className="inline-flex size-10 items-center justify-center rounded-full border border-foreground/15 transition-colors hover:bg-foreground/[0.05]"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Vision: numbered steps + navy stage, sticky on desktop ─── */
function Vision() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(2, Math.floor(v * 3))));

  const items = [1, 2, 3].map((n) => ({
    title: t(`home.vision${n}Title`),
    desc: t(`home.vision${n}Desc`),
  }));

  return (
    <section ref={ref} className={cn("relative", !reduce && "md:h-[280vh]")}>
      <div
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-24 md:grid-cols-12 md:gap-12 md:px-8",
          !reduce && "md:sticky md:top-0 md:h-[100dvh] md:py-24",
        )}
      >
        <div className="flex flex-col md:col-span-5">
          <Eyebrow>{t("home.visionLabel")}</Eyebrow>
          <h2 className="text-h2">{t("home.visionTitle")}</h2>
          <ol className="mt-auto space-y-3 pt-10">
            {items.map((item, i) => {
              const on = i === step || reduce;
              return (
                <li key={item.title} className="flex gap-5">
                  <span
                    className={cn(
                      "font-display font-medium leading-none tracking-[-0.04em] transition-all duration-500",
                      on ? "text-[3.5rem] text-foreground" : "text-h3 text-foreground/25",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className={cn("grid transition-all duration-500", on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 max-md:grid-rows-[1fr] max-md:opacity-100")}>
                    <div className="overflow-hidden">
                      <h3 className="pt-2 text-h4">{item.title}</h3>
                      <p className="mt-2 max-w-[44ch] font-serif text-body-lg text-foreground/75">{item.desc}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative isolate min-h-[420px] overflow-hidden rounded-[1.75rem] bg-navy md:col-span-7">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(247,249,232,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(247,249,232,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="size-[min(22rem,60vw)] rounded-full transition-[box-shadow,background] duration-1000"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${["#FFE4CD", "#D0FDF2", "#FBFFDC"][step]} 0%, ${["#F2C6A2", "#A8DDD0", "#DDE88A"][step]}55 40%, transparent 70%)`,
                boxShadow: `0 0 120px 10px ${["#F2C6A2", "#A8DDD0", "#DDE88A"][step]}40`,
              }}
            />
          </div>
          <span className="absolute bottom-6 left-6 rounded-lg border border-on-navy/30 px-3 py-1.5 text-small text-on-navy">
            {items[step].title}
          </span>
          <span className="absolute right-6 top-6 text-small text-on-navy/50">
            {step + 1} / 3
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─── Process: horizontal expanding panels ──────────────────── */
function Process() {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const icons = [Compass, PenTool, Hammer, RefreshCw];
  const steps = icons.map((icon, i) => ({
    icon,
    title: t(`home.step${i + 1}Title`),
    desc: t(`home.step${i + 1}Desc`),
  }));

  return (
    <section className="border-y border-foreground/[0.08] bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AnimateInView className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-h2">{t("home.processTitle")}</h2>
          <p className="mt-5 font-serif text-lead text-foreground/75">{t("home.processDesc")}</p>
        </AnimateInView>

        <div className="flex flex-col gap-3 md:h-[420px] md:flex-row">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.title}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-pressed={on}
                className={cn(
                  "relative flex min-w-0 flex-col justify-between gap-6 overflow-hidden rounded-2xl border p-6 text-left transition-[flex-grow,background-color,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  on
                    ? "border-transparent bg-tint-peach md:flex-[2.6]"
                    : "border-foreground/10 bg-background md:flex-1 hover:border-foreground/25",
                )}
              >
                <div className="flex w-full items-start justify-between gap-4">
                  <span className="text-h4 font-medium tracking-[-0.02em]">{s.title}</span>
                  <span className="shrink-0 text-micro text-foreground/55">
                    {i + 1} / {steps.length}
                  </span>
                </div>
                {on ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
                  >
                    <s.icon size={40} strokeWidth={1.1} className="mb-6 text-[#253241]" />
                    <p className="max-w-[40ch] font-serif text-lead leading-snug text-foreground/90">{s.desc}</p>
                  </motion.div>
                ) : (
                  <p className="line-clamp-2 text-small text-foreground/55 max-md:hidden">{s.desc}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Capabilities: sky card + ruled list ───────────────────── */
function Capabilities() {
  const { t } = useLanguage();
  const rows = [
    { icon: Lightbulb, key: "Consulting" },
    { icon: Palette, key: "Design" },
    { icon: Globe, key: "Web" },
    { icon: Smartphone, key: "Mobile" },
    { icon: Server, key: "Backend" },
    { icon: Leaf, key: "Impact" },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AnimateInView className="mb-12 flex flex-col gap-5">
          <h2 className="max-w-3xl text-h2">{t("home.servicesHeading")}</h2>
          <span className="w-fit rounded-md bg-tint-green px-2.5 py-1 text-micro font-medium text-[#253241] dark:text-foreground">
            {t("home.pill")}
          </span>
        </AnimateInView>

        <div className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] border border-foreground/10 md:grid-cols-12">
          <div className="relative min-h-[280px] md:col-span-5">
            <SkyBackdrop fade={false} />
            <div className="absolute left-1/2 top-[38%] w-1/2 -translate-x-1/2 -translate-y-1/2">
              <Glider />
            </div>
          </div>
          <StaggerContainer className="divide-y divide-foreground/10 bg-surface md:col-span-7">
            {rows.map((r) => (
              <motion.div key={r.key} variants={staggerItemVariants} className="flex gap-5 p-6 md:px-8">
                <r.icon size={20} strokeWidth={1.5} className="mt-1 shrink-0" />
                <div>
                  <h3 className="text-h4 font-medium">{t(`home.service${r.key}`)}</h3>
                  <p className="mt-2 max-w-[56ch] font-serif text-body-lg text-foreground/70">
                    {t(`home.service${r.key}Desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}

/* ─── Team + Journal: one navy band ─────────────────────────── */
function NavyBand() {
  const { t, language } = useLanguage();

  return (
    <section className="relative isolate overflow-hidden bg-navy py-24 text-on-navy md:py-32">
      <div className="absolute inset-0 -z-10 [--border:rgba(247,249,232,0.1)]">
        <div className="rails size-full" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <AnimateInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2">{t("home.teamTitle")}</h2>
          <p className="mx-auto mt-5 max-w-[48ch] font-serif text-lead text-on-navy/75">{t("home.teamDesc")}</p>
        </AnimateInView>

        <StaggerContainer className="mx-auto mt-14 flex max-w-5xl flex-wrap justify-center gap-3 md:gap-4">
          {team.map((m, i) => (
            <motion.figure key={m.name} variants={staggerItemVariants} className={cn("w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(20%-0.8rem)]", i % 2 === 1 && "md:-translate-y-8")}>
              <div className={cn("overflow-hidden rounded-2xl", TEAM_TINTS[i])}>
                <img src={m.img} alt={m.name} className="aspect-[3/4] w-full object-cover mix-blend-multiply" />
              </div>
              <figcaption className="mt-3 text-center text-small text-on-navy/80">{m.name}</figcaption>
            </motion.figure>
          ))}
        </StaggerContainer>

        <div className="mt-16 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <ul className="marquee flex w-max gap-14 pr-14">
            {[...STACK, ...STACK].map((s, i) => (
              <li key={i} className="font-display text-h4 font-medium tracking-[-0.02em] text-on-navy/45">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex justify-center">
          <CtaLink to="/career" variant="lime" className="rounded-xl" arrow>
            {t("nav.career")}
          </CtaLink>
        </div>

        <div className="mt-28 md:mt-36">
          <AnimateInView className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>{t("nav.blog")}</Eyebrow>
              <h2 className="text-h3">{t("home.notesTitle")}</h2>
            </div>
            <Link to="/blog" className="text-small text-on-navy/70 underline-offset-4 hover:text-on-navy hover:underline">
              {t("home.notesAll")}
            </Link>
          </AnimateInView>

          <ul className="border-t border-on-navy/15">
            {articles.slice(0, 4).map((a) => (
              <li key={a.slug} className="border-b border-on-navy/15">
                <Link to={`/blog/${a.slug}`} className="group flex items-center justify-between gap-6 py-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-body-lg transition-opacity group-hover:opacity-75">{a.title[language]}</span>
                    <span className="rounded-md bg-tint-green px-2 py-0.5 text-micro text-[#253241]">
                      {a.readTime[language]}
                    </span>
                  </div>
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F7F9E8] text-[#253241] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ─── Closing CTA ───────────────────────────────────────────── */
function ClosingCta() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <Cloud seed={4} className="cloud-drift -left-[8%] top-[10%] w-[30%] min-w-[220px] opacity-70" />
      <Cloud seed={9} className="cloud-drift-2 -right-[6%] bottom-[5%] w-[26%] min-w-[200px] opacity-70" />
      <AnimateInView className="relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
        <h2 className="text-display tracking-[-0.05em] text-[#253241] dark:text-foreground">{t("home.ctaTitle")}</h2>
        <p className="mt-6 max-w-[40ch] font-serif text-lead text-foreground/80">{t("home.ctaDesc")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <CtaLink to={CALL_URL} className="rounded-xl" arrow>
            {t("home.startProject")}
          </CtaLink>
          <CtaLink to="/portfolio" variant="peach" className="rounded-xl">
            {t("home.viewWork")}
          </CtaLink>
        </div>
        <Link to="/contact" className="mt-6 inline-flex items-center gap-1 text-small text-foreground/60 hover:text-foreground">
          {t("nav.contact")} <ArrowUpRight size={13} />
        </Link>
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
    <NavyBand />
    <ClosingCta />
  </>
);

export default Home;
