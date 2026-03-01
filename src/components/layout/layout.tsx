import type { ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-maiyu-dark text-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
