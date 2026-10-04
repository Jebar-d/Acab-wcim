"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reports true once the element has scrolled near the viewport, then stays
 * true forever. Used to defer mounting a WebGL <Canvas> until its section
 * is actually about to be seen — mounting every 3D scene on a page at once
 * can exceed the browser's live WebGL context limit and cause silent
 * "Context Lost" failures (contexts just stop rendering, no thrown error).
 */
export function useInView<T extends HTMLElement>(rootMargin = "200px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
