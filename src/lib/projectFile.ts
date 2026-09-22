import { validateAngles } from './geometry';
import type { Project } from './model';
export function parseProject(text:string):Project {
  const p=JSON.parse(text);if(p?.version!==1||!['free','textbook'].includes(p.mode)||!Array.isArray(p.triangles)||p.triangles.length>2000||typeof p.settings?.snap!=='boolean')throw new Error('지원하는 삼각형 프로젝트 파일이 아니에요.');
  const ids=new Set<string>();
  const triangles=p.triangles.map((t:Record<string,unknown>)=>{if(typeof t.id!=='string'||ids.has(t.id)||typeof t.angleA!=='number'||typeof t.angleB!=='number'||!validateAngles(t.angleA,t.angleB)||typeof t.fill!=='string'||!/^#[0-9a-f]{6}$/i.test(t.fill)||!['x','y','scale','rotation'].every(k=>typeof t[k]==='number'&&Number.isFinite(t[k])&&Math.abs(t[k] as number)<=1e6)||(t.scale as number)<=0||(t.scale as number)>100||t.groupId!==undefined&&typeof t.groupId!=='string')throw new Error('파일에 올바르지 않은 삼각형 정보가 있어요.');ids.add(t.id);return {id:t.id,angleA:t.angleA,angleB:t.angleB,fill:t.fill,x:t.x as number,y:t.y as number,scale:t.scale as number,rotation:t.rotation as number,...(t.groupId?{groupId:t.groupId as string}:{})};});
  return {version:1,mode:p.mode,triangles,settings:{snap:p.settings.snap}};
}
export const serializeProject=(p:Project)=>JSON.stringify(p,null,2);
export function download(blob:Blob,name:string) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
