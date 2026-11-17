// The heads-up display: the score, the wave, the wick's lives, the core charge
// and the two abilities, laid out so nothing overlaps anything else.
import { CONFIG } from './config.js';
import { STATE } from './game.js';

const P = CONFIG.palette;
const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

/** One ability, in its own frame, with its state read from its light. */
function abilityBox(context, x, y, key, label, ready, ratio, accent) {
  const width = 168;
  const height = 34;
  const lit = accent || P.playerCore;
  context.strokeStyle = ready ? lit : 'rgba(141, 127, 174, 0.35)';
  context.lineWidth = 1.5;
  context.strokeRect(x + 0.5, y + 0.5, width, height);
  context.fillStyle = ready ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)';
  context.fillRect(x + 1, y + 1, width - 2, height - 2);

  context.fillStyle = ready ? P.ink : P.dim;
  context.font = `700 14px ${FONT}`;
  context.fillText(key, x + 12, y + 22);

  context.fillStyle = ready ? lit : P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText(label, x + 68, y + 22);

  // The charge the ability is waiting on, as a thin line under the frame.
  context.fillStyle = 'rgba(255, 255, 255, 0.12)';
  context.fillRect(x + 1, y + height + 2, width - 2, 3);
  context.fillStyle = ready ? lit : P.dim;
  context.fillRect(x + 1, y + height + 2, (width - 2) * ratio, 3);
}

