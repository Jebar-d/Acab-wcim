"use client";

import dynamic from "next/dynamic";
import { useInView } from "./scene3d/use-in-view";

const WorkerScene = dynamic(
  () => import("./scene3d/worker-scene").then((m) => m.WorkerScene),
  { ssr: false }
);

export function WorkerCalloutSection() {
  const { ref, inView } = useInView<HTMLDivElement>("300px");

  return (
    <section
      ref={ref}
      className="relative flex h-[52vh] w-full items-center justify-center overflow-hidden bg-[#0e0e0d] md:h-[58vh]"
    >
      <div className="absolute left-[14%] top-[22%] max-w-[190px] rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black shadow-lg md:left-[24%]">
        It seems we are at the bottom
      </div>
      <div className="absolute right-[14%] top-[38%] max-w-[170px] rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-black shadow-lg md:right-[24%]">
        Time to inquire!
      </div>
      <div className="h-full w-full max-w-md">
        {inView ? <WorkerScene /> : null}
      </div>
    </section>
  );
}
