"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { createInquiry } from "@/lib/inquiries-store";
import { createQuotation } from "@/lib/quotations-store";
import { useSession } from "@/lib/auth-store";
import { ensureClientForAccount } from "@/lib/clients-store";
import { formatAddress, useAddresses } from "@/lib/addresses-store";
import { addNotification } from "@/lib/notifications-store";

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

type FieldKey = "customerName" | "customerEmail" | "customerPhone" | "location";

export default function InquirePage() {
  const session = useSession();
  const router = useRouter();

  const [projectType, setProjectType] = useState("Residential");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pull the customer's profile (name, email, phone, default address) into the form.
  const addresses = useAddresses();
  const defaultAddress =
    addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    location: "",
  });
  const edited = useRef(new Set<FieldKey>());

  const profileName = session?.name ?? "";
  const profileEmail = session?.email ?? "";
  const profilePhone = session?.phone || defaultAddress?.phone || "";
  const profileLocation = defaultAddress ? formatAddress(defaultAddress) : "";

  useEffect(() => {
    const profile: Record<FieldKey, string> = {
      customerName: profileName,
      customerEmail: profileEmail,
      customerPhone: profilePhone,
      location: profileLocation,
    };
    // Never overwrite something the customer already typed.
    setFields((current) => {
      const next = { ...current };
      for (const key of Object.keys(profile) as FieldKey[]) {
        if (!edited.current.has(key)) next[key] = profile[key];
      }
      return next;
    });
  }, [profileName, profileEmail, profilePhone, profileLocation]);

  function setField(key: FieldKey, value: string) {
    edited.current.add(key);
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      toast.error("Please sign in before requesting a quotation.");
      return;
    }

    setSaving(true);

    try {
      const data = new FormData(event.currentTarget);

      const project = String(data.get("project") ?? "").trim();
      const location = String(data.get("location") ?? "").trim();
      const materials = String(data.get("materials") ?? "").trim();
      const quantity = String(data.get("quantity") ?? "").trim();
      const timeline = String(data.get("timeline") ?? "").trim();
      const customerName = String(
        data.get("customerName") ?? session.name ?? "",
      ).trim();
      const email = String(
        data.get("customerEmail") ?? session.email ?? "",
      ).trim();
      const phone = String(data.get("customerPhone") ?? "").trim();
      const notes = String(data.get("notes") ?? "").trim();

      if (!project || !location || !materials || !quantity || !timeline) {
        toast.error(
          "Please fill in all required quotation details before submitting.",
        );
        return;
      }

      const client = await ensureClientForAccount({
        id: session.id,
        name: customerName || session.name,
        email: session.email,
        phone: phone || session.phone,
        address: profileLocation,
      });

      const inquiry = await createInquiry({
        accountId: session.id,
        project,
        projectType,
        location,
        materials,
        quantity,
        timeline,
        notes,
      });

      await createQuotation({
        inquiryId: inquiry.id,
        clientId: client.id,
        accountId: session.id,
        customerName: customerName || session.name,
        customerEmail: email,
        customerPhone: phone,
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

      addNotification({
        audience: "staff",
        title: "New quotation request",
        body: `${session.name} requested a quote for ${project}.`,
        href: "/staff/quotations",
      });

      addNotification({
        audience: "admin",
        title: "New quotation request",
        body: `${session.name} submitted a quotation request for ${project}.`,
        href: "/dashboard",
      });

      setSubmitted(true);
      toast.success("Quotation request received.");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit quotation request.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (saving) {
    return (
      <main className="min-h-screen bg-[#0e0e0d] px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-10 w-72 bg-white/10" />
          <Skeleton className="mt-8 h-64 w-full bg-white/10" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0e0e0d] text-white">
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          {/* Page heading */}
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
            Request a quotation
          </p>

          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">
            Tell us what you&apos;re building.
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/60">
            Submit your project requirements and materials. Our staff will
            review inventory and confirm the quotation.
          </p>

          {submitted ? (
            <Alert className="mt-10 border-white/10 bg-white/5 text-white">
              <AlertDescription className="text-white/80">
                Your quotation request was submitted successfully. You will
                receive a notification after our staff confirms the quotation.
              </AlertDescription>
            </Alert>
          ) : (
            <form
              noValidate
              onSubmit={submit}
              className="mt-10 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              {session && (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-white/60">
                  Your name, email, phone and address are filled in from your
                  profile. Edit them here if this request is different, or{" "}
                  <Link
                    href="/profile"
                    className="text-blue-400 underline underline-offset-2"
                  >
                    update your profile
                  </Link>{" "}
                  to change the defaults.
                </p>
              )}

              {/* Project Type */}
              <div>
                <Label className="text-white">Project type</Label>

                <Select
                  value={projectType}
                  onValueChange={(value) => setProjectType(value ?? "")}
                >
                  <SelectTrigger className="mt-1.5 w-full border-white/10 bg-white/10 text-white">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Residential">Residential</SelectItem>

                    <SelectItem value="Commercial">Commercial</SelectItem>

                    <SelectItem value="Infrastructure">
                      Infrastructure
                    </SelectItem>

                    <SelectItem value="Renovation">Renovation</SelectItem>

                    <SelectItem value="Industrial">Industrial</SelectItem>

                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Name */}
              <div>
                <Label htmlFor="project" className="text-white">
                  Project name
                </Label>

                <Input
                  id="project"
                  name="project"
                  required
                  className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                  placeholder="Example: Riverside Housing Project"
                />
              </div>

              <div>
                <Label htmlFor="customerName" className="text-white">
                  Full name
                </Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={fields.customerName}
                  onChange={(event) =>
                    setField("customerName", event.target.value)
                  }
                  className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="customerEmail" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={fields.customerEmail}
                    onChange={(event) =>
                      setField("customerEmail", event.target.value)
                    }
                    className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone" className="text-white">
                    Contact number
                  </Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={fields.customerPhone}
                    onChange={(event) =>
                      setField("customerPhone", event.target.value)
                    }
                    className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                    placeholder="+63 917 000 0000"
                  />
                </div>
              </div>

              {/* Project Location */}
              <div>
                <Label htmlFor="location" className="text-white">
                  Project location
                </Label>

                <Input
                  id="location"
                  name="location"
                  required
                  value={fields.location}
                  onChange={(event) => setField("location", event.target.value)}
                  className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                  placeholder="Example: Cebu City"
                />

                {addresses.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/50">
                      Saved addresses:
                    </span>
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() =>
                          setField("location", formatAddress(address))
                        }
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:bg-white/15"
                      >
                        {address.label}
                        {address.city ? ` · ${address.city}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Materials */}
              <div>
                <Label htmlFor="materials" className="text-white">
                  Materials needed
                </Label>

                <Input
                  id="materials"
                  name="materials"
                  required
                  className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                  placeholder="Example: Cement, Rebar, Sand"
                />
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity" className="text-white">
                  Quantity
                </Label>

                <Input
                  id="quantity"
                  name="quantity"
                  required
                  className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                  placeholder="Example: 50 bags, 100 pieces"
                />
              </div>

              {/* Timeline */}
              <div>
                <Label htmlFor="timeline" className="text-white">
                  Required timeline
                </Label>

                <Input
                  id="timeline"
                  name="timeline"
                  required
                  className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30"
                  placeholder="Example: Within 2 weeks"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-white">
                  Additional notes
                </Label>

                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-500"
                  placeholder="Preferred material brand, required delivery date, special project requirements..."
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="mt-2 w-full bg-blue-500 text-white hover:bg-blue-600"
              >
                Request a quotation
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
