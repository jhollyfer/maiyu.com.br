import { useLanguage } from "@/contexts/language";
import { Github, Linkedin, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const scrollToTop = (duration = 1200) => {
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

  const navLinks = [
    { name: t("nav.home"), to: "/" },
    { name: t("nav.portfolio"), to: "/portfolio" },
    { name: t("nav.blog"), to: "/blog" },
    { name: t("nav.career"), to: "/career" },
    { name: t("nav.contact"), to: "/contact" },
  ];

  return (
    <footer className="relative bg-canvas-bone dark:bg-canvas-moss border-t border-foreground/[0.06] overflow-hidden">
      {/* Massive editorial sign-off */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-24 md:pt-32 pb-10">
        <div className="mb-20 md:mb-28">
          <p className="eyebrow mb-6">— {t("footer.signoff")}</p>
          <h2 className="font-display text-display font-400 leading-[0.92] tracking-[-0.03em] text-foreground max-w-[18ch]">
            Maiyu<span className="text-[color:var(--color-amber)]">.</span>
          </h2>
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12 pb-16 border-t border-foreground/[0.08] pt-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-5">
            <p className="text-body font-sans text-foreground/80 leading-relaxed max-w-sm mb-8">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/maiyu-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-10 items-center justify-center rounded-full border border-foreground/15 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-[color,border-color] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                aria-label="GitHub"
              >
                <Github size={15} strokeWidth={1.4} />
              </a>
              <a
                href="https://linkedin.com/company/maiyu"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-10 items-center justify-center rounded-full border border-foreground/15 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-[color,border-color] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                aria-label="LinkedIn"
              >
                <Linkedin size={15} strokeWidth={1.4} />
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div className="md:col-span-3">
            <p className="eyebrow mb-5">{t("footer.navigation")}</p>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-1.5 font-sans text-body text-foreground/70 hover:text-foreground transition-colors duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <span>{link.name}</span>
                    <ArrowUpRight
                      size={13}
                      strokeWidth={1.4}
                      className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <p className="eyebrow mb-5">{t("footer.contact")}</p>
            <ul className="space-y-2.5">
              <li className="font-sans text-body text-foreground/70">
                Rua Gildo Sampaio, 140
              </li>
              <li className="font-sans text-body text-foreground/70">
                CM Filadelfia — Benjamin Constant, AM
              </li>
              <li>
                <a
                  href="mailto:contato@maiyu.com"
                  className="group inline-flex items-center gap-1.5 font-sans text-body text-[color:var(--color-forest)] dark:text-[color:var(--color-forest-bright)] hover:opacity-80 transition-opacity"
                >
                  contato@maiyu.com
                  <ArrowUpRight
                    size={13}
                    strokeWidth={1.4}
                    className="transition-transform duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              </li>
              <li>
                <a
                  href="tel:+5597984317149"
                  className="font-sans text-body text-foreground/70 hover:text-foreground transition-colors"
                >
                  +55 (97) 9 8431-7149
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-10 border-t border-foreground/[0.08]">
          <p className="font-sans text-small text-muted-foreground">
            © {currentYear} Maiyu SH. {t("footer.rights")}.
          </p>
          <p className="font-sans text-small text-muted-foreground italic max-w-md">
            {t("footer.colophon")}
          </p>
          <button
            onClick={() => scrollToTop()}
            className="group inline-flex items-center gap-2 font-sans text-small text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="eyebrow">{t("footer.backToTop")}</span>
            <span className="inline-flex size-8 items-center justify-center rounded-full border border-foreground/15 group-hover:border-foreground/40 transition-[border-color,transform] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 19V5M5 12L12 5L19 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
