import { Game } from '../game/src/game.js';
import { Rng } from '../game/src/rng.js';
import { stageShot } from '../game/src/shots.js';
for (const name of ['play', 'burst', 'end', 'choice']) {
  const game = new Game(new Rng(31337));
  stageShot(name, game);
  console.log(name.padEnd(7), '| state', String(game.state).padEnd(9), '| wave', game.wave, '| score', game.score, '| embers', game.embers.length, '| bursts', game.bursts.length);
}
