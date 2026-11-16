// The world of a night: the entities that live in it and how they are made.
// Nothing here decides what happens; it only builds things with their numbers.
import { CONFIG } from './config.js';

/** The lantern wick the player keeps alive. */
export function makePlayer() {
  return {
    x: CONFIG.world.width / 2,
    y: CONFIG.world.height / 2,
    vx: 0,
    vy: 0,
    radius: CONFIG.player.radius,
    health: CONFIG.player.health,
    invuln: 0,
    charge: 0,
    facing: 0,
    bob: 0,
  };
}

/** A hostile ember of one of the three kinds. */
export function makeEmber(kind, x, y, speed, rng) {
  const type = CONFIG.ember.types[kind];
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    speed,
    radius: type.radius,
    hp: type.hp,
    score: type.score,
    tint: type.tint,
    age: 0,
    wobble: rng.range(0, Math.PI * 2),
    drift: rng.range(0.6, 1.4),
    alive: true,
  };
}

/** A drifting mote of light: score, and a little charge for the core. */
export function makeMote(x, y, rng, beacon = false) {
  const spec = beacon ? CONFIG.mote.beacon : CONFIG.mote;
  return {
    x,
    y,
    vx: rng.range(-1, 1) * CONFIG.mote.driftSpeed,
    vy: rng.range(-1, 1) * CONFIG.mote.driftSpeed,
    radius: spec.radius,
    value: spec.value,
    chargeGain: spec.chargeGain,
    beacon,
    age: 0,
    life: beacon ? CONFIG.mote.beacon.lifetime : Infinity,
    bob: rng.range(0, Math.PI * 2),
    alive: true,
  };
}

/** A short-lived spark thrown off by a snuffed ember. */
export function makeSpark(x, y, angle, speed, tint) {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: CONFIG.spark.radius,
    life: CONFIG.spark.life,
    maxLife: CONFIG.spark.life,
    tint,
    alive: true,
  };
}

/** The expanding ring a core burst throws out. */
export function makeBurst(x, y) {
  return {
    x,
    y,
    radius: 0,
    max: CONFIG.core.burstRadius,
    life: CONFIG.core.burstLife,
    maxLife: CONFIG.core.burstLife,
    alive: true,
  };
}

/** How many of each ember a wave sends, and how fast they travel. */
export function wavePlan(wave, rng) {
  const plan = { cinders: 0, coals: 0, sparks: 0, speed: 1 };
  plan.cinders = Math.round(CONFIG.waves.cinderBase + (wave - 1) * CONFIG.waves.cinderGrowth);
  if (wave >= CONFIG.waves.coalEvery) plan.coals = Math.floor(wave / CONFIG.waves.coalEvery);
  if (wave >= CONFIG.waves.sparkFrom) plan.sparks = Math.floor((wave - 1) / 2);
  plan.speed = Math.pow(CONFIG.waves.speedGrowth, wave - 1);
  plan.gap = Math.max(CONFIG.waves.spawnGapFloor, CONFIG.waves.spawnGapBase - wave * 0.1);
  plan.moteGap = Math.max(CONFIG.waves.moteGapFloor, CONFIG.waves.moteGapBase - wave * 0.16);
  plan.beacon = wave >= 4 && rng.next() < 0.5;
  return plan;
}
