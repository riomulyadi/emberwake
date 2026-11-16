// Play the game for real in a browser: start it, play it, take a boon,
// and check nothing stalls and no page error is thrown.
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:8099';
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(600);

// Start the night.
await page.keyboard.press('Space');
await page.waitForTimeout(400);
let state = await page.evaluate(() => window.emberwakeGame.state);
console.log('after Space:', state);

// Play for a while, steering and using the abilities, and answer any boon
// choice with the number keys.
const keys = ['KeyW', 'KeyD', 'KeyS', 'KeyA'];
for (let round = 0; round < 400; round += 1) {
  const key = keys[round % keys.length];
  await page.keyboard.down(key);
  await page.waitForTimeout(220);
  await page.keyboard.up(key);
  if (round % 12 === 0) await page.keyboard.press('Space');
  if (round % 11 === 0) await page.keyboard.press('ShiftLeft');
  const current = await page.evaluate(() => window.emberwakeGame.state);
  if (current === 'choosing') {
    await page.keyboard.press('Digit1');
    console.log('took a boon at round', round);
  }
  if (current === 'gameover' || current === 'victory') {
    console.log('run ended at round', round, '->', current);
    break;
  }
}

const summary = await page.evaluate(() => {
  const g = window.emberwakeGame;
  return {
    state: g.state,
    wave: g.wave,
    score: g.score,
    health: g.player.health,
    boons: g.boonsChosen,
    taken: g.takenBoons,
    offers: g.offers.length,
    embers: g.embers.length,
  };
});
console.log('summary:', JSON.stringify(summary));
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
