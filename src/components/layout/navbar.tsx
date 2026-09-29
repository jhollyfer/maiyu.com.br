import { CtaLink } from "@/components/cta-link";
import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";
import { CALL_URL, cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LanguageSwitcher from "../language-switcher";

const EASE = [0.16, 1, 0.3, 1] as const;

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { name: t("nav.portfolio"), to: "/portfolio" },
    { name: t("nav.blog"), to: "/blog" },
    { name: t("nav.career"), to: "/career" },
  ];
  const mobileLinks = [...navLinks, { name: t("nav.contact"), to: "/contact" }];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const themeButton = (
    <button
      onClick={toggleTheme}
      className="inline-flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
        <div
          className={cn(
            "mx-auto grid h-14 grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border pl-4 pr-2 transition-[max-width,background-color,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:grid-cols-[auto_1fr_auto]",
            scrolled || mobileMenuOpen
              ? "max-w-5xl border-foreground/[0.08] bg-surface/80 shadow-[0_8px_30px_-12px_var(--shadow-tint)] backdrop-blur-xl"
              : "max-w-7xl border-transparent bg-transparent",
          )}
        >
          <Link to="/" className="flex items-center gap-2 justify-self-start py-2" aria-label="Maiyu home">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="font-brand text-lg uppercase tracking-[0.08em] text-foreground dark:text-brand-green">
              Maiyu
            </span>
          </Link>

          <nav className="hidden lg:block lg:pl-10" aria-label="Main">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname.startsWith(link.to);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-full px-4 py-2 text-small font-medium transition-colors duration-300",
                        active
                          ? "bg-foreground/[0.06] font-semibold text-foreground underline decoration-brand-green decoration-2 underline-offset-[6px] dark:text-brand-green"
                          : "text-foreground/70 hover:text-foreground",
                      )}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 justify-self-end">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <div className="hidden md:block">{themeButton}</div>
            <CtaLink to="/contact" variant="soft" className="ml-1 hidden rounded-xl px-4 py-2 md:inline-flex">
              {t("nav.contact")}
            </CtaLink>
            <CtaLink to={CALL_URL} variant="brand" className="hidden rounded-xl px-4 py-2 md:inline-flex">
              {t("nav.getInTouch")}
            </CtaLink>

            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06] lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="relative block size-4">
                <span
                  className={cn(
                    "absolute inset-x-0 h-[1.5px] rounded-full bg-current transition-[top,bottom,transform] duration-500",
                    mobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[5px]",
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-0 h-[1.5px] rounded-full bg-current transition-[top,bottom,transform] duration-500",
                    mobileMenuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-[5px]",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex h-full flex-col justify-between px-4 pt-24 pb-10">
              <nav aria-label="Mobile">
                <ul className="flex flex-col">
                  {mobileLinks.map((link, i) => (
                    <motion.li
                      key={link.to}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease: EASE }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={location.pathname.startsWith(link.to) ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between border-b border-foreground/[0.08] py-5 font-display text-4xl font-bold tracking-[-0.015em]",
                          location.pathname.startsWith(link.to) ? "text-foreground" : "text-foreground/60",
                        )}
                      >
                        {link.name}
                        {location.pathname.startsWith(link.to) && (
                          <span aria-hidden="true" className="brand-bar w-10" />
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <div className="flex items-center justify-between gap-4 pt-10">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  {themeButton}
                </div>
                <CtaLink to={CALL_URL} variant="brand" onClick={() => setMobileMenuOpen(false)}>
                  {t("nav.getInTouch")}
                </CtaLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
