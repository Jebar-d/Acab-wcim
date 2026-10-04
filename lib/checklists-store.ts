"use client";
import {
  createRecord,
  deleteRecord,
  getCollection,
  makeId,
  refreshCollection,
  updateRecord,
  useDbCollection,
} from "@/lib/db-client";
import type { Material } from "@/lib/materials-store";
import {
  isOpenQuotationStatus,
  parseQuotationItems,
  updateQuotation,
  type Quotation,
} from "@/lib/quotations-store";

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
  /** "material" rows are generated from the quotation's materials and checked against inventory. */
  kind?: "material" | "general";
  /** Material name exactly as the customer typed it on the quotation. */
  materialName?: string;
  /** Quantity requested for this material (only when it can be told apart from the others). */
  requested?: string;
  /** Inventory record this material was matched to, if any. */
  materialId?: string | null;
};

export type ChecklistStatus =
  | "Pending Review"
  | "Checklist Pending"
  | "Ready for Confirmation"
  | "Completed"
  | "Confirmed"
  | "Rejected";

export type Checklist = {
  id: string;
  quotationId?: string | null;
  title: string;
  status: ChecklistStatus;
  items: ChecklistItem[];
  createdAt: string;
};

/** A checklist that has been confirmed by staff and can no longer be ticked/unticked. */
export function isChecklistDone(status?: string) {
  return status === "Completed" || status === "Confirmed";
}

const GENERAL_CHECKS = [
  "Verify quotation details and requested quantities",
  "Verify customer/project information",
  "Verify warehouse storage location",
  "Confirm supplier availability for missing materials",
  "Verify delivery schedule and required date",
  "Verify transportation or delivery requirements",
  "Confirm project location and delivery destination",
];
const INVENTORY_CHECK = "Check material availability in inventory";

export function useChecklists() {
  return useDbCollection<Checklist>("checklists");
}

/* ------------------------------------------------------------------ */
/* Reading the quotation's free-text materials / quantity              */
/* ------------------------------------------------------------------ */

/** "Cement, lumber and steel bars" -> ["Cement", "lumber", "steel bars"] */
export function parseMaterialList(value?: string | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of (value ?? "").split(/[,;\n&+]+|\s+and\s+/i)) {
    const name = part.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  return out;
}

