import type { ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";
import { ScrollToTop } from "../scroll-to-top";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-brand-green"
      >
        Pular para o conteúdo
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
