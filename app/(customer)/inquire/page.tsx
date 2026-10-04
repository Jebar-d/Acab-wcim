"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageOff } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { createInquiry } from "@/lib/inquiries-store";
import { createQuotation } from "@/lib/quotations-store";
import { useSession } from "@/lib/auth-store";
import { ensureClientForAccount } from "@/lib/clients-store";
import { formatAddress, useAddresses } from "@/lib/addresses-store";
import { addNotification } from "@/lib/notifications-store";
import { useMaterials } from "@/lib/materials-store";
import type { QuotationItem } from "@/lib/quotations-store";
import { formatUnitPrice } from "@/lib/money";
import { resolveApiAssetUrl } from "@/lib/db-client";

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

function MaterialImage({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <img src={resolveApiAssetUrl(src)} alt={name} className="h-full w-full object-contain p-3" onError={() => setFailed(true)} />;
  return <span className="flex flex-col items-center gap-2 text-white/40"><ImageOff className="size-7" aria-hidden="true" /><span className="text-xs">No Image Available</span></span>;
}
type FieldKey = "customerName" | "customerEmail" | "customerPhone" | "location";

export default function InquirePage() {
  const session = useSession();
  const router = useRouter();

  const [projectType, setProjectType] = useState("Residential");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const inventory = useMaterials();
  const [selectedItems, setSelectedItems] = useState<Record<string, number | "">>({});
  const [materialSearch, setMaterialSearch] = useState("");

  function toggleMaterial(materialId: string) {
    setSelectedItems((current) => {
      if (Object.hasOwn(current, materialId)) {
        const next = { ...current };
        delete next[materialId];
        return next;
      }
      return { ...current, [materialId]: "" };
    });
  }

  const selectedMaterials = inventory.filter((material) => Object.hasOwn(selectedItems, material.id));

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
      const invalidSelection = Object.entries(selectedItems).find(([materialId, value]) => {
        const material = inventory.find((item) => item.id === materialId);
        const requested = Number(value);
        return !material || !Number.isFinite(requested) || requested <= 0 || material.status === "Unavailable" || requested > material.quantity;
      });
      if (invalidSelection) {
        const material = inventory.find((item) => item.id === invalidSelection[0]);
        toast.error(material && Number(invalidSelection[1]) > material.quantity ? `Only ${material.quantity} ${material.unit} are currently available.` : "Enter a quantity greater than zero for each selected material.");
        return;
      }
      const items: QuotationItem[] = inventory.filter((material) => Number(selectedItems[material.id] ?? 0) > 0).map((material) => { const quantity=Number(selectedItems[material.id]); const price=Number(material.unitPrice)||0; return {materialId: material.id, materialName: material.name, sku: material.sku, category: material.category, imageUrl: material.imageUrl, quantity, unit: material.unit, price, subtotal: Math.round(quantity*price*100)/100}; });
      const materials = JSON.stringify(items);
      const timeline = String(data.get("timeline") ?? "").trim();
      const customerName = String(
        data.get("customerName") ?? session.name ?? "",
      ).trim();
      const email = String(
        data.get("customerEmail") ?? session.email ?? "",
      ).trim();
      const phone = String(data.get("customerPhone") ?? "").trim();
      const notes = String(data.get("notes") ?? "").trim();

      if (!project || !location || !items.length || !timeline) {
        toast.error("Please fill in all required quotation details before submitting.");
        return;
      }
      const unavailable = items.find((item) => { const material=inventory.find((candidate)=>candidate.id===item.materialId); return !material || material.status === "Unavailable" || item.quantity > (material?.quantity ?? 0); });
      if (unavailable) { toast.error(`Only ${inventory.find((m)=>m.id===unavailable.materialId)?.quantity ?? 0} ${unavailable.unit} currently available for ${unavailable.materialName}.`); return; }
      const quantity = items.map((item) => `${item.quantity} ${item.unit}`).join(", ");

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
        items,
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
      <main className="min-h-screen bg-[#0e0e0d] px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-[4vw]">
        <div className="mx-auto w-full max-w-[1600px]">
          <Skeleton className="h-10 w-72 bg-white/10" />
          <Skeleton className="mt-8 h-64 w-full bg-white/10" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0e0e0d] text-white">
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-[4vw] lg:py-20">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Page heading */}
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
            Request a quotation
          </p>

          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
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
              className="mt-8 flex min-w-0 flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:mt-10 sm:gap-6 sm:p-6 lg:p-8"
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

              <div>
                <Label htmlFor="material-search" className="text-white">Choose materials from current inventory</Label>
                <Input id="material-search" value={materialSearch} onChange={(event)=>setMaterialSearch(event.target.value)} className="mt-1.5 border-white/10 bg-white/10 text-white placeholder:text-white/30" placeholder="Search materials..." />
                {inventory.length === 0 && <p className="mt-3 text-sm text-white/60">No inventory materials are available to select.</p>}
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {inventory.filter((m)=>`${m.name} ${m.category} ${m.sku}`.toLowerCase().includes(materialSearch.toLowerCase())).map((material)=>{
                    const selected = Object.hasOwn(selectedItems, material.id);
                    const availability = material.quantity <= 0 || material.status === "Unavailable" ? "UNAVAILABLE" : material.status === "Limited" || material.quantity <= material.minimumStock ? "LIMITED" : "AVAILABLE";
                    const availabilityClass = availability === "AVAILABLE" ? "text-emerald-300" : availability === "LIMITED" ? "text-amber-200" : "text-red-300";
                    const quantity = Number(selectedItems[material.id] ?? 0);

                    return <div key={material.id} className="flex min-w-0 flex-col gap-2">
                      <button type="button" aria-pressed={selected} onClick={() => toggleMaterial(material.id)} className={`overflow-hidden rounded-2xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${selected ? "border-blue-400 bg-blue-500/10" : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"}`}>
                        <span className="flex h-36 items-center justify-center border-b border-white/10 bg-white/[0.03]" aria-label={`Image for ${material.name}`}>
                          <MaterialImage key={material.imageUrl ?? material.id} src={material.imageUrl} name={material.name} />
                        </span>
                        <span className="block p-4">
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0"><span className="block truncate font-medium text-white">{material.name}</span><span className="mt-1 block truncate text-xs text-white/60">{material.category} · {material.sku}</span></span>
                            {selected && <Check className="size-5 shrink-0 text-blue-300" aria-label="Selected" />}
                          </span>
                          <span className="mt-3 block text-sm font-medium text-white">{formatUnitPrice(material.unitPrice)} / {material.unit}</span>
                          <span className="mt-1 block text-sm text-white/70">Available: {material.quantity} {material.unit}</span>
                          <span className={`mt-2 block text-xs font-semibold ${availabilityClass}`}>{availability}</span>
                        </span>
                      </button>
                      {selected && <div className="px-1">
                        <label className="block text-xs font-medium text-white/70" htmlFor={`qty-${material.id}`}>Quantity ({material.unit})</label>
                        <Input id={`qty-${material.id}`} type="number" min="0.001" max={material.quantity} step="any" value={selectedItems[material.id] ?? ""} onChange={(event)=>setSelectedItems((current)=>({...current,[material.id]:event.target.value === "" ? "" : Number(event.target.value)}))} className="mt-1 h-10 rounded-xl border-white/10 bg-white/10 text-white" />
                        {quantity > material.quantity && <p className="mt-1 text-xs text-red-300">Requested quantity exceeds available stock.</p>}
                        {selectedItems[material.id] === "" && <p className="mt-1 text-xs text-amber-200">Enter a quantity greater than zero.</p>}
                        {quantity <= 0 && selectedItems[material.id] !== "" && <p className="mt-1 text-xs text-red-300">Enter a quantity greater than zero.</p>}
                      </div>}
                    </div>;
                  })}
                </div>
                {selectedMaterials.length > 0 && <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <h2 className="font-semibold text-white">Quotation summary</h2>
                  <div className="mt-3 space-y-3">
                    {selectedMaterials.map((material) => <div key={material.id} className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"><MaterialImage src={material.imageUrl} name={material.name} /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium text-white">{material.name}</span><span className="block text-xs text-white/60">{material.sku} · {selectedItems[material.id] || 0} {material.unit} × {formatUnitPrice(material.unitPrice)} / {material.unit}</span><span className="block text-xs text-white/70">Line total: {formatUnitPrice((Number(selectedItems[material.id]) || 0) * (Number(material.unitPrice) || 0))}</span></span>
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleMaterial(material.id)}>Remove</Button>
                    </div>)}
                  </div>
                  <p className="mt-4 flex justify-between gap-3 text-sm text-white/70"><span>Total items: {selectedMaterials.length} · Total units: {selectedMaterials.reduce((sum, material) => sum + (Number(selectedItems[material.id]) || 0), 0)}</span><span className="font-semibold text-white">{formatUnitPrice(selectedMaterials.reduce((sum, material) => sum + (Number(selectedItems[material.id]) || 0) * (Number(material.unitPrice) || 0), 0))}</span></p>
                </div>}
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
