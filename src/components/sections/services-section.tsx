import { useLanguage } from "@/contexts/language";
import { StaggerContainer, staggerItemVariants } from "@/components/motion/animate-in-view";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { Globe, Smartphone, Server, Database, Palette, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const icons = [Globe, Smartphone, Server, Database, Palette, Leaf];

export function ServicesSection() {
  const { t } = useLanguage();

  const services = [
    { key: "web", icon: icons[0] },
    { key: "mobile", icon: icons[1] },
    { key: "backend", icon: icons[2] },
    { key: "database", icon: icons[3] },
    { key: "design", icon: icons[4] },
    { key: "sustainable", icon: icons[5] },
  ];

  return (
    <section id="services" className="py-24 px-6 bg-white/[0.02]">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <AnimateInView>
              <p className="text-maiyu-green text-sm font-medium tracking-widest uppercase mb-3">
                {t("services.label")}
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                {t("services.heading")}
              </h2>
            </AnimateInView>
          </div>

          <StaggerContainer className="lg:col-span-8 space-y-0 divide-y divide-white/10">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.key}
                  variants={staggerItemVariants}
                  className="group flex items-start gap-6 py-6 first:pt-0 last:pb-0 transition-colors duration-300 hover:bg-white/[0.02] -mx-4 px-4 rounded-lg"
                >
                  <span className="text-white/30 font-mono text-sm mt-1 shrink-0 w-8">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon
                    size={22}
                    className="text-maiyu-purple shrink-0 mt-1 group-hover:text-maiyu-blue transition-colors duration-300"
                  />
                  <div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-maiyu-green transition-colors duration-300">
                      {t(`services.${service.key}.title`)}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {t(`services.${service.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
