"use client";
import * as React from "react";
import { apiRequest, createRecord, makeId, updateRecord, useDbCollection } from "@/lib/db-client";
export type NotificationAudience="admin"|"staff"|"user"|"all";
export type Notification={id:string;audience:NotificationAudience;accountId?:string;title:string;body:string;createdAt:string;read:boolean;href?:string};
export function addNotification(input:{audience:NotificationAudience;accountId?:string;title:string;body:string;href?:string}){const row:Notification={...input,id:makeId("notification"),createdAt:new Date().toISOString(),read:false};void createRecord("notifications",row);return row;}
export function useNotifications(audience:NotificationAudience,accountId?:string){
 const rows=useDbCollection<Notification>("notifications");
 return React.useMemo(()=>rows.filter(n=>(n.audience==="all"||n.audience===audience)&&(!n.accountId||n.accountId===accountId)),[rows,audience,accountId]);
}
export function useUnreadCount(audience:NotificationAudience,accountId?:string){return useNotifications(audience,accountId).filter(n=>!n.read).length;}
export function markRead(id:string){void updateRecord("notifications",id,{read:true});}
export async function markAllRead(audience:NotificationAudience,accountId?:string){const rows=await apiRequest<Notification[]>("list","notifications");for(const n of rows){if((n.audience==="all"||n.audience===audience)&&(!n.accountId||n.accountId===accountId))void updateRecord("notifications",n.id,{read:true});}}