/** The wick's remaining lives, as little flames. */
function drawLives(context, x, y) {
  for (let index = 0; index < CONFIG.player.health; index += 1) {
    const cx = x + index * 26;
    context.fillStyle = P.emberMid;
    context.beginPath();
    context.arc(cx, y, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = P.emberCore;
    context.beginPath();
    context.arc(cx, y, 3.6, 0, Math.PI * 2);
    context.fill();
  }
  // The lives that are gone, drawn as cold husks so the count always reads.
  for (let index = CONFIG.player.health; index < CONFIG.player.maxHealth; index += 1) {
    const cx = x + index * 26;
    context.strokeStyle = 'rgba(141, 127, 174, 0.5)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(cx, y, 8, 0, Math.PI * 2);
    context.stroke();
  }
}

/** A soft dark pool under a corner's readouts, so text never fights the field. */
function corner(context, x, y, width, height) {
  // The gradient must reach zero inside the box it is filled in, or the box's
  // own edge shows as a seam across the field.
  const radius = Math.min(width, height) / 2;
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(5, 3, 10, 0.78)');
  gradient.addColorStop(0.6, 'rgba(5, 3, 10, 0.5)');
  gradient.addColorStop(1, 'rgba(5, 3, 10, 0)');
  context.save();
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
}

/** The heads-up display over the field. */
export function drawHud(context, game) {
  const { width, height } = CONFIG.world;
  context.save();
  context.textBaseline = 'top';

  // The four corners get a soft backing, so a drifting ember never sits on
  // top of a number.
  corner(context, 110, 70, 300, 190);
  corner(context, width - 150, 60, 300, 150);
  corner(context, 190, height - 80, 420, 190);
  corner(context, width - 190, height - 40, 380, 120);

  // The game's name, as a lockup in the black space beside the arena. A
  // still of a game should say what the game is called and what it is
  // about; without it the cover reads as any arena shooter at all. It is
  // set larger than any other type on the screen, so the name wins the eye
  // rather than the score counter.
  context.textAlign = 'left';
  // A soft backing, so the name stays readable over a bright ember.
  const brandGradient = context.createRadialGradient(
    150, 340, 20,
    150, 340, 270,
  );
  brandGradient.addColorStop(0, 'rgba(5, 3, 10, 0.85)');
  brandGradient.addColorStop(1, 'rgba(5, 3, 10, 0)');
  context.fillStyle = brandGradient;
  context.fillRect(0, 200, 330, 270);

  // The mark: a wick burning, drawn in the same flame the player is. It
  // is the one piece of logo the game has, so it is drawn here rather
  // than set in type.
  const markX = 62;
  const markY = 268;
  const flame = context.createRadialGradient(markX, markY, 2, markX, markY, 34);
  flame.addColorStop(0, '#fff6d8');
  flame.addColorStop(0.4, P.playerCore);
  flame.addColorStop(1, 'rgba(255, 216, 138, 0)');
  context.fillStyle = flame;
  context.beginPath();
  context.moveTo(markX, markY - 30);
  context.bezierCurveTo(markX + 22, markY - 8, markX + 16, markY + 20, markX, markY + 24);
  context.bezierCurveTo(markX - 16, markY + 20, markX - 22, markY - 8, markX, markY - 30);
  context.closePath();
  context.fill();
  context.fillStyle = P.emberCore;
  context.beginPath();
  context.ellipse(markX, markY + 2, 6, 12, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = P.playerCore;
  context.font = `800 46px ${FONT}`;
  context.fillText('EMBER', 108, 288);
  context.fillText('WAKE', 108, 336);
  // The tagline sits under both lines of the name, clear of them.
  context.fillStyle = 'rgba(244, 233, 255, 0.82)';
  context.font = `700 19px ${FONT}`;
  context.fillText('hold the light', 108, 368);
  context.fillText('until dawn', 108, 392);
  context.textAlign = 'left';

  // Top left: the score, and the wick's lives.
  context.fillStyle = P.ink;
  context.font = `700 32px ${FONT}`;
  context.fillText(String(game.score).padStart(5, '0'), 28, 20);
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText('SCORE', 28, 60);
  drawLives(context, 32, 98);
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText('WICK', 28, 112);

  // Which night this is, so the sheet of screens reads as one run of the
  // same game rather than a set of unrelated moments.
  context.fillStyle = 'rgba(141, 127, 174, 0.85)';
  context.font = `700 15px ${FONT}`;
  context.fillText(`NIGHT ${game.night === 2 ? 'TWO' : 'ONE'}`, 28, 138);

  // Top right: the wave, and how much of it is left.
  context.textAlign = 'right';
  context.fillStyle = P.ink;
  context.font = `700 26px ${FONT}`;
  context.fillText(`WAVE ${Math.max(1, game.wave)} / ${CONFIG.waves.count}`, width - 28, 20);
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  const left = Math.max(0, game.waveLength - game.waveClock);
  context.fillText(`NIGHT HOLDS ${Math.ceil(left)}s`, width - 28, 54);

  // The wave pips, the same marks the end screens use, so how far the run
  // has got is one glance.
  const pipGap = 16;
  const pipRadius = 5;
  const pipX = width - 28 - (CONFIG.waves.count - 1) * pipGap;
  for (let index = 0; index < CONFIG.waves.count; index += 1) {
    context.beginPath();
    context.arc(pipX + index * pipGap, 74, pipRadius, 0, Math.PI * 2);
    if (index < Math.max(1, game.wave)) {
      context.fillStyle = P.ink;
      context.fill();
    } else {
      context.strokeStyle = 'rgba(141, 127, 174, 0.7)';
      context.lineWidth = 1.5;
      context.stroke();
    }
  }
  context.textAlign = 'left';

  // The combo, tucked under the score on the left, where the other numbers
  // live. Centred at the top it sat on the ward's arc, with the HUD over
  // the playfield. The label is measured, not guessed at, so the number and
  // the word never run into each other.
  if (game.multiplier > 1.01) {
    const label = 'COMBO';
    context.fillStyle = P.mote;
    context.font = `800 30px ${FONT}`;
    const value = `x${game.multiplier.toFixed(1)}`;
    const valueWidth = context.measureText(value).width;
    context.fillText(value, 28, 160);
    context.fillStyle = P.dim;
    context.font = `600 13px ${FONT}`;
    const labelWidth = context.measureText(label).width;
    context.fillText(label, 28 + valueWidth + 10, 160);
    void labelWidth;
  }

  // Bottom left: the core charge bar, on its own line and clearly labelled.
  // The track is drawn as a row of segments and the fill is bright, so a
  // nearly empty core still reads as a working gauge rather than as a
  // rendering failure.
  const barX = 28;
  const barY = height - 116;
  const barWidth = 300;
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText('CORE CHARGE', barX, barY - 20);
  context.textAlign = 'right';
  context.fillText(`${Math.round(game.player.charge)}%`, barX + barWidth, barY - 20);
  context.textAlign = 'left';
  const ratio = game.player.charge / CONFIG.core.maxCharge;
  const segments = 20;
  const segmentWidth = barWidth / segments;
  for (let index = 0; index < segments; index += 1) {
    const filled = (index + 1) / segments <= ratio + 0.001;
    context.fillStyle = filled
      ? P.playerCore
      : 'rgba(244, 233, 255, 0.16)';
    context.fillRect(barX + index * segmentWidth, barY, segmentWidth - 3, 16);
  }
  context.strokeStyle = 'rgba(244, 233, 255, 0.3)';
  context.lineWidth = 1;
  context.strokeRect(barX + 0.5, barY + 0.5, barWidth - 1, 15);

  // Bottom left, under the bar: the two abilities, each in its own frame.
  const burstReady = game.burstCooldown <= 0 && game.player.charge >= CONFIG.core.burstCost;
  const shieldUp = game.shieldTime > 0;
  const shieldReady = game.shieldCooldown <= 0 && game.player.charge >= CONFIG.shield.cost;
  abilityBox(context, barX, barY + 30, 'SPACE', burstReady ? 'BURST READY' : 'COOLDOWN', burstReady, game.player.charge / CONFIG.core.maxCharge);
  abilityBox(context, barX + 184, barY + 30, 'SHIFT', shieldUp ? 'SHIELD UP' : shieldReady ? 'SHIELD READY' : 'COOLDOWN', shieldReady || shieldUp, 1 - game.shieldCooldown / CONFIG.shield.cooldown, P.shield);

  // Bottom right: the night so far, in words. The control legend is kept
  // quiet and small: the title card already teaches the keys, and a bright
  // legend here competes with the fight for the eye.
  context.textAlign = 'right';
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText(`${game.stats.embers} SNUFFED  ·  ${game.stats.motes} MOTES`, width - 34, height - 34);
  context.fillStyle = 'rgba(141, 127, 174, 0.55)';
  context.font = `600 11px ${FONT}`;
  context.fillText('WASD / ARROWS  STEER', width - 34, height - 52);
  context.textAlign = 'left';

  // The wave banner, in the middle of the field.
  if (game.bannerTimer > 0 && game.state === STATE.PLAYING) {
    const alpha = Math.min(1, game.bannerTimer / 0.6);
    context.save();
    context.globalAlpha = alpha;
    context.textAlign = 'center';
    context.fillStyle = P.ink;
    context.font = `800 48px ${FONT}`;
    context.fillText(game.banner, width / 2, height / 2 - 74);
    context.fillStyle = P.dim;
    context.font = `600 19px ${FONT}`;
    context.fillText(game.message, width / 2, height / 2 - 22);
    context.restore();
    context.textAlign = 'left';
  }

  context.restore();
}
