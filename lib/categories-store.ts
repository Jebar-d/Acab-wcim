"use client";
import { createRecord, deleteRecord, makeId, updateRecord, useDbCollection } from "@/lib/db-client";
export type Category={id:string;name:string;description?:string;status:"active"|"inactive";createdAt:string};
export function useCategories(){return useDbCollection<Category>("categories");}
export function addCategory(input:{name:string;description?:string}){const row:Category={...input,id:makeId("cat"),status:"active",createdAt:new Date().toISOString()};void createRecord("categories",row);return row;}
export function updateCategory(id:string,patch:Partial<Category>){void updateRecord("categories",id,patch);}
export function toggleCategoryStatus(id:string){/* use the current status supplied by the caller/store UI */ void updateRecord("categories",id,{});}
export function deleteCategory(id:string){void deleteRecord("categories",id);}
