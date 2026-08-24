// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { useEffect, useRef, useState } from "react";

import ParticleImage from "@/components/originkit/ui/hero-20/svg-particle";

/** Public asset under /sections/hero-20/assets */
function asset(file: string) {
  return `/originkit/hero-20/${file}`;
}

/**
 * Halftone building render.
 *
 * Hover assembly is a desktop affordance — touch has no hover to give, and with
 * `hoverEnabled` on, the field idles scattered and would never resolve on a
 * phone or tablet. Below desktop-sm it stays off, so the artwork renders
 * assembled and static.
 */
/**
 * The engine samples the source into an offscreen canvas the size of the
 * container in CSS px, so a narrow phone squashes a 1600px render down to
 * ~340px and every sample averages dark building pixels with the pale
 * background — the field reads washed out. Particles are drawn at
 * `ceil(size / 4 * dpr)` device px on a 2px grid, so bumping the size on small
 * screens closes those gaps and restores the density.
 */
const PARTICLE_SIZE = { mobile: 11, tablet: 8, desktop: 6 };

export const BuildingParticles = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const tablet = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      setIsDesktop(desktop.matches);
      setIsTablet(tablet.matches);
    };
    sync();
    desktop.addEventListener("change", sync);
    tablet.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      tablet.removeEventListener("change", sync);
    };
  }, []);

  /**
   * The copy sits above the canvas, so moving across the headline never reaches
   * the field and the particles ignore the cursor. Pointer moves anywhere in
   * the section are forwarded to the canvas with their real coordinates, so
   * hover and repulsion track the cursor over text as well as open space.
   */
  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = wrap?.closest("main");
    if (!wrap || !stage || !isDesktop) return;

    const canvas = () => wrap.querySelector("canvas");

    const forward = (event: PointerEvent) => {
      canvas()?.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: event.clientX,
          clientY: event.clientY,
          bubbles: true,
        }),
      );
    };

    const release = () => {
      canvas()?.dispatchEvent(
        new MouseEvent("mouseout", {
          bubbles: true,
          relatedTarget: document.body,
        }),
      );
    };

    stage.addEventListener("pointermove", forward);
    stage.addEventListener("pointerleave", release);
    return () => {
      stage.removeEventListener("pointermove", forward);
      stage.removeEventListener("pointerleave", release);
    };
  }, [isDesktop]);

  const particleSize = isDesktop
    ? PARTICLE_SIZE.desktop
    : isTablet
      ? PARTICLE_SIZE.tablet
      : PARTICLE_SIZE.mobile;

  return (
    <div ref={wrapRef} className="size-full">
      <ParticleImage
        width="100%"
        height="100%"
        backgroundColor="transparent"
        particleCount={500}
        particleSize={particleSize}
        particleShape="circle"
        particleColor="original"
        hoverEnabled={isDesktop}
        // Roam targets default to a rectangle spanning the canvas, so the
        // scattered state reads as a hard-edged block of noise; an oval keeps
        // its edges soft. The transition drives both the assemble and the
        // scatter tween — 1.6s lets the building resolve rather than snap.
        hoverConfig={{
          hoverType: "roam",
          roamShape: "oval",
          roamOpacity: 0.5,
          transition: { duration: 1.6, ease: "easeInOut" },
        }}
        repulsionEnabled={isDesktop}
        repulsionConfig={{
          repulsionMode: "random",
          repulsionForce: 10,
          repulsionRadius: 60,
        }}
        imageConfig={{
          image: asset("building.png"),
          mode: "fill",
          scale: 10,
        }}
      />
    </div>
  );
};
