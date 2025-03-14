import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full text-white py-1.5 px-3 cursor-pointer hover:bg-white/10 transition-colors">
        <Globe size={16} />
        <span>{language === "en" ? "EN" : "PT"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-maiyu-dark border-white/10">
        <DropdownMenuItem
          className="text-white/90 hover:text-white hover:bg-white/10 cursor-pointer"
          onClick={() => setLanguage("en")}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-white/90 hover:text-white hover:bg-white/10 cursor-pointer"
          onClick={() => setLanguage("pt-BR")}
        >
          Português
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
