import { useLanguage } from "@/contexts/language";
import { AnimateInView } from "@/components/motion/animate-in-view";
import { MapPin } from "lucide-react";

export function HeroSection() {
  const { t } = useLanguage();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <AnimateInView delay={0}>
              <div className="flex items-center gap-2 text-white/50 text-sm mb-6">
                <MapPin size={14} className="text-maiyu-green" />
                <span>Benjamin Constant, Amazonas</span>
              </div>
            </AnimateInView>

            <AnimateInView delay={0.15}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 whitespace-pre-line">
                {t("hero.title")}
              </h1>
            </AnimateInView>

            <AnimateInView delay={0.25}>
              <p className="text-lg text-white/60 max-w-lg mb-10 leading-relaxed">
                {t("hero.description")}
              </p>
            </AnimateInView>

            <AnimateInView delay={0.35}>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => scrollTo("projects")}
                  className="py-3 px-8 rounded-full bg-gradient-to-r from-maiyu-purple to-maiyu-blue text-white font-medium transition-transform duration-300 hover:scale-105"
                >
                  {t("hero.seeWork")}
                </button>
                <button
                  onClick={() => scrollTo("contact")}
                  className="py-3 px-8 rounded-full border border-white/20 text-white font-medium transition-all duration-300 hover:bg-white/5"
                >
                  {t("hero.talkToUs")}
                </button>
              </div>
            </AnimateInView>
          </div>

          <AnimateInView delay={0.3} variant="fadeIn" className="hidden lg:block">
            <div className="relative">
              <div className="w-full aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-maiyu-purple/20 via-maiyu-blue/10 to-maiyu-green/20 border border-white/5 flex items-center justify-center">
                <span className="text-gradient text-8xl font-black">M.</span>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-maiyu-purple/10 border border-maiyu-purple/20 blur-sm" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-maiyu-blue/10 border border-maiyu-blue/20 blur-sm" />
            </div>
          </AnimateInView>
        </div>
      </div>
    </section>
  );
}
