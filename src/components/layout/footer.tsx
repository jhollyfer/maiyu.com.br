import { useLanguage } from "@/contexts/language";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

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
    <footer className="border-t border-foreground/[0.08] bg-surface">
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-5">
            <p className="max-w-sm font-serif text-lead leading-snug text-foreground/85">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
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

          <div className="col-span-2 md:col-span-3">
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

        <p
          aria-hidden="true"
          className="mt-20 select-none font-display text-[clamp(5rem,20vw,16rem)] font-medium leading-[0.8] tracking-[-0.06em] text-foreground/[0.07]"
        >
          Maiyu
        </p>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-foreground/[0.08] pt-8 md:flex-row md:items-center">
          <p className="text-small text-muted-foreground">
            © {currentYear} Maiyu. {t("footer.rights")}.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-2 text-small text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("footer.backToTop")}
            <ArrowUp
              size={14}
              strokeWidth={1.75}
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
