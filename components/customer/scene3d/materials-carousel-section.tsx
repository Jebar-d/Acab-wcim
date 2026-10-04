"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

const MaterialsCarouselScene = dynamic(
  () =>
    import("./materials-carousel-scene").then((m) => m.MaterialsCarouselScene),
  { ssr: false }
);

const MATERIAL_INFO = [
  {
    name: "Cement",
    description: "High-strength cement for foundations, slabs, and masonry work.",
  },
  {
    name: "Steel bars",
    description: "Structural reinforcement for concrete and steel-framed systems.",
  },
  {
    name: "Lumber",
    description: "Framing timber for structural and finish carpentry needs.",
  },
  {
    name: "Hardware",
    description: "Helmets, gloves, and essential site safety hardware in stock.",
  },
  {
    name: "Electrical",
    description: "Breaker panels, wiring, and electrical accessories for active sites.",
  },
  {
    name: "Plumbing",
    description: "Pipes, valves, and fittings ready for delivery.",
  },
] as const;

const SCROLL_LENGTHS_PER_ITEM = 0.9; // viewport-heights of scroll per carousel item

export function MaterialsCarouselSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = rect.height - vh;
      const traveled = -rect.top;
      progressRef.current = Math.min(1, Math.max(0, total > 0 ? traveled / total : 0));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const poll = () => {
      if (activeIndexRef.current !== activeIndex) {
        setActiveIndex(activeIndexRef.current);
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex]);

  const heightVh = 100 * (1 + MATERIAL_INFO.length * SCROLL_LENGTHS_PER_ITEM);
  const info = MATERIAL_INFO[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="relative w-screen"
      style={{
        height: `${heightVh}vh`,
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#faf9f5]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2">
          <Image
            src="/brand/materials.png"
            alt="Materials"
            width={520}
            height={133}
            className="h-auto w-[min(70vw,520px)]"
            priority
          />
        </div>

        <MaterialsCarouselScene
          progressRef={progressRef}
          activeIndexRef={activeIndexRef}
        />

        {/* Hover-reveal info panel: name + description appear beside the
            active item only while the pointer is over the scene. */}
        <div
          className={`pointer-events-none absolute right-[8%] top-1/2 max-w-xs -translate-y-1/2 text-left transition-all duration-300 ${
            hovered ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          }`}
        >
          <h3 className="text-3xl font-semibold tracking-tight text-[#161514] md:text-4xl">
            {info.name}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#6b6862] md:text-base">
            {info.description}
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-2">
          {MATERIAL_INFO.map((m, i) => (
            <span
              key={m.name}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-[#161514]" : "w-1.5 bg-[#161514]/25"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
