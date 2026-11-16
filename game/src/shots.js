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
  // The choice between waves is answered with the first key.
  if (game.state === 'choosing') pressed.add('Digit1');
  return {
    held,
    pressed,
    down(code) { return held.has(code); },
    hit(code) { return pressed.has(code); },
    // The autopilot steers by the vector it wants, which the keyboard can only
    // approximate: the held keys are for the human player, the vector is what
    // the scripted frames use.
    moveVector() {
      if (decision.vector) return decision.vector;
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
  // A careful player raises the shield when something is right on top of it
  // and there is not enough charge left to burst.
  let shield = false;
  if (
    !burst &&
    game.shieldCooldown <= 0 &&
    game.player.charge >= CONFIG.shield.cost &&
    threat.nearest &&
    threat.distance < 110
  ) {
    shield = true;
  }
  return { x, y, burst, shield, vector: { x, y } };
}

/**
 * The choice between waves is answered by the pilot: it always takes the
 * first offer, so a scripted night runs to its end.
 */
function chooseBoon(game) {
  if (game.state !== 'choosing') return;
  game.chooseBoon(0);
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
  return { x, y, burst: false, shield: false, vector: { x, y } };
}

/**
 * Play the night forward and leave it in the state the shot names: start (the
 * title card), play (a night in progress), end (a night that ended badly) or
 * dawn (a night that held to the end).
 */
export function stageShot(name, game) {
  game.reset();
  if (name === 'start') {
    // The title card, with the night already stirring behind it.
    for (let index = 0; index < 240; index += 1) {
      game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
    }
    return;
  }
  if (name === 'title') {
    // The title card, with the field already alive behind it, so the sheet
    // shows where a night begins as well as where it ends.
    game.start();
    for (let index = 0; index < 900 * 60; index += 1) {
      game.step(STEP, fakeInput(game, carefulPilot(game)));
      if (game.state === 'gameover' || game.state === 'victory') break;
      if (game.wave >= 2 && game.embers.length >= 4) break;
    }
    game.state = 'title';
    return;
  }
  if (name === 'choice') {
    // The choice between waves: the three boons on offer, waiting.
    game.start();
    for (let index = 0; index < 900 * 60; index += 1) {
      game.step(STEP, fakeInput(game, carefulPilot(game)));
      if (game.state === 'choosing') break;
      if (game.state === 'gameover' || game.state === 'victory') break;
    }
    return;
  }
  if (name === 'dawn') {
    // A night the wick held to the end.
    game.start();
    for (let index = 0; index < 900 * 60; index += 1) {
      game.step(STEP, fakeInput(game, carefulPilot(game)));
      if (game.state === 'victory') break;
    }
    for (let index = 0; index < 40; index += 1) {
      game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
    }
    return;
  }
  game.start();
  if (name === 'play' || name === 'end') {
    // One night, played two ways. The play frame stops it while it is still
    // going; the loss card carries the same night on until the wick goes
    // out. The night is deterministic, so the best moment is found in one
    // pass and then played again exactly, up to that frame.
    let best = null;
    let frame = 0;
    for (; frame < 400 * 60; frame += 1) {
      const hadShield = game.shieldTime > 0;
      game.step(STEP, fakeInput(game, carefulPilot(game)));
      if (game.state === 'gameover' || game.state === 'victory') break;
      if (game.state !== 'playing' || game.wave < 7) continue;
      const kinds = new Set(game.embers.map((ember) => ember.kind));
      const close = game.embers.filter(
        (ember) => Math.hypot(ember.x - game.player.x, ember.y - game.player.y) < 260,
      ).length;
      let score = kinds.size * 100 + close * 40 + Math.min(7, game.multiplier) * 15;
      // The frame where the shield is up and the embers are on the wick is
      // the one worth showing: it is the game under pressure.
      if (hadShield && close >= 2) score += 900;
      if (!best || score > best.score) best = { score, frame };
      if (hadShield && close >= 2 && kinds.size >= 2) {
        best = { score: score + 1000, frame };
        break;
      }
    }
    const chosen = best ? best.frame : frame;

    if (name === 'end') {
      // The same night, carried on: careful play until the seventh wave,
      // then a slip, and the wick goes out on that wave.
      for (let index = 0; index < 400 * 60; index += 1) {
        const decision = game.wave >= 7 ? recklessPilot(game) : carefulPilot(game);
        game.step(STEP, fakeInput(game, decision));
        if (game.state === 'gameover' || game.state === 'victory') break;
      }
      // The night ends on the seventh wave, whatever the pilot managed.
      if (game.state !== 'gameover') {
        game.wave = 7;
        game.state = 'playing';
        game.player.health = 1;
        game.player.invuln = 0;
        game.hitPlayer({ x: game.player.x + game.player.radius, y: game.player.y, radius: 12 });
      }
      // Hold on the loss: the field settles and the message stays up.
      for (let index = 0; index < 40; index += 1) {
        game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
      }
      return;
    }

    // Play that night again, to the frame that was chosen.
    game.reset();
    game.start();
    for (let index = 0; index < chosen; index += 1) {
      game.step(STEP, fakeInput(game, carefulPilot(game)));
    }
    // Raise the shield, caught in the act: the embers are on the wick, the
    // shield is lit, and the core is spent from holding it up.
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.charge = CONFIG.shield.cost + 6;
    game.tryShield();
    game.shake = 4;
    for (let index = 0; index < 8; index += 1) {
      game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
    }
    // Pull the embers in around the wick, so the frame shows the night at
    // its throat: two on the rim of the shield and the rest closing in.
    // The wick is moved first, off-centre, so the frame is composed around
    // the fight rather than around a still centre.
    game.player.x = CONFIG.world.width / 2 + 150;
    game.player.y = CONFIG.world.height / 2 - 60;
    const near = game.embers
      .map((ember) => ({
        ember,
        distance: Math.hypot(ember.x - game.player.x, ember.y - game.player.y),
      }))
      .sort((a, b) => a.distance - b.distance);
    near.slice(0, 6).forEach(({ ember }, index) => {
      const angle = Math.atan2(ember.y - game.player.y, ember.x - game.player.x);
      // The first two sit on the shield; the rest close in behind them.
      const wanted = index < 2
        ? CONFIG.shield.radius - ember.radius - 2
        : CONFIG.shield.radius + 52 + index * 26;
      ember.x = game.player.x + Math.cos(angle) * wanted;
      ember.y = game.player.y + Math.sin(angle) * wanted;
    });
    // The motes and the sparks follow the wick, so the field still reads as
    // one place rather than a set of parts.
    const shiftX = game.player.x - CONFIG.world.width / 2;
    const shiftY = game.player.y - CONFIG.world.height / 2;
    for (const mote of game.motes) {
      mote.x -= shiftX;
      mote.y -= shiftY;
    }
    return;
  }
}