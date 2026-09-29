import { useLanguage } from "@/contexts/language";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SkyBackdrop } from "../sky";

const linkCls =
  "group inline-flex items-center gap-1 text-body text-foreground/70 transition-colors duration-300 hover:text-foreground";

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

  const socials = [
    { name: "GitHub", href: "https://github.com/maiyu-dev" },
    { name: "LinkedIn", href: "https://linkedin.com/company/maiyu" },
  ];

  return (
    <footer className="relative isolate overflow-hidden pt-4">
      <SkyBackdrop fade={false} className="-z-10 top-[45%] [mask-image:linear-gradient(to_bottom,transparent,black_35%)]" />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-background md:grid-cols-4 md:divide-x md:divide-foreground/10">
          <div className="border-b border-foreground/10 p-8 md:border-b-0">
            <img src="/favicon.svg" alt="" className="mb-5 size-9" />
            <p className="max-w-xs font-serif text-body-lg leading-snug text-foreground/85">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="border-b border-foreground/10 p-8 md:border-b-0">
            <p className="mb-4 text-small text-muted-foreground">{t("footer.navigation")}</p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkCls}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-b border-foreground/10 p-8 md:border-b-0">
            <p className="mb-4 text-small text-muted-foreground">{t("footer.social")}</p>
            <ul className="space-y-2">
              {socials.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    {s.name}
                    <ArrowUpRight size={13} strokeWidth={1.75} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8">
            <p className="mb-4 text-small text-muted-foreground">{t("footer.contact")}</p>
            <ul className="space-y-2 text-body text-foreground/70">
              <li>Rua Gildo Sampaio, 140</li>
              <li>CM Filadelfia, Benjamin Constant, AM</li>
              <li>
                <a href="mailto:contato@maiyu.com" className={linkCls}>
                  contato@maiyu.com
                </a>
              </li>
              <li>
                <a href="tel:+5597984317149" className={linkCls}>
                  +55 (97) 9 8431-7149
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-16 pb-8 text-center">
          <p className="text-small text-[#253241]/80 dark:text-foreground/70">
            © {currentYear} Maiyu. {t("footer.rights")}. {t("footer.signoff")}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t("footer.backToTop")}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#253241] text-[#F7F9E8] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <ArrowUp size={15} strokeWidth={1.75} />
          </button>
        </div>

        <p
          aria-hidden="true"
          className="select-none text-center font-display text-[clamp(5rem,22vw,18rem)] font-medium leading-[0.72] tracking-[-0.06em] text-[#253241]/15 dark:text-foreground/10"
        >
          Maiyu
        </p>
      </div>
    </footer>
  );
};

export default Footer;
