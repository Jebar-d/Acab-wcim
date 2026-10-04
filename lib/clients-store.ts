"use client";
import { createRecord, deleteRecord, makeId, updateRecord, useDbCollection } from "@/lib/db-client";
export type ClientStatus="active"|"inactive";
export type Client={id:string;accountId?:string;name:string;email?:string;phone?:string;company?:string;address?:string;status:ClientStatus;createdAt:string};
export type ClientInput=Omit<Client,"id"|"createdAt"|"status"> & {id?:string;status?:ClientStatus};
export function useClients(){return useDbCollection<Client>("clients");}
export function upsertClient(input:ClientInput){const id=input.id??makeId("client");const row:Client={...input,id,status:input.status??"active",createdAt:new Date().toISOString()};void createRecord("clients",row);return row;}
export function ensureClientForAccount(account:{id:string;name:string;email:string}){const row:Client={id:`client-${account.id}`,accountId:account.id,name:account.name,email:account.email,status:"active",createdAt:new Date().toISOString()};void createRecord("clients",row);return row;}
export function updateClient(id:string,patch:Partial<Client>){void updateRecord("clients",id,patch);}
export function deleteClient(id:string){void deleteRecord("clients",id);}
