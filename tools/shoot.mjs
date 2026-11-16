// Drive Emberwake in a real Chrome and take its screenshots.
//   node tools/shoot.mjs [baseUrl] [outDir]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:8099';
const outDir = process.argv[3] ?? 'screenshots';
mkdirSync(outDir, { recursive: true });

const SHOTS = [
  { name: '1-play.jpg', shot: 'play' },
  { name: '2-start.jpg', shot: 'start' },
  { name: '3-end.jpg', shot: 'end' },
  { name: '4-dawn.jpg', shot: 'dawn' },
];

const browser = await chromium.launch({
  args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

for (const shot of SHOTS) {
  await page.goto(`${base}/?shot=${shot.shot}&seed=7`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.emberwakeReady === true, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  const canvas = await page.$('#game');
  const buffer = await canvas.screenshot({ type: 'jpeg', quality: 88 });
  writeFileSync(`${outDir}/${shot.name}`, buffer);
  console.log('shot', shot.name, buffer.length, 'bytes');
}

// A live run, to check the game actually plays and the console stays clean.
await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(600);
await page.keyboard.press('Space');
for (const key of ['KeyW', 'KeyD', 'KeyS', 'KeyA']) {
  await page.keyboard.down(key);
  await page.waitForTimeout(500);
  await page.keyboard.up(key);
}
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
const live = await page.evaluate(() => ({
  score: document.getElementById('status')?.textContent ?? '',
  canvasSize: (() => { const c = document.getElementById('game'); return c ? `${c.width}x${c.height}` : 'none'; })(),
}));
console.log('live status:', live.status ?? live.score);

if (errors.length) {
  console.log('CONSOLE ERRORS:');
  errors.forEach((line) => console.log('  ', line));
} else {
  console.log('no console errors');
}
await browser.close();
