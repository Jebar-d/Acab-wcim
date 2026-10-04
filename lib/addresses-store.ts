"use client";
import { createRecord, deleteRecord, makeId, updateRecord, useDbCollection } from "@/lib/db-client";
export type Address={id:string;userId:string;label:string;recipientName:string;phone?:string;line1:string;line2?:string;barangay?:string;city?:string;province?:string;postalCode?:string;isDefault:boolean;createdAt:string};
export function useAddresses(){return useDbCollection<Address>("addresses");}
export function addAddress(input:Omit<Address,"id"|"createdAt">){const row:Address={...input,id:makeId("address"),createdAt:new Date().toISOString()};void createRecord("addresses",row);return row;}
export function updateAddress(id:string,patch:Partial<Address>){void updateRecord("addresses",id,patch);}
export function deleteAddress(id:string){void deleteRecord("addresses",id);}
