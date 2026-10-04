"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const VehicleScene = dynamic(
  () => import("./vehicle-scene").then((m) => m.VehicleScene),
  {
    ssr: false,
  },
);

export function VehicleDescendSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;

    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();

      const vh = window.innerHeight || 1;

      /*
       * Start the vehicle above the screen.
       * As this section enters the viewport,
       * the vehicle smoothly drops into place.
       */

      const raw = (vh - rect.top) / (vh * 0.65);

      const progress = Math.min(1, Math.max(0, raw));

      progressRef.current = progress;

      setReveal(progress);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);

      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="
        relative
        h-[550px]
        w-full
        overflow-visible
      "
    >
      <div
        className="
          absolute
          inset-0
        "
      >
        <VehicleScene progressRef={progressRef} />
      </div>
    </div>
  );
}
