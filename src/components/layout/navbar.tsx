import { CtaLink } from "@/components/cta-link";
import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";
import { cn } from "@/lib/utils";
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
    { name: t("nav.contact"), to: "/contact" },
  ];

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
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500",
          scrolled || mobileMenuOpen
            ? "border-foreground/[0.08] bg-background/75 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 md:px-8 lg:grid-cols-[1fr_auto_1fr]">
          <Link
            to="/"
            className="flex items-center gap-2 justify-self-start"
            aria-label="Maiyu home"
          >
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="font-display text-xl font-medium tracking-[-0.03em] text-foreground">
              Maiyu
            </span>
          </Link>

          <nav className="hidden lg:block" aria-label="Main">
            <ul className="flex items-center gap-8">
              {navLinks.map((link) => {
                const active = location.pathname.startsWith(link.to);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "text-small font-medium transition-colors duration-300",
                        active
                          ? "text-foreground"
                          : "text-foreground/65 hover:text-foreground",
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
            <CtaLink to="/contact" className="ml-2 hidden px-5 py-2.5 md:inline-flex">
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
                    "absolute inset-x-0 h-[1.5px] rounded-full bg-current transition-all duration-500",
                    mobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[5px]",
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-0 h-[1.5px] rounded-full bg-current transition-all duration-500",
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
                  {navLinks.map((link, i) => (
                    <motion.li
                      key={link.to}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease: EASE }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block border-b border-foreground/[0.08] py-5 font-display text-4xl font-medium tracking-[-0.03em] text-foreground"
                      >
                        {link.name}
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
                <CtaLink to="/contact" onClick={() => setMobileMenuOpen(false)}>
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
