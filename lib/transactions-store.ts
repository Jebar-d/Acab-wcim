"use client";
import { apiRequest, makeId, useDbCollection } from "@/lib/db-client";
export type Transaction={id:string;orderId?:string;accountId?:string;actorUserId?:string;actorRole?:string;type:string;status:string;title:string;message?:string;metadata?:Record<string,unknown>|null;createdAt:string};
export function useTransactions(){return useDbCollection<Transaction>("transactions");}
export async function addTransaction(input:Omit<Transaction,"id"|"createdAt">){const row={...input,id:makeId("tx"),createdAt:new Date().toISOString()};return apiRequest<Transaction>("create","transactions",{record:row});}
