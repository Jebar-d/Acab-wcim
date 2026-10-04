"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const PalletScene = dynamic(
  () => import("./pallet-scene").then((m) => m.PalletScene),
  { ssr: false }
);

/**
 * Full-bleed, edge-to-edge cinematic section. The 3D pallet group rotates
 * in direct response to how far the user has scrolled through this
 * section (0 at the top edge entering the viewport, 1 as it exits).
 */
export function PalletScrollSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = rect.height + vh;
      const traveled = vh - rect.top;
      progressRef.current = Math.min(1, Math.max(0, traveled / total));
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
    <section
      ref={sectionRef}
      className="relative h-[140vh] w-screen"
      style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0e0e0d]">
        <div
          className="absolute inset-0 bg-cover bg-[right_center] opacity-[0.15]"
          style={{ backgroundImage: "url('/img1.jpe')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/70" />
        <PalletScene progressRef={progressRef} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center px-6 py-14 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            WCIM warehouse
          </span>
          <h2 className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Every pallet, tracked from the moment it lands.
          </h2>
          <div className="flex-1" />
          <span className="text-xs uppercase tracking-[0.25em] text-white/40">
            Scroll to rotate
          </span>
        </div>
      </div>
    </section>
  );
}
