import { pointsOf,type Project } from './model';
import { statistics } from './statistics';
import { download } from './projectFile';
// A separate render surface guarantees that editor overlays and filters never reach PNGs.
export function renderArtwork(p:Project,card=false,transparent=false) {
  const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=card?1900:1600;const ctx=canvas.getContext('2d')!;ctx.scale(2,2);
  if(!transparent||card){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1200,card?950:800);}
  ctx.save();ctx.beginPath();ctx.rect(0,0,1200,800);ctx.clip();
  p.triangles.forEach(t=>{ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.rotation*Math.PI/180);ctx.scale(t.scale,t.scale);ctx.beginPath();pointsOf(t).forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=t.fill;ctx.fill();ctx.restore();});ctx.restore();
  if(card){const s=statistics(p.triangles);ctx.fillStyle='#e5edf0';ctx.fillRect(40,818,1120,1);ctx.fillStyle='#203440';ctx.font='bold 25px sans-serif';ctx.fillText('나의 삼각형 작품',44,861);ctx.font='18px sans-serif';ctx.fillStyle='#526675';ctx.fillText(`총 ${s.total}개   ·   예각 ${s.acute}   직각 ${s.right}   둔각 ${s.obtuse}   ·   이등변 ${s.isIsosceles}   정삼각형 ${s.isEquilateral}`,44,904);}
  return canvas;
}
export async function exportArtwork(p:Project,card=false,transparent=false) {const canvas=renderArtwork(p,card,transparent);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('이미지를 저장하지 못했어요.')),'image/png'));download(blob,`triangle-${card?'card':'art'}-${new Date().toISOString().slice(0,10)}.png`);}
