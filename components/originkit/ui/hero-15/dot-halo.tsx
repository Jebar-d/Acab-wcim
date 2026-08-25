// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { useEffect, useState } from "react";

import PixelCard from "@/components/originkit/ui/hero-15/pixel-card";

/**
 * Figma "Mask group" (1:1409 phone / 1:859 + 1:861 tablet) — the grainy dot
 * wash behind the creator tiles.
 *
 * Phone composes it as one mask over one group: a 500x500 alpha stencil of 4px
 * squares on a 12px pitch (1:1410), masking three #d9d9d9 circles under a 56px
 * blur (1:1411 / 1:1412 / 1:1413). Ported live rather than as a flat stencil —
 * PixelCard draws the same grid on a canvas, so each dot grows in and then
 * shimmers instead of sitting at a frozen random alpha. Figma's six discrete
 * alpha steps were a still frame of exactly this.
 *
 * The blobs become the mask instead of the masked content, which is the only
 * way round that works when the dots are a canvas. Each is a radial-gradient
 * whose stops trace the alpha profile of a disc of radius R under a Gaussian
 * of sigma — alpha at distance d is about Phi((R - d) / sigma), which is why
 * the centre tops out just under 1 and the falloff runs well past the radius.
 * Multiple mask layers composite as `add`, so they read as one field.
 *
 * Tablet re-cuts it rather than scaling: two patches instead of three (1:859
 * and 1:861), and a coarser grid — 5px squares on a 15px pitch. The patches are
 * pulled in from the rects Figma draws, since those bound the blur rather than
 * the visible field; measured against the tablet render the dots die out around
 * y1030 and never reach the headline. Both are canvas geometry, not CSS, so
 * they switch on a media query here rather than a Tailwind variant.
 *
 * Desktop (1:2252 / 1:2255) goes back to the phone's 4-on-12 grid but masks it
 * with two rectangles instead of circles — see DESKTOP_MASK.
 */

const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1280px)";

/** Figma's texture pitch and square size, per breakpoint, in frame pixels. */
const GRID = {
  phone: { pitch: 12, dot: 4 },
  tablet: { pitch: 15, dot: 5 },
  desktop: { pitch: 12, dot: 4 },
};

/** Phone — three circles: r100 at (54,645), r100 22px inside the right edge at
 *  y687, and r111 centred at y890, mostly below the frame. sigma 56. */
const PHONE_MASK = [
  "radial-gradient(circle 280px at 54px 645px, rgba(0,0,0,0.963) 0%, rgba(0,0,0,0.894) 10.7%, rgba(0,0,0,0.762) 21.4%, rgba(0,0,0,0.571) 32.1%, rgba(0,0,0,0.5) 35.7%, rgba(0,0,0,0.296) 46.4%, rgba(0,0,0,0.142) 57.1%, rgba(0,0,0,0.037) 71.4%, transparent 100%)",
  "radial-gradient(circle 280px at calc(100% - 22px) 687px, rgba(0,0,0,0.963) 0%, rgba(0,0,0,0.894) 10.7%, rgba(0,0,0,0.762) 21.4%, rgba(0,0,0,0.571) 32.1%, rgba(0,0,0,0.5) 35.7%, rgba(0,0,0,0.296) 46.4%, rgba(0,0,0,0.142) 57.1%, rgba(0,0,0,0.037) 71.4%, transparent 100%)",
  "radial-gradient(circle 290px at 50% 890px, rgba(0,0,0,0.976) 0%, rgba(0,0,0,0.898) 13.8%, rgba(0,0,0,0.71) 27.6%, rgba(0,0,0,0.5) 38.3%, rgba(0,0,0,0.243) 51.7%, rgba(0,0,0,0.079) 65.5%, rgba(0,0,0,0.011) 82.8%, transparent 100%)",
].join(", ");

/** Tablet — r200 at (230,850) and r130 94px inside the right edge at y884.
 *  sigma 60. Tighter than the phone blobs relative to the frame: the tablet
 *  field is concentrated under the buttons and tile row and dies out well
 *  before the headline, where the phone one still carries. */
