import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
// Verifies the GA4 wiring end-to-end without ever letting a request reach Google's servers:
// googletagmanager.com is aborted at the network layer regardless of what the app does.
// Part 1 runs against the real dev server (localhost) to prove analytics stays OFF there.
// Part 2 uses the analytics module's test-only override to exercise the "enabled" code path
// (script tag, both configs, every custom event, and the "no artwork data" rule) safely.
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
await page.route('**://www.googletagmanager.com/**',route=>route.abort());
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const gaRequests=[];page.on('request',r=>{if(r.url().includes('googletagmanager.com'))gaRequests.push(r.url());});

await page.goto('http://localhost:5173');await page.waitForTimeout(500);

// Part 1: real environment (dev server on localhost) — analytics must stay fully inert.
assert.equal(await page.evaluate(()=>document.querySelectorAll('script[src*="googletagmanager.com"]').length),0,'no gtag script tag on localhost');
assert.equal(gaRequests.length,0,'no network request to googletagmanager.com on localhost');
await page.getByRole('button',{name:'삼각형 추가',exact:true}).click();
await page.getByText('1개의 삼각형',{exact:true}).waitFor();
assert.equal(await page.evaluate(()=>typeof window.gtag),'undefined','gtag must not even exist on localhost (real code path, no override yet)');

// Part 2: force the "deployed production site" branch on for this same loaded page, via the
// module's test-only override — the app code itself is completely unaware of this.
await page.evaluate(async()=>{
  const mod=await import('/src/lib/analytics.ts');
  window.__ga=[];
  window.gtag=(...args)=>window.__ga.push(args);
  mod.__setAnalyticsTestOverride(true);
  mod.initializeAnalytics();
});
const scriptTags=await page.evaluate(()=>[...document.querySelectorAll('script[src*="googletagmanager.com"]')].map(s=>s.src));
assert.equal(scriptTags.length,1,'gtag.js must be loaded exactly once');
assert.ok(scriptTags[0].includes('id=G-DC7N6KQBG0'),'the loader script should reference a GA4 id');
let calls=await page.evaluate(()=>window.__ga);
assert.deepEqual(calls.map(c=>c[0]),['js','config','config'],'initializeAnalytics should call js once then config for each of the two properties');
const configIds=calls.filter(c=>c[0]==='config').map(c=>c[1]);
assert.deepEqual(configIds,['G-DC7N6KQBG0','G-5YW0T2C109']);
for(const c of calls.filter(x=>x[0]==='config')) assert.deepEqual(c[2],{allow_google_signals:false,allow_ad_personalization_signals:false});

// Calling initializeAnalytics again must not add a second script tag or a second set of configs.
await page.evaluate(async()=>{const mod=await import('/src/lib/analytics.ts');mod.initializeAnalytics();});
assert.equal(await page.evaluate(()=>document.querySelectorAll('script[src*="googletagmanager.com"]').length),1,'gtag.js still loaded exactly once after a second initializeAnalytics() call');

async function lastEvent(){return (await page.evaluate(()=>window.__ga)).filter(c=>c[0]==='event').at(-1);}

// triangle_created: button vs drag, and slider movement alone must not fire it.
await page.getByLabel('첫 번째 각 A').focus();
for(let i=0;i<5;i++) await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(50);
assert.equal(await lastEvent(),undefined,'moving the angle slider must not send triangle_created');

await page.getByRole('button',{name:'삼각형 추가',exact:true}).click();
await page.getByText('2개의 삼각형',{exact:true}).waitFor();
let ev=await lastEvent();
assert.equal(ev[1],'triangle_created');
assert.equal(ev[2].method,'button');
assert.ok(['acute','right','obtuse'].includes(ev[2].angle_type));
assert.equal(typeof ev[2].is_isosceles,'boolean');
assert.equal(typeof ev[2].is_equilateral,'boolean');
assert.equal(ev[2].mode,'free');
assert.deepEqual(ev[2].send_to,['G-DC7N6KQBG0','G-5YW0T2C109']);

