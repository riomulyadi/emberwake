// Find the seed whose night makes the best gameplay frame: several embers of
// more than one kind closing in on the wick, with the combo up.
//   node tools/seed.mjs
import { Game, STATE } from '../game/src/game.js';
import { Rng } from '../game/src/rng.js';

const STEP = 1 / 60;

function fakeInput(game, decision) {
  const held = new Set();
  if (decision.x > 0.25) held.add('KeyD');
  if (decision.x < -0.25) held.add('KeyA');
  if (decision.y > 0.25) held.add('KeyS');
  if (decision.y < -0.25) held.add('KeyW');
  const pressed = new Set();
  if (decision.burst && game.state === 'playing') pressed.add('Space');
  return {
    held,
    pressed,
    down(code) { return held.has(code); },
    hit(code) { return pressed.has(code); },
    moveVector() {
      let mx = 0;
      let my = 0;
      if (held.has('KeyA')) mx -= 1;
      if (held.has('KeyD')) mx += 1;
      if (held.has('KeyW')) my -= 1;
      if (held.has('KeyS')) my += 1;
      if (mx !== 0 && my !== 0) { mx *= Math.SQRT1_2; my *= Math.SQRT1_2; }
      return { x: mx, y: my };
    },
  };
}

function nearest(game, list) {
  let best = null;
  let distance = Infinity;
  for (const item of list) {
    const d = Math.hypot(item.x - game.player.x, item.y - game.player.y);
    if (d < distance) { distance = d; best = item; }
  }
  return { best, distance };
}

function pilot(game) {
  const threat = nearest(game, game.embers);
  const light = nearest(game, game.motes);
  let x = 0;
  let y = 0;
  if (threat.best && threat.distance < 190) {
    x = (game.player.x - threat.best.x) / threat.distance;
    y = (game.player.y - threat.best.y) / threat.distance;
  } else if (light.best) {
    x = (light.best.x - game.player.x) / light.distance;
    y = (light.best.y - game.player.y) / light.distance;
  }
  let burst = false;
  if (game.burstCooldown <= 0 && game.player.charge >= 30) {
    let close = 0;
    for (const ember of game.embers) {
      if (Math.hypot(ember.x - game.player.x, ember.y - game.player.y) < 190) close += 1;
    }
    burst = close >= 2;
  }
  return { x, y, burst };
}

for (const seed of [7, 11, 23, 101, 555, 2024, 90210, 123456, 31337, 4242]) {
  const game = new Game(new Rng(seed));
  game.start();
  let best = null;
  for (let index = 0; index < 300 * 60; index += 1) {
    game.step(STEP, fakeInput(game, pilot(game)));
    if (game.state === 'gameover' || game.state === 'victory') break;
    if (game.state !== 'playing') continue;
    const kinds = new Set(game.embers.map((ember) => ember.kind));
    const close = game.embers.filter(
      (ember) => Math.hypot(ember.x - game.player.x, ember.y - game.player.y) < 340,
    ).length;
    const score = kinds.size * 100 + close * 12 + Math.min(6, game.multiplier) * 8;
    if (!best || score > best.score) {
      best = {
        score, index, wave: game.wave, kinds: kinds.size,
        close, embers: game.embers.length, motes: game.motes.length,
        combo: Number(game.multiplier.toFixed(2)), score: game.score,
      };
    }
  }
  console.log(seed, JSON.stringify(best), 'final:', game.state, 'wave', game.wave);
}
