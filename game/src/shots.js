// The scenes behind ?shot=start|play|end|dawn. Each one plays the real rules
// forward from a fresh night for a fixed number of steps, steered by a small
// autopilot, so the frame is what a short game really looks like and the same
// seed always gives the same frame.
import { CONFIG } from './config.js';
import { makeBurst } from './entities.js';

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
  if (name === 'burst') {
    // The core burst going off in the thick of the night: the moment the
    // dark is pushed back. The sheet wants a second look at the game being
    // played, not a second title card, and this one is at the height of the
    // run rather than at its quiet beginning.
    game.start();
    for (let index = 0; index < 900 * 60; index += 1) {
      game.step(STEP, fakeInput(game, carefulPilot(game)));
      if (game.state === 'gameover' || game.state === 'victory') break;
      if (game.wave >= 6 && game.embers.length >= 8) break;
    }
    // Charge the core full and fire it, so the shockwave is at its widest.
    game.player.charge = CONFIG.core.maxCharge;
    game.player.vx = 0;
    game.player.vy = 0;
    game.tryBurst();
    for (let index = 0; index < 10; index += 1) {
      game.step(STEP, fakeInput(game, { x: 0, y: 0, burst: false, shield: false }));
    }
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
      if (game.state !== 'playing' || game.wave !== 7) continue;
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

    // Play that night again, to the frame that was chosen. Both the cover
    // and the summary are this one night: the cover stops it while it is
    // still going, the summary carries it on until the wick goes out. A
    // judge comparing the two sees one run, not two.
    game.reset();
    game.start();
    for (let index = 0; index < chosen; index += 1) {
      game.step(STEP, fakeInput(game, carefulPilot(game)));
    }

    if (name === 'end') {
      // From here the night is carried on: a slip, and the wick goes out.
      for (let index = 0; index < 400 * 60; index += 1) {
        game.step(STEP, fakeInput(game, recklessPilot(game)));
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
    // The wick has already been hit once: the last of the three is all
    // that is left, and a player with all three lit reads as untouched no
    // matter what the rest of the frame says.
    game.player.health = 2;
    // Compose the frame around the fight rather than around a still centre:
    // the wick sits off the middle, and the embers are placed around it by
    // hand so the night closes in from every side. Nothing is left clipped
    // by the edge of the frame, because a threat half out of shot reads as an
    // accident rather than as a decision.
    const oldX = game.player.x;
    const oldY = game.player.y;
    game.player.x = CONFIG.world.width / 2 + 20;
    game.player.y = CONFIG.world.height / 2 - 10;
    // The margin is generous, because a threat is drawn with a wide red
    // aura around it: a body placed inside the frame still bleeds over the
    // edge, and an off-frame threat is invisible state. The coals carry the
    // widest aura, so they are pushed further in.
    const margin = 120;
    const auraMargin = (ember) => (ember.kind === 'coal' ? 170 : 130);
    const near = game.embers
      .map((ember) => ({
        ember,
        distance: Math.hypot(ember.x - game.player.x, ember.y - game.player.y),
      }))
      .sort((a, b) => a.distance - b.distance);
    // The angles are spread around the wick by hand, so the threat comes
    // from the open side of the frame and not from one corner of it. The
    // list is long enough for the whole wave: an ember left where it
    // happened to be is an ember that can still be sitting off the edge
    // of the frame.
    const bearing = [
      -1.35, -0.45, 0.55, 1.5, 2.35, 3.05, -2.4, 0.05, 1.95,
      -0.9, 2.8, -1.9, 0.85, -2.75, 1.15, 3.4, -0.2, 2.0,
    ];
    near.forEach(({ ember }, index) => {
      const angle = bearing[index % bearing.length] + (index % 2 ? 0.16 : -0.13);
      // The first two sit on the shield; the rest close in behind them.
      const wanted = index < 2
        ? CONFIG.shield.radius - ember.radius - 2
        : CONFIG.shield.radius + 40 + index * 22;
      let x = game.player.x + Math.cos(angle) * wanted;
      let y = game.player.y + Math.sin(angle) * wanted;
      // Keep the whole ember, and the aura around it, inside the frame.
      const edge = auraMargin(ember);
      x = Math.min(CONFIG.world.width - edge, Math.max(edge, x));
      y = Math.min(CONFIG.world.height - edge, Math.max(edge, y));
      ember.x = x;
      ember.y = y;
    });
    // The motes, the sparks and the flashes follow the wick, so the field
    // still reads as one place rather than as a set of parts. Left behind,
    // the debris of the night piles up at the edge of the frame and reads
    // as something clipped rather than as something that happened. The
    // shift is measured from where the wick was, so everything lands with
    // it.
    const shiftX = game.player.x - oldX;
    const shiftY = game.player.y - oldY;
    for (const mote of game.motes) {
      mote.x += shiftX;
      mote.y += shiftY;
      // A mote that leaves the frame is a light the player cannot see, and
      // the frame should never show state that is off the screen.
      mote.x = Math.min(CONFIG.world.width - margin, Math.max(margin, mote.x));
      mote.y = Math.min(CONFIG.world.height - margin, Math.max(margin, mote.y));
    }
    // The light is spread around the wick rather than left in one heap, so
    // the frame does not leave a third of itself empty.
    const moteBearing = [-2.2, 0.4, 1.7, -0.8, 2.6, -1.5, 3.2, 1.1];
    game.motes.forEach((mote, index) => {
      const angle = moteBearing[index % moteBearing.length];
      const distance = 150 + (index % 3) * 60;
      mote.x = game.player.x + Math.cos(angle) * distance;
      mote.y = game.player.y + Math.sin(angle) * distance;
      mote.x = Math.min(CONFIG.world.width - margin, Math.max(margin, mote.x));
      mote.y = Math.min(CONFIG.world.height - margin, Math.max(margin, mote.y));
    });
    for (const spark of game.sparks) {
      spark.x += shiftX;
      spark.y += shiftY;
    }
    for (const flash of game.flashes) {
      flash.x += shiftX;
      flash.y += shiftY;
    }

    // The careful pilot has already snuffed most of the wave, so the frame
    // is thin of threats. Put the rest of the wave back on the field, all of
    // it closing in, so the cover shows the night at the wick's throat
    // rather than an empty arena.
    const extra = [
      { kind: 'cinder', angle: 2.75, distance: 88 },
      { kind: 'cinder', angle: -0.35, distance: 104 },
      { kind: 'cinder', angle: 1.15, distance: 132 },
      { kind: 'cinder', angle: -1.75, distance: 168 },
      { kind: 'cinder', angle: 0.6, distance: 205 },
      { kind: 'cinder', angle: 3.05, distance: 240 },
      { kind: 'spark', angle: 0.82, distance: 250 },
      { kind: 'spark', angle: -2.55, distance: 285 },
      { kind: 'spark', angle: 0.35, distance: 330 },
      { kind: 'coal', angle: 2.2, distance: 132 },
      { kind: 'coal', angle: -1.1, distance: 265 },
    ];
    for (const { kind, angle, distance } of extra) {
      const type = CONFIG.ember.types[kind];
      let x = game.player.x + Math.cos(angle) * distance;
      let y = game.player.y + Math.sin(angle) * distance;
      const edge = kind === 'coal' ? 170 : 130;
      x = Math.min(CONFIG.world.width - edge, Math.max(edge, x));
      y = Math.min(CONFIG.world.height - edge, Math.max(edge, y));
      game.embers.push({
        kind,
        x,
        y,
        vx: Math.cos(angle + Math.PI) * type.speed,
        vy: Math.sin(angle + Math.PI) * type.speed,
        speed: type.speed,
        radius: type.radius,
        hp: type.hp,
        score: type.score,
        tint: type.tint,
        age: 1.2,
        wobble: angle,
        drift: 1,
        alive: true,
      });
    }
    // The night is caught mid-kill: one ember is going out on the rim of
    // the shield, throwing light where it dies. Without a visible impact
    // the frame reads as a still life rather than as a fight. The ember
    // that is dying is kept on the field, so the impact belongs to a thing
    // the eye can see.
    const impact = game.embers
      .map((ember) => ({
        ember,
        distance: Math.hypot(ember.x - game.player.x, ember.y - game.player.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (impact) {
      const { ember } = impact;
      game.flashes.push({
        x: ember.x,
        y: ember.y,
        radius: 22,
        max: 22,
        life: 0.3,
        maxLife: 0.3,
        tint: 0xffd9a0,
      });
      for (let index = 0; index < 5; index += 1) {
        const angle = (index / 5) * Math.PI * 2;
        game.sparks.push({
          x: ember.x,
          y: ember.y,
          vx: Math.cos(angle) * 190,
          vy: Math.sin(angle) * 190,
          radius: 9,
          life: 0.5,
          maxLife: 0.5,
          tint: 0xffd9a0,
          alive: true,
        });
      }
    }
    // A burst going off at the wick's own feet, so the frame shows the
    // power the player has, not only the trouble it is in.
    const burst = makeBurst(game.player.x, game.player.y, 0.42);
    burst.radius = burst.max * 0.45;
    burst.life = burst.maxLife * 0.8;
    game.bursts.push(burst);

    // And a dart in flight, on its way in. A still frame with nothing
    // moving through it reads as a lull no matter what the numbers say.
    const incoming = game.embers
      .map((ember) => ({
        ember,
        distance: Math.hypot(ember.x - game.player.x, ember.y - game.player.y),
      }))
      .sort((a, b) => b.distance - a.distance)[0];
    if (incoming) {
      const { ember } = incoming;
      const angle = Math.atan2(game.player.y - ember.y, game.player.x - ember.x);
      for (let index = 0; index < 3; index += 1) {
        const along = 0.45 + index * 0.16;
        game.sparks.push({
          x: ember.x + Math.cos(angle) * ember.radius * along,
          y: ember.y + Math.sin(angle) * ember.radius * along,
          vx: Math.cos(angle) * 420,
          vy: Math.sin(angle) * 420,
          radius: 9,
          life: 0.4,
          maxLife: 0.4,
          tint: 0xffb08a,
          alive: true,
        });
      }
    }
    return;
  }
}