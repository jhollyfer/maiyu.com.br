import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import LanguageSwitcher from "../language-switcher";

const EASE = [0.16, 1, 0.3, 1] as const;

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

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
    { name: t("nav.home"), to: "/" },
    { name: t("nav.portfolio"), to: "/portfolio" },
    { name: t("nav.blog"), to: "/blog" },
    { name: t("nav.career"), to: "/career" },
    { name: t("nav.contact"), to: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* ─── Floating glass island navbar ──────────────────────── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 pointer-events-none",
          "px-4 pt-4 md:pt-6 transition-[padding] duration-[820ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled && "md:pt-4",
        )}
      >
        <div
          className={cn(
            "pointer-events-auto mx-auto flex items-center justify-between gap-4",
            "max-w-6xl w-full rounded-full border border-foreground/[0.08]",
            "bg-background/70 backdrop-blur-2xl",
            "pl-5 pr-2 md:pl-7 md:pr-3 py-2 md:py-2.5",
            "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(20,24,20,0.25)]",
            "transition-[padding,background-color,border-color,box-shadow] duration-[820ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled && "bg-background/90 border-foreground/[0.12]",
          )}
        >
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2 z-[51]"
            aria-label="Maiyu home"
          >
            <span
              className="size-2 rounded-full bg-[color:var(--color-amber)]"
              aria-hidden="true"
            />
            <span className="font-display text-2xl md:text-[1.6rem] font-500 leading-none tracking-[-0.02em] text-foreground">
              Maiyu
            </span>
            <span className="font-display text-2xl md:text-[1.6rem] font-400 leading-none -ml-0.5 text-[color:var(--color-amber)]">
              .
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            <ul className="flex items-center gap-7">
              {navLinks.map((link) => {
                const active =
                  link.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.to);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={cn(
                        "relative font-sans text-[12px] font-medium tracking-[0.14em] uppercase py-1.5",
                        "transition-colors duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {link.name}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 left-0 right-0 h-px origin-left bg-[color:var(--color-amber)]",
                          "transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                          active ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            <button
              onClick={toggleTheme}
              className="hidden md:inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Primary CTA — desktop */}
            <Link
              to="/contact"
              className="group relative hidden md:inline-flex items-center gap-1 pl-5 pr-1 py-1.5 rounded-full bg-foreground text-background text-[12px] font-medium tracking-[0.06em] font-sans transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color:var(--color-forest)] hover:text-[color:var(--color-canvas-cream)] dark:hover:bg-[color:var(--color-forest-bright)] active:scale-[0.97]"
            >
              <span>{t("nav.getInTouch")}</span>
              <span className="ml-1 flex size-7 items-center justify-center rounded-full bg-background/15 group-hover:bg-background/25 transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7 17L17 7M17 7H9M17 7V15"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>

            {/* Mobile hamburger — morphs to X */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="lg:hidden inline-flex size-10 items-center justify-center rounded-full text-foreground hover:bg-foreground/[0.06] transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="relative block size-4">
                <span
                  className={cn(
                    "absolute left-0 right-0 h-[1.5px] bg-current rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
                    mobileMenuOpen
                      ? "top-1/2 -translate-y-1/2 rotate-45"
                      : "top-[5px]",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 right-0 h-[1.5px] bg-current rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
                    mobileMenuOpen
                      ? "top-1/2 -translate-y-1/2 -rotate-45"
                      : "bottom-[5px]",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile menu overlay ─────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl lg:hidden"
          >
            <div className="flex h-full flex-col justify-between px-6 pt-28 pb-10">
              <nav>
                <ul className="flex flex-col gap-1">
                  {navLinks.map((link, i) => (
                    <motion.li
                      key={link.to}
                      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.7,
                        delay: 0.08 + i * 0.06,
                        ease: EASE,
                      }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-baseline justify-between border-b border-foreground/[0.08] py-5"
                      >
                        <span className="font-display text-4xl font-400 tracking-[-0.02em] text-foreground group-hover:text-[color:var(--color-forest)] dark:group-hover:text-[color:var(--color-forest-bright)] transition-colors duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                          {link.name}
                        </span>
                        <span className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
                          0{i + 1}
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
                className="flex items-center justify-between gap-4 pt-10"
              >
                <div className="flex items-center gap-3">
                  <LanguageSwitcher />
                  <button
                    onClick={toggleTheme}
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
                    aria-label="Toggle theme"
                  >
                    {resolvedTheme === "dark" ? (
                      <Sun size={16} />
                    ) : (
                      <Moon size={16} />
                    )}
                  </button>
                </div>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-[12px] font-medium tracking-[0.06em] font-sans"
                >
                  {t("nav.getInTouch")}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
