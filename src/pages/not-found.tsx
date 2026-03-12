import React from "react";
import { useLocation } from "react-router-dom";

export function NotFound() {
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center px-6">
        <h1 className="text-9xl font-bold text-gradient mb-8">404</h1>
        <p className="text-2xl text-foreground/80 mb-8">Oops! Page not found</p>
        <p className="text-foreground/60 max-w-md mx-auto mb-10">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <a
          href="/"
          className="inline-flex items-center py-3 px-8 rounded-full bg-gradient-to-r from-maiyu-purple to-maiyu-blue text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-maiyu-purple/20 hover:scale-105"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
