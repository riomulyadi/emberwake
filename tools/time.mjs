// Time the staged shots without a browser, so the shot staging can be tuned
// quickly.   node tools/time.mjs
import { Game } from '../game/src/game.js';
import { Rng } from '../game/src/rng.js';
import { stageShot } from '../game/src/shots.js';

for (const name of ['start', 'play', 'end', 'dawn']) {
  const game = new Game(new Rng(31337));
  const began = Date.now();
  stageShot(name, game);
  const took = Date.now() - began;
  console.log(
    name.padEnd(6),
    String(took).padStart(6) + 'ms',
    '| state', game.state,
    '| wave', game.wave,
    '| score', game.score,
    '| embers', game.embers.length,
    '| snuffed', game.stats.embers,
    '| motes', game.stats.motes,
  );
}
