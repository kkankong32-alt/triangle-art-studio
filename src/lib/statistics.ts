import { getTriangleProperties } from './classification';
import type { Triangle,Filter } from './model';
export function matches(t:Triangle,filter:Filter) {const p=getTriangleProperties(t.angleA,t.angleB);return !filter||(['acute','right','obtuse'].includes(filter)?p.angleType===filter:p[filter as 'isIsosceles'|'isEquilateral'|'isScalene']);}
export function statistics(ts:Triangle[]) { const s={total:ts.length,acute:0,right:0,obtuse:0,isIsosceles:0,isEquilateral:0,isScalene:0,colors:{} as Record<string,number>};ts.forEach(t=>{const p=getTriangleProperties(t.angleA,t.angleB);s[p.angleType]++;if(p.isIsosceles)s.isIsosceles++;if(p.isEquilateral)s.isEquilateral++;if(p.isScalene)s.isScalene++;s.colors[t.fill]=(s.colors[t.fill]||0)+1;});return s; }
