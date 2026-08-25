"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  HardHat,
  House,
  Landmark,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const projects = [
  [House, "Residential", "Homes, renovations, and residential construction."],
  [Building2, "Commercial", "Offices, retail spaces, and commercial projects."],
  [Landmark, "Infrastructure", "Larger-scale construction and development."],
  [Wrench, "Renovation", "Repairs, upgrades, and remodeling work."],
] as const;

const materials = [
  ["Cement", "Foundation and masonry supplies", "Available"],
  ["Steel bars", "Structural reinforcement materials", "Check availability"],
  ["Lumber", "Framing and general construction timber", "Available"],
  ["Hardware", "Practical supplies for every worksite", "Limited"],
  [
    "Electrical",
    "Essential electrical construction supplies",
    "Check availability",
  ],
  ["Plumbing", "Reliable fittings and installation supplies", "Available"],
] as const;

export function CustomerHomeSections() {
  return (
    <>
      <section className="border-b border-border/70 px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Construction materials, organized
            </Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
              Build Better.{" "}
              <span className="text-primary">Source Smarter.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Warehouse Construction Inventory Management helps construction
              teams organize materials, discover available supplies, and connect
              with the right resources for their next project.
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
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
              {[
                [Boxes, "Construction Materials"],
                [HardHat, "Hardware & Supplies"],
                [ClipboardList, "Project Inquiries"],
                [CheckCircle2, "Organized Inventory"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  {label as string}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-muted shadow-xl"
          >
            <Image
              src="/originkit/hero-20/building.png"
              alt="Construction materials and warehouse operations"
              width={900}
              height={700}
              priority
              className="aspect-[5/4] object-cover"
            />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/30 bg-black/55 p-4 text-white backdrop-blur-md">
              <p className="text-sm font-medium">From warehouse to worksite</p>
              <p className="mt-1 text-xs text-white/70">
                Clearer visibility for every material handoff.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-24" id="projects">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Start with your project
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            What are you building?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with your project and we&apos;ll help you find the materials
            and supplies you need.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map(([Icon, title, description]) => (
            <Card
              key={title}
              className="rounded-2xl transition-transform duration-200 hover:-translate-y-1"
            >
              <CardHeader>
                <Icon className="size-6 text-primary" />
                <CardTitle className="mt-4">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
                <Link
                  href="/inquire"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary"
                >
                  Explore Materials <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section
        className="border-y border-border bg-muted/30 px-6 py-24"
        id="finder"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Material finder
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Find the materials your project needs.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Search by material, then send us the requirements your team is
            working with.
          </p>
          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-border bg-background p-2 shadow-sm">
            <Search className="ml-3 size-5 text-muted-foreground" />
            <input
              aria-label="Search materials"
              placeholder="Search cement, steel bars, plywood, hardware..."
              className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none"
            />
            <Button render={<Link href="/inquire">Inquire</Link>}>
              Inquire
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              "Cement",
              "Steel",
              "Lumber",
              "Hardware",
              "Electrical",
              "Plumbing",
              "Safety Equipment",
            ].map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="rounded-full px-3 py-1"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-24" id="materials">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Materials
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Materials ready for your next project.
            </h2>
          </div>
          <Link href="/inquire" className="text-sm font-medium text-primary">
            View all materials <ArrowRight className="ml-1 inline size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map(([name, description, availability], index) => (
            <Card key={name} className="overflow-hidden rounded-2xl">
              <div
                className={`h-32 ${index % 3 === 0 ? "bg-primary/15" : index % 3 === 1 ? "bg-amber-500/15" : "bg-emerald-500/15"} p-5`}
              >
                <Boxes className="size-7 text-primary" />
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{name}</h3>
                  <Badge
                    variant={
                      availability === "Available" ? "secondary" : "outline"
                    }
                  >
                    {availability}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground md:grid-cols-[1fr_0.8fr] md:p-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              Project support
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Have a project in mind?
            </h2>
            <p className="mt-4 max-w-xl text-primary-foreground/80">
              Tell us what you&apos;re building and what materials you need. Our
              team can help you organize your requirements.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                render={<Link href="/inquire">Start an Inquiry</Link>}
              />
              <Button
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                render={<Link href="/contact">Request a Quote</Link>}
              />
            </div>
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl md:block">
            <Image
              src="/originkit/hero-20/building.png"
              alt="Construction project support"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">
            From project idea to materials.
          </h2>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            [
              "01",
              "Tell us about your project",
              "Describe the type of construction project you&apos;re working on.",
            ],
            [
              "02",
              "Tell us what you need",
              "Select materials, quantities, and requirements.",
            ],
            [
              "03",
              "Get assistance",
              "Our team can review your request and help with availability and sourcing.",
            ],
          ].map(([number, title, body]) => (
            <div key={number}>
              <span className="text-5xl font-semibold text-primary/40">
                {number}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-border bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Why WCIM
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Built around the way construction teams work.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                Boxes,
                "Organized Materials",
                "Keep construction materials easier to discover and manage.",
              ],
              [
                ClipboardList,
                "Faster Inquiries",
                "Send project requirements without unnecessary back-and-forth.",
              ],
              [
                ShieldCheck,
                "Better Visibility",
                "Understand what materials and supplies are available.",
              ],
              [
                HardHat,
                "Project Support",
                "Give customers a direct way to communicate their requirements.",
              ],
            ].map(([Icon, title, body]) => (
              <div
                key={title as string}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <Icon className="size-5 text-primary" />
                <h3 className="mt-5 font-semibold">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {body as string}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Ready to build?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start your next project with a clearer way to source construction
          materials.
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
