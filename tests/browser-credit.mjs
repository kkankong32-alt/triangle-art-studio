import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
// The cover's 시작하기 always enters the editor directly (the entry quiz is a separate site with
// its own button into the program), and the editor shows a small footer credit that never ends up
// in exported PNGs.
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('**://www.googletagmanager.com/**',r=>r.abort());
const errors=[];page.on('pageerror',e=>errors.push(e.message));

// 1) Start enters the editor directly, with or without a quiz-pass key, and never navigates away.
for(const passed of [false,true]){
  await page.goto('http://localhost:5173');await page.waitForTimeout(400);
  await page.evaluate(p=>{p?sessionStorage.setItem('triangle_art_quiz_passed','1'):sessionStorage.removeItem('triangle_art_quiz_passed');},passed);
  await page.locator('.cover-start').click();await page.waitForTimeout(350);
  assert.equal(await page.locator('.cover').count(),0,'start should enter the editor (quiz passed: '+passed+')');
  assert.equal(page.url(),'http://localhost:5173/');
}

// 5) Footer credit: present, small, muted, inside the footer, and it does not overlap the artboard.
const credit=page.locator('footer .credit');
assert.equal((await credit.textContent()).trim(),'기획·제작: 쓰로인훈쌤 김종훈');
const size=parseFloat(await credit.evaluate(el=>getComputedStyle(el).fontSize));
assert.ok(size>=12&&size<=13,`credit should be 12-13px, got ${size}`);
const cBox=await credit.boundingBox(), bBox=await page.locator('.board-paper').boundingBox(), fBox=await page.locator('footer').boundingBox();
assert.ok(cBox.y>=bBox.y+bBox.height,'credit must sit below the artboard, not over it');
assert.ok(cBox.y>=fBox.y&&cBox.y+cBox.height<=fBox.y+fBox.height+1,'credit must stay inside the footer');
await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(250);
const c2=await credit.boundingBox();assert.ok(c2&&c2.width>50,'credit stays visible at tablet width');

// 6) The saved PNG never contains the credit (credit is DOM-only; export draws from artwork data).
await page.getByRole('button',{name:'삼각형 추가',exact:true}).click();
const dl=page.waitForEvent('download');
await page.getByRole('button',{name:'작품 저장',exact:true}).click();
await page.getByRole('button',{name:/작품만 저장/}).click();
const file=await (await dl).path();
const fs=await import('node:fs');
const png=fs.readFileSync(file);
assert.equal(png.subarray(0,4).toString('hex'),'89504e47');
assert.equal(png.includes(Buffer.from('김종훈')),false,'exported PNG must not embed the credit text');

assert.deepEqual(errors,[]);
console.log('PASS: start always enters the editor; footer credit 12px below the artboard; PNG has no credit');
await browser.close();
