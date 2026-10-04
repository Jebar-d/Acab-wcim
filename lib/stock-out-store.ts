"use client";
import { apiRequest, createRecord, deleteRecord, makeId, refreshCollection, useDbCollection } from "@/lib/db-client";
export type StockOut={id:string;stockOutId:string;sku:string;material:string;quantity:number;orderRef:string;destination:string;warehouseStaff:string;date:string;status:"Draft"|"Confirmed";createdAt:string};
export function useStockOuts(){return useDbCollection<StockOut>("stock_out");}
export async function addStockOut(input:Omit<StockOut,"id"|"createdAt">){const row:StockOut={...input,id:makeId("stockout"),createdAt:new Date().toISOString()};return createRecord("stock_out",row);}
export async function confirmStockOut(id:string){const saved=await apiRequest<StockOut>("confirm_stock_out",undefined,{id});await Promise.all([refreshCollection("stock_out"),refreshCollection("materials"),refreshCollection("delivery_receipts")]);return saved;}
export function deleteStockOut(id:string){void deleteRecord("stock_out",id);}
