// Tunable constants for Emberwake: every number the game balances on lives here.
export const CONFIG = {
  world: { width: 1280, height: 720 },
  player: {
    radius: 20, accel: 2200, maxSpeed: 330, drag: 0.86,
    health: 3, maxHealth: 3, invulnAfterHit: 1.7, hitKnockback: 260,
  },
  ember: {
    bobAmp: 48, bobRate: 1.9, chaseTurn: 1.6, spawnFade: 0.45, lungeSpeed: 1.45,
    types: {
      // The threats are cold: violet and magenta. The wick is the only warm
      // thing on the field, so the eye finds it and reads it as the threat
      // in one glance.
      cinder: { radius: 11, speed: 212, hp: 1, score: 10, splitInto: 0, tint: 0xb06cf0 },
      coal: { radius: 20, speed: 138, hp: 3, score: 34, splitInto: 2, tint: 0xe0457b },
      spark: { radius: 7, speed: 300, hp: 1, score: 16, splitInto: 0, tint: 0x8f6fff },
    },
  },
  mote: {
    radius: 5, pickupRadius: 26, magnetRadius: 120, magnetSpeed: 640,
    driftSpeed: 26, value: 5, chargeGain: 9,
    beacon: { radius: 9, value: 25, chargeGain: 60, lifetime: 9 },
  },
  spark: { radius: 9, life: 0.85, speed: 250, drag: 0.9 },
  core: {
    maxCharge: 100, chargePerSecond: 17, burstRadius: 230, burstCost: 30,
    burstCooldown: 0.45, burstLife: 0.42, pushSpeed: 620,
  },
  shield: { radius: 46, cooldown: 1.4, duration: 0.55, cost: 16 },
  score: { comboStep: 0.34, comboMax: 6, comboWindow: 2.8 },
  waves: {
    count: 8, bannerTime: 2.1, nextWaveDelay: 1.5,
    cinderBase: 3, cinderGrowth: 1.6, coalEvery: 2, sparkFrom: 2,
    speedGrowth: 1.07, spawnGapBase: 1.2, spawnGapFloor: 0.26,
    moteEvery: 2.2, moteGapBase: 2.6, moteGapFloor: 1.1,
    // How long a wave lasts, in seconds, and how it shortens as the night goes on.
    durationBase: 46, durationFall: 2.6, durationFloor: 26, clearBonus: 120,
  },
  palette: {
    void: '#0a0713',
    voidDeep: '#05030a',
    haze: '#171033',
    // The wick's own light: hot and warm, the one warm thing on the field.
    emberCore: '#fff1cf',
    emberMid: '#ffb347',
    emberEdge: '#e0457b',
    playerCore: '#ffd88a',
    playerEdge: '#c2410c',
    mote: '#ffe27a',
    beacon: '#c9a6ff',
    spark: '#b6f0ff',
    shield: '#6ee7ff',
    danger: '#ff4d6d',
    ink: '#f4e9ff',
    dim: '#8d7fae',
    good: '#7ef2a8',
  },
};
