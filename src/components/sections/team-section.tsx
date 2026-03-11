import { useLanguage } from "@/contexts/language";
import {
  StaggerContainer,
  staggerItemVariants,
  AnimateInView,
} from "@/components/motion/animate-in-view";
import { motion } from "framer-motion";

const teamMembers = [
  { key: "jhollyfer", image: "/jhollyfer.png" },
  { key: "lenny", image: "/lenny.png" },
  { key: "geison", image: "/geison.png" },
  { key: "matheus", image: "/matheus.png" },
];

export function TeamSection() {
  const { t } = useLanguage();

  return (
    <section id="team" className="py-28 px-6" style={{ backgroundColor: "#080f0b" }}>
      <div className="container mx-auto">
        <AnimateInView className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-px bg-maiyu-green inline-block" />
            <p className="text-maiyu-green font-body text-[10px] font-medium tracking-[0.3em] uppercase">
              {t("team.heading")}
            </p>
          </div>
        </AnimateInView>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {teamMembers.map((member) => (
            <motion.div
              key={member.key}
              variants={staggerItemVariants}
              className="group text-center"
            >
              {/* Avatar — square with amber ring on hover */}
              <div
                className="w-24 h-24 mx-auto mb-4 overflow-hidden relative"
                style={{ borderRadius: "2px" }}
              >
                <div className="absolute inset-0 border border-transparent group-hover:border-maiyu-amber/60 transition-all duration-400 z-10" />
                <img
                  src={member.image}
                  alt={t(`team.${member.key}.name`)}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                />
              </div>

              <h3 className="font-heading font-bold text-sm text-foreground">
                {t(`team.${member.key}.name`)}
              </h3>
              <p className="text-white/35 font-body text-[10px] mt-1 tracking-wider uppercase">
                {t(`team.${member.key}.role`)}
              </p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
