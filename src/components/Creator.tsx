import { useRef,useState,type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, Move } from 'lucide-react';
import { createTriangleVertices,fitTriangleToBox,type Point } from '../lib/geometry';
import { screenToArtboard } from '../lib/coords';
import { getTriangleProperties,angleLabels,textbookColors } from '../lib/classification';
export const palette=[['청록','#258CA0'],['산호','#E46F6A'],['노랑','#EEC64E'],['파랑','#538FD1'],['남색','#334C73'],['보라','#9B82BE'],['초록','#6F9E78'],['주황','#DE934F'],['분홍','#D995AE'],['먹색','#354754']];
interface Props {mode:'free'|'textbook';onAdd:(a:number,b:number,fill:string,method:'button'|'drag',pos?:Point)=>void;boardRef:RefObject<HTMLDivElement|null>}
export function Creator({mode,onAdd,boardRef}:Props) {
  const [a,setA]=useState(60),[b,setB]=useState(60),[color,setColor]=useState(palette[0][1]);const c=180-a-b,p=getTriangleProperties(a,b),fill=mode==='textbook'?textbookColors[p.angleType]:color;
  const points=fitTriangleToBox(createTriangleVertices(a,b),272,180,34);
  const ghostPoints=fitTriangleToBox(createTriangleVertices(a,b),84,68,8);
  const ghost=useRef<HTMLDivElement>(null),[drag,setDrag]=useState<Point|null>(null);
  function dropAt(clientX:number,clientY:number) {const el=boardRef.current;return el?screenToArtboard(el.getBoundingClientRect(),clientX,clientY):null;}
  function place(clientX:number,clientY:number) {ghost.current?.style.setProperty('transform',`translate(${clientX}px,${clientY}px) translate(-50%,-50%)`);const valid=!!dropAt(clientX,clientY);ghost.current?.classList.toggle('invalid',!valid);boardRef.current?.classList.toggle('drop-ready',valid);}
  function startDrag(e:React.PointerEvent) {
    if(e.pointerType==='mouse'&&e.button!==0) return;
    e.preventDefault();
    setDrag({x:e.clientX,y:e.clientY});
    const move=(ev:PointerEvent)=>place(ev.clientX,ev.clientY);
    const end=(ev:PointerEvent)=>{
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',cancel);
      boardRef.current?.classList.remove('drop-ready');setDrag(null);
      const pos=dropAt(ev.clientX,ev.clientY);if(pos) onAdd(a,b,fill,'drag',pos);
    };
    const cancel=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',cancel);boardRef.current?.classList.remove('drop-ready');setDrag(null);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',cancel);
  }
  return <aside className="creator"><div className="creator-content"><div className="eyebrow">01 / MAKE</div><h2>삼각형 만들기</h2><p className="muted intro">두 각을 움직여 모양을 찾아보세요.</p>
    <div className="angles">{[{name:'A',value:a,max:175-b,set:setA,label:'첫 번째 각'},{name:'B',value:b,max:175-a,set:setB,label:'두 번째 각'}].map(v=><label className="angle" key={v.name}><span><b className="letter">{v.name}</b>{v.label}<strong>{v.value}<small>°</small></strong></span><input aria-label={`${v.label} ${v.name}`} type="range" min="5" max={v.max} value={v.value} onChange={e=>v.set(+e.target.value)}/></label>)}<div className="third"><span><b className="letter">C</b>세 번째 각 <small>자동 계산</small></span><strong>{c}°</strong></div></div>
    <div className="preview"><div className="preview-grab" onPointerDown={startDrag} role="img" aria-label={`${a}도, ${b}도, ${c}도 삼각형. 눌러서 캔버스로 끌어다 놓을 수 있어요.`}><svg viewBox="0 0 272 180"><polygon points={points.map(p=>`${p.x},${p.y}`).join(' ')} fill={fill}/>{points.map((v,i)=><text key={i} x={v.x+(i===0?-9:i===1?9:0)} y={v.y+(i===2?-12:22)} textAnchor="middle">{['A','B','C'][i]} {([a,b,c])[i]}°</text>)}</svg></div><span>A + B + C = 180°</span><span className="drag-hint"><Move size={11}/>눌러서 캔버스에 끌어다 놓아요</span></div>
    <div className="properties"><h3>이 삼각형의 성질</h3><div className="chips"><span>{angleLabels[p.angleType]}</span>{p.isIsosceles&&<span>이등변삼각형</span>}{p.isEquilateral&&<span>정삼각형</span>}{p.isScalene&&<span>세 변의 길이가 모두 달라요</span>}</div></div>
    <details className="examples"><summary>빠른 예시 <ChevronDown size={14}/></summary><div>{[[60,60,'정삼각형'],[45,45,'직각 이등변'],[30,30,'둔각 이등변']].map(([x,y,name])=><button key={name} onClick={()=>{setA(+x);setB(+y);}}>{name}</button>)}</div></details>
    <section className="colors"><h3>색상 <span>{mode==='free'?'자유롭게 골라요':'각의 종류에 따라 정해져요'}</span></h3>{mode==='free'?<div className="palette">{palette.map(([name,hex])=><button key={hex} aria-label={`${name} 색상`} aria-pressed={color===hex} title={name} onClick={()=>setColor(hex)}><i style={{background:hex}}/>{color===hex&&<span>✓</span>}</button>)}</div>:<div className="textbook-legend">{Object.entries(textbookColors).map(([key,hex])=><span key={key}><i style={{background:hex}}/>{angleLabels[key as keyof typeof angleLabels]}</span>)}</div>}</section>
    <button className="primary add" onClick={()=>onAdd(a,b,fill,'button')}><Plus size={19}/>삼각형 추가</button><p className="creator-note">작은 삼각형에서 시작하는 나만의 작품</p>
    </div>
    {drag&&createPortal(<div ref={ghost} className="drag-ghost" style={{transform:`translate(${drag.x}px,${drag.y}px) translate(-50%,-50%)`}} aria-hidden="true"><svg viewBox="0 0 84 68"><polygon points={ghostPoints.map(p=>`${p.x},${p.y}`).join(' ')} fill={fill}/></svg></div>,document.body)}
  </aside>;
}
