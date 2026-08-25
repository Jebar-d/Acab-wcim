"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const materialItems = [
  [
    "Cement",
    "High-strength cement for foundations, slabs, and masonry work.",
    "Available",
    "/cement.webp",
  ],
  [
    "Steel Bars",
    "Structural reinforcement for concrete and steel-framed systems.",
    "Limited",
    "/steel bars.jpg",
  ],
  [
    "Lumber",
    "Framing timber for structural and finish carpentry needs.",
    "Available",
    "/lumber.jpg",
  ],
  [
    "Hardware",
    "Fasteners, fixtures, and essential site hardware in stock.",
    "Available",
    "/img8.png",
  ],
  [
    "Electrical",
    "Wiring, breakers, and electrical accessories for active projects.",
    "Check availability",
    "/img3.jpe",
  ],
  [
    "Plumbing",
    "Pipes, fittings, and water system components ready for delivery.",
    "Available",
    "/pipes.jpe",
  ],
] as const;

export function CustomerHomeSections() {
  return (
    <>
      <section className="px-6 pb-16 pt-8 md:pb-24 md:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Construction materials, organized
          </Badge>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-foreground md:text-7xl">
            ACAB WAREHOUSE
            <span className="mt-2 block text-muted-foreground">
              INVENTORY MANAGEMENT
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            Find the materials your project needs, request a quotation, and move
            from inquiry to delivery with a clearer warehouse process.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              render={
                <Link href="/inquire">
                  Request a Quote <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              render={<Link href="#materials">Browse Materials</Link>}
            />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {[
              "Customer Inquiry",
              "Quotation",
              "Order",
              "Inventory",
              "Warehouse",
              "Delivery",
            ].map((step) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {step}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-6" id="materials">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Materials
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Supply categories your project can rely on.
            </h2>
          </div>
          <Link
            href="/inquire"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            Request a quote <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materialItems.map(([label, description, status, src]) => (
            <div
              key={label}
              className="overflow-hidden rounded-[1.5rem] border border-border bg-[#f7f5f0] shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:bg-[#171717]"
            >
              <div className="relative h-44 w-full">
                <Image src={src} alt={label} fill className="object-cover" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{label}</h3>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Project support
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Tell us what the site needs.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Whether you need structural materials, general supplies, or a faster
            warehouse turnaround, WCIM helps your team shape the right inquiry
            and keep the next steps clear.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button render={<Link href="/inquire">Start an Inquiry</Link>} />
            <Button
              variant="outline"
              render={<Link href="/contact">Request a Quote</Link>}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
          <Warehouse className="size-4 text-primary" />
          WCIM warehouse coordination
        </div>
        <h2 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
          Ready to build with a clearer process?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Bring your next project requirement to WCIM and move from inquiry to
          quotation with a more organized workflow.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            size="lg"
            render={
              <Link href="/inquire">
                Request a Quote <ArrowRight className="size-4" />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            render={<Link href="#materials">Browse Materials</Link>}
          />
        </div>
      </section>
    </>
  );
}
