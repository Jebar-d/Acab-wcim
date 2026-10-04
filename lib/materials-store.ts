"use client";
import { deleteRecord, makeId, updateRecord, useDbCollection, apiRequest, refreshCollection } from "@/lib/db-client";
export type MaterialStatus = "Available" | "Limited" | "Unavailable";
export type Material = { id:string; sku:string; name:string; category:string; unit:string; quantity:number; minimumStock:number; status:MaterialStatus; imageUrl?:string|null; createdAt:string };
export function useMaterials(): Material[] { return useDbCollection<Material>("materials"); }
export async function addMaterial(input: Omit<Material,"id"|"createdAt"> & {id?:string;imageData?:string}) {
  const {imageData,...details}=input;
  const material: Material={...details,id:input.id??makeId("material"),createdAt:new Date().toISOString()};
  const saved=await apiRequest<Material>("create","materials",{record:{...material,imageData:imageData??""}});
  await refreshCollection<Material>("materials");
  return saved;
}
export async function updateMaterial(id:string,patch:Partial<Material>,imageData=""){const {imageUrl:_imageUrl,...details}=patch;const saved=await apiRequest<Material>("update","materials",{id,patch:{...details,imageData}});await refreshCollection<Material>("materials");return saved;}
export function deleteMaterial(id:string){ void deleteRecord("materials",id); }
export async function adjustStock(id:string,delta:number){
  const materials=await apiRequest<Material[]>("list","materials");
  const material=materials.find(item=>item.id===id);
  if(!material)return null;
  const quantity=Math.max(0,material.quantity+delta);
  const status:MaterialStatus=quantity<=material.minimumStock?"Limited":"Available";
  return updateRecord("materials",id,{quantity,status});
}
