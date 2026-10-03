import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
// Cover -> (quiz | editor) routing and the editor's footer credit. localhost normally skips the
// quiz gate (like standalone/file://), so the "deployed" behaviour is forced on through the
// module's test-only override; the quiz site itself is stubbed so nothing leaves the machine.
const QUIZ='https://kkankong32-alt.github.io/triangle-art-studio-quiz/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.route('**://www.googletagmanager.com/**',r=>r.abort());
await context.route(QUIZ+'**',r=>r.fulfill({contentType:'text/html',body:'<title>quiz stub</title>quiz'}));
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const forceGate=()=>page.evaluate(async()=>{const m=await import('/src/lib/quizGate.ts');m.__setQuizGateTestOverride(true);});

// 1) Local/dev (gate inactive): start goes straight to the editor, no navigation.
await page.goto('http://localhost:5173');await page.waitForTimeout(400);
await page.locator('.cover-start').click();await page.waitForTimeout(350);
assert.equal(await page.locator('.cover').count(),0,'with the gate inactive, start should enter the editor');
assert.equal(page.url(),'http://localhost:5173/');

// 2) Gate active + quiz NOT passed: start navigates to the entry quiz and the editor is not entered.
await page.goto('http://localhost:5173');await page.waitForTimeout(400);
await page.evaluate(()=>sessionStorage.removeItem('triangle_art_quiz_passed'));
await forceGate();
await Promise.all([page.waitForURL(QUIZ),page.locator('.cover-start').click()]);
assert.equal(await page.title(),'quiz stub');

// 3) Back returns to the cover (not a bypassed editor).
await page.goBack();await page.waitForTimeout(500);
assert.equal(page.url().startsWith('http://localhost:5173'),true);
assert.equal(await page.locator('.cover').count(),1,'coming back from the quiz without passing must show the cover, not the editor');
assert.equal(await page.locator('.cover').evaluate(el=>getComputedStyle(el).opacity),'1');

// 4) Gate active + quiz passed (sessionStorage key set by the quiz site): start enters the editor.
await page.goto('http://localhost:5173');await page.waitForTimeout(400);
await page.evaluate(()=>sessionStorage.setItem('triangle_art_quiz_passed','1'));
await forceGate();
await page.locator('.cover-start').click();await page.waitForTimeout(350);
assert.equal(await page.locator('.cover').count(),0,'a student who passed the quiz should go straight into the editor');
assert.equal(page.url(),'http://localhost:5173/');

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
console.log('PASS: dev skips the gate; unpassed -> quiz (Back returns to cover); passed -> editor; footer credit 12px below the artboard; PNG has no credit');
await browser.close();
