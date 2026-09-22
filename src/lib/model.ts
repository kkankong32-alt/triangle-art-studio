import { localVertices } from './geometry';
export interface Triangle { id:string; angleA:number; angleB:number; fill:string; x:number; y:number; scale:number; rotation:number; groupId?:string }
export interface Project { version:1; mode:'free'|'textbook'; triangles:Triangle[]; settings:{snap:boolean} }
export type Filter='acute'|'right'|'obtuse'|'isIsosceles'|'isEquilateral'|'isScalene'|null;
export const emptyProject=():Project=>({version:1,mode:'free',triangles:[],settings:{snap:true}});
export function makeTriangle(a=60,b=60,fill='#258CA0',index=0,pos?:{x:number;y:number}):Triangle {return {id:crypto.randomUUID(),angleA:a,angleB:b,fill,x:pos?pos.x:600+(index%7)*18,y:pos?pos.y:400+(index%7)*18,scale:1,rotation:0};}
export const pointsOf=(t:Triangle)=>localVertices(t.angleA,t.angleB);
