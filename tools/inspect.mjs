// Report what the staged scenes actually contain, so the frames can be judged on
// facts rather than on a guess from the pixels.
//   node tools/inspect.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:8099';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

for (const shot of ['start', 'play', 'end', 'dawn']) {
  await page.goto(`${base}/?shot=${shot}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.emberwakeReady === true, null, { timeout: 30000 });
  const info = await page.evaluate(() => {
    const game = window.emberwakeGame;
    if (!game) return { missing: true };
    return {
      state: game.state,
      wave: game.wave,
      score: game.score,
      health: game.player.health,
      charge: Math.round(game.player.charge),
      embers: game.embers.length,
      toSpawn: game.toSpawn,
      motes: game.motes.length,
      sparks: game.sparks.length,
      bursts: game.bursts.length,
      combo: Number(game.multiplier.toFixed(2)),
      stats: game.stats,
      emberKinds: game.embers.map((e) => e.kind),
      emberPositions: game.embers.map((e) => [Math.round(e.x), Math.round(e.y)]),
      playerPos: [Math.round(game.player.x), Math.round(game.player.y)],
    };
  });
  console.log(`--- ${shot} ---`);
  console.log(JSON.stringify(info));
}

if (errors.length) {
  console.log('ERRORS:');
  errors.forEach((line) => console.log('  ', line));
}
await browser.close();