const before=(await page.evaluate(()=>window.__ga)).length;
const preview=await page.locator('.preview-grab').boundingBox();
const board=await page.locator('.board-paper').boundingBox();
await page.mouse.move(preview.x+preview.width/2,preview.y+preview.height/2);await page.mouse.down();
await page.mouse.move(board.x+board.width/2,board.y+board.height/2,{steps:10});await page.mouse.up();
await page.getByText('3개의 삼각형',{exact:true}).waitFor();
const after=await page.evaluate(()=>window.__ga);
const newEvents=after.slice(before).filter(c=>c[0]==='event'&&c[1]==='triangle_created');
assert.equal(newEvents.length,1,'exactly one triangle_created for the drag-created triangle');
assert.equal(newEvents[0][2].method,'drag');

// mode_changed
await page.getByRole('button',{name:'교과서 활동',exact:true}).click();
ev=await lastEvent();assert.equal(ev[1],'mode_changed');assert.equal(ev[2].mode,'textbook');
const beforeSameMode=(await page.evaluate(()=>window.__ga)).length;
await page.getByRole('button',{name:'교과서 활동',exact:true}).click();
assert.equal((await page.evaluate(()=>window.__ga)).length,beforeSameMode,'re-clicking the already-active mode must not send another mode_changed');

// analysis_opened + analysis_filter_used
await page.getByRole('button',{name:'작품 분석',exact:true}).click();
ev=await lastEvent();assert.equal(ev[1],'analysis_opened');assert.equal(ev[2].triangle_count,3);
await page.getByRole('button',{name:/예각삼각형/}).click();
ev=await lastEvent();assert.equal(ev[1],'analysis_filter_used');assert.equal(ev[2].filter_type,'acute');
await page.getByRole('button',{name:'전체 보기',exact:true}).click();
const afterClearFilter=(await page.evaluate(()=>window.__ga)).length;
await page.getByRole('button',{name:'분석 닫기'}).click();
assert.equal((await page.evaluate(()=>window.__ga)).length,afterClearFilter,'closing the drawer must not itself send an event');

// artwork_exported
await page.getByRole('button',{name:'작품 저장',exact:true}).click();
const downloadEvent=page.waitForEvent('download');
await page.getByRole('button',{name:/작품만 저장/}).click();
await downloadEvent;
ev=await lastEvent();assert.equal(ev[1],'artwork_exported');assert.equal(ev[2].export_type,'artwork');assert.equal(ev[2].triangle_count,3);

// project_saved / project_loaded
await page.getByRole('button',{name:'더보기',exact:true}).click();
const jsonEvent=page.waitForEvent('download');
await page.getByRole('button',{name:'프로젝트 저장',exact:true}).click();
const jsonPath=await (await jsonEvent).path();
ev=await lastEvent();assert.equal(ev[1],'project_saved');
await page.locator('input[type=file]').setInputFiles(jsonPath);
await page.waitForTimeout(200);
ev=await lastEvent();assert.equal(ev[1],'project_loaded');

// help_opened
await page.getByRole('button',{name:'더보기',exact:true}).click();
await page.getByRole('button',{name:'사용방법',exact:true}).click();
ev=await lastEvent();assert.equal(ev[1],'help_opened');

// No event, ever, carries anything beyond small primitives — never triangle geometry, colors
// arrays, filenames or JSON content.
const finalCalls=(await page.evaluate(()=>window.__ga)).filter(c=>c[0]==='event');
const forbiddenKeys=['x','y','points','triangles','fill','geometry','json','filename','angleA','angleB'];
for(const c of finalCalls){
  const params=c[2]||{};
  for(const key of Object.keys(params)) assert.ok(!forbiddenKeys.includes(key),`event ${c[1]} must not include a "${key}" field`);
  for(const value of Object.values(params)) assert.ok(['string','number','boolean'].includes(typeof value)||Array.isArray(value),`event ${c[1]} params must stay primitive/simple, got ${typeof value}`);
}

// Exactly one attempted request (from the single script tag), and page.route aborted it
// before it ever reached Google — so no real analytics traffic was sent during this test.
assert.equal(gaRequests.length,1,'exactly one gtag.js request should have been attempted (and it was aborted, never reaching Google)');
assert.deepEqual(errors,[]);
console.log(`PASS: gtag.js loaded once, both GA4 properties configured with privacy flags, ${finalCalls.length} custom events fired correctly (triangle_created button/drag, slider silent, mode_changed dedup, analysis_opened/filter_used, artwork_exported, project_saved/loaded, help_opened), no artwork/geometry data leaked, zero real network requests, zero page errors`);
await browser.close();
