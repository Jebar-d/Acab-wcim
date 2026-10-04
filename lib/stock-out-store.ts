"use client";
import { apiRequest, createRecord, deleteRecord, makeId, useDbCollection } from "@/lib/db-client";
export type StockOut={id:string;stockOutId:string;sku:string;material:string;quantity:number;orderRef:string;destination:string;warehouseStaff:string;date:string;status:"Draft"|"Confirmed";createdAt:string};
export function useStockOuts(){return useDbCollection<StockOut>("stock_out");}
export function addStockOut(input:Omit<StockOut,"id"|"createdAt">){const row:StockOut={...input,id:makeId("stockout"),createdAt:new Date().toISOString()};void createRecord("stock_out",row);return row;}
export async function confirmStockOut(id:string){return apiRequest<StockOut>("confirm_stock_out",undefined,{id});}
export function deleteStockOut(id:string){void deleteRecord("stock_out",id);}
