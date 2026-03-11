import { useLanguage } from "@/contexts/language";
import { Github, Linkedin, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";

const scrollToTop = (duration = 1400) => {
  const start = window.scrollY;
  const startTime = performance.now();
  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start * (1 - ease(progress)));
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="pt-20 border-t border-white/8"
      style={{ backgroundColor: "#272221" }}
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">

          {/* Brand */}
          <div>
            <Link to="/" className="block mb-4">
              <span className="text-gradient font-heading text-3xl font-black">
                Maiyu.
              </span>
            </Link>
            <p className="text-white/45 font-body text-xs leading-[1.9] mb-6 max-w-xs">
              {t("footer.tagline")}
            </p>
            <div className="flex space-x-3">
              <a
                href="https://github.com/maiyu-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-white/8 hover:border-white/20 text-white/40 hover:text-white transition-all duration-200"
                style={{ borderRadius: "1px" }}
              >
                <Github size={15} />
              </a>
              <a
                href="https://linkedin.com/company/maiyu"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-white/8 hover:border-white/20 text-white/40 hover:text-white transition-all duration-200"
                style={{ borderRadius: "1px" }}
              >
                <Linkedin size={15} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground mb-5">
              {t("footer.services")}
            </h3>
            <ul className="space-y-3">
              {["web", "mobile", "software", "design", "sustainable"].map((key) => (
                <li key={key} className="text-white/40 font-body text-xs">
                  {t(`footer.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground mb-5">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-3">
              <li className="text-white/40 font-body text-xs">Maiyu SH</li>
              <li className="text-white/40 font-body text-xs">
                Rua Gildo Sampaio, 140, CM Filadelfia
              </li>
              <li className="text-white/40 font-body text-xs">
                Benjamin Constant, Amazonas
              </li>
              <li>
                <a
                  href="mailto:contato@maiyu.com"
                  className="text-maiyu-amber hover:text-maiyu-amber/70 font-body text-xs transition-colors duration-200"
                >
                  contato@maiyu.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 font-body text-xs">
            &copy; {currentYear} Maiyu SH. {t("footer.rights")}
          </p>

          <div className="flex items-center gap-6">
            <span className="text-white/20 font-body text-xs">{t("footer.terms")}</span>
            <span className="text-white/20 font-body text-xs">{t("footer.privacy")}</span>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-white/35 hover:text-maiyu-amber font-body text-xs tracking-wider uppercase transition-colors duration-200 group"
            >
              <span>{t("footer.backToTop")}</span>
              <span className="border border-white/15 group-hover:border-maiyu-amber/50 p-1 transition-colors duration-200" style={{ borderRadius: "2px" }}>
                <ArrowUp size={11} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
