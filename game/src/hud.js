// The heads-up display: the score, the wave, the wick's lives, the core charge
// and the two abilities, laid out so nothing overlaps anything else.
import { CONFIG } from './config.js';
import { STATE } from './game.js';

const P = CONFIG.palette;
const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

/** A small framed label with a value in it, used for the two abilities. */
function abilityBox(context, x, y, key, label, ready, ratio) {
  const width = 168;
  const height = 34;
  context.strokeStyle = ready ? P.playerCore : 'rgba(141, 127, 174, 0.35)';
  context.lineWidth = 1.5;
  context.strokeRect(x + 0.5, y + 0.5, width, height);
  context.fillStyle = 'rgba(255, 255, 255, 0.05)';
  context.fillRect(x + 1, y + 1, width - 2, height - 2);

  context.fillStyle = ready ? P.ink : P.dim;
  context.font = `700 14px ${FONT}`;
  context.fillText(key, x + 12, y + 22);

  context.fillStyle = ready ? P.playerCore : P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText(label, x + 68, y + 22);

  // The charge the ability is waiting on, as a thin line under the frame.
  context.fillStyle = 'rgba(255, 255, 255, 0.12)';
  context.fillRect(x + 1, y + height + 2, width - 2, 3);
  context.fillStyle = ready ? P.playerCore : P.dim;
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

  // Top right: the wave, and how much of it is left.
  context.textAlign = 'right';
  context.fillStyle = P.ink;
  context.font = `700 26px ${FONT}`;
  context.fillText(`WAVE ${Math.max(1, game.wave)} / ${CONFIG.waves.count}`, width - 28, 20);
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  const left = Math.max(0, game.waveLength - game.waveClock);
  context.fillText(`NIGHT HOLDS ${Math.ceil(left)}s`, width - 28, 54);
  context.textAlign = 'left';

  // Top centre: the combo, when there is one.
  if (game.multiplier > 1.01) {
    context.textAlign = 'center';
    context.fillStyle = P.mote;
    context.font = `800 30px ${FONT}`;
    context.fillText(`x${game.multiplier.toFixed(1)}`, width / 2, 22);
    context.fillStyle = P.dim;
    context.font = `600 13px ${FONT}`;
    context.fillText('COMBO', width / 2, 60);
    context.textAlign = 'left';
  }

  // Bottom left: the core charge bar, on its own line and clearly labelled.
  const barX = 28;
  const barY = height - 116;
  const barWidth = 300;
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText('CORE CHARGE', barX, barY - 20);
  context.textAlign = 'right';
  context.fillText(`${Math.round(game.player.charge)}%`, barX + barWidth, barY - 20);
  context.textAlign = 'left';
  context.fillStyle = 'rgba(255, 255, 255, 0.08)';
  context.fillRect(barX, barY, barWidth, 14);
  const ratio = game.player.charge / CONFIG.core.maxCharge;
  context.fillStyle = ratio >= 0.5 ? P.playerCore : P.dim;
  context.fillRect(barX, barY, barWidth * ratio, 14);
  context.strokeStyle = 'rgba(244, 233, 255, 0.35)';
  context.lineWidth = 1;
  context.strokeRect(barX + 0.5, barY + 0.5, barWidth, 13);

  // Bottom left, under the bar: the two abilities, each in its own frame.
  const burstReady = game.burstCooldown <= 0 && game.player.charge >= CONFIG.core.burstCost;
  const shieldReady = game.shieldCooldown <= 0 && game.player.charge >= CONFIG.shield.cost;
  abilityBox(context, barX, barY + 30, 'SPACE', burstReady ? 'BURST READY' : 'CHARGING', burstReady, game.player.charge / CONFIG.core.maxCharge);
  abilityBox(context, barX + 184, barY + 30, 'SHIFT', shieldReady ? 'SHIELD READY' : 'COOLING', shieldReady, 1 - game.shieldCooldown / CONFIG.shield.cooldown);

  // Bottom right: the night so far, in words.
  context.textAlign = 'right';
  context.fillStyle = P.dim;
  context.font = `600 13px ${FONT}`;
  context.fillText(`${game.stats.embers} SNUFFED  ·  ${game.stats.motes} MOTES`, width - 34, height - 34);
  context.fillText('WASD / ARROWS  STEER', width - 34, height - 54);
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