const TABLET_MASK = [
  "radial-gradient(circle 380px at 230px 850px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.977) 21.1%, rgba(0,0,0,0.841) 36.8%, rgba(0,0,0,0.5) 52.6%, rgba(0,0,0,0.159) 68.4%, rgba(0,0,0,0.023) 84.2%, transparent 100%)",
  "radial-gradient(circle 310px at calc(100% - 94px) 880px, rgba(0,0,0,0.985) 0%, rgba(0,0,0,0.841) 22.6%, rgba(0,0,0,0.5) 41.9%, rgba(0,0,0,0.159) 61.3%, rgba(0,0,0,0.023) 80.6%, transparent 100%)",
].join(", ");

/**
 * Desktop — two patches rather than blobs. Figma masks a 291 x 305 rectangle
 * under the same 56px blur, so the gradient is an ellipse sized to the rect's
 * half-extents (145.5 / 152.5) with the usual sigma-56 falloff, which keeps the
 * flat core a blurred rectangle has.
 *
 * The blur is not what bounds the field though — the 500 x 500 texture is.
 * Figma parks one on each end of the copy plate, and a dot can only exist where
 * that stencil reaches, so the field stops dead on the plate's left edge and
 * again on its right, and cuts off at y817. Past those lines the blur still
 * carries but there is no stencil to print it. Reproduced by giving
 * each patch its own 500-box with `overflow-hidden` rather than masking one
 * full-bleed layer, which had the field bleeding out both ends.
 *
 * Both boxes take the same local mask: the ellipse sits at the identical offset
 * inside each. Unlike phone and tablet, desktop paints these over the copy
 * plate rather than under it — that is Figma's own paint order.
 */
const desktopPatchMask = (cx: number) =>
  `radial-gradient(ellipse 313.5px 320.5px at ${cx}px 347.5px, rgba(0,0,0,0.995) 0%, rgba(0,0,0,0.93) 20%, rgba(0,0,0,0.739) 35%, rgba(0,0,0,0.5) 46.4%, rgba(0,0,0,0.259) 58%, rgba(0,0,0,0.093) 70%, rgba(0,0,0,0.015) 85%, transparent 100%)`;

/**
 * The two boxes are mirror images, not a pair offset the same way. Figma flips
 * the right one — the codegen carries `rotate-180` with `-scale-y-100`, which
 * composes to a horizontal flip, and the mask offset goes 0 -> -209, exactly
 * `-(500 - 291)`, i.e. the stencil re-anchored to the opposite edge.
 *
 * So the left box hangs off rule 3 with its hard edge on the left and fades
 * right; the right box hangs off the same inset from the other side with its
 * hard edge on the right and fades left. Both then tuck into the copy plate's
 * two ends rather than one sitting far out towards the frame edge. The mask
 * ellipse mirrors with the box: 145.5 in from the leading edge either way.
 */
const CELL = "(100% - 126px) / 13";
const INSET = `calc(63px + 3 * ${CELL})`;
const DESKTOP_BOXES = [
  { key: "l", style: { left: INSET }, mask: desktopPatchMask(145.5) },
  { key: "r", style: { right: INSET }, mask: desktopPatchMask(500 - 145.5) },
];

export const DotHalo = () => {
  const [size, setSize] = useState<"phone" | "tablet" | "desktop">("phone");

  useEffect(() => {
    const tablet = window.matchMedia(TABLET_QUERY);
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const sync = () =>
      setSize(
        desktop.matches ? "desktop" : tablet.matches ? "tablet" : "phone",
      );
    sync();
    tablet.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    return () => {
      tablet.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
    };
  }, []);

  const { pitch, dot } = GRID[size];

  const field = (
    <PixelCard
      key={pitch}
      colors={["#d9d9d9"]}
      gap={pitch}
      pixelSize={dot}
      speed={22}
      appearFrom="bottom"
      autoPlay
      transition={{ type: "tween", duration: 1.4, ease: "easeOut" }}
      backgroundColor="transparent"
      borderWidth={0}
      radius={0}
      padding={0}
    />
  );

  if (size === "desktop") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[4]">
        {DESKTOP_BOXES.map(({ key, style, mask }) => (
          <div
            key={key}
            className="absolute size-[500px] overflow-hidden"
            style={{
              ...style,
              top: 317,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          >
            {field}
          </div>
        ))}
      </div>
    );
  }

  const mask = size === "tablet" ? TABLET_MASK : PHONE_MASK;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[4]"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {field}
    </div>
  );
};
