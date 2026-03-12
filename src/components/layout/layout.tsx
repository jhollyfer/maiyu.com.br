import type { ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";
import { ScrollToTop } from "../scroll-to-top";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
