"use client";
import { createRecord, deleteRecord, getCollection, makeId, updateRecord, useDbCollection, apiRequest } from "@/lib/db-client";
export type OrderStatus="Pending"|"Confirmed"|"Preparing"|"Ready for Release"|"Released"|"Delivered"|"Cancelled";
export type Order={id:string;quotationId?:string;inquiryId?:string;clientId?:string;accountId?:string;projectName:string;clientName:string;materials:string;quantity:string;status:OrderStatus;createdAt:string;confirmedAt?:string;deliveryMethod?:string;deliveryAddressId?:string;paymentMethod?:string;notes?:string};
export function useOrders(){return useDbCollection<Order>("orders");}
export async function createOrderFromQuotation(q:{id:string;inquiryId?:string;clientId?:string;accountId?:string;projectName:string;customerName?:string;materials:string;quantity:string}){
 const existing=getCollection<Order>("orders").find(o=>o.quotationId===q.id); if(existing)return existing;
 const now=new Date().toISOString(); const order:Order={id:makeId("order"),quotationId:q.id,inquiryId:q.inquiryId,clientId:q.clientId,accountId:q.accountId,projectName:q.projectName,clientName:q.customerName||"Customer",materials:q.materials,quantity:q.quantity,status:"Confirmed",createdAt:now,confirmedAt:now};
 const saved = await createRecord("orders",order);
 await apiRequest("create","transactions",{record:{id:makeId("tx"),orderId:saved.id,accountId:saved.accountId,type:"ORDER_CREATED",status:"Confirmed",title:"Order confirmed",message:`${saved.clientName} confirmed ${saved.projectName}.`}});
 return saved;
}
export function updateOrder(id:string,patch:Partial<Order>){void updateRecord("orders",id,patch);}
export function addOrder(input:Omit<Order,"id"|"createdAt"|"status"> & {status?:OrderStatus}){const row:Order={...input,id:makeId("order"),createdAt:new Date().toISOString(),status:input.status??"Pending"};void createRecord("orders",row);return row;}
export function deleteOrder(id:string){void deleteRecord("orders",id);}
export async function updateOrderStatus(orderId:string,status:OrderStatus,message?:string){
  await apiRequest("transaction_status",undefined,{orderId,status,message});
  await updateRecord("orders",orderId,{status});
}
export async function cancelOrder(orderId:string,reason?:string){await updateOrderStatus(orderId,"Cancelled",reason ?? "The customer cancelled this order.");}
