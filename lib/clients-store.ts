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
export type ClientStatus = "active" | "inactive";
export type Client = {
  id: string;
  accountId?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  status: ClientStatus;
  createdAt: string;
};
export type ClientInput = Omit<Client, "id" | "createdAt" | "status"> & {
  id?: string;
  status?: ClientStatus;
};
export function useClients() {
  return useDbCollection<Client>("clients");
}
export function upsertClient(input: ClientInput) {
  const id = input.id ?? makeId("client");
  const row: Client = {
    ...input,
    id,
    status: input.status ?? "active",
    createdAt: new Date().toISOString(),
  };
  void createRecord("clients", row);
  return row;
}
export async function ensureClientForAccount(account: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string;
}) {
  const id = `client-${account.id}`;
  const cached = getCollection<Client>("clients").find(
    (client) => client.id === id || client.accountId === account.id,
  );
  if (cached) return cached;

  const rows = await refreshCollection<Client>("clients");
  const existing = rows.find(
    (client) => client.id === id || client.accountId === account.id,
  );
  if (existing) return existing;

  const row: Client = {
    id,
    accountId: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone || undefined,
    address: account.address || undefined,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  try {
    return await createRecord("clients", row);
  } catch (error) {
    // A second request may race the first client insert. Reuse the saved row.
    const latest = await refreshCollection<Client>("clients");
    const racedClient = latest.find(
      (client) => client.id === id || client.accountId === account.id,
    );
    if (racedClient) return racedClient;
    throw error;
  }
}
export function updateClient(id: string, patch: Partial<Client>) {
  void updateRecord("clients", id, patch);
}
export function deleteClient(id: string) {
  void deleteRecord("clients", id);
}
