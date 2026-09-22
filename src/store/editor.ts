import { useCallback, useState } from 'react';
import type { Project,Triangle } from '../lib/model';
export interface History {past:Project[];present:Project;future:Project[]}
export function commit(h:History,p:Project):History {if(JSON.stringify(h.present)===JSON.stringify(p))return h;return {past:[...h.past,h.present].slice(-80),present:p,future:[]};}
export function undo(h:History):History {return h.past.length?{past:h.past.slice(0,-1),present:h.past.at(-1)!,future:[h.present,...h.future]}:h;}
export function redo(h:History):History {return h.future.length?{past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)}:h;}
export function duplicate(ts:Triangle[]):Triangle[] {const groups=new Map<string,string>();return ts.map(t=>{if(t.groupId&&!groups.has(t.groupId))groups.set(t.groupId,crypto.randomUUID());return {...t,id:crypto.randomUUID(),x:t.x+24,y:t.y+24,groupId:t.groupId?groups.get(t.groupId):undefined};});}
export function useEditor(initial:Project) {const [history,setHistory]=useState<History>({past:[],present:initial,future:[]});const change=useCallback((fn:(p:Project)=>Project)=>setHistory(h=>commit(h,fn(h.present))),[]);return {project:history.present,change,undo:useCallback(()=>setHistory(undo),[]),redo:useCallback(()=>setHistory(redo),[]),canUndo:!!history.past.length,canRedo:!!history.future.length};}
