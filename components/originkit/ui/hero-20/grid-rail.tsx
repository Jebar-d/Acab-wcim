// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

const TICK = "rgba(0,0,0,0.45)";

/**
 * Dashed grid column running down both page edges: diagonal hatch inside each
 * cell, dashed vertical rules on both sides, dashed cell boundaries, and a
 * cross tick at every cell corner.
 *
 * Cell metrics scale with the breakpoint (32px mobile → 52px from iPad up) and
 * are driven by CSS variables so the gradients stay in one place.
 */
export const GridRail = ({ className = "" }: { className?: string }) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute inset-y-0 w-[var(--cell)] [--cell:32px] [--hatch-gap:1.6px] [--hatch-line:0.55px] [--lw:0.444px] [--tick:5.333px] ipad:[--cell:52px] ipad:[--hatch-gap:2.6px] ipad:[--hatch-line:0.9px] ipad:[--lw:0.722px] ipad:[--tick:8.667px] desktop-sm:[--cell:72px] desktop-sm:[--hatch-gap:3.6px] desktop-sm:[--hatch-line:1.24px] desktop-sm:[--lw:1px] desktop-sm:[--tick:12px] ${className}`}
  >
    {/* diagonal hatch texture */}
    <div
      className="absolute inset-0 opacity-50"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, rgba(2,2,2,0.09) 0 var(--hatch-line), transparent var(--hatch-line) var(--hatch-gap))",
      }}
    />

    {/* dashed vertical rules on both edges */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: [
          "repeating-linear-gradient(to bottom, rgba(2,2,2,0.28) 0 2px, transparent 2px 4px)",
          "repeating-linear-gradient(to bottom, rgba(2,2,2,0.28) 0 2px, transparent 2px 4px)",
        ].join(","),
        backgroundSize: "var(--lw) 100%, var(--lw) 100%",
        backgroundPosition: "0 0, 100% 0",
        backgroundRepeat: "no-repeat, no-repeat",
      }}
    />

    {/* dashed horizontal rule at every cell boundary */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(2,2,2,0.2) 0 var(--lw), transparent var(--lw) var(--cell))",
        maskImage:
          "repeating-linear-gradient(to right, #000 0 2px, transparent 2px 4px)",
        WebkitMaskImage:
          "repeating-linear-gradient(to right, #000 0 2px, transparent 2px 4px)",
      }}
    />

    {/* cross ticks at each cell corner */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: [
          `linear-gradient(to bottom, ${TICK} 0 var(--tick), transparent 0)`,
          `linear-gradient(to bottom, ${TICK} 0 var(--tick), transparent 0)`,
          `linear-gradient(to bottom, ${TICK} 0 var(--lw), transparent 0)`,
          `linear-gradient(to bottom, ${TICK} 0 var(--lw), transparent 0)`,
        ].join(","),
        backgroundSize: [
          "var(--lw) var(--cell)",
          "var(--lw) var(--cell)",
          "calc(var(--tick) / 2) var(--cell)",
          "calc(var(--tick) / 2) var(--cell)",
        ].join(","),
        backgroundPosition: [
          "0 calc(var(--tick) / -2)",
          "100% calc(var(--tick) / -2)",
          "0 calc(var(--lw) / -2)",
          "100% calc(var(--lw) / -2)",
        ].join(","),
        backgroundRepeat: "repeat-y, repeat-y, repeat-y, repeat-y",
      }}
    />
  </div>
);
