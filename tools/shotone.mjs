// Take one staged screenshot by name.
//   node tools/shotone.mjs <shot> <outfile> [baseUrl]
import { chromium } from 'playwright';

const shot = process.argv[2];
const out = process.argv[3];
const base = process.argv[4] ?? 'http://127.0.0.1:8099';
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${base}/?shot=${shot}&seed=31337`, { waitUntil: 'load' });
await page.waitForFunction(() => window.emberwakeReady === true, null, { timeout: 90000 });
await page.waitForTimeout(300);
const canvas = await page.$('#game');
const buffer = await canvas.screenshot({ type: 'jpeg', quality: 88 });
const { writeFileSync } = await import('node:fs');
writeFileSync(out, buffer);
console.log('wrote', out, buffer.length, 'bytes', errors.length ? errors : '(no errors)');
await browser.close();
