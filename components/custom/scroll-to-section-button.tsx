"use client";

import { Button } from "@/components/ui/button";

/** Props for {@link ScrollToSectionButton} */
interface ScrollToSectionButtonProps {
  /** The `id` of the target section element to scroll to */
  targetId: string;
  /** Additional CSS class names */
  className?: string;
  /** HTML `id` attribute for the button element */
  id?: string;
  /** Child content for the button */
  children: React.ReactNode;
}

/**
 * Button that scrolls smoothly to a section identified by its DOM `id`.
 *
 * Heuristic: Fitts's Law — renders a clear, tappable target
 * Heuristic: Nielsen #4 Consistency — reuses existing Button component
 *
 * @param props - See {@link ScrollToSectionButtonProps}
 * @returns The rendered scroll-to-section button.
 */
export function ScrollToSectionButton({
  targetId,
  className,
  id,
  children,
}: ScrollToSectionButtonProps) {
  /**
   * Scrolls smoothly to the target element.
   */
  const handleClick = () => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Button variant="ghost" onClick={handleClick} className={className} id={id}>
      {children}
    </Button>
  );
}
