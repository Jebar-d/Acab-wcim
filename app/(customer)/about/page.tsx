import Image from "next/image";
import { Boxes, ClipboardList, Eye, Hammer } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
  [
    Boxes,
    "Track materials",
    "Keep construction materials and supplies easier to organize.",
  ],
  [
    Eye,
    "Improve visibility",
    "Understand what is available before plans become urgent requests.",
  ],
  [
    ClipboardList,
    "Plan with clarity",
    "Support procurement and project planning with better information.",
  ],
  [
    Hammer,
    "Support the worksite",
    "Give teams and customers a simple way to communicate requirements.",
  ],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            About WCIM
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl">
            A clearer way to manage construction materials.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Warehouse Construction Inventory Management is a system designed to
            help construction-related businesses organize, monitor, and manage
            construction materials and inventory.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border">
          <Image
            src="/originkit/hero-20/building.png"
            alt="Warehouse construction operations"
            fill
            className="object-cover"
          />
        </div>
      </div>
      <Separator className="my-20" />
      <div className="grid gap-12 md:grid-cols-2">
        <section>
          <h2 className="text-3xl font-semibold">What WCIM does</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            WCIM brings inventory visibility, material movement, suppliers, and
            customer inquiries into one practical workspace. It helps teams
            spend less time searching for information and more time moving
            projects forward.
          </p>
        </section>
        <section>
          <h2 className="text-3xl font-semibold">Why inventory matters</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Construction depends on the right supplies arriving at the right
            time. Organized inventory reduces confusion around stock, improves
            handoffs, and gives teams a stronger foundation for procurement
            decisions.
          </p>
        </section>
      </div>
      <div className="mt-20">
        <h2 className="text-3xl font-semibold">How WCIM helps</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([Icon, title, body]) => (
            <Card key={title as string} className="rounded-2xl">
              <CardHeader>
                <Icon className="size-5 text-primary" />
                <CardTitle className="mt-4 text-lg">
                  {title as string}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {body as string}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <section className="mt-20 rounded-3xl bg-muted/40 p-8 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Our goal
        </p>
        <h2 className="mt-3 text-3xl font-semibold">
          Make material decisions easier to understand.
        </h2>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          WCIM gives operations teams and customers a shared starting point for
          better planning, clearer inquiries, and more dependable construction
          work.
        </p>
      </section>
    </div>
  );
}
