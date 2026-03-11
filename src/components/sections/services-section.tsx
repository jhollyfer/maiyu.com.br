import { useLanguage } from "@/contexts/language";
import {
  StaggerContainer,
  staggerItemVariants,
  AnimateInView,
} from "@/components/motion/animate-in-view";
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
    <section id="services" className="py-28 px-6" style={{ backgroundColor: "#272221" }}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Section label — editorial left column */}
          <div className="lg:col-span-4">
            <AnimateInView>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-6 h-px bg-maiyu-amber inline-block" />
                <p className="text-maiyu-amber font-body text-[10px] font-medium tracking-[0.3em] uppercase">
                  {t("services.label")}
                </p>
              </div>
              <h2 className="font-heading text-3xl lg:text-4xl font-bold leading-tight text-foreground">
                {t("services.heading")}
              </h2>
            </AnimateInView>
          </div>

          {/* Services list */}
          <StaggerContainer className="lg:col-span-8 divide-y divide-white/6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.key}
                  variants={staggerItemVariants}
                  className="group relative flex items-start gap-6 py-7 first:pt-0 last:pb-0 transition-all duration-300"
                >
                  {/* Large number watermark */}
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 font-heading font-black text-white pointer-events-none select-none leading-none"
                    style={{
                      fontSize: "clamp(48px, 5vw, 80px)",
                      opacity: 0.04,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Small index */}
                  <span className="text-white/20 font-body text-xs mt-1.5 shrink-0 w-6 tracking-wider">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Icon */}
                  <Icon
                    size={18}
                    className="text-maiyu-amber shrink-0 mt-1.5 transition-colors duration-300 group-hover:text-maiyu-amber"
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="font-heading text-base font-bold mb-1.5 text-foreground group-hover:text-maiyu-amber transition-colors duration-300">
                      {t(`services.${service.key}.title`)}
                    </h3>
                    <p className="text-white/45 font-body text-xs leading-[1.8]">
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
