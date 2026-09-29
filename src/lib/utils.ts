import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Shared form field styling: boxed input, label above. */
export const fieldCls =
  "h-12 rounded-xl border-foreground/20 bg-background px-4 text-body placeholder:text-foreground/50 focus-visible:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring/25";
export const labelCls = "text-small font-medium text-foreground";
