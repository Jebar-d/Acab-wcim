"use client";
import { createRecord, deleteRecord, makeId, updateRecord, useDbCollection } from "@/lib/db-client";
export type SupplierStatus="active"|"inactive";
export type Supplier={id:string;name:string;contactName?:string;phone?:string;email?:string;address?:string;status:SupplierStatus;createdAt:string};
export type SupplierInput=Omit<Supplier,"id"|"createdAt"|"status"> & { status?: SupplierStatus };
export function useSuppliers(){return useDbCollection<Supplier>("suppliers");}
export async function addSupplier(input:SupplierInput){const row: Supplier={...input,status:input.status ?? "active",id:makeId("supplier"),createdAt:new Date().toISOString()};return createRecord("suppliers",row);}
export function toggleSupplierStatus(id:string,status:SupplierStatus){return updateRecord("suppliers",id,{status});}
export function updateSupplier(id:string,patch:Partial<Supplier>){return updateRecord("suppliers",id,patch);}
export function deleteSupplier(id:string){return deleteRecord("suppliers",id);}
