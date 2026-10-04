"use client";
import { createRecord, deleteRecord, makeId, useDbCollection } from "@/lib/db-client";
export type LedgerSource="Purchase Order"|"Invoice"|"Customer Order"|"Delivery Receipt"|"Stock In"|"Stock Out"|"Project Transaction"|"Customer Payment"|"Supplier Payment"|"Other Income"|"Operating Expense";
export type LedgerEntry={id:string;type:string;source:LedgerSource;reference:string;description:string;amount:number;date:string;party:string;project:string;status:"Posted"|"Draft";sourceId:string;createdAt:string};
export function useLedger(){return useDbCollection<LedgerEntry>("ledger_entries");}
export async function addLedgerEntry(input:Omit<LedgerEntry,"id"|"createdAt">){const row:LedgerEntry={...input,id:makeId("ledger"),createdAt:new Date().toISOString()};return createRecord("ledger_entries",row);}
export function deleteLedgerEntry(id:string){void deleteRecord("ledger_entries",id);}
