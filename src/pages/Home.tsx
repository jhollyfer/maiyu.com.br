import { useLanguage } from "@/contexts/language";
import { AnimateInView, StaggerContainer, staggerItemVariants } from "@/components/motion/animate-in-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Smartphone, Server, Database, Palette, Leaf, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-maiyu-purple/10 to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 py-20">
          <div className="flex flex-col gap-8">
            <AnimateInView variant="fadeUp">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-maiyu-purple/10 border border-maiyu-purple/20 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-maiyu-purple opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-maiyu-purple" />
                </span>
                <span className="text-maiyu-purple text-xs font-bold uppercase tracking-widest">
                  {t("home.badge")}
                </span>
              </div>
            </AnimateInView>

            <AnimateInView variant="fadeUp" delay={0.1}>
              <h1 className="text-foreground text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
                {t("home.heroTitle1")} <br />
                <span className="text-maiyu-purple">{t("home.heroTitle2")}</span>
              </h1>
            </AnimateInView>

            <AnimateInView variant="fadeUp" delay={0.2}>
              <p className="text-muted-foreground text-lg md:text-xl max-w-lg leading-relaxed">
                {t("home.heroDescription")}
              </p>
            </AnimateInView>

            <AnimateInView variant="fadeUp" delay={0.3}>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/portfolio">
                  <Button className="bg-maiyu-purple text-white px-8 py-6 rounded-xl font-bold text-lg hover:brightness-110 transition-all flex items-center gap-2">
                    {t("home.startProject")}
                    <ArrowRight size={20} />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="border-border text-foreground px-8 py-6 rounded-xl font-bold text-lg hover:bg-muted transition-all">
                    {t("home.viewWork")}
                  </Button>
                </Link>
              </div>
            </AnimateInView>
          </div>

          <AnimateInView variant="fadeIn" delay={0.3}>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-maiyu-purple/20 blur-3xl rounded-full" />
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBx9V9Cw_a9kExcrZftlBrOZ8poL3ALjS-CG3S1DhU60B0IKvStrpPB6V5JdphmtGCLOW0iSbgI21HGysfc92ziE6LcP7dEnajpv_SxZWopZncX1DPpaPT6a01Hv7eEnQJ0MZWsediKkliDcjNelHzY9IJQtE-KHbx7c9YMsJhmMSFRSd8_3qF1lo_z0NIBlZ1zPoXRVvMjg2RyTIKsU2FtrBPmFeanH0b-cjK1kYcb_hVlyCz0-B-WkFKzULk84FhupbwYj69gFM"
                  alt="Dashboard UI"
                />
              </div>
              {/* Floating review card */}
              <div className="absolute -bottom-6 -left-6 bg-card/80 backdrop-blur-md border border-border p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <img src="/jhollyfer.png" alt="Jhollyfer" className="h-10 w-10 rounded-full border-2 border-background object-cover" />
                    <img src="/lenny.png" alt="Lenny" className="h-10 w-10 rounded-full border-2 border-background object-cover" />
                    <img src="/geison.png" alt="Geison" className="h-10 w-10 rounded-full border-2 border-background object-cover" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-bold">Maiyu Team</p>
                    <div className="flex text-maiyu-purple">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimateInView>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card py-12 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: t("home.statsProducts"), value: "3+" },
            { label: t("home.statsEngineers"), value: "4" },
            { label: t("home.statsRegion"), value: "AM" },
          ].map((stat) => (
            <AnimateInView key={stat.label} variant="fadeUp">
              <div className="flex flex-col items-center md:items-start">
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mb-1">
                  {stat.label}
                </p>
                <h3 className="text-maiyu-purple text-4xl font-extrabold">{stat.value}</h3>
              </div>
            </AnimateInView>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl">
              <AnimateInView variant="fadeUp">
                <h2 className="text-maiyu-purple text-sm font-bold uppercase tracking-[0.3em] mb-4">
                  {t("home.servicesLabel")}
                </h2>
              </AnimateInView>
              <AnimateInView variant="fadeUp" delay={0.1}>
                <h3 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
                  {t("home.servicesHeading")}
                </h3>
              </AnimateInView>
            </div>
            <AnimateInView variant="fadeUp" delay={0.2}>
              <p className="text-muted-foreground text-lg max-w-sm mb-2">
                {t("home.servicesSubheading")}
              </p>
            </AnimateInView>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: t("home.serviceWeb"), desc: t("home.serviceWebDesc") },
              { icon: Smartphone, title: t("home.serviceMobile"), desc: t("home.serviceMobileDesc") },
              { icon: Server, title: t("home.serviceBackend"), desc: t("home.serviceBackendDesc") },
              { icon: Database, title: t("home.serviceDatabase"), desc: t("home.serviceDatabaseDesc") },
              { icon: Palette, title: t("home.serviceDesign"), desc: t("home.serviceDesignDesc") },
              { icon: Leaf, title: t("home.serviceImpact"), desc: t("home.serviceImpactDesc") },
            ].map((service) => (
              <motion.div key={service.title} variants={staggerItemVariants}>
                <Card className="group p-8 rounded-3xl bg-card border-border hover:border-maiyu-purple/50 transition-all h-full">
                  <CardContent className="p-0">
                    <div className="bg-maiyu-purple/10 text-maiyu-purple w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-maiyu-purple group-hover:text-white transition-colors">
                      <service.icon size={28} />
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-foreground">{service.title}</h4>
                    <p className="text-muted-foreground leading-relaxed mb-6">{service.desc}</p>
                    <span className="text-maiyu-purple font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                      {t("home.learnMore")}
                      <ArrowRight size={16} />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Featured Portfolio */}
      <section className="py-24 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <AnimateInView variant="fadeUp">
            <h2 className="text-foreground text-4xl font-extrabold mb-12">{t("home.selectedWork")}</h2>
          </AnimateInView>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "ADACAIBS",
                category: "React · AdonisJS · PostgreSQL",
                img: "/images/adacaibs.webp",
                url: "https://adacaibs.com.br",
              },
              {
                title: "MatisCraft",
                category: "React · Fastify · Prisma",
                img: "/images/matis.webp",
                url: "https://matis.maiyu.com.br",
              },
            ].map((project) => (
              <AnimateInView key={project.title} variant="fadeUp">
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="group cursor-pointer block">
                  <div className="relative overflow-hidden rounded-3xl mb-6 bg-card">
                    <img
                      className="w-full aspect-[16/10] object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      src={project.img}
                      alt={project.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-8">
                      <div>
                        <h4 className="text-foreground text-2xl font-bold mb-2">{project.title}</h4>
                        <p className="text-maiyu-purple font-medium">{project.category}</p>
                      </div>
                    </div>
                  </div>
                </a>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-maiyu-purple">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <AnimateInView variant="fadeUp">
            <h2 className="text-maiyu-black text-4xl md:text-6xl font-extrabold mb-8 leading-tight">
              {t("home.ctaTitle")}
            </h2>
          </AnimateInView>
          <AnimateInView variant="fadeUp" delay={0.1}>
            <p className="text-maiyu-black/80 text-xl font-medium mb-12 max-w-2xl mx-auto">
              {t("home.ctaDescription")}
            </p>
          </AnimateInView>
          <AnimateInView variant="fadeUp" delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/contact">
                <Button className="w-full sm:w-auto bg-maiyu-black text-white px-10 py-6 rounded-2xl font-extrabold text-xl hover:scale-105 transition-transform">
                  {t("home.ctaButton1")}
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button variant="outline" className="w-full sm:w-auto border-2 border-maiyu-black text-maiyu-black px-10 py-6 rounded-2xl font-extrabold text-xl hover:bg-maiyu-black hover:text-maiyu-purple transition-all">
                  {t("home.ctaButton2")}
                </Button>
              </Link>
            </div>
          </AnimateInView>
        </div>
      </section>
    </div>
  );
};

export default Home;
