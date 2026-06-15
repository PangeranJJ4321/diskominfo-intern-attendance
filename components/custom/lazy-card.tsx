"use client";

import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface LazyCardProps {
  /** Content to render when the card enters the viewport */
  children: ReactNode;
  /**
   * Height for the skeleton placeholder. Use Tailwind arbitrary values
   * such as `h-[400px]` or shorthand `h-64`. Default `h-[400px]`.
   *
   * Chosen to roughly match the height of the content-card being replaced to
   * minimise Cumulative Layout Shift (CLS).
   */
  skeletonHeight?: string;
  /**
   * Custom className for the outer wrapper `<div>`. This div hosts the
   * IntersectionObserver ref and participates in parent layout (flex / grid).
   */
  className?: string;
}

/**
 * Viewport-aware lazy container.
 *
 * Renders a matching-height skeleton until the element scrolls within
 * `200px` of the viewport, then mounts `children` permanently.
 * Designed to wrap dashboard cards so their heavy data-fetching
 * `useEffect` calls are deferred until scrolled into view.
 *
 * @param props - Component properties.
 * @returns The skeleton placeholder or the actual children.
 */
export function LazyCard({
  children,
  skeletonHeight = "h-[400px]",
  className = "",
}: LazyCardProps) {
  const [ref, isInView] = useIntersectionObserver({
    rootMargin: "-100px",
    triggerOnce: true,
  });

  return (
    <div ref={ref} className={className}>
      {isInView ? (
        children
      ) : (
        <Skeleton
          className={`${skeletonHeight} w-full rounded-xl border border-border/50`}
        />
      )}
    </div>
  );
}
