"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useInView } from "./scene3d/use-in-view";

const WorkerScene = dynamic(
  () => import("./scene3d/worker-scene").then((m) => m.WorkerScene),
  { ssr: false }
);

function SpeechBubble({
  text,
  inView,
  side,
  className,
  delay = 0,
}: {
  text: string;
  inView: boolean;
  side: "left" | "right";
  className: string;
  delay?: number;
}) {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!inView) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) {
      const frame = window.requestAnimationFrame(() => setTypedText(text));
      return () => window.cancelAnimationFrame(frame);
    }

    let index = 0;
    let typingInterval: number | undefined;
    const startTimeout = window.setTimeout(() => {
      typingInterval = window.setInterval(() => {
        index += 1;
        setTypedText(text.slice(0, index));
        if (index >= text.length && typingInterval !== undefined) {
          window.clearInterval(typingInterval);
        }
      }, 48);
    }, delay);

    return () => {
      window.clearTimeout(startTimeout);
      if (typingInterval !== undefined) window.clearInterval(typingInterval);
    };
  }, [delay, inView, text]);

  const tailPosition =
    side === "left"
      ? "-right-2 [clip-path:polygon(0_0,100%_50%,0_100%)]"
      : "-left-2 [clip-path:polygon(100%_0,0_50%,100%_100%)]";

  return (
    <div
      role="status"
      aria-label={text}
      className={`absolute z-10 rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black shadow-lg transition-all duration-700 ease-out ${className} ${
        inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 bg-white ${tailPosition}`}
      />
      <span className="relative">{typedText}</span>
      {inView && typedText.length < text.length ? (
        <span aria-hidden="true" className="animate-pulse">▍</span>
      ) : null}
    </div>
  );
}

export function WorkerCalloutSection() {
  const { ref, inView } = useInView<HTMLElement>("0px 0px -120px 0px");

  return (
    <section
      ref={ref}
      className="relative flex h-[52vh] w-full items-center justify-center overflow-hidden bg-[#0e0e0d] md:h-[58vh]"
    >
      <SpeechBubble
        text="It seems we are at the bottom"
        inView={inView}
        side="left"
        className="left-[14%] top-[22%] w-[190px] md:left-[24%]"
      />
      <SpeechBubble
        text="Time to inquire!"
        inView={inView}
        side="right"
        className="right-[14%] top-[38%] w-[170px] md:right-[24%]"
        delay={700}
      />
      <div className="h-full w-full max-w-md">
        {inView ? <WorkerScene /> : null}
      </div>
    </section>
  );
}
