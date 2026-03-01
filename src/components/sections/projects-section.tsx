import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { ExternalLink } from "lucide-react";

const projects = [
  {
    key: "adacaibs",
    url: "https://adacaibs.com.br",
    image: "/images/adacaibs.webp",
    tech: ["React", "AdonisJS", "TanStack Query", "Tailwind", "PostgreSQL"],
  },
  {
    key: "matis",
    url: "https://matis.maiyu.com.br",
    image: "/images/matis.webp",
    tech: ["React", "TanStack Start", "Fastify", "TanStack Query", "Tailwind", "Prisma"],
  },
  {
    key: "manganga",
    url: "https://www.manganga.maiyu.com.br",
    image: "/images/manganga.webp",
    tech: ["React", "TanStack Start", "Fastify", "TanStack Query", "Tailwind", "Prisma"],
  },
];

export function ProjectsSection() {
  const { t } = useLanguage();

  return (
    <section id="projects" className="py-24 px-6">
      <div className="container mx-auto">
        <AnimateInView className="mb-16">
          <p className="text-maiyu-green text-sm font-medium tracking-widest uppercase mb-3">
            {t("projects.label")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold">
            {t("projects.heading")}
          </h2>
        </AnimateInView>

        <div className="space-y-20">
          {projects.map((project, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <AnimateInView key={project.key} delay={index * 0.1}>
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${
                    isReversed ? "lg:direction-rtl" : ""
                  }`}
                >
                  <div className={isReversed ? "lg:order-2" : ""}>
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border-b border-white/10">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                        <span className="ml-3 text-xs text-white/30 font-mono truncate">
                          {project.url.replace("https://", "")}
                        </span>
                      </div>
                      <img
                        src={project.image}
                        alt={t(`projects.${project.key}.title`)}
                        className="w-full aspect-video object-cover object-top transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className={isReversed ? "lg:order-1" : ""}>
                    <h3 className="text-2xl font-bold mb-3">
                      {t(`projects.${project.key}.title`)}
                    </h3>
                    <p className="text-white/50 mb-6 leading-relaxed">
                      {t(`projects.${project.key}.description`)}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tech.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs px-3 py-1 rounded-full border border-white/10 text-white/60"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-maiyu-green font-medium text-sm hover:underline transition-colors duration-300"
                    >
                      {t("projects.visit")}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </AnimateInView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
