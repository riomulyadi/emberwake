// The scenes behind ?shot=start|play|end|dawn. Each one plays the real rules
// forward from a fresh night for a fixed number of steps, steered by a small
// autopilot, so the frame is what a short game really looks like and the same
// seed always gives the same frame.
import { CONFIG } from './config.js';

const STEP = 1 / 60;

/** A stand-in for the keyboard, so the autopilot can drive the real input path. */
function fakeInput(game, decision) {
  const held = new Set();
  if (decision.x > 0.25) held.add('KeyD');
  if (decision.x < -0.25) held.add('KeyA');
  if (decision.y > 0.25) held.add('KeyS');
  if (decision.y < -0.25) held.add('KeyW');
  const pressed = new Set();
  // Space restarts a night that has ended, so it only means "burst" while one
  // is still running.
  if (decision.burst && game.state === 'playing') pressed.add('Space');
  if (decision.shield && game.state === 'playing') pressed.add('ShiftLeft');
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
      if (mx !== 0 && my !== 0) {
        mx *= Math.SQRT1_2;
        my *= Math.SQRT1_2;
      }
      return { x: mx, y: my };
    },
  };
}

/** The ember nearest the wick, and how far away it is. */
function nearestEmber(game) {
  const player = game.player;
  let nearest = null;
  let distance = Infinity;
  for (const ember of game.embers) {
    const d = Math.hypot(ember.x - player.x, ember.y - player.y);
    if (d < distance) {
      distance = d;
      nearest = ember;
    }
  }
  return { nearest, distance };
}

/** The mote nearest the wick, and how far away it is. */
function nearestMote(game) {
  const player = game.player;
  let nearest = null;
  let distance = Infinity;
  for (const mote of game.motes) {
    const d = Math.hypot(mote.x - player.x, mote.y - player.y);
    if (d < distance) {
      distance = d;
      nearest = mote;
    }
  }
  return { nearest, distance };
}

/**
 * The careful pilot: it keeps away from what is close, chases the light, and
 * bursts when embers crowd in. It survives.
 */
function carefulPilot(game) {
  const player = game.player;
  const threat = nearestEmber(game);
  const light = nearestMote(game);
  let x = 0;
  let y = 0;
  if (threat.nearest && threat.distance < 190) {
    x = (player.x - threat.nearest.x) / threat.distance;
    y = (player.y - threat.nearest.y) / threat.distance;
  } else if (light.nearest) {
    x = (light.nearest.x - player.x) / light.distance;
    y = (light.nearest.y - player.y) / light.distance;
  }
  let burst = false;
  if (game.burstCooldown <= 0 && game.player.charge >= CONFIG.core.burstCost) {
    let close = 0;
    for (const ember of game.embers) {
      if (Math.hypot(ember.x - player.x, ember.y - player.y) < 190) close += 1;
    }
    burst = close >= 2;
  }
  return { x, y, burst, shield: false };
}

/**
 * The reckless pilot: it makes for the light and never looks out, so the
 * embers catch it and the night ends early.
 */
function recklessPilot(game) {
  const player = game.player;
  const light = nearestMote(game);
  let x = 0;
  let y = 0;
  if (light.nearest) {
    x = (light.nearest.x - player.x) / light.distance;
    y = (light.nearest.y - player.y) / light.distance;
  }
  return { x, y, burst: false, shield: false };
}

/**
 * Play the night forward and leave it in the state the shot names: start (the
 * title card), play (a night in progress), end (a night that ended badly) or
 * dawn (a night that held to the end).
 */
export function stageShot(name, game) {
  game.reset();
  if (name === 'start') {
    for (let index = 0; index < 240; index += 1) {
      game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
    }
    return;
  }
  game.start();
  if (name === 'play') {
    // Play on until the night shows what the game is: embers of more than one
    // kind closing in on the wick, with the combo up and the field full.
    let best = null;
    for (let index = 0; index < 300 * 60; index += 1) {
      game.step(STEP, fakeInput(game, carefulPilot(game)));
      if (game.state === 'gameover' || game.state === 'victory') break;
      if (game.state !== 'playing') continue;
      const kinds = new Set(game.embers.map((ember) => ember.kind));
      const close = game.embers.filter(
        (ember) => Math.hypot(ember.x - game.player.x, ember.y - game.player.y) < 340,
      ).length;
      const score = kinds.size * 100 + close * 12 + Math.min(6, game.multiplier) * 8;
      if (!best || score > best.score) best = { score, index };
      if (game.wave >= 5 && kinds.size >= 3 && close >= 4 && game.multiplier > 2) break;
    }
    // Fire the core, caught in the act, so the frame shows the burst ring and
    // the sparks it throws off.
    game.player.charge = CONFIG.core.maxCharge;
    game.tryBurst();
    game.shake = 5;
    for (let index = 0; index < 6; index += 1) {
      game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
    }
    return;
  }
  if (name === 'end') {
    // A night played badly: the wick goes out, and the loss screen holds.
    for (let index = 0; index < 400 * 60; index += 1) {
      game.step(STEP, fakeInput(game, recklessPilot(game)));
      if (game.state === 'gameover') break;
    }
    // Hold on the loss: the field settles and the message stays up.
    for (let index = 0; index < 40; index += 1) {
      game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
    }
    return;
  }
  // dawn: hold every wave.
  for (let index = 0; index < 900 * 60; index += 1) {
    game.step(STEP, fakeInput(game, carefulPilot(game)));
    if (game.state === 'victory') break;
  }
  for (let index = 0; index < 40; index += 1) {
    game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
  }
}
