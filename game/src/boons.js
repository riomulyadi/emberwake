// The things a player can carry between waves: each one changes how the
// wick plays, and the player picks one of three after every wave they hold.
//
// Every boon is a small rule change, so none of them needs a new system to
// implement: they are read by the rules in game.js.
export const BOONS = [
  {
    id: 'wide-core',
    name: 'WIDE CORE',
    blurb: 'The burst reaches further.',
    detail: 'The core burst snuffs embers in a ring 30% wider.',
    apply(game) {
      game.boons.coreRadius = 1.3;
    },
  },
  {
    id: 'quick-hands',
    name: 'QUICK HANDS',
    blurb: 'The shield comes back sooner.',
    detail: 'The shield returns half a second sooner.',
    apply(game) {
      game.boons.shieldCooldown = 0.7;
    },
  },
  {
    id: 'deep-flame',
    name: 'DEEP FLAME',
    blurb: 'The core fills faster.',
    detail: 'The core fills a third faster, so the burst comes sooner.',
    apply(game) {
      game.boons.chargeRate = 1.34;
    },
  },
  {
    id: 'long-wick',
    name: 'LONG WICK',
    blurb: 'The wick reaches further.',
    detail: 'The wick is bigger, and gathers motes from further away.',
    apply(game) {
      game.boons.pickupRange = 1.6;
    },
  },
  {
    id: 'glass-core',
    name: 'GLASS CORE',
    blurb: 'The burst costs less.',
    detail: 'The core burst costs a third less charge.',
    apply(game) {
      game.boons.burstCost = 0.65;
    },
  },
  {
    id: 'cold-night',
    name: 'COLD NIGHT',
    blurb: 'The embers draw nearer.',
    detail: 'The embers chase a third more slowly, but score a third more.',
    apply(game) {
      game.boons.emberSpeed = 0.66;
      game.boons.emberScore = 1.35;
    },
  },
  {
    id: 'steady-hand',
    name: 'STEADY HAND',
    blurb: 'The wick holds its course.',
    detail: 'The wick keeps more of its speed when it turns.',
    apply(game) {
      game.boons.accel = 1.4;
    },
  },
  {
    id: 'second-wind',
    name: 'SECOND WIND',
    blurb: 'The wick is harder to put out.',
    detail: 'The wick survives one more hit.',
    apply(game) {
      game.player.maxHealth += 1;
      game.player.health += 1;
    },
  },
];

/**
 * Three boons to choose from, never the one already taken and never the
 * same one twice in a row.
 */
export function offerBoons(taken, rng, count = 3) {
  const pool = BOONS.filter((boon) => !taken.includes(boon.id));
  const choices = [];
  while (choices.length < count && pool.length > 0) {
    const index = rng.int(0, pool.length - 1);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}

/**
 * Take a boon: apply its rule change and remember it, so it is never
 * offered twice.
 */
export function takeBoon(game, boon) {
  if (!boon) return;
  boon.apply(game);
  game.takenBoons.push(boon.id);
  game.boonsChosen.push(boon.name);
}
