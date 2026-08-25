// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import CurvedLoop from "@/components/originkit/ui/hero-15/curved-marquee";

/**
 * Figma "Marque" (1:1331 phone / 1:863 tablet / 1:2281 desktop) —
 * "2 Months Free - Annually" running along an arc that crests just above the
 * headline.
 *
 * Figma bakes the arc into per-glyph rotations; those give away the geometry.
 * Across the middle repeat the glyphs swing from -12.29deg to +12.33deg at
 * every breakpoint, so all three are the same ring at a different size:
 * radius 305 / 483 / 528 carrying 8.944 / 14.2 / 15.608px type.
 *
 * CurvedLoop draws its baseline as `M-100,400 Q720,400+curveAmount 1540,400`
 * in a 1440x800 viewBox, so its radius is 1640^2 / (4 * |curveAmount|) in
 * viewBox units and the svg scales by width/1440. Radius and type therefore
 * both key off one number — the band width — which is why curveAmount,
 * fontSize, letterSpacing and gap are shared and only the band box moves.
 *
 * SIZED TO THE CREST, NOT THE WHOLE RING. The band spans the arc out to +/-22
 * degrees of glyph rotation and no further, so `half-span = R * sin(22)` and
 * `W = 0.7492R`. Because W tracks R, the two shared constants fall out of it:
 *   |curveAmount| = 1640^2 * 0.7492 / (4 * 1440) = 350
 *   fontSize      = (font/R) * 1440 / 0.7492     = 56.5
 * and those widths reproduce Figma's radii to the pixel — 305.0, 483.0, 528.0.
 *
 * That sizing is what replaced Figma's two clip discs. Figma hides the ring's
 * descending tails behind solid #f5f5f5 ellipses, which costs nothing in a
 * static frame but a lot here: they were the only opaque things in this layer,
 * so they blanked whichever grid rules they crossed and had to be patched back
 * in three places. Nor could they be trusted to cover — the phone band began at
 * x53 while its disc only reached the arc at x69, and a running ring kept
 * surfacing in the gap. Cutting the band down to the crest puts the tails
 * outside the box entirely, so `overflow-hidden` takes them and nothing opaque
 * is left to sit on the background pattern.
 *
 * `fade` softens the two edges that remain. Without it the clip slices whatever
 * glyph is crossing the boundary and parks half a letter on it; at 10 percent
 * the ramp is two to four glyphs and they dissolve on approach instead.
 *
 * letterSpacing is not decoration: Figma's repeat measures 135.9px across 24
 * glyphs where Helvetica Neue Medium sets the same string in ~100px. The
 * missing 36px is 0.175em of tracking, which is 7.95 units at fontSize 56.5.
 */

export const MarqueeBand = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
  >
    <div className="absolute top-[219.3px] left-[19.34%] aspect-[1440/800] w-[56.84%] overflow-hidden ipad:top-[346.1px] ipad:left-[25.41%] ipad:w-[48.64%] desktop-sm:top-[237.7px] desktop-sm:left-[36.89%] desktop-sm:w-[27.47%]">
      <CurvedLoop
        text="2 Months Free - Annually"
        font={{
          fontFamily:
            "var(--font-helvetica-neue-family), 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 500,
          fontSize: 56.5,
          letterSpacing: "7.95px",
        }}
        color="#010101"
        direction="right"
        baseVelocity={8}
        curveAmount={-350}
        gap={4.25}
        draggable={false}
        fade
        fadePercent={10}
        style={{ minHeight: 0, position: "relative" }}
      />
    </div>
  </div>
);
