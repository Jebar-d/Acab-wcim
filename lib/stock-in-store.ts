"use client";
import { createRecord, deleteRecord, makeId, useDbCollection } from "@/lib/db-client";
export type StockIn={id:string;stockInId?:string;sku:string;material:string;quantity:number;supplier:string;receivedBy?:string;reference?:string;date:string;status:"Draft"|"Confirmed";createdAt:string};
export type StockInInput = Omit<StockIn, "id" | "createdAt" | "status"> & { stockInId?: string };
export function useStockIns(){return useDbCollection<StockIn>("stock_in");}
export function addStockIn(input:StockInInput){const row:StockIn={...input,stockInId:input.stockInId ?? makeId("stockin"),id:makeId("stockin"),createdAt:new Date().toISOString(),status:"Confirmed"};void createRecord("stock_in",row);return row;}
export function deleteStockIn(id:string){void deleteRecord("stock_in",id);}
