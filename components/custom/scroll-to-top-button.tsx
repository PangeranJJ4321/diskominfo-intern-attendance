"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

/**
 * Floating button that scrolls the page back to the top.
 * Only visible after the user has scrolled past a threshold.
 *
 * Heuristic: Fitts's Law — large touch target placed at bottom-right
 *
 * @returns {React.JSX.Element | null} The scroll-to-top button or null when hidden.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Scrolls the window smoothly to the top.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-6 right-6 z-50 size-10 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-4" />
    </Button>
  );
}
