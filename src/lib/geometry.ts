export interface Point { x: number; y: number }
export const ANGLE_EPSILON = 0.01;
export const approximatelyEqual = (a:number,b:number,epsilon=ANGLE_EPSILON) => Math.abs(a-b)<=epsilon;
export const calculateThirdAngle = (a:number,b:number) => 180-a-b;
export function validateAngles(a:number,b:number,c=calculateThirdAngle(a,b)) { return [a,b,c].every(v=>Number.isFinite(v)&&v>=5)&&approximatelyEqual(a+b+c,180); }
export const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
export function createTriangleVertices(a:number,b:number,c=200):Point[] {
  if(!validateAngles(a,b)||!Number.isFinite(c)||c<=0) throw new Error('각은 5° 이상이고 합은 180°여야 합니다.');
  const rad=Math.PI/180, length=c*Math.sin(b*rad)/Math.sin(calculateThirdAngle(a,b)*rad);
  return [{x:0,y:0},{x:c,y:0},{x:length*Math.cos(a*rad),y:-length*Math.sin(a*rad)}];
}
export function fitTriangleToBox(points:Point[],width:number,height:number,padding=0):Point[] {
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const scale=Math.min((width-padding*2)/(maxX-minX),(height-padding*2)/(maxY-minY));
  return points.map(p=>({x:(p.x-(minX+maxX)/2)*scale+width/2,y:(p.y-(minY+maxY)/2)*scale+height/2}));
}
export function calculateSideLengths(p:Point[]) { return [distance(p[1],p[2]),distance(p[0],p[2]),distance(p[0],p[1])]; }
export const localVertices=(a:number,b:number)=>fitTriangleToBox(createTriangleVertices(a,b),210,185).map(p=>({x:p.x-105,y:p.y-92.5}));
export function transformPoint(p:Point,t:{x:number;y:number;rotation:number;scale:number}):Point {const r=t.rotation*Math.PI/180;return {x:t.x+t.scale*(p.x*Math.cos(r)-p.y*Math.sin(r)),y:t.y+t.scale*(p.x*Math.sin(r)+p.y*Math.cos(r))};}
