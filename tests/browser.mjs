import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_CHROME_PATH});
const page=await browser.newPage();
page.setDefaultTimeout(10000);
await mkdir('test-results',{recursive:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:3000/?utm_source=qa&utm_campaign=sala404');
await page.getByRole('button',{name:'Só essenciais'}).click();
for(const [width,height] of [[390,844],[393,852],[430,932],[1440,1000]]){await page.setViewportSize({width,height});await page.screenshot({path:`test-results/${width}.png`,fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`horizontal overflow at ${width}`);}
await page.setViewportSize({width:390,height:844});
await page.locator('.header-entry').click();
for(let i=0;i<4;i++){await page.locator('.quiz-option').first().click();await page.locator('.quiz-top').getByText(`${i+2} DE 6`,{exact:true}).waitFor();}
await page.getByLabel('Nome e sobrenome').fill('Pessoa Teste');
await page.getByRole('button',{name:/^CONTINUAR/}).click();
await page.getByLabel('WhatsApp com DDD').fill('11999991234');
assert.equal(await page.getByLabel('WhatsApp com DDD').inputValue(),'(11) 99999-1234');
await page.locator('.consent input').check();
await page.getByRole('button',{name:/^QUERO ENTRAR NA SALA 404/}).click();
await page.locator('.error').waitFor();
assert.match(await page.locator('.error').innerText(),/temporariamente indisponível/);
assert.equal(await page.getByLabel('WhatsApp com DDD').inputValue(),'(11) 99999-1234');
// Local mock only: proves success UI without creating a real lead or message.
await page.route('**/api/leads',async route=>{const payload=route.request().postDataJSON();assert.equal(payload.attribution.utm_source,'qa');assert.equal(payload.marketing_consent,false);assert.equal(payload.answers.length,4);await route.fulfill({json:{whatsappUrl:'https://chat.whatsapp.com/LOCAL_TEST_ONLY',isNew:true,eventId:'local-test'}})});
await page.getByRole('button',{name:/^QUERO ENTRAR NA SALA 404/}).click();
await page.getByRole('heading',{name:'PORTA LIBERADA.'}).waitFor();
assert.equal(await page.getByRole('link',{name:'ENTRAR NO WHATSAPP'}).getAttribute('href'),'https://chat.whatsapp.com/LOCAL_TEST_ONLY');
await page.screenshot({path:'test-results/success-mobile.png'});
assert.deepEqual(errors,[]);
await browser.close();
console.log('PASS: four viewports, quiz, mask, attribution, real failure preservation and mocked success; no browser errors.');


