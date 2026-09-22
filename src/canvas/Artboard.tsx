import { useEffect,useRef,useState,type RefObject } from 'react';
import { Stage,Layer,Line,Rect,Transformer,Circle } from 'react-konva';
import Konva from 'konva';
import { pointsOf,type Triangle,type Filter } from '../lib/model';
import { matches } from '../lib/statistics';
import { snapVertices } from '../lib/snapping';
import type { Point } from '../lib/geometry';
interface Props {triangles:Triangle[];selected:string[];setSelected:(ids:string[])=>void;onUpdate:(triangles:Triangle[])=>void;filter:Filter;snap:boolean;multi:boolean;boardRef:RefObject<HTMLDivElement|null>}
export function Artboard({triangles,selected,setSelected,onUpdate,filter,snap,multi,boardRef}:Props) {
  const host=useRef<HTMLDivElement>(null),stage=useRef<Konva.Stage>(null),transformer=useRef<Konva.Transformer>(null),nodes=useRef(new Map<string,Konva.Line>()),drag=useRef<{start:Point;items:Triangle[]}|null>(null);
  const [size,setSize]=useState({width:800,height:533}),[marquee,setMarquee]=useState<{start:Point;end:Point}|null>(null),[guide,setGuide]=useState<Point|null>(null);
  const factor=size.width/1200;
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>{const {width,height}=entry.contentRect,w=Math.min(width,height*1.5);setSize({width:w,height:w/1.5});});observer.observe(host.current!);return ()=>observer.disconnect();},[]);
  useEffect(()=>{transformer.current?.nodes(selected.map(id=>nodes.current.get(id)).filter((v):v is Konva.Line=>!!v));},[selected,triangles]);
  function expand(ids:string[]) {const groups=new Set(triangles.filter(t=>ids.includes(t.id)&&t.groupId).map(t=>t.groupId));return triangles.filter(t=>ids.includes(t.id)||t.groupId&&groups.has(t.groupId)).map(t=>t.id);}
  function select(t:Triangle,add=false) {const ids=expand([t.id]);setSelected(add?(selected.includes(t.id)?selected.filter(id=>!ids.includes(id)):[...new Set([...selected,...ids])]):ids);}
  function currentPoint() {const p=stage.current?.getPointerPosition();return p?{x:p.x/factor,y:p.y/factor}:null;}
  function saveTransform() {onUpdate(triangles.map(t=>{const n=nodes.current.get(t.id);if(!n||!selected.includes(t.id))return t;const s=Math.max(.04,Math.min(100,Math.abs(n.scaleX())));n.scale({x:s,y:s});return {...t,x:n.x(),y:n.y(),rotation:n.rotation(),scale:s};}));}
  const box=marquee?{x:Math.min(marquee.start.x,marquee.end.x),y:Math.min(marquee.start.y,marquee.end.y),width:Math.abs(marquee.start.x-marquee.end.x),height:Math.abs(marquee.start.y-marquee.end.y)}:null;
  return <div className="board-fit" ref={host}><div className="board-paper" ref={boardRef} style={{width:size.width,height:size.height}}><Stage ref={stage} width={size.width} height={size.height} scaleX={factor} scaleY={factor}
    onPointerDown={e=>{if(e.target===e.target.getStage()){const p=currentPoint();if(p){setMarquee({start:p,end:p});if(!e.evt.shiftKey&&!multi)setSelected([]);}}}}
    onPointerMove={()=>{if(marquee){const p=currentPoint();if(p)setMarquee({...marquee,end:p});}}}
    onPointerUp={()=>{if(box&&box.width+box.height>5){const hits=triangles.filter(t=>{const r=nodes.current.get(t.id)?.getClientRect({relativeTo:stage.current!});return r&&Konva.Util.haveIntersection(box,r);}).map(t=>t.id);setSelected(expand(multi?[...selected,...hits]:hits));}setMarquee(null);}}
  ><Layer>{triangles.map(t=><Line key={t.id} ref={n=>{if(n)nodes.current.set(t.id,n);else nodes.current.delete(t.id);}} id={t.id} points={pointsOf(t).flatMap(p=>[p.x,p.y])} closed fill={t.fill} x={t.x} y={t.y} scaleX={t.scale} scaleY={t.scale} rotation={t.rotation} opacity={matches(t,filter)?1:.16} stroke={selected.includes(t.id)?'#087f96':undefined} strokeWidth={selected.includes(t.id)?1.3/factor:0} strokeScaleEnabled={false} draggable
    onClick={e=>select(t,e.evt.shiftKey||multi)} onTap={()=>select(t,multi)}
    onDragStart={()=>{const ids=selected.includes(t.id)?selected:expand([t.id]);if(!selected.includes(t.id))setSelected(ids);drag.current={start:{x:t.x,y:t.y},items:triangles.filter(v=>ids.includes(v.id))};}}
    onDragMove={e=>{const d=drag.current;if(!d)return;let dx=e.target.x()-d.start.x,dy=e.target.y()-d.start.y;const moving=d.items.map(v=>({...v,x:v.x+dx,y:v.y+dy}));const hit=snap?snapVertices(moving,triangles.filter(v=>!d.items.some(s=>s.id===v.id)),12/factor):null;if(hit){dx+=hit.dx;dy+=hit.dy;}setGuide(hit?.target??null);d.items.forEach(v=>nodes.current.get(v.id)?.position({x:v.x+dx,y:v.y+dy}));}}
    onDragEnd={()=>{const d=drag.current;if(d)onUpdate(triangles.map(v=>{const n=nodes.current.get(v.id);return n&&d.items.some(s=>s.id===v.id)?{...v,x:n.x(),y:n.y()}:v;}));drag.current=null;setGuide(null);}}
  />)}<Transformer ref={transformer} rotateEnabled keepRatio flipEnabled={false} enabledAnchors={['top-left','top-right','bottom-left','bottom-right']} anchorSize={12/factor} rotateAnchorOffset={30/factor} anchorCornerRadius={3} borderStroke="#087f96" anchorStroke="#087f96" anchorFill="white" ignoreStroke onTransformEnd={saveTransform} boundBoxFunc={(old,b)=>Math.abs(b.width)<15||Math.abs(b.height)<8?old:b}/>{box&&<Rect {...box} fill="#16869a18" stroke="#16869a" strokeWidth={1/factor} listening={false}/ >}{guide&&<Circle {...guide} radius={6/factor} fill="white" stroke="#087f96" strokeWidth={2/factor} listening={false}/>}</Layer></Stage>{!triangles.length&&<div className="empty-state"><svg width="90" height="78" viewBox="0 0 90 78" aria-hidden="true"><path d="M17 61 45 13 73 61Z" fill="#eef7f8" stroke="#a8cbd1" strokeWidth="1.5"/><path d="M45 13 45 61 73 61" fill="#dceef1"/><circle cx="17" cy="61" r="3" fill="#258ca0"/><circle cx="45" cy="13" r="3" fill="#258ca0"/><circle cx="73" cy="61" r="3" fill="#258ca0"/></svg><h2>세 개의 각, 무한한 상상</h2><p>삼각형을 추가해 작품을 만들어 보세요.</p><span>왼쪽에서 모양과 색을 고르고, 삼각형 추가</span></div>}</div></div>;
}
