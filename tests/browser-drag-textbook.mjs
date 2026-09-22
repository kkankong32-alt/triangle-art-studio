import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
// Preview drag-to-create must respect textbook mode's automatic angle-type coloring too.
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForTimeout(400);
await page.getByRole('button',{name:'교과서 활동',exact:true}).click();
await page.getByText('빠른 예시').click();
await page.getByRole('button',{name:'둔각 이등변',exact:true}).click();
async function dragTo(from,to){await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:10});await page.mouse.up();await page.waitForTimeout(150);}
const preview=await page.locator('.preview-grab').boundingBox();
const board=await page.locator('.board-paper').boundingBox();
await dragTo({x:preview.x+preview.width/2,y:preview.y+preview.height/2},{x:board.x+board.width/2,y:board.y+board.height/2});
await page.getByText('1개의 삼각형',{exact:true}).waitFor();
const fill=await page.evaluate(async()=>{const {default:K}=await import('/node_modules/.vite/deps/konva.js');return K.stages[0].find('Line')[0].fill();});
assert.equal(fill.toLowerCase(),'#538fd1','drag-created triangle in textbook mode should use the obtuse-angle legend color, not a free palette color');
assert.deepEqual(errors,[]);
console.log('PASS: preview drag-to-create uses the textbook mode\'s automatic angle-type color (#538FD1 for obtuse)');
await browser.close();
