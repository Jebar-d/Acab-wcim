"use client";

import Link from "next/link";
import { ArrowRight, Boxes, ClipboardList, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import Hero20 from "@/components/originkit/hero-20";
import ScrollExpand from "@/components/ScrollExpand";
import MouseEffects from "@/components/originkit/ui/clickeffects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CustomerHome() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <Hero20 />
        <div className="pointer-events-none absolute inset-0">
          <MouseEffects
            color="#2563eb"
            interactionMode="rings"
            showLabel={false}
          />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Built for the field
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
            Make every delivery count.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            A calmer way to coordinate materials, suppliers, and construction
            teams from first quote to final receipt.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              Boxes,
              "Materials in motion",
              "Know what is available before the crew needs it.",
            ],
            [
              ClipboardList,
              "Clear handoffs",
              "Keep orders and receipts connected.",
            ],
            [
              ShieldCheck,
              "Trusted operations",
              "Give every decision a useful audit trail.",
            ],
          ].map(([Icon, title, body], index) => (
            <motion.div
              key={title as string}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="h-full rounded-2xl transition-transform duration-200 hover:-translate-y-1">
                <CardHeader>
                  <Icon className="size-5 text-primary" />
                  <CardTitle className="mt-3">{title as string}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {body as string}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="bg-muted/30">
        <ScrollExpand
          src="/originkit/hero-20/building.png"
          alt="Construction materials at a warehouse"
          title="From warehouse to worksite"
          useWindowScroll
          className="h-[130vh]"
          style={{}}
        >
          {null}
        </ScrollExpand>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Button
          render={
            <Link href="/inquire">
              Request a quotation <ArrowRight className="size-4" />
            </Link>
          }
        />
      </section>
    </div>
  );
}
