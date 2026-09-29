import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const base =
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 font-sans text-small font-medium transition-[background-color,border-color,color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/85",
  ghost:
    "border border-foreground/25 text-foreground hover:border-foreground/50 hover:bg-foreground/[0.04]",
  /* Logo pairing: night ink with brand green; outlined green at night */
  soft: "border border-foreground/25 bg-transparent text-foreground hover:border-foreground/50 hover:bg-foreground/[0.04] dark:border-brand-green/60 dark:text-brand-green dark:hover:bg-brand-green/10",
  brand:
    "bg-brand-green text-navy shadow-[0_10px_28px_-12px_rgba(136,255,154,0.75)] hover:bg-brand-blue",
  light: "bg-on-navy text-navy hover:bg-white",
};

/** Pill link. Internal paths use the router, http(s) opens a new tab. */
export function CtaLink({
  to,
  children,
  variant = "primary",
  arrow = false,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  arrow?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const cls = cn(base, variants[variant], className);
  const content = (
    <>
      {children}
      {arrow && (
        <ArrowUpRight
          size={15}
          strokeWidth={1.75}
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  );

  if (to.startsWith("http")) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
        {content}
      </a>
    );
  }
  return (
    <Link to={to} className={cls} onClick={onClick}>
      {content}
    </Link>
  );
}
