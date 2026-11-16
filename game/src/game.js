// The rule layer of Emberwake: what the night does to the player, and what the
// player does back. The renderer only draws the state this file leaves behind.
import { CONFIG } from './config.js';
import { makeEmber, makeMote, makeSpark, makeBurst, makePlayer, wavePlan } from './entities.js';

const STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  WAVE_BREAK: 'break',
  GAMEOVER: 'gameover',
  VICTORY: 'victory',
};

/** One night of Emberwake: the player, the night, and everything in it. */
export class Game {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  /** Start the night over, from wave one, with a fresh player. */
  reset() {
    this.state = STATE.TITLE;
    this.player = makePlayer();
    this.embers = [];
    this.motes = [];
    this.sparks = [];
    this.bursts = [];
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.wave = 0;
    this.wavePlan = null;
    this.waveTimer = 0;
    this.waveLength = 0;
    this.waveClock = 0;
    this.toSpawn = 0;
    this.spawnTimer = 0;
    this.moteTimer = 0;
    this.banner = '';
    this.bannerTimer = 0;
    this.burstCooldown = 0;
    this.shieldCooldown = 0;
    this.shieldTime = 0;
    this.shake = 0;
    this.flash = 0;
    this.time = 0;
    this.stats = { embers: 0, motes: 0, bestCombo: 0, waves: 0 };
    this.message = 'Hold the light until dawn.';
  }

  /** Begin the night: wave one, and the player at the centre of the dark. */
  start() {
    this.reset();
    this.state = STATE.PLAYING;
    this.beginWave(1);
    this.message = 'Wave 1 — the embers stir.';
  }

  /** Set up a wave: its plan, its banner and its first spawn. */
  beginWave(number) {
    this.wave = number;
    this.wavePlan = wavePlan(number, this.rng);
    this.waveLength = Math.max(
      CONFIG.waves.durationFloor,
      CONFIG.waves.durationBase - (number - 1) * CONFIG.waves.durationFall,
    );
    this.waveClock = 0;
    this.spawnTimer = 0.6;
    this.moteTimer = 1.4;
    this.toSpawn = this.wavePlan.cinders + this.wavePlan.coals + this.wavePlan.sparks;
    this.banner = number === 1 ? 'Wave 1' : `Wave ${number}`;
    this.bannerTimer = CONFIG.waves.bannerTime;
  }

  /** The multiplier the current combo carries, from 1 up to the cap. */
  get multiplier() {
    return 1 + this.combo;
  }

  /** Add score, scaled by the combo, and keep the combo alive. */
  addScore(base) {
    const gained = Math.round(base * this.multiplier);
    this.score += gained;
    this.stats.embers += 1;
    if (this.multiplier > this.stats.bestCombo) this.stats.bestCombo = this.multiplier;
    this.combo = Math.min(CONFIG.score.comboMax, this.combo + CONFIG.score.comboStep);
    this.comboTimer = CONFIG.score.comboWindow;
    return gained;
  }

  /** Spend charge if there is enough; returns true when it was spent. */
  spend(amount) {
    if (this.player.charge < amount) return false;
    this.player.charge -= amount;
    return true;
  }

  /** Fire the core burst: a ring that snuffs embers and shoves the rest. */
  tryBurst() {
    if (this.burstCooldown > 0) return false;
    if (!this.spend(CONFIG.core.burstCost)) return false;
    this.burstCooldown = CONFIG.core.burstCooldown;
    this.bursts.push(makeBurst(this.player.x, this.player.y));
    this.shake = Math.max(this.shake, 6);
    this.flash = Math.max(this.flash, 0.5);
    return true;
  }

  /** Raise the shield: brief protection that also burns what touches it. */
  tryShield() {
    if (this.shieldCooldown > 0) return false;
    if (!this.spend(CONFIG.shield.cost)) return false;
    this.shieldCooldown = CONFIG.shield.cooldown;
    this.shieldTime = CONFIG.shield.duration;
    return true;
  }

  /** An ember reaches the wick: it costs a life and knocks the player back. */
  hitPlayer(ember) {
    if (this.player.invuln > 0 || this.shieldTime > 0) return;
    this.player.health -= 1;
    this.player.invuln = CONFIG.player.invulnAfterHit;
    this.combo = 0;
    this.shake = 14;
    this.flash = 1;
    const angle = Math.atan2(this.player.y - ember.y, this.player.x - ember.x);
    this.player.vx += Math.cos(angle) * CONFIG.player.hitKnockback;
    this.player.vy += Math.sin(angle) * CONFIG.player.hitKnockback;
    for (let i = 0; i < 12; i += 1) {
      this.sparks.push(makeSpark(this.player.x, this.player.y, angle + this.rng.range(-1.1, 1.1), this.rng.range(120, 320), 0xff4d6d));
    }
    if (this.player.health <= 0) {
      this.state = STATE.GAMEOVER;
      this.message = 'Your wick went out.';
    }
  }

