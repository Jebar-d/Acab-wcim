"use client";

import {
  apiRequest,
  createRecord,
  deleteRecord,
  getCollection,
  makeId,
  refreshCollection,
  updateRecord,
  useDbCollection,
} from "@/lib/db-client";

export type QuotationItem = {
  materialId: string;
  materialName: string;
  sku?: string;
  category?: string;
  imageUrl?: string | null;
  brand?: string;
  size?: string;
  color?: string;
  variant?: string;
  quantity: number;
  unit: string;
  price?: number;
  subtotal?: number;
};

export type QuotationStatus =
  | "changes-requested"
  | "pending"
  | "reviewing"
  | "inventory-check"
  | "checklist-pending"
  | "ready"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "expired"
  | "edit-requested"
  | "updated";

export type Quotation = {
  id: string;
  inquiryId?: string;
  clientId?: string;
  accountId?: string;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  projectName: string;
  projectType: string;
  location: string;
  materials: string;
  quantity: string;
  timeline: string;
  notes?: string;
  customerChangeRequest?: string | null;
  status: QuotationStatus;
  inventoryStatus?: "Available" | "Limited" | "Unavailable" | null;
  checklistStatus?:
    | "Pending Review"
    | "Checking Inventory"
    | "Checklist Pending"
    | "Ready for Confirmation"
    | "Confirmed"
    | "Rejected";
  confirmedAt?: string | null;
  confirmationSentAt?: string | null;
  customerConfirmedAt?: string | null;
  orderId?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  totalAmount?: number;
  items?: QuotationItem[];
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
};

export function isOpenQuotationStatus(status?: string): boolean {
  const normalized = status?.toLowerCase();
  return (
    typeof normalized === "string" &&
    normalized.length > 0 &&
    !["confirmed", "rejected", "cancelled", "expired"].includes(normalized)
  );
}

export function parseQuotationItems(value?: string | unknown): QuotationItem[] {
  let parsed: unknown = value;
  // Older requests sometimes persisted the JSON array as a JSON string, so
  // decode the value more than once before deciding it is legacy free text.
  for (let attempt = 0; attempt < 3 && typeof parsed === "string"; attempt += 1) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((value): QuotationItem[] => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    const materialId = String(item.materialId ?? item.id ?? "").trim();
    const materialName = String(item.materialName ?? item.name ?? item.material ?? "").trim();
    const quantity = Number(item.quantity);
    if (!materialName || !Number.isFinite(quantity) || quantity <= 0) return [];
    const price = Number(item.price);
    const subtotal = Number(item.subtotal);
    return [{
      materialId,
      materialName,
      sku: typeof item.sku === "string" ? item.sku : undefined,
      category: typeof item.category === "string" ? item.category : undefined,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      brand: typeof item.brand === "string" ? item.brand : undefined,
      size: typeof item.size === "string" ? item.size : undefined,
      color: typeof item.color === "string" ? item.color : undefined,
      variant: typeof item.variant === "string" ? item.variant : undefined,
      quantity,
      unit: String(item.unit ?? "Piece"),
      price: Number.isFinite(price) && price >= 0 ? price : undefined,
      subtotal: Number.isFinite(subtotal) && subtotal >= 0 ? subtotal : undefined,
    }];
  });
}

export function useQuotations() {
  return useDbCollection<Quotation>("quotations", true);
}

export function getQuotationById(id?: string) {
  if (!id) return null;
  return getCollection<Quotation>("quotations").find((quote) => quote.id === id) ?? null;
}

export async function createQuotation(
  input: Omit<Quotation, "id" | "createdAt"> & { id?: string },
) {
  const createdAt = new Date().toISOString();
  const row: Quotation = {
    ...input,
    id: input.id ?? makeId("quotation"),
    createdAt,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: input.status ?? "pending",
    checklistStatus: input.checklistStatus ?? "Pending Review",
  };

  if (input.customerEmail || input.customerPhone) {
    const contactDetails = [input.customerEmail, input.customerPhone]
      .filter((value): value is string => Boolean(value))
      .join(" • ");
    row.notes = [input.notes, contactDetails]
      .filter((value): value is string => Boolean(value))
      .join("\n");
  }

  const saved = await createRecord("quotations", row);
  const refreshed = await refreshCollection<Quotation>("quotations");
  return refreshed.find((quote) => quote.id === saved.id) ?? saved ?? row;
}

export async function updateQuotation(id: string, patch: Partial<Quotation>) {
  const updated = await updateRecord("quotations", id, patch);
  return updated ?? getCollection<Quotation>("quotations").find((quote) => quote.id === id) ?? null;
}

export function deleteQuotation(id: string) {
  void deleteRecord("quotations", id);
}

export async function confirmQuotation(
  id: string,
  options?: { sendNotification?: boolean },
) {
  const now = new Date().toISOString();
  return updateQuotation(id, {
    status: "confirmed",
    checklistStatus: "Confirmed",
    confirmedAt: now,
    confirmationSentAt: options?.sendNotification ? now : undefined,
  });
}

export async function confirmCustomerOrder(quotationId: string, orderId: string) {
  return updateQuotation(quotationId, {
    customerConfirmedAt: new Date().toISOString(),
    orderId,
  });
}

export async function requestQuotationChanges(id: string, message: string) {
  const updated = await apiRequest<Quotation>(
    "request_quotation_changes",
    undefined,
    { quotationId: id, message },
  );
  const rows = await refreshCollection<Quotation>("quotations");
  return rows.find((quote) => quote.id === updated.id) ?? updated;
}
