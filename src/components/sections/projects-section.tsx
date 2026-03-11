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
    <section id="projects" className="py-28 px-6" style={{ backgroundColor: "#403937" }}>
      <div className="container mx-auto">
        {/* Header */}
        <AnimateInView className="mb-20">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-6 h-px bg-maiyu-amber inline-block" />
            <p className="text-maiyu-amber font-body text-[10px] font-medium tracking-[0.3em] uppercase">
              {t("projects.label")}
            </p>
          </div>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
            {t("projects.heading")}
          </h2>
        </AnimateInView>

        <div className="space-y-24">
          {projects.map((project, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <AnimateInView key={project.key} delay={index * 0.08}>
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
                >
                  {/* Browser mockup — macOS style */}
                  <div className={isReversed ? "lg:order-2" : ""}>
                    {/* Outer shell with depth shadow */}
                    <div
                      className="overflow-hidden border border-white/10"
                      style={{
                        borderRadius: "10px",
                        boxShadow:
                          "0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
                      }}
                    >
                      {/* macOS title bar */}
                      <div
                        className="relative flex items-center px-4 border-b border-white/8"
                        style={{
                          backgroundColor: "#332c2b",
                          height: "38px",
                        }}
                      >
                        {/* Traffic lights */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: "#ff5f57" }}
                          />
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: "#febc2e" }}
                          />
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: "#28c840" }}
                          />
                        </div>

                        {/* URL bar — centered */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 border border-white/8"
                          style={{
                            borderRadius: "5px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            minWidth: "180px",
                            maxWidth: "260px",
                          }}
                        >
                          {/* Lock icon */}
                          <svg width="9" height="10" viewBox="0 0 9 10" fill="none" className="shrink-0 opacity-40">
                            <rect x="1" y="4" width="7" height="6" rx="1" fill="currentColor" className="text-white" />
                            <path d="M2.5 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.2" className="text-white" fill="none" />
                          </svg>
                          <span className="text-xs text-white/40 font-body truncate leading-none">
                            {project.url.replace("https://", "")}
                          </span>
                        </div>
                      </div>

                      {/* Screenshot */}
                      <div className="overflow-hidden">
                        <img
                          src={project.image}
                          alt={t(`projects.${project.key}.title`)}
                          className="w-full aspect-video object-cover object-top transition-transform duration-700 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project info */}
                  <div className={isReversed ? "lg:order-1" : ""}>
                    {/* Project index */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-maiyu-amber font-body text-xs tracking-widest">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="w-8 h-px bg-maiyu-amber/40 inline-block" />
                    </div>

                    <h3 className="font-heading text-2xl font-bold mb-3 text-foreground">
                      {t(`projects.${project.key}.title`)}
                    </h3>
                    <p className="text-white/45 font-body text-xs leading-[1.9] mb-6">
                      {t(`projects.${project.key}.description`)}
                    </p>

                    {/* Tech stack */}
                    <div className="flex flex-wrap gap-2 mb-7">
                      {project.tech.map((tech) => (
                        <span
                          key={tech}
                          className="text-[10px] px-2.5 py-1 border border-white/10 text-white/40 font-body tracking-wide"
                          style={{ borderRadius: "1px" }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-maiyu-amber font-body text-xs tracking-wider uppercase hover:text-maiyu-amber/80 transition-colors duration-200"
                    >
                      {t("projects.visit")}
                      <ExternalLink size={12} />
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
