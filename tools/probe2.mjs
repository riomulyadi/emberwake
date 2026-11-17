import { Game } from '../game/src/game.js';
import { Rng } from '../game/src/rng.js';
import { stageShot } from '../game/src/shots.js';

const game = new Game(new Rng(31337));
stageShot('play', game);
const px = game.player.x, py = game.player.y;
const near = game.sparks.filter(s => Math.hypot(s.x-px, s.y-py) < 260);
console.log('sparks total:', game.sparks.length, '| within 260px of wick:', near.length);
const byTint = {};
for (const s of game.sparks) {
  const k = '#' + s.tint.toString(16).padStart(6,'0');
  byTint[k] = (byTint[k] || 0) + 1;
}
console.log('sparks by tint:', byTint);
const lives = game.sparks.map(s => s.life).sort((a,b)=>a-b);
console.log('spark life min/max:', lives[0]?.toFixed(3), lives[lives.length-1]?.toFixed(3));
console.log('sparks left of x=200:', game.sparks.filter(s => s.x < 200).length);
console.log('flashes:', game.flashes.map(f => `${f.x},${f.y}`).join(' '));
