import { CtaLink } from "@/components/cta-link";
import {
  AnimateInView,
  StaggerContainer,
  staggerItemVariants,
} from "@/components/motion/animate-in-view";
import { PageHero } from "@/components/page-hero";
import { useLanguage } from "@/contexts/language";
import { featuredProject, projects } from "@/data/projects";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const Portfolio = () => {
  const { t, language } = useLanguage();
  const rest = projects.filter((p) => p.slug !== featuredProject.slug);

  return (
    <>
      <PageHero
        title={`${t("portfolio.heroTitle1")} ${t("portfolio.heroTitle2")} ${t("portfolio.heroTitle3")}`}
        lead={t("portfolio.heroDescription")}
      />

      {/* Featured case study */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <AnimateInView className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] bg-tint-mint md:grid-cols-12">
            <div className="relative aspect-[4/3] md:col-span-7 md:aspect-auto md:min-h-[520px]">
              <img
                src={featuredProject.image}
                alt={featuredProject.title}
                width={1863}
                height={927}
                style={{ objectPosition: featuredProject.focus }}
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-between gap-10 p-6 md:col-span-5 md:p-10">
              <div>
                <p className="text-small text-foreground/65">
                  {t("portfolio.featuredLabel")}, {featuredProject.year}
                </p>
                <h2 className="mt-2 text-h2 lg:text-h1">{featuredProject.title}</h2>
                <p className="mt-6 font-serif text-lead leading-snug text-foreground/85">
                  {featuredProject.description[language]}
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <ul className="flex flex-wrap gap-1.5">
                  {featuredProject.tech.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full bg-background/60 px-3 py-1 text-micro text-foreground/80"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
                <CtaLink to={featuredProject.url} arrow className="self-start">
                  {t("portfolio.visitSite")}
                </CtaLink>
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* More work */}
      <section className="bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <AnimateInView className="mb-12">
            <h2 className="max-w-2xl text-h1">{t("home.selectedWorkDesc")}</h2>
          </AnimateInView>

          <StaggerContainer className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {rest.map((project, idx) => (
              <motion.a
                key={project.slug}
                variants={staggerItemVariants}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group block",
                  idx % 2 === 0 ? "md:col-span-7" : "md:col-span-5 md:mt-20",
                )}
              >
                <div
                  className={cn(
                    "overflow-hidden rounded-[1.75rem]",
                    idx % 2 === 0 ? "aspect-[16/10] bg-tint-peach" : "aspect-[4/5] bg-tint-mist",
                  )}
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    width={1863}
                    height={927}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: project.focus }}
                    className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-small text-muted-foreground">
                      {project.year}, {project.client[language]}
                    </p>
                    <h3 className="mt-2 text-h2">{project.title}</h3>
                    <p className="mt-3 max-w-lg text-body text-foreground/75">
                      {project.summary[language]}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={20}
                    strokeWidth={1.5}
                    className="mt-1 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </motion.a>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
};

export default Portfolio;
