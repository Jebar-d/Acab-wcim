"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createInquiry } from "@/lib/inquiries-store";

import { createQuotation } from "@/lib/quotations-store";

import { useSession } from "@/lib/auth-store";

import { ensureClientForAccount } from "@/lib/clients-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InquirePage() {
  const session = useSession();

  const [projectType, setProjectType] = useState("Residential");

  const [submitted, setSubmitted] = useState(false);

  const [saving, setSaving] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      toast.error("Please sign in before requesting a quotation.");

      return;
    }

    setSaving(true);

    const data = new FormData(event.currentTarget);

    const project = String(data.get("project") ?? "").trim();

    const location = String(data.get("location") ?? "").trim();

    const materials = String(data.get("materials") ?? "").trim();

    const quantity = String(data.get("quantity") ?? "").trim();

    const timeline = String(data.get("timeline") ?? "").trim();

    const notes = String(data.get("notes") ?? "").trim();

    /*
     * Automatically create/update the client.
     */
    const client = ensureClientForAccount({
      id: session.id,
      name: session.name,
      email: session.email,
    });

    /*
     * Create the customer inquiry.
     */
    const inquiry = createInquiry({
      accountId: session.id,
      project,
      projectType,
      location,
      materials,
      quantity,
      timeline,
      notes,
    });

    /*
     * Create the staff quotation record.
     */
    createQuotation({
      inquiryId: inquiry.id,
      clientId: client.id,
      accountId: session.id,

      customerName: session.name,

      projectName: project,
      projectType,
      location,

      materials,
      quantity,
      timeline,
      notes,

      status: "pending",

      checklistStatus: "Pending Review",
    });

    setSubmitted(true);
    setSaving(false);

    toast.success("Quotation request received.");
  }

  if (saving) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Skeleton className="h-10 w-72" />

        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        Order / quotation
      </p>

      <h1 className="mt-4 text-5xl font-semibold tracking-tight">
        Tell us what you&apos;re building.
      </h1>

      <p className="mt-3 text-sm text-muted-foreground">
        Submit your project requirements and materials. Our staff will review
        inventory and confirm the quotation.
      </p>

      {submitted ? (
        <Alert className="mt-10">
          <AlertDescription>
            Your quotation request was submitted successfully. You will receive
            a notification after our staff confirms the quotation.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          onSubmit={submit}
          className="mt-10 flex flex-col gap-4 rounded-2xl border border-border p-6"
        >
          <div>
            <Label>Project type</Label>

            <Select value={projectType} onValueChange={(value) => setProjectType(value ?? "")}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Residential">Residential</SelectItem>

                <SelectItem value="Commercial">Commercial</SelectItem>

                <SelectItem value="Infrastructure">Infrastructure</SelectItem>

                <SelectItem value="Renovation">Renovation</SelectItem>

                <SelectItem value="Industrial">Industrial</SelectItem>

                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="project">Project name</Label>

            <Input
              id="project"
              name="project"
              required
              className="mt-1.5"
              placeholder="Example: Riverside Housing Project"
            />
          </div>

          <div>
            <Label htmlFor="location">Project location</Label>

            <Input
              id="location"
              name="location"
              required
              className="mt-1.5"
              placeholder="Example: Cebu City"
            />
          </div>

          <div>
            <Label htmlFor="materials">Materials needed</Label>

            <Input
              id="materials"
              name="materials"
              required
              className="mt-1.5"
              placeholder="Example: Cement, Rebar, Sand"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>

            <Input
              id="quantity"
              name="quantity"
              required
              className="mt-1.5"
              placeholder="Example: 50 bags, 100 pieces"
            />
          </div>

          <div>
            <Label htmlFor="timeline">Required timeline</Label>

            <Input
              id="timeline"
              name="timeline"
              required
              className="mt-1.5"
              placeholder="Example: Within 2 weeks"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional notes</Label>

            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="mt-1.5 w-full rounded-2xl border border-input bg-transparent p-3 text-sm outline-none"
              placeholder="Preferred material brand, required delivery date, special project requirements..."
            />
          </div>

          <Button type="submit">Request quotation</Button>
        </form>
      )}
    </div>
  );
}
