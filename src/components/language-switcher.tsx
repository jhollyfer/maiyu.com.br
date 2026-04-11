import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, type Language } from "@/contexts/language";
import { cn } from "@/lib/utils";

type LanguageOption = {
  code: Language;
  label: string;
  native: string;
};

const options: LanguageOption[] = [
  { code: "pt-BR", label: "PT", native: "Português" },
  { code: "en", label: "EN", native: "English" },
  { code: "es", label: "ES", native: "Español" },
];

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const current = options.find((o) => o.code === language) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/60",
          "px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] uppercase",
          "text-muted-foreground hover:text-foreground hover:border-foreground/20",
          "transition-[color,border-color] duration-[480ms]",
          "ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none",
        )}
        aria-label="Change language"
      >
        <span
          className="size-1 rounded-full bg-[var(--color-amber)]"
          aria-hidden="true"
        />
        {current.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-[180px] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl p-1.5"
      >
        {options.map((option) => {
          const active = option.code === language;
          return (
            <DropdownMenuItem
              key={option.code}
              onSelect={() => setLanguage(option.code)}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer",
                "text-sm transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active
                  ? "bg-foreground/5 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-sans">{option.native}</span>
              <span className="text-[10px] tracking-[0.22em] font-medium uppercase">
                {option.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
