import { distance,transformPoint,type Point } from './geometry';
import { pointsOf,type Triangle } from './model';
export function snapVertices(moving:Triangle[],fixed:Triangle[],threshold:number):{dx:number;dy:number;target:Point}|null {let best=threshold,result=null;const targets=fixed.flatMap(t=>pointsOf(t).map(p=>transformPoint(p,t)));for(const t of moving)for(const p of pointsOf(t)){const v=transformPoint(p,t);for(const target of targets){const d=distance(v,target);if(d<best){best=d;result={dx:target.x-v.x,dy:target.y-v.y,target};}}}return result;}