// Splits "50 bags, 100 pieces" but keeps "1,000 bags" together.
function parseQuantityList(value?: string | null): string[] {
  return (value ?? "")
    .split(/;|\n|,(?!\d{3}(?:\D|$))/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseQuantityNumber(value?: string | null): number | null {
  const match = (value ?? "")
    .replace(/(\d),(\d{3})/g, "$1$2")
    .match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

const EXPAND: Record<string, string[]> = {
  rebar: ["steel", "bar"],
  "re-bar": ["steel", "bar"],
  gravel: ["gravel"],
};
const STOP_WORDS = new Set(["of", "the", "a", "an", "for", "pcs", "pc"]);

function tokenize(value: string): string[] {
  const words = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => EXPAND[word] ?? [word])
    .flatMap((word) =>
      word.includes("-") && !EXPAND[word] ? word.split("-") : [word],
    )
    .filter((word) => word && !STOP_WORDS.has(word));
  return words.map((word) =>
    word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
      ? word.slice(0, -1)
      : word,
  );
}

/** Finds the inventory record a typed material name refers to (every word must be found). */
export function matchMaterial(
  name: string,
  materials: Material[],
): Material | null {
  const wanted = tokenize(name);
  if (wanted.length === 0) return null;
  let best: { material: Material; extra: number } | null = null;
  for (const material of materials) {
    const have = new Set([
      ...tokenize(material.name),
      ...tokenize(material.category),
    ]);
    if (!wanted.every((word) => have.has(word))) continue;
    const extra = have.size - wanted.length;
    if (!best || extra < best.extra) best = { material, extra };
  }
  return best?.material ?? null;
}

/* ------------------------------------------------------------------ */
/* Live inventory check for one checklist row                          */
/* ------------------------------------------------------------------ */

export type StockState = "ok" | "low" | "short" | "missing";
export type StockCheck = {
  state: StockState;
  material: Material | null;
  onHand: number | null;
  needed: number | null;
};

export function checkStock(
  item: ChecklistItem,
  materials: Material[],
): StockCheck {
  const material =
    (item.materialId
      ? materials.find((m) => m.id === item.materialId)
      : undefined) ?? matchMaterial(item.materialName ?? item.text, materials);
  if (!material)
    return { state: "missing", material: null, onHand: null, needed: null };
  const needed = parseQuantityNumber(item.requested);
  const onHand = material.quantity;
  let state: StockState = "ok";
  if (
    onHand <= 0 ||
    material.status === "Unavailable" ||
    (needed !== null && onHand < needed)
  ) {
    state = "short";
  } else if (
    material.status === "Limited" ||
    onHand - (needed ?? 0) <= material.minimumStock
  ) {
    state = "low";
  }
  return { state, material, onHand, needed };
}

/** Rolls the per-material results up into the quotation's inventoryStatus. */
export function summarizeInventory(
  items: ChecklistItem[],
  materials: Material[],
): NonNullable<Quotation["inventoryStatus"]> | undefined {
  const rows = items.filter((item) => item.kind === "material");
  if (rows.length === 0) return undefined;
  const states = rows.map((item) => checkStock(item, materials).state);
  if (states.some((s) => s === "short" || s === "missing"))
    return "Unavailable";
  if (states.some((s) => s === "low")) return "Limited";
  return "Available";
}

/* ------------------------------------------------------------------ */
/* Creating / updating checklists                                      */
/* ------------------------------------------------------------------ */

function buildItems(
  quotation: Quotation,
  materials: Material[],
): ChecklistItem[] {
  const quotationItems = parseQuotationItems(quotation.materials);
  if (quotationItems.length > 0) {
    const materialItems: ChecklistItem[] = quotationItems.map((item) => {
      const match = materials.find((material) => material.id === item.materialId)
        ?? materials.find((material) => item.sku && material.sku.toLowerCase() === item.sku.toLowerCase())
        ?? matchMaterial(item.materialName, materials);
      return {
        id: makeId("checkitem"),
        kind: "material",
        text: `Check stock: ${item.materialName}`,
        materialName: item.materialName,
        requested: `${item.quantity} ${item.unit}`,
        materialId: match?.id ?? null,
        completed: false,
      };
    });
    const generalItems = GENERAL_CHECKS.map((text) => ({
      id: makeId("checkitem"),
      kind: "general" as const,
      text,
      completed: false,
    }));
    return [...materialItems, ...generalItems];
  }

  const names = parseMaterialList(quotation.materials);
  const quantities = parseQuantityList(quotation.quantity);
  const aligned = quantities.length === names.length;

  const materialItems: ChecklistItem[] = names.map((name, index) => ({
    id: makeId("checkitem"),
    kind: "material",
    text: `Check stock: ${name}`,
    materialName: name,
    requested: aligned ? quantities[index] : undefined,
    materialId: matchMaterial(name, materials)?.id ?? null,
    completed: false,
  }));

  const generalItems: ChecklistItem[] = [
    ...(names.length === 0 ? [INVENTORY_CHECK] : []),
    ...GENERAL_CHECKS,
  ].map((text) => ({
    id: makeId("checkitem"),
    kind: "general",
    text,
    completed: false,
  }));

  return [...materialItems, ...generalItems];
}

export function getChecklistForQuotation(
  quotationId: string,
): Checklist | null {
  return (
    getCollection<Checklist>("checklists").find(
      (c) => c.quotationId === quotationId,
    ) ?? null
  );
}

/**
 * Returns the checklist for a quotation, creating it (one row per quotation) from the
 * quotation's materials the first time. Safe to call repeatedly.
 */
export async function ensureChecklistForQuotation(
  quotation: Quotation,
  knownMaterials: Material[] = [],
): Promise<Checklist> {
  let existing = getChecklistForQuotation(quotation.id);
  if (!existing) {
    const rows = await refreshCollection<Checklist>("checklists");
    existing = rows.find((c) => c.quotationId === quotation.id) ?? null;
  }
  if (existing) {
    const quoteItems = parseQuotationItems(quotation.materials);
    if (quoteItems.length > 0) {
      const actualNames = existing.items
        .filter((item) => item.kind === "material")
        .map((item) => (item.materialName ?? "").trim().toLowerCase())
        .sort();
      const expectedNames = quoteItems.map((item) => item.materialName.trim().toLowerCase()).sort();
      const checklistMatches = actualNames.length === expectedNames.length
        && expectedNames.every((name, index) => actualNames[index] === name);
      if (!checklistMatches) {
        const materials = knownMaterials.length > 0
          ? knownMaterials
          : await refreshCollection<Material>("materials");
        const repaired: Checklist = {
          ...existing,
          title: `${quotation.projectName || "Project"} — Material Review`,
          status: "Checklist Pending",
          items: buildItems(quotation, materials),
        };
        await updateRecord("checklists", existing.id, {
          title: repaired.title,
          status: repaired.status,
          items: repaired.items,
        } as Partial<Checklist>);
        if (!quotation.customerConfirmedAt && !quotation.orderId) {
          await updateQuotation(quotation.id, {
            status: "checklist-pending",
            checklistStatus: "Checklist Pending",
            confirmedAt: null,
            confirmationSentAt: null,
            inventoryStatus: summarizeInventory(repaired.items, materials),
          });
        }
        return repaired;
      }
    }
    return existing;
  }

  const materials =
    knownMaterials.length > 0
      ? knownMaterials
      : await refreshCollection<Material>("materials");

  const row: Checklist = {
    // Deterministic id: a second create for the same quotation fails instead of duplicating.
    id: `checklist-${quotation.id}`,
    quotationId: quotation.id,
    title: `${quotation.projectName || "Project"} — Material Review`,
    status: "Checklist Pending",
    items: buildItems(quotation, materials),
    createdAt: new Date().toISOString(),
  };

  let saved: Checklist;
  try {
    saved = await createRecord("checklists", row);
  } catch (error) {
    const rows = await refreshCollection<Checklist>("checklists");
    const duplicate = rows.find((c) => c.quotationId === quotation.id);
    if (duplicate) return duplicate;
    throw error;
  }

  if (isOpenQuotationStatus(quotation.status)) {
    await updateQuotation(quotation.id, {
      status: "checklist-pending",
      checklistStatus: "Checklist Pending",
      inventoryStatus: summarizeInventory(row.items, materials),
    });
  }
  return saved;
}

/** Rebuilds a quotation checklist after a customer asks for revisions. */
export async function resetChecklistForQuotation(
  quotation: Quotation,
  knownMaterials: Material[] = [],
) {
  const existing =
    getChecklistForQuotation(quotation.id) ??
    (await refreshCollection<Checklist>("checklists")).find(
      (checklist) => checklist.quotationId === quotation.id,
    ) ??
    (await ensureChecklistForQuotation(quotation, knownMaterials));
  const materials =
    knownMaterials.length > 0
      ? knownMaterials
      : await refreshCollection<Material>("materials");
  const items = buildItems(quotation, materials);

  await updateRecord("checklists", existing.id, {
    title: `${quotation.projectName || "Project"} — Material Review`,
    status: "Checklist Pending",
    items,
  } as Partial<Checklist>);
}

/** Manual checklist (not tied to a quotation) from the checklist page. */
export function addChecklist(input: { title: string }) {
  const row: Checklist = {
    id: makeId("check"),
    title: input.title.trim() || "Construction Material Review",
    status: "Checklist Pending",
    items: [INVENTORY_CHECK, ...GENERAL_CHECKS].map((text) => ({
      id: makeId("checkitem"),
      kind: "general",
      text,
      completed: false,
    })),
    createdAt: new Date().toISOString(),
  };
  void createRecord("checklists", row);
  return row;
}

export function toggleChecklistItem(checklistId: string, itemId: string) {
  const list = getCollection<Checklist>("checklists");
  const checklist = list.find((c) => c.id === checklistId);
  if (!checklist || isChecklistDone(checklist.status)) return;
  const items = checklist.items.map((i) =>
    i.id === itemId ? { ...i, completed: !i.completed } : i,
  );
  const status: ChecklistStatus =
    items.length && items.every((i) => i.completed)
      ? "Ready for Confirmation"
      : "Checklist Pending";
  void updateRecord("checklists", checklistId, {
    items,
    status,
  } as Partial<Checklist>);
}

async function findQuotation(id: string): Promise<Quotation | null> {
  const cached = getCollection<Quotation>("quotations").find(
    (q) => q.id === id,
  );
  if (cached) return cached;
  const rows = await refreshCollection<Quotation>("quotations");
  return rows.find((q) => q.id === id) ?? null;
}

/**
 * Staff presses "Confirm checklist": the checklist becomes Done and the linked quotation
 * becomes "Ready for Confirmation" (that is what unlocks Confirm on the quotation).
 */
export async function confirmChecklist(checklistId: string) {
  const checklist = getCollection<Checklist>("checklists").find(
    (c) => c.id === checklistId,
  );
  if (!checklist) throw new Error("Checklist not found.");
  if (
    checklist.items.length === 0 ||
    !checklist.items.every((i) => i.completed)
  ) {
    throw new Error("Complete every check before confirming the checklist.");
  }
  await updateRecord("checklists", checklistId, {
    status: "Completed",
  } as Partial<Checklist>);

  if (!checklist.quotationId) return;
  const quotation = await findQuotation(checklist.quotationId);
  if (!quotation || !isOpenQuotationStatus(quotation.status)) return;
  const materials = await refreshCollection<Material>("materials");
  await updateQuotation(quotation.id, {
    status: "ready",
    checklistStatus: "Ready for Confirmation",
    inventoryStatus: summarizeInventory(checklist.items, materials),
  });
}

/** Unlocks a confirmed checklist so it can be edited again; the quotation goes back to pending. */
export async function reopenChecklist(checklistId: string) {
  const checklist = getCollection<Checklist>("checklists").find(
    (c) => c.id === checklistId,
  );
  if (!checklist) return;
  await updateRecord("checklists", checklistId, {
    status: "Ready for Confirmation",
  } as Partial<Checklist>);
  if (!checklist.quotationId) return;
  const quotation = await findQuotation(checklist.quotationId);
  if (quotation && isOpenQuotationStatus(quotation.status)) {
    await updateQuotation(quotation.id, {
      status: "checklist-pending",
      checklistStatus: "Checklist Pending",
    });
  }
}

export function updateChecklist(id: string, patch: Partial<Checklist>) {
  void updateRecord("checklists", id, patch);
}

export async function deleteChecklist(id: string) {
  const checklist = getCollection<Checklist>("checklists").find(
    (c) => c.id === id,
  );
  await deleteRecord("checklists", id);
  if (checklist?.quotationId) {
    const quotation = await findQuotation(checklist.quotationId);
    if (quotation && isOpenQuotationStatus(quotation.status)) {
      await updateQuotation(quotation.id, {
        status: "pending",
        checklistStatus: "Pending Review",
        inventoryStatus: null,
      });
    }
  }
}
