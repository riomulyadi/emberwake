// Play the night forward in Node and report how it goes, so the balance can be
// tuned without a browser in the loop.
//   node tools/balance.mjs
import { Game, STATE } from '../game/src/game.js';
import { Rng } from '../game/src/rng.js';
import { CONFIG } from '../game/src/config.js';

const STEP = 1 / 60;

function fakeInput(decision) {
  const held = new Set();
  if (decision.x > 0.25) held.add('KeyD');
  if (decision.x < -0.25) held.add('KeyA');
  if (decision.y > 0.25) held.add('KeyS');
  if (decision.y < -0.25) held.add('KeyW');
  const pressed = new Set();
  if (decision.burst) pressed.add('Space');
  if (decision.shield) pressed.add('ShiftLeft');
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

/** A pilot that dodges well and bursts only when it is worth it. */
function pilot(game, care) {
  const threat = nearest(game, game.embers);
  const light = nearest(game, game.motes);
  let x = 0;
  let y = 0;
  if (threat.best && threat.distance < care) {
    x = (game.player.x - threat.best.x) / threat.distance;
    y = (game.player.y - threat.best.y) / threat.distance;
  } else if (light.best) {
    x = (light.best.x - game.player.x) / light.distance;
    y = (light.best.y - game.player.y) / light.distance;
  }
  let burst = false;
  if (game.burstCooldown <= 0 && game.player.charge >= CONFIG.core.burstCost) {
    let close = 0;
    for (const ember of game.embers) {
      if (Math.hypot(ember.x - game.player.x, ember.y - game.player.y) < 190) close += 1;
    }
    burst = close >= 2;
  }
  return { x, y, burst };
}

/** Run one night and report what happened. */
function run(care, seed, maxSeconds = 900) {
  const game = new Game(new Rng(seed));
  game.start();
  const waveTimes = [];
  let lastWave = 1;
  let peakEmbers = 0;
  for (let step = 0; step < maxSeconds * 60; step += 1) {
    const decision = pilot(game, care);
    const pressed = new Set();
    if (decision.burst && game.state === 'playing') pressed.add('Space');
    game.step(STEP, {
      held: new Set(),
      pressed,
      down(code) { return false; },
      hit(code) { return pressed.has(code); },
      moveVector() {
        let mx = 0;
        let my = 0;
        if (decision.x > 0.25) mx += 1;
        if (decision.x < -0.25) mx -= 1;
        if (decision.y > 0.25) my += 1;
        if (decision.y < -0.25) my -= 1;
        if (mx !== 0 && my !== 0) { mx *= Math.SQRT1_2; my *= Math.SQRT1_2; }
        return { x: mx, y: my };
      },
    });
    peakEmbers = Math.max(peakEmbers, game.embers.length);
    if (game.wave !== lastWave) {
      waveTimes.push(`w${lastWave}@${(step / 60).toFixed(0)}s`);
      lastWave = game.wave;
    }
    if (game.state === STATE.GAMEOVER || game.state === STATE.VICTORY) break;
  }
  return {
    result: game.state,
    wave: game.wave,
    seconds: waveTimes.length ? waveTimes.join(' ') : 'no wave cleared',
    score: game.score,
    health: game.player.health,
    peakEmbers,
    stats: game.stats,
  };
}

console.log('careful pilot (dodges at 190px):');
for (const seed of [1, 7, 42, 20261117]) {
  console.log(' ', JSON.stringify(run(190, seed)));
}
console.log('reckless pilot (dodges at 60px):');
for (const seed of [1, 7, 42, 20261117]) {
  console.log(' ', JSON.stringify(run(60, seed)));
}
