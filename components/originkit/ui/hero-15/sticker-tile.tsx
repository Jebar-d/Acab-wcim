// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { useEffect, useRef, useState } from "react";

import StickerPeeling from "@/components/originkit/ui/hero-15/sticker-peel";

/**
 * A creator tile — Figma 1:1452 / 1:1453 / 1:1454 — rendered as a peelable
 * sticker instead of a flat crop.
 *
 * StickerPeeling needs concrete pixel dimensions (it builds a WebGL mesh at
 * that size), but the tile itself is a grid cell that grows with the frame. So
 * the host box reserves the cell at Figma's 72.72 x 72 ratio, measures itself,
 * and only then mounts the sticker — no layout shift either way.
 *
 * Phone fills its grid cell; tablet (1:983 / 1:982 / 1:984) sets a fixed
 * 92.92 x 92 that sits at about 73% of the wider cell, and desktop a fixed
 * 101 x 100, so the width is pinned there and the placement comes from the
 * caller. All three ratios are 0.990, so one aspect box covers them.
 *
 * The shadow offsets ship tuned for a 200px sticker, so they scale with the
 * measured width; otherwise a 73px tile would sit under a shadow cast from
 * several tile-widths away.
 *
 * The measured width is rounded, and that is load-bearing — do not pass the raw
 * fractional cell width. StickerPeeling sizes its backing store as
 * round(width * 4 * devicePixelRatio); a fractional width can land that on an
 * odd number of pixels, which takes down the whole renderer process (a 73.4px
 * tile crashes the tab, 73 and 74 are fine). Integers keep it a multiple of 4.
 */

const NATIVE_SIZE = 200;
const TILE_RATIO = 72 / 72.72;

type StickerTileProps = {
  src: string;
  /** Peel direction in degrees. 240 lifts the bottom-left corner. */
  curlRotation?: number;
  className?: string;
};

export const StickerTile = ({
  src,
  curlRotation = 240,
  className = "",
}: StickerTileProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    setWidth(Math.round(host.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const scale = width / NATIVE_SIZE;

  return (
    <div
      ref={hostRef}
      className={`aspect-[72.72/72] w-full ipad:w-[92.92px] desktop-sm:w-[101px] ${className}`}
    >
      {width > 0 && (
        <StickerPeeling
          image={src}
          imageWidth={width}
          imageHeight={Math.round(width * TILE_RATIO)}
          curlRotation={curlRotation}
          hoverPeel={45}
          pressPeel={64}
          backColor="#ffffff"
          shadowEnabled
          shadow={{
            opacity: 30,
            color: "#000000",
            x: -300 * scale,
            y: 140 * scale,
          }}
        />
      )}
    </div>
  );
};
