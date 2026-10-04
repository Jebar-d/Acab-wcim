"use client";
import { createRecord, deleteRecord, getCollection, makeId, refreshCollection, updateRecord, useDbCollection } from "@/lib/db-client";
export type QuotationStatus="pending"|"reviewing"|"inventory-check"|"checklist-pending"|"ready"|"confirmed"|"rejected";
export type Quotation={id:string;inquiryId?:string;clientId?:string;accountId?:string;customerName?:string;customerEmail?:string;customerPhone?:string;projectName:string;projectType:string;location:string;materials:string;quantity:string;timeline:string;notes?:string;status:QuotationStatus;inventoryStatus?:"Available"|"Limited"|"Unavailable";checklistStatus?:"Pending Review"|"Checking Inventory"|"Checklist Pending"|"Ready for Confirmation"|"Confirmed"|"Rejected";confirmedAt?:string;confirmationSentAt?:string;customerConfirmedAt?:string;orderId?:string;createdAt:string};
export function isOpenQuotationStatus(status?: string): boolean {
  const normalized = status?.toLowerCase();
  return typeof normalized === "string" && normalized.length > 0 && !["confirmed", "rejected"].includes(normalized);
}
export function useQuotations(){return useDbCollection<Quotation>("quotations", true);}
export function getQuotationById(id?: string){if (!id) return null; return getCollection<Quotation>("quotations").find(q=>q.id===id)??null;}
export async function createQuotation(input:Omit<Quotation,"id"|"createdAt"> & {id?:string}){
  const row:Quotation={...input,id:input.id??makeId("quotation"),createdAt:new Date().toISOString(),status:input.status??"pending",checklistStatus:input.checklistStatus??"Pending Review"};
  if (input.customerEmail || input.customerPhone) {
    const contactDetails=[input.customerEmail, input.customerPhone].filter((value): value is string => Boolean(value)).join(" • ");
    row.notes = [input.notes, contactDetails].filter((value): value is string => Boolean(value)).join("\n");
  }
  const saved=await createRecord("quotations",row);
  const refreshed=await refreshCollection<Quotation>("quotations");
  return refreshed.find((q)=>q.id===saved.id) ?? saved ?? row;
}
export async function updateQuotation(id:string,patch:Partial<Quotation>){const updated=await updateRecord("quotations",id,patch);return updated ?? getCollection<Quotation>("quotations").find(q=>q.id===id)??null;}
export function deleteQuotation(id:string){void deleteRecord("quotations",id);}
export async function confirmQuotation(id:string,options?:{sendNotification?:boolean}){const now=new Date().toISOString();return updateQuotation(id,{status:"confirmed",checklistStatus:"Confirmed",confirmedAt:now,confirmationSentAt:options?.sendNotification?now:undefined});}
export async function confirmCustomerOrder(quotationId:string,orderId:string){return updateQuotation(quotationId,{customerConfirmedAt:new Date().toISOString(),orderId});}
