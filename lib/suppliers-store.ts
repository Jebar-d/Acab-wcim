"use client";
import { createRecord, deleteRecord, makeId, updateRecord, useDbCollection } from "@/lib/db-client";
export type SupplierStatus="active"|"inactive";
export type Supplier={id:string;name:string;contactName?:string;category?:string;phone?:string;email?:string;address?:string;status:SupplierStatus;createdAt:string};
export type SupplierInput=Omit<Supplier,"id"|"createdAt"|"status"> & { status?: SupplierStatus };
export function useSuppliers(){return useDbCollection<Supplier>("suppliers");}
export function addSupplier(input:SupplierInput):Supplier{const row: Supplier={...input,status:input.status ?? "active",id:makeId("supplier"),createdAt:new Date().toISOString()};void createRecord("suppliers",row);return row;}
export function toggleSupplierStatus(id:string,status:SupplierStatus){void updateRecord("suppliers",id,{status});}
export function updateSupplier(id:string,patch:Partial<Supplier>){void updateRecord("suppliers",id,patch);}
export function deleteSupplier(id:string){void deleteRecord("suppliers",id);}
