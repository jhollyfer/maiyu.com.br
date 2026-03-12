import { useLanguage } from "@/contexts/language";
import { AnimateInView, StaggerContainer, staggerItemVariants } from "@/components/motion/animate-in-view";
import { ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const projects = [
  {
    title: "ADACAIBS",
    description: "Association management platform for the indigenous community of Benjamin Constant. Full-stack web application with member management, document handling, and reporting.",
    descriptionPt: "Plataforma de gestao para a associacao da comunidade indigena de Benjamin Constant. Aplicacao web full-stack com gestao de membros, documentos e relatorios.",
    image: "/images/adacaibs.webp",
    tech: ["React", "AdonisJS", "TanStack Query", "PostgreSQL", "Tailwind CSS"],
    url: "https://adacaibs.com.br",
    year: "2024",
  },
  {
    title: "MatisCraft",
    description: "E-commerce platform for indigenous artisan crafts from the Matis people. Features product catalog, shopping cart, and order management.",
    descriptionPt: "Plataforma de e-commerce para artesanato indigena do povo Matis. Catalogo de produtos, carrinho de compras e gestao de pedidos.",
    image: "/images/matis.webp",
    tech: ["React", "Fastify", "Prisma", "PostgreSQL", "Tailwind CSS"],
    url: "https://matis.maiyu.com.br",
    year: "2024",
  },
  {
    title: "Manganga",
    description: "Digital platform for cultural preservation and community engagement in the Amazon region. Content management and event organization.",
    descriptionPt: "Plataforma digital para preservacao cultural e engajamento comunitario na regiao amazonica. Gestao de conteudo e organizacao de eventos.",
    image: "/images/manganga.webp",
    tech: ["React", "Fastify", "Prisma", "PostgreSQL", "Tailwind CSS"],
    url: "https://manganga.maiyu.com.br",
    year: "2025",
  },
];

const Portfolio = () => {
  const { t, language } = useLanguage();

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full bg-background text-foreground overflow-x-hidden pt-20">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
          <AnimateInView variant="fadeUp">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maiyu-purple/10 border border-maiyu-purple/20 text-maiyu-purple text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-maiyu-purple opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-maiyu-purple" />
              </span>
              {t("portfolio.badge")}
            </div>
          </AnimateInView>
          <AnimateInView variant="fadeUp" delay={0.1}>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-8">
              {t("portfolio.heroTitle1")}
              <span className="text-maiyu-purple italic"> {t("portfolio.heroTitle2")}</span> {t("portfolio.heroTitle3")}
            </h1>
          </AnimateInView>
          <AnimateInView variant="fadeUp" delay={0.2}>
            <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
              {t("portfolio.heroDescription")}
            </p>
          </AnimateInView>
        </div>
      </section>

      {/* Project Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-24">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {projects.map((project) => (
            <motion.div key={project.title} variants={staggerItemVariants} className="group flex flex-col gap-6">
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-card">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url("${project.image}")` }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>
                <div className="flex flex-col gap-3 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-maiyu-purple tracking-widest uppercase">
                      {project.year}
                    </span>
                    <ExternalLink className="text-muted-foreground group-hover:text-maiyu-purple transition-all" size={18} />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground group-hover:text-maiyu-purple transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === "pt-BR" ? project.descriptionPt : project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.tech.map((tech) => (
                      <span key={tech} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <span className="text-maiyu-purple font-bold flex items-center gap-2 mt-2 group-hover:translate-x-1 transition-transform">
                    {project.url.replace("https://", "")}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </a>
            </motion.div>
          ))}
        </StaggerContainer>
      </main>
    </div>
  );
};

export default Portfolio;
