"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseIntersectionObserverOptions {
  /** Ref element or null */
  root?: Element | null;
  /** Margin around the root. Similar to CSS margin. */
  rootMargin?: string;
  /** Number between 0 and 1 indicating the percentage of the target's visibility to trigger. */
  threshold?: number;
  /** Only trigger once (unobserve after first intersection). Default true. */
  triggerOnce?: boolean;
}

/**
 * A hook that observes an element with IntersectionObserver and returns whether
 * it is intersecting (visible in the viewport).
 *
 * @param options - IntersectionObserver configuration.
 * @returns A tuple: [ref to attach to the observed element, isIntersecting boolean].
 */
export function useIntersectionObserver({
  root = null,
  rootMargin = "200px",
  threshold = 0,
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggeredOnceRef = useRef(false);

  const ref = useCallback(
    (node: Element | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      // If triggerOnce and already triggered, mark as intersecting immediately
      if (triggerOnce && triggeredOnceRef.current) {
        setIsIntersecting(true);
        return;
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsIntersecting(true);
              if (triggerOnce) {
                triggeredOnceRef.current = true;
                observerRef.current?.unobserve(entry.target);
              }
            } else if (!triggerOnce) {
              setIsIntersecting(false);
            }
          });
        },
        {
          root,
          rootMargin,
          threshold,
        },
      );

      observerRef.current.observe(node);
    },
    [root, rootMargin, threshold, triggerOnce],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [ref, isIntersecting];
}
