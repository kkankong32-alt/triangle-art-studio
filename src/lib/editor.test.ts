import { it,expect } from 'vitest';
import { emptyProject,makeTriangle } from './model';
import { commit,undo,redo,duplicate,type History } from '../store/editor';
import { statistics,matches } from './statistics';
import { parseProject,serializeProject } from './projectFile';
import { snapVertices } from './snapping';
it('create, undo, redo, duplicate, delete and statistics',()=>{let h:History={past:[],present:emptyProject(),future:[]};h=commit(h,{...h.present,triangles:[makeTriangle()]});expect(h.present.triangles.length).toBe(1);h=undo(h);expect(h.present.triangles.length).toBe(0);h=redo(h);expect(h.present.triangles.length).toBe(1);const ts=[...h.present.triangles,...duplicate(h.present.triangles)];expect(statistics(ts).total).toBe(2);expect(ts[0].id).not.toBe(ts[1].id);expect(statistics(ts.slice(1)).total).toBe(1);});
it('color, uniform resize, rotation, group and ungroup preserve properties',()=>{const ts=[makeTriangle(),makeTriangle(45,45),makeTriangle(30,30)];const before=statistics(ts);const changed=ts.map(t=>({...t,fill:'#123456',rotation:77,scale:2.3,groupId:'g'}));expect(statistics(changed)).toMatchObject({total:3,acute:1,right:1,obtuse:1,isEquilateral:1,isIsosceles:3});expect(statistics(changed.map(t=>({...t,groupId:undefined}))).total).toBe(before.total);expect(statistics(changed).colors['#123456']).toBe(3);});
it('save/load restores the complete project, rejects malformed files',()=>{const p={...emptyProject(),triangles:[{...makeTriangle(),groupId:'g',rotation:89,scale:1.7}]};expect(parseProject(serializeProject(p))).toEqual(p);expect(()=>parseProject('{')).toThrow();expect(()=>parseProject(JSON.stringify({...p,triangles:[{...p.triangles[0],scale:-1}]}))).toThrow();expect(()=>parseProject(JSON.stringify({...p,triangles:[p.triangles[0],p.triangles[0]]}))).toThrow();});
it('filters are views and exclusive angle counts sum to total',()=>{const ts=[makeTriangle(),makeTriangle(30,60),makeTriangle(30,30)];const original=JSON.stringify(ts),s=statistics(ts);expect(ts.filter(t=>matches(t,'right')).length).toBe(1);expect(ts.filter(t=>matches(t,'isIsosceles')).length).toBe(2);expect(JSON.stringify(ts)).toBe(original);expect(s.acute+s.right+s.obtuse).toBe(s.total);});
it('snaps to vertices with exact translation',()=>{const fixed=makeTriangle(),moving={...makeTriangle(),x:fixed.x+4,y:fixed.y+3};const hit=snapVertices([moving],[fixed],12);expect(hit?.dx).toBeCloseTo(-4);expect(hit?.dy).toBeCloseTo(-3);expect(snapVertices([{...moving,x:900}],[fixed],12)).toBeNull();});
it('history is bounded and restores color and transforms',()=>{let h:History={past:[],present:{...emptyProject(),triangles:[makeTriangle()]},future:[]};for(let i=0;i<100;i++)h=commit(h,{...h.present,triangles:h.present.triangles.map(t=>({...t,rotation:i,scale:1+i/100,fill:'#123456'}))});expect(h.past.length).toBe(80);expect(undo(h).present.triangles[0].rotation).toBe(98);});
it('drag-to-artboard creation places the triangle at the exact drop point and keeps current angle/color; undo/redo restore it',()=>{
  const pos={x:333,y:471};
  let h:History={past:[],present:emptyProject(),future:[]};
  h=commit(h,{...h.present,triangles:[makeTriangle(45,45,'#EEC64E',0,pos)]});
  expect(h.present.triangles).toHaveLength(1);
  const created=h.present.triangles[0];
  expect(created).toMatchObject({angleA:45,angleB:45,fill:'#EEC64E',x:pos.x,y:pos.y,scale:1,rotation:0});
  expect(statistics(h.present.triangles)).toMatchObject({total:1,right:1,isIsosceles:1});
  h=undo(h);expect(h.present.triangles).toHaveLength(0);
  h=redo(h);expect(h.present.triangles).toHaveLength(1);expect(h.present.triangles[0]).toEqual(created);
});
it('an explicit drop position does not disturb the default cascade placement used by the button flow',()=>{
  const dragged=makeTriangle(60,60,'#258CA0',5,{x:10,y:20});
  const buttonAdded=makeTriangle(60,60,'#258CA0',5);
  expect(dragged).toMatchObject({x:10,y:20});
  expect(buttonAdded).toMatchObject({x:600+(5%7)*18,y:400+(5%7)*18});
});
