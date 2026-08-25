"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createInquiry } from "@/lib/inquiries-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function InquirePage() {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const data = new FormData(event.currentTarget);
    const project = String(data.get("project") ?? "");
    const projectType = String(data.get("projectType") ?? "Residential");
    const location = String(data.get("location") ?? "");
    const materials = String(data.get("materials") ?? "");
    const quantity = String(data.get("quantity") ?? "");
    const timeline = String(data.get("timeline") ?? "");
    const notes = String(data.get("notes") ?? "");
    createInquiry({
      project,
      projectType,
      location,
      materials,
      quantity,
      timeline,
      notes,
    });
    setSubmitted(true);
    setSaving(false);
    toast.success("Quotation request received");
  }
  if (saving)
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        Order / quotation
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">
        Tell us what you&apos;re building.
      </h1>
      {submitted ? (
        <Alert className="mt-10">
          <AlertDescription>
            Your request is queued. Our team will contact you with a quotation.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          onSubmit={submit}
          className="mt-10 flex flex-col gap-4 rounded-2xl border border-border p-6"
        >
          <div>
            <Label htmlFor="projectType">Project type</Label>
            <select
              id="projectType"
              name="projectType"
              className="mt-1.5 h-9 w-full rounded-2xl border border-input bg-transparent px-3 text-sm"
              defaultValue="Residential"
            >
              <option>Residential</option>
              <option>Commercial</option>
              <option>Infrastructure</option>
              <option>Renovation</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="project">Project name</Label>
            <Input id="project" name="project" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="materials">Materials needed</Label>
            <Input
              id="materials"
              name="materials"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" name="quantity" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="timeline">Timeline</Label>
            <Input id="timeline" name="timeline" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="mt-1.5 w-full rounded-2xl border border-input bg-transparent p-3 text-sm outline-none"
              placeholder="Preferred material brand, required delivery date, project requirements, special instructions..."
            />
          </div>
          <Button type="submit">Request quotation</Button>
        </form>
      )}
    </div>
  );
}