  /** A mote is gathered: score, charge and a little light. */
  collectMote(mote) {
    const gained = Math.round(mote.value * this.multiplier);
    this.score += gained;
    this.stats.motes += 1;
    this.player.charge = Math.min(CONFIG.core.maxCharge, this.player.charge + mote.chargeGain);
    this.combo = Math.min(CONFIG.score.comboMax, this.combo + CONFIG.score.comboStep);
    this.comboTimer = CONFIG.score.comboWindow;
    for (let i = 0; i < 6; i += 1) {
      this.sparks.push(makeSpark(mote.x, mote.y, this.rng.range(0, Math.PI * 2), this.rng.range(60, 190), mote.beacon ? 0xb6ff8f : 0xffe27a));
    }
    return gained;
  }

  /** An ember is snuffed: score, sparks, and maybe smaller ones in its place. */
  snuffEmber(ember, index, split = true) {
    ember.alive = false;
    this.embers.splice(index, 1);
    const gained = this.addScore(ember.score);
    const tint = ember.tint;
    for (let i = 0; i < 7; i += 1) {
      this.sparks.push(makeSpark(ember.x, ember.y, this.rng.range(0, Math.PI * 2), this.rng.range(90, 280), tint));
    }
    const type = CONFIG.ember.types[ember.kind];
    // A coal breaks into two cinders, unless the dawn is sweeping the field
    // and there is no more night left for them.
    if (split && type.splitInto > 0) {
      for (let i = 0; i < type.splitInto; i += 1) {
        const angle = this.rng.range(0, Math.PI * 2);
        const child = makeEmber('cinder', ember.x, ember.y, ember.speed * 0.9, this.rng);
        child.vx = Math.cos(angle) * 180;
        child.vy = Math.sin(angle) * 180;
        this.embers.push(child);
      }
    }
    return gained;
  }

