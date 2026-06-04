"use client";

import { ReactNode } from "react";

interface ScrollToSectionButtonProps {
  targetId: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * A button that smoothly scrolls to a target section by ID.
 * Used on the landing page for anchor-style navigation.
 */
export function ScrollToSectionButton({
  targetId,
  children,
  className,
  id,
}: ScrollToSectionButtonProps) {
  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button id={id} onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
