// Probe the staged play frame: what is actually on it, in numbers.
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:8099';
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${base}/?shot=play`, { waitUntil: 'load' });
await page.waitForFunction(() => window.emberwakeReady === true, null, { timeout: 20000 });
const state = await page.evaluate(() => {
  const g = window.emberwakeGame;
  return {
    state: g.state,
    wave: g.wave,
    bursts: g.bursts.map((b) => ({ r: Math.round(b.radius), life: +(b.life / b.maxLife).toFixed(2) })),
    flashes: g.flashes.map((f) => ({ r: Math.round(f.radius), life: +(f.life / f.maxLife).toFixed(2) })),
    sparks: g.sparks.length,
    sparkR: g.sparks.map((s) => Math.round(Math.hypot(s.x - g.player.x, s.y - g.player.y))),
    player: { x: Math.round(g.player.x), y: Math.round(g.player.y), r: g.player.radius },
    embers: g.embers.length,
    emberDist: g.embers.map((e) => Math.round(Math.hypot(e.x - g.player.x, e.y - g.player.y))).sort((a, b) => a - b),
    emberKinds: g.embers.map((e) => e.kind),
    shieldTime: +g.shieldTime.toFixed(2),
    charge: Math.round(g.player.charge),
  };
});
console.log(JSON.stringify(state, null, 1));
await browser.close();
