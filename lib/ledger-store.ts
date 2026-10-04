"use client";
import { createRecord, deleteRecord, makeId, useDbCollection } from "@/lib/db-client";
export type LedgerSource="Purchase Order"|"Invoice"|"Customer Order"|"Delivery Receipt"|"Stock In"|"Stock Out"|"Project Transaction";
export type LedgerEntry={id:string;source:LedgerSource;reference:string;description:string;amount:number;date:string;party:string;project:string;status:"Posted"|"Draft";sourceId:string;createdAt:string};
export function useLedger(){return useDbCollection<LedgerEntry>("ledger_entries");}
export function addLedgerEntry(input:Omit<LedgerEntry,"id"|"createdAt">){const row:LedgerEntry={...input,id:makeId("ledger"),createdAt:new Date().toISOString()};void createRecord("ledger_entries",row);return row;}
export function deleteLedgerEntry(id:string){void deleteRecord("ledger_entries",id);}
