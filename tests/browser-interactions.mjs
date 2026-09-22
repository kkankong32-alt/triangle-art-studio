import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('http://localhost:5173');await page.getByRole('button',{name:'삼각형 추가',exact:true}).click();
const inspect=()=>page.evaluate(async()=>{const {default:K}=await import('/node_modules/.vite/deps/konva.js');const s=K.stages[0],node=s.find('Line')[0],tr=s.find('Transformer')[0];const p=s.container().getBoundingClientRect();const xy=n=>{const v=n.getAbsolutePosition();return {x:v.x+p.x,y:v.y+p.y};};return {triangle:{x:node.x(),y:node.y(),sx:node.scaleX(),sy:node.scaleY(),rotation:node.rotation()},center:xy(node),corner:xy(tr.findOne('.bottom-right')),rotate:xy(tr.findOne('.rotater'))};});
async function drag(from,to){await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:15});await page.mouse.up();await page.waitForTimeout(150);}
let s=await inspect();await drag({x:s.center.x,y:s.center.y+20},{x:s.center.x+60,y:s.center.y+55});let next=await inspect();assert.ok(next.triangle.x>s.triangle.x+30);
s=next;await drag(s.corner,{x:s.corner.x+70,y:s.corner.y+40});next=await inspect();assert.ok(next.triangle.sx>1.1);assert.ok(Math.abs(next.triangle.sx-next.triangle.sy)<1e-8);
s=next;await drag(s.rotate,{x:s.rotate.x+90,y:s.rotate.y+60});next=await inspect();assert.ok(Math.abs(next.triangle.rotation)>10);
await page.getByRole('button',{name:'복제',exact:true}).click();await page.keyboard.press('Control+a');await page.getByRole('button',{name:'그룹',exact:true}).click();
s=await inspect();await drag(s.corner,{x:s.corner.x+30,y:s.corner.y+30});
const scales=await page.evaluate(async()=>{const {default:K}=await import('/node_modules/.vite/deps/konva.js');return K.stages[0].find('Line').map(n=>[n.scaleX(),n.scaleY()]);});scales.forEach(([x,y])=>assert.ok(Math.abs(x-y)<1e-8));
await page.screenshot({path:'outputs/desktop-editor.png'});
await page.setViewportSize({width:1024,height:768});await page.locator('.creator').evaluate(e=>e.scrollTop=0);await page.waitForTimeout(200);assert.ok(await page.getByRole('button',{name:'삼각형 추가',exact:true}).isVisible());await page.screenshot({path:'outputs/tablet-editor.png'});
await page.getByRole('button',{name:'작품 분석',exact:true}).click();await page.getByRole('button',{name:/예각삼각형/}).click();
const clean=await page.evaluate(async()=>{const {renderArtwork}=await import('/src/lib/exportArtwork.ts');const {default:K}=await import('/node_modules/.vite/deps/konva.js');const ts=K.stages[0].find('Line').map((n,i)=>({id:''+i,angleA:60,angleB:60,fill:n.fill(),x:n.x(),y:n.y(),rotation:n.rotation(),scale:n.scaleX()}));const p={version:1,mode:'free',triangles:ts,settings:{snap:true}};const c=renderArtwork(p,false,true);return {width:c.width,height:c.height,alpha:c.getContext('2d').getImageData(0,0,1,1).data[3],card:renderArtwork(p,true).height};});assert.deepEqual(clean,{width:2400,height:1600,alpha:0,card:1900});
console.log('PASS: pointer drag, corner uniform scale, rotation, grouped uniform transform, transparent export and artwork card');
await browser.close();
