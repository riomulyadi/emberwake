// Measure the staged play frame: where everything actually is, and what is
// hanging off the edge of the frame.
import { Game } from '../game/src/game.js';
import { Rng } from '../game/src/rng.js';
import { stageShot } from '../game/src/shots.js';
import { CONFIG } from '../game/src/config.js';

const game = new Game(new Rng(31337));
stageShot('play', game);
const W = CONFIG.world.width;
const H = CONFIG.world.height;

console.log('world', W, 'x', H, '| player at', Math.round(game.player.x), Math.round(game.player.y));
console.log('embers:', game.embers.length);
let clipped = 0;
for (const e of game.embers) {
  const m = e.radius;
  const off = e.x - m < 0 || e.y - m < 0 || e.x + m > W || e.y + m > H;
  if (off) clipped += 1;
  console.log(` ${e.kind.padEnd(7)} x=${Math.round(e.x)} y=${Math.round(e.y)} r=${e.radius}${off ? '  <-- CLIPPED' : ''}`);
}
console.log('clipped embers:', clipped);

const badMotes = game.motes.filter((m) => m.x < 0 || m.y < 0 || m.x > W || m.y > H);
console.log('motes:', game.motes.length, '| outside frame:', badMotes.length);
const badSparks = game.sparks.filter((s) => s.x < 0 || s.y < 0 || s.x > W || s.y > H);
console.log('sparks:', game.sparks.length, '| outside frame:', badSparks.length);
const badFlashes = game.flashes.filter((f) => f.x < 0 || f.y < 0 || f.x > W || f.y > H);
console.log('flashes:', game.flashes.length, '| outside frame:', badFlashes.length);
console.log('bursts:', game.bursts.length, '| shield up:', game.shieldTime > 0, '| health:', game.player.health);
