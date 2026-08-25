"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  HardHat,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import RoundCarousel from "@/components/originkit/ui/roundcarousel-custom-style";
import KlarnaCarousel from "@/components/originkit/ui/button-carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const heroImages = [
  { src: "/img1.jpe" },
  { src: "/img2.jpe" },
  { src: "/img3.jpe" },
  { src: "/img4.jpe" },
  { src: "/img5.jpe" },
  { src: "/img6.jpg" },
  { src: "/img7.jpe" },
];

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
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-xl"
          >
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Construction materials, organized
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-foreground md:text-7xl">
              CONSTRUCTION MATERIALS
              <span className="mt-2 block text-muted-foreground">
                AND WAREHOUSE MANAGEMENT
              </span>
            </h1>
            <p className="mt-6 text-base leading-7 text-muted-foreground md:text-lg">
              Find the materials your project needs, request a quotation, and
              move from inquiry to delivery with a clearer warehouse process.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
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

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[2rem] border border-border bg-background shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
              <RoundCarousel
                images={heroImages}
                imageWidth={520}
                imageHeight={680}
                spacing={0}
                speed={4.5}
                direction="right"
                drag
                sensitivity={6}
                tilt={-18}
                perspective={2400}
                cornerRadius={28}
                innerDim={3.2}
                background="#f5f5f3"
                style={{ minHeight: 620 }}
              />
            </div>
          </motion.div>
        </div>
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

        <div className="overflow-hidden rounded-[2rem] border border-border bg-[#f7f5f0] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:bg-[#171717]">
          <KlarnaCarousel
            items={materialItems.map((item) => {
              const [label, , status, src] = item;
              return {
                label: `${label} · ${status}`,
                image: { src },
                buttonImage: { src },
              };
            })}
            cardRadius={18}
            imageWidth={520}
            imageHeight={420}
            buttonCount={6}
            buttonSize={72}
            buttonRadius={18}
            curve={6}
            gap={18}
            labelShow
            labelColor="#111111"
            backgroundColor="#f7f5f0"
            labelFont={{
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 18,
              lineHeight: "1.3em",
            }}
          />
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Project support
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Tell us what the site needs.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Whether you need structural materials, general supplies, or a
              faster warehouse turnaround, WCIM helps your team shape the right
              inquiry and keep the next steps clear.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/inquire">Start an Inquiry</Link>} />
              <Button
                variant="outline"
                render={<Link href="/contact">Request a Quote</Link>}
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-border bg-muted shadow-[0_24px_60px_rgba(0,0,0,0.1)]">
            <Image
              src="/img8.png"
              alt="Project support"
              width={960}
              height={760}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            From customer inquiry to material delivery.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [
              "01",
              "Submit your request",
              "Share the project, material needs, and timeline in one inquiry.",
            ],
            [
              "02",
              "Review and confirm",
              "Staff checks availability, inventory, and checklist requirements before confirming the quotation.",
            ],
            [
              "03",
              "Warehouse release",
              "Approved materials move through the warehouse and delivery workflow with clearer tracking.",
            ],
          ].map(([number, title, body]) => (
            <div
              key={number}
              className="rounded-[1.5rem] border border-border bg-card p-5"
            >
              <span className="text-5xl font-semibold tracking-tight text-primary/35">
                {number}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Why WCIM
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Built to keep construction work moving.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Boxes,
                title: "Material visibility",
                body: "Track available stock, pending requests, and delivery movement in one place.",
              },
              {
                icon: ClipboardList,
                title: "Faster quotation reviews",
                body: "Review project needs with clearer inventory and warehouse coordination.",
              },
              {
                icon: ShieldCheck,
                title: "Inventory confidence",
                body: "Check what is in stock before committing to delivery timelines.",
              },
              {
                icon: HardHat,
                title: "Worksite readiness",
                body: "Support field teams with a dependable material and warehouse process.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-border bg-background p-5"
              >
                <Icon className="size-5 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
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
