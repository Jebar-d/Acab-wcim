"use client";
import { createRecord, deleteRecord, makeId, updateRecord, useDbCollection, apiRequest } from "@/lib/db-client";
export type MaterialStatus = "Available" | "Limited" | "Unavailable";
export type Material = { id:string; sku:string; name:string; category:string; unit:string; quantity:number; minimumStock:number; status:MaterialStatus; createdAt:string };
export function useMaterials(): Material[] { return useDbCollection<Material>("materials"); }
export function addMaterial(input: Omit<Material,"id"|"createdAt"> & {id?:string}) {
  const material: Material={...input,id:input.id??makeId("material"),createdAt:new Date().toISOString()};
  void createRecord("materials",material); return material;
}
export function updateMaterial(id:string,patch:Partial<Material>){ void updateRecord("materials",id,patch); }
export function deleteMaterial(id:string){ void deleteRecord("materials",id); }
export async function adjustStock(id:string,delta:number){
  const materials=await apiRequest<Material[]>("list","materials");
  const material=materials.find(item=>item.id===id);
  if(!material)return null;
  const quantity=Math.max(0,material.quantity+delta);
  const status:MaterialStatus=quantity<=material.minimumStock?"Limited":"Available";
  return updateRecord("materials",id,{quantity,status});
}
