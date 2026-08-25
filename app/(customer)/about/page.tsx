import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        About WCIM
      </p>
      <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
        Warehouse Construction Inventory Management for real projects.
      </h1>

      <div className="mt-8 max-w-3xl text-lg leading-8 text-muted-foreground">
        WCIM is a practical system for construction-related businesses that need
        a clearer way to manage materials, inventory, customer requests, and
        warehouse movement. It helps teams stay organized from the first inquiry
        to the final delivery.
      </div>

      <Separator className="my-16" />

      <div className="grid gap-12 md:grid-cols-2">
        <section>
          <h2 className="text-3xl font-semibold">What it is</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            WCIM is designed to help construction businesses organize
            construction materials, monitor inventory levels, manage customers
            and clients, process inquiries, prepare quotations, check material
            availability, and maintain a reliable warehouse operation.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-semibold">What it supports</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The system covers the operational work that keeps construction
            supply flow moving: inquiry intake, quotation preparation, stock
            checks, stock movement, procurement support, and transaction
            tracking.
          </p>
        </section>
      </div>

      <div className="mt-16 rounded-[2rem] border border-border bg-muted/30 p-8 md:p-10">
        <h2 className="text-3xl font-semibold">How the workflow is used</h2>
        <ul className="mt-6 grid gap-3 text-base leading-7 text-muted-foreground md:grid-cols-2">
          <li>• organize construction materials</li>
          <li>• monitor inventory</li>
          <li>• manage customers and clients</li>
          <li>• process inquiries and quotations</li>
          <li>• check material availability</li>
          <li>• manage warehouse stock movements</li>
          <li>• record stock in and stock out</li>
          <li>• prepare delivery receipts</li>
          <li>• support procurement</li>
          <li>• maintain transaction and ledger records</li>
        </ul>
      </div>
    </div>
  );
}
