import { useLanguage } from "@/contexts/language";
import { StaggerContainer, staggerItemVariants } from "@/components/motion/animate-in-view";
import { AnimateInView } from "@/components/motion/animate-in-view";
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
    <section id="team" className="py-24 px-6 bg-white/[0.02]">
      <div className="container mx-auto">
        <AnimateInView className="text-center mb-16">
          <h2 className="text-sm font-medium tracking-[0.2em] uppercase text-white/40 mb-3">
            {t("team.heading")}
          </h2>
        </AnimateInView>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          {teamMembers.map((member) => (
            <motion.div
              key={member.key}
              variants={staggerItemVariants}
              className="text-center group"
            >
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                <img
                  src={member.image}
                  alt={t(`team.${member.key}.name`)}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="font-semibold text-sm">{t(`team.${member.key}.name`)}</h3>
              <p className="text-white/40 text-xs mt-1">{t(`team.${member.key}.role`)}</p>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
