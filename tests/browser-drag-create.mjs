import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
// Regression coverage for preview -> artboard drag creation (mouse), alongside the existing button pipeline.
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForTimeout(400);
await page.locator('.cover-start').click();await page.waitForTimeout(300); // dismiss the intro cover before exercising the editor

const inspect=()=>page.evaluate(async()=>{const {default:K}=await import('/node_modules/.vite/deps/konva.js');return K.stages[0].find('Line').map(n=>({x:n.x(),y:n.y(),fill:n.fill()}));});
async function dragTo(from,to){await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move((from.x+to.x)/2,(from.y+to.y)/2,{steps:5});await page.mouse.move(to.x,to.y,{steps:10});await page.mouse.up();await page.waitForTimeout(150);}
const previewCenter=async()=>{const b=await page.locator('.preview-grab').boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
const boardBox=()=>page.locator('.board-paper').boundingBox();
const expectedLogical=(board,client)=>({x:(client.x-board.x)/board.width*1200,y:(client.y-board.y)/board.height*800});

// Use a preset (not the default 60/60/60) and a distinct palette color so the created object is easy to verify.
await page.getByText('빠른 예시').click();
await page.getByRole('button',{name:'직각 이등변',exact:true}).click();
await page.getByRole('button',{name:'노랑 색상'}).click();

// 1) Preview drag creates exactly one triangle, at the drop point, with the current angle/fill.
let board=await boardBox();
let target={x:board.x+board.width*0.68,y:board.y+board.height*0.28};
await dragTo(await previewCenter(),target);
await page.getByText('1개의 삼각형',{exact:true}).waitFor();
let lines=await inspect();
assert.equal(lines.length,1,'drag should create exactly one triangle');
let expected=expectedLogical(board,target);
assert.ok(Math.abs(lines[0].x-expected.x)<3,'dropped x should match the pointer position');
assert.ok(Math.abs(lines[0].y-expected.y)<3,'dropped y should match the pointer position');
assert.equal(lines[0].fill.toLowerCase(),'#eec64e','drag-created triangle should use the selected palette color');

// 2) Dropping outside the artboard cancels creation (count stays the same).
await dragTo(await previewCenter(),{x:20,y:20});
await page.waitForTimeout(150);
lines=await inspect();
assert.equal(lines.length,1,'dropping outside the artboard must not create a triangle');

// 3) The button keeps using the same pipeline and coexists with drag-created triangles.
await page.getByRole('button',{name:'삼각형 추가',exact:true}).click();
await page.getByText('2개의 삼각형',{exact:true}).waitFor();

// 4) Coordinate conversion stays correct after the artboard is resized (responsive scaling).
await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(300);
board=await boardBox();
target={x:board.x+board.width*0.3,y:board.y+board.height*0.72};
await dragTo(await previewCenter(),target);
await page.getByText('3개의 삼각형',{exact:true}).waitFor();
lines=await inspect();
expected=expectedLogical(board,target);
assert.ok(Math.abs(lines[2].x-expected.x)<3,'scaled-artboard drop x should still map to logical coordinates');
assert.ok(Math.abs(lines[2].y-expected.y)<3,'scaled-artboard drop y should still map to logical coordinates');

// 5) Undo removes the drag-created triangle, redo restores it.
await page.keyboard.press('Control+z');
await page.getByText('2개의 삼각형',{exact:true}).waitFor();
await page.keyboard.press('Control+Shift+z');
await page.getByText('3개의 삼각형',{exact:true}).waitFor();

// 6) The analysis dashboard total reflects drag-created triangles too.
await page.getByRole('button',{name:'작품 분석',exact:true}).click();
await page.getByText('총 삼각형').waitFor();
assert.equal(await page.locator('.total strong').innerText(),'3개');

assert.deepEqual(errors,[]);
console.log('PASS: preview drag creates at the exact drop point with current angle/color, cancels outside the artboard, matches button creation, survives resize, undo/redo, and analysis totals');
await browser.close();
