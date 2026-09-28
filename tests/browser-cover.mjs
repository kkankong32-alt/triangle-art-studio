import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
// Cover/intro screen regression: visible on load, hides the editor from interaction/AX
// (inert) until started, the invisible start hotspot aligns with the image's own button by
// percentage at several viewport sizes, mouse/keyboard/touch all enter the editor, returning
// to the cover never erases the artwork, and intro_started fires exactly once per click.
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true});
await page.route('**://www.googletagmanager.com/**',route=>route.abort());
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:5173');await page.waitForTimeout(400);

// 1) Cover visible on initial load, fully opaque, sitting on top of (and marking inert) the
// editor underneath. The full-viewport overlay already makes the editor unclickable by pure
// stacking order; confirm a normal (non-forced) click on it is blocked/times out.
assert.equal(await page.locator('.cover').count(),1,'cover should be mounted on first load');
assert.equal(await page.locator('.cover').first().evaluate(el=>getComputedStyle(el).opacity),'1','cover should be fully visible, not mid-fade');
assert.equal(await page.locator('main').evaluate(el=>el.inert),true,'the editor <main> should be marked inert while the cover is showing');
let editorBlocked=false;
try{await page.locator('.add').click({timeout:1500});}catch{editorBlocked=true;}
assert.ok(editorBlocked,'the editor add-button must not be clickable while the cover overlay is on top');

// 2) The invisible hotspot must line up with the image's button by percentage, and stay
// aligned at several viewport sizes (desktop, wide desktop, tablet landscape).
async function checkAlignment(label){
  const frame=await page.locator('.cover-frame').boundingBox();
  const btn=await page.locator('.cover-start').boundingBox();
  const relLeft=(btn.x-frame.x)/frame.width*100, relTop=(btn.y-frame.y)/frame.height*100;
  const relW=btn.width/frame.width*100, relH=btn.height/frame.height*100;
  const ratio=frame.width/frame.height;
  assert.ok(Math.abs(ratio-1672/941)<0.01,`${label}: cover-frame should keep the image's exact aspect ratio, got ${ratio}`);
  assert.ok(Math.abs(relLeft-36.7)<0.3,`${label}: left% drifted (${relLeft})`);
  assert.ok(Math.abs(relTop-60.9)<0.3,`${label}: top% drifted (${relTop})`);
  assert.ok(Math.abs(relW-26.1)<0.3,`${label}: width% drifted (${relW})`);
  assert.ok(Math.abs(relH-11.2)<0.3,`${label}: height% drifted (${relH})`);
}
await checkAlignment('1440x900');
await page.setViewportSize({width:1920,height:1080});await page.waitForTimeout(150);await checkAlignment('1920x1080');
await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(150);await checkAlignment('tablet landscape 1024x768');
await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(150);

// 3) Force the "enabled" analytics path (see tests/browser-analytics.mjs for why) so we can
// verify intro_started fires exactly once, with the right params, on a real click.
await page.evaluate(async()=>{const mod=await import('/src/lib/analytics.ts');window.__ga=[];window.gtag=(...a)=>window.__ga.push(a);mod.__setAnalyticsTestOverride(true);});
await page.locator('.cover-start').click();
await page.waitForTimeout(350); // allow the fade-out transition + unmount
assert.equal(await page.locator('.cover').count(),0,'cover should be fully unmounted after the fade-out');
await page.getByRole('button',{name:'삼각형 추가',exact:true}).waitFor();
const gaEvents=(await page.evaluate(()=>window.__ga)).filter(c=>c[0]==='event');
assert.equal(gaEvents.length,1,'exactly one intro_started event should fire per click');
assert.equal(gaEvents[0][1],'intro_started');
assert.equal(gaEvents[0][2].source,'cover');
assert.deepEqual(gaEvents[0][2].send_to,['G-DC7N6KQBG0','G-5YW0T2C109']);

// 4) Make some artwork, return to the cover, and confirm nothing was erased.
await page.getByRole('button',{name:'삼각형 추가',exact:true}).click();
await page.getByText('1개의 삼각형',{exact:true}).waitFor();
await page.getByRole('button',{name:'더보기',exact:true}).click();
await page.getByRole('button',{name:'표지로 돌아가기',exact:true}).click();
assert.equal(await page.locator('.cover').count(),1,'"표지로 돌아가기" should bring the cover back');
assert.ok((await page.locator('.workspace-top h2').textContent()).includes('1개의 삼각형'),'returning to the cover must not clear the artwork underneath');
await page.locator('.cover-start').click();
await page.waitForTimeout(350);
await page.getByText('1개의 삼각형',{exact:true}).waitFor();

// 5) Keyboard: reload, Tab to the hotspot, Enter enters the editor.
await page.reload();await page.waitForTimeout(400);
await page.locator('.cover-start').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(350);
assert.equal(await page.locator('.cover').count(),0,'Enter on the focused hotspot should enter the editor');

// 6) Touch: reload, tap the hotspot.
await page.reload();await page.waitForTimeout(400);
const box=await page.locator('.cover-start').boundingBox();
await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
await page.waitForTimeout(350);
assert.equal(await page.locator('.cover').count(),0,'a tap on the hotspot should enter the editor');

assert.deepEqual(errors,[]);
console.log('PASS: cover visible+inert on load, hotspot aligns with the image button at 1440x900/1920x1080/tablet, mouse/keyboard/touch all enter the editor, "표지로 돌아가기" preserves artwork, intro_started fires exactly once with source:cover');
await browser.close();