  /** Advance the night by `dt` seconds. */
  step(dt, input) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 26);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.burstCooldown = Math.max(0, this.burstCooldown - dt);
    this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
    this.shieldTime = Math.max(0, this.shieldTime - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this.state === STATE.TITLE) {
      if (input.hit('Space') || input.hit('Enter')) this.start();
      return;
    }
    if (this.state === STATE.GAMEOVER || this.state === STATE.VICTORY) {
      if (input.hit('KeyR') || input.hit('Space') || input.hit('Enter')) this.start();
      return;
    }

    this.stepPlayer(dt, input);
    this.stepSpawns(dt);
    this.stepEmbers(dt);
    this.stepMotes(dt);
    this.stepSparks(dt);
    this.stepBursts(dt);
    this.stepWave(dt);
    this.stepBreak(dt);
  }

  /** Move the wick, and fire what the player asked for. */
  stepPlayer(dt, input) {
    const player = this.player;
    const move = input.moveVector();
    player.vx += move.x * CONFIG.player.accel * dt;
    player.vy += move.y * CONFIG.player.accel * dt;
    const drag = Math.pow(CONFIG.player.drag, dt * 60);
    player.vx *= drag;
    player.vy *= drag;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > CONFIG.player.maxSpeed) {
      player.vx = (player.vx / speed) * CONFIG.player.maxSpeed;
      player.vy = (player.vy / speed) * CONFIG.player.maxSpeed;
    }
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const margin = player.radius + 30;
    if (player.x < margin) { player.x = margin; player.vx = Math.abs(player.vx) * 0.4; }
    if (player.y < margin) { player.y = margin; player.vy = Math.abs(player.vy) * 0.4; }
    if (player.x > CONFIG.world.width - margin) { player.x = CONFIG.world.width - margin; player.vx = -Math.abs(player.vx) * 0.4; }
    if (player.y > CONFIG.world.height - margin) { player.y = CONFIG.world.height - margin; player.vy = -Math.abs(player.vy) * 0.4; }
    if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
    player.bob += dt * 3.1;
    player.charge = Math.min(CONFIG.core.maxCharge, player.charge + CONFIG.core.chargePerSecond * dt);
    if (move.x !== 0 || move.y !== 0) player.facing = Math.atan2(move.y, move.x);
    if (input.hit('Space')) this.tryBurst();
    if (input.hit('ShiftLeft') || input.hit('ShiftRight') || input.hit('KeyF')) this.tryShield();
  }

  /** Send out the embers and the motes the wave owes. */
  stepSpawns(dt) {
    // The motes keep coming whatever the wave is doing: they are the light the
    // player needs for the core, so they never stop.
    this.moteTimer -= dt;
    if (this.moteTimer <= 0) {
      this.moteTimer = this.wavePlan.moteGap;
      const beacon = this.wavePlan.beacon && this.motes.length < 3;
      this.motes.push(makeMote(
        this.rng.range(60, CONFIG.world.width - 60),
        this.rng.range(60, CONFIG.world.height - 60),
        this.rng,
        beacon,
      ));
    }

    if (this.toSpawn <= 0) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = this.wavePlan.gap;
    const kind = this.pickEmberKind();
    const edge = this.rng.int(0, 3);
    const inset = 46;
    const x = edge === 0 ? this.rng.range(0, CONFIG.world.width)
      : edge === 1 ? inset
        : edge === 2 ? CONFIG.world.width - inset
          : this.rng.range(0, CONFIG.world.width);
    const y = edge === 0 ? inset
      : edge === 1 ? this.rng.range(0, CONFIG.world.height)
        : edge === 2 ? CONFIG.world.height - inset
          : this.rng.range(0, CONFIG.world.height);
    const speed = CONFIG.ember.types[kind].speed * this.wavePlan.speed;
    this.embers.push(makeEmber(kind, x, y, speed, this.rng));
    this.toSpawn -= 1;
  }

  /** Which ember kind comes next: whatever the wave still owes. */
  pickEmberKind() {
    if (this.wavePlan.coals > 0 && this.rng.next() < 0.28) {
      this.wavePlan.coals -= 1;
      return 'coal';
    }
    if (this.wavePlan.sparks > 0 && this.rng.next() < 0.22) {
      this.wavePlan.sparks -= 1;
      return 'spark';
    }
    this.wavePlan.cinders -= 1;
    return 'cinder';
  }

  /** The embers drift in, and what they touch answers back. */
  stepEmbers(dt) {
    const player = this.player;
    for (let index = this.embers.length - 1; index >= 0; index -= 1) {
      const ember = this.embers[index];
      ember.age += dt;
      ember.wobble += dt * CONFIG.ember.bobRate * ember.drift;
      const toPlayer = Math.atan2(player.y - ember.y, player.x - ember.x);
      let angle = Math.atan2(ember.vy, ember.vx);
      if (!Number.isFinite(angle)) angle = toPlayer;
      let delta = toPlayer - angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      angle += Math.max(-CONFIG.ember.chaseTurn * dt, Math.min(CONFIG.ember.chaseTurn * dt, delta));
      const wobble = Math.sin(ember.wobble) * 0.42;
      // Close in, the ember stops drifting and lunges: the last stretch is the
      // dangerous one, and the player has to burst it before it lands.
      const distance = Math.hypot(player.x - ember.x, player.y - ember.y);
      const lunge = distance < 240 ? CONFIG.ember.lungeSpeed : 1;
      ember.vx = Math.cos(angle + wobble) * ember.speed * lunge;
      ember.vy = Math.sin(angle + wobble) * ember.speed * lunge;
      ember.x += ember.vx * dt;
      ember.y += ember.vy * dt;

      // The embers keep apart from each other, so a wave reads as a crowd of
      // distinct shapes rather than one clump.
      for (let other = index - 1; other >= 0; other -= 1) {
        const neighbour = this.embers[other];
        const apart = Math.hypot(ember.x - neighbour.x, ember.y - neighbour.y);
        const wanted = ember.radius + neighbour.radius + 14;
        if (apart > 0.01 && apart < wanted) {
          const push = ((wanted - apart) / wanted) * 190 * dt;
          const dx = (ember.x - neighbour.x) / apart;
          const dy = (ember.y - neighbour.y) / apart;
          ember.x += dx * push;
          ember.y += dy * push;
          neighbour.x -= dx * push;
          neighbour.y -= dy * push;
        }
      }

      if (ember.x < -40 || ember.x > CONFIG.world.width + 40 || ember.y < -40 || ember.y > CONFIG.world.height + 40) {
        ember.alive = false;
        this.embers.splice(index, 1);
        continue;
      }

      if (this.shieldTime > 0 && distance < CONFIG.shield.radius + ember.radius) {
        this.snuffEmber(ember, index);
        continue;
      }
      if (distance < player.radius + ember.radius) {
        if (this.shieldTime > 0) {
          this.snuffEmber(ember, index);
          continue;
        }
        this.hitPlayer(ember);
        if (this.state === STATE.GAMEOVER) return;
        ember.alive = false;
        this.embers.splice(index, 1);
      }
    }
  }

  /** The motes drift, and pull towards the wick when it is close. */
  stepMotes(dt) {
    const player = this.player;
    for (let index = this.motes.length - 1; index >= 0; index -= 1) {
      const mote = this.motes[index];
      mote.age += dt;
      mote.bob += dt * 2.4;
      mote.x += mote.vx * dt;
      mote.y += mote.vy * dt;
      if (mote.x < 20 || mote.x > CONFIG.world.width - 20) mote.vx *= -1;
      if (mote.y < 20 || mote.y > CONFIG.world.height - 20) mote.vy *= -1;
      const distance = Math.hypot(player.x - mote.x, player.y - mote.y);
      if (distance < CONFIG.mote.magnetRadius) {
        const pull = (1 - distance / CONFIG.mote.magnetRadius) * CONFIG.mote.magnetSpeed;
        mote.vx += ((player.x - mote.x) / distance) * pull * dt;
        mote.vy += ((player.y - mote.y) / distance) * pull * dt;
      }
      if (distance < CONFIG.mote.pickupRadius + mote.radius) {
        this.collectMote(mote);
        mote.alive = false;
        this.motes.splice(index, 1);
        continue;
      }
      if (mote.life !== Infinity && mote.age > mote.life) {
        mote.alive = false;
        this.motes.splice(index, 1);
      }
    }
  }

  /** The sparks cool and fade. */
  stepSparks(dt) {
    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index];
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= Math.pow(CONFIG.spark.drag, dt * 60);
      spark.vy *= Math.pow(CONFIG.spark.drag, dt * 60);
      if (spark.life <= 0) {
        spark.alive = false;
        this.sparks.splice(index, 1);
      }
    }
  }

  /** The bursts expand, snuff what they pass and shove the rest outward. */
  stepBursts(dt) {
    for (let index = this.bursts.length - 1; index >= 0; index -= 1) {
      const burst = this.bursts[index];
      burst.life -= dt;
      burst.radius += (burst.max / burst.maxLife) * dt;
      for (let e = this.embers.length - 1; e >= 0; e -= 1) {
        const ember = this.embers[e];
        const distance = Math.hypot(ember.x - burst.x, ember.y - burst.y);
        if (distance > burst.radius) continue;
        if (distance < burst.radius - 26) {
          ember.hp -= 1;
          if (ember.hp <= 0) {
            this.snuffEmber(ember, e);
            continue;
          }
        }
        const angle = Math.atan2(ember.y - burst.y, ember.x - burst.x);
        ember.vx += Math.cos(angle) * CONFIG.core.pushSpeed * dt;
        ember.vy += Math.sin(angle) * CONFIG.core.pushSpeed * dt;
      }
      if (burst.life <= 0) {
        burst.alive = false;
        this.bursts.splice(index, 1);
      }
    }
  }

  /** The wave clock: spawn, hold, and the next wave. */
  stepWave(dt) {
    if (this.state !== STATE.PLAYING) return;
    this.waveClock += dt;
    // A wave ends when its time is up: whatever is still drifting is snuffed
    // by the dawn, and the wave is scored as held.
    if (this.waveClock < this.waveLength) return;
    this.state = STATE.WAVE_BREAK;
    this.waveTimer = CONFIG.waves.nextWaveDelay;
    this.stats.waves = this.wave;
    for (let index = this.embers.length - 1; index >= 0; index -= 1) {
      this.snuffEmber(this.embers[index], index, false);
    }
    this.score += Math.round(CONFIG.waves.clearBonus * this.multiplier);
    if (this.wave >= CONFIG.waves.count) {
      this.state = STATE.VICTORY;
      this.message = 'Dawn breaks. The wick still burns.';
      return;
    }
    this.message = `Wave ${this.wave} held.`;
  }

  /** Keep the wave clock running during the break between waves. */
  stepBreak(dt) {
    if (this.state !== STATE.WAVE_BREAK) return;
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.state = STATE.PLAYING;
      this.beginWave(this.wave + 1);
    }
  }
}

export { STATE };
