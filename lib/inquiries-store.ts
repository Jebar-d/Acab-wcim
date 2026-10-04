"use client";
import { createRecord, makeId, refreshCollection, updateRecord, useDbCollection } from "@/lib/db-client";
export type Inquiry={id:string;accountId?:string;project:string;projectType:string;location:string;materials:string;quantity:string;timeline:string;notes?:string;status?:string;createdAt:string};
export function useInquiries(){return useDbCollection<Inquiry>("inquiries");}
export async function createInquiry(input:Omit<Inquiry,"id"|"createdAt">){const row:Inquiry={...input,id:makeId("inquiry"),status:input.status??"pending",createdAt:new Date().toISOString()};const saved=await createRecord("inquiries",row);await refreshCollection<Inquiry>("inquiries");return saved ?? row;}
export function updateInquiry(id:string,patch:Partial<Inquiry>){void updateRecord("inquiries",id,patch);}
