"use client";
import { createRecord, deleteRecord, makeId, updateRecord, useDbCollection } from "@/lib/db-client";
export type ChecklistItem={id:string;text:string;completed:boolean};
export type Checklist={id:string;title:string;status:"Pending Review"|"Checklist Pending"|"Ready for Confirmation"|"Confirmed"|"Rejected";items:ChecklistItem[];createdAt:string};
const STANDARD=["Verify quotation details and requested quantities","Verify customer/project information","Check material availability in inventory","Verify warehouse storage location","Confirm supplier availability for missing materials","Verify delivery schedule and required date","Verify transportation or delivery requirements","Confirm project location and delivery destination"];
export function useChecklists(){return useDbCollection<Checklist>("checklists");}
function standardItems(){return STANDARD.map(text=>({id:makeId("checkitem"),text,completed:false}));}
export function addChecklist(input:{title:string}){const row:Checklist={id:makeId("check"),title:input.title.trim()||"Construction Material Review",status:"Checklist Pending",items:standardItems(),createdAt:new Date().toISOString()};void createRecord("checklists",row);return row;}
export function toggleChecklistItem(checklistId:string,itemId:string){const list=useChecklists();const item=list.find(c=>c.id===checklistId);if(!item||item.status==="Confirmed")return;const items=item.items.map(i=>i.id===itemId?{...i,completed:!i.completed}:i);const status=items.length&&items.every(i=>i.completed)?"Ready for Confirmation":"Checklist Pending";void updateRecord("checklists",checklistId,{items,status} as Partial<Checklist>);}
export function updateChecklist(id:string,patch:Partial<Checklist>){void updateRecord("checklists",id,patch);}
export function deleteChecklist(id:string){void deleteRecord("checklists",id);}
