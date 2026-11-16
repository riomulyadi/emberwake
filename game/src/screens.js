// The screens that sit between the nights: the title, the end of a night that
// ended badly, and the one that ended at dawn. Each draws over the field.
import { CONFIG } from './config.js';
import { STATE } from './game.js';

const P = CONFIG.palette;
const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

/** A dimming veil so the text reads over the field. */
function veil(context, alpha) {
  context.save();
  context.fillStyle = `rgba(5, 3, 10, ${alpha})`;
  context.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
  context.restore();
}

/** A panel behind the centred column, so the text never fights the field. */
function panel(context, x, y, width, height) {
  context.save();
  context.fillStyle = 'rgba(10, 7, 19, 0.82)';
  context.fillRect(x, y, width, height);
  context.strokeStyle = 'rgba(141, 127, 174, 0.35)';
  context.lineWidth = 1.5;
  context.strokeRect(x + 0.5, y + 0.5, width, height);
  context.restore();
}

/** The best combo of the run, never below the x1.0 it started at. */
function comboText(game) {
  const best = Math.max(1, game.stats.bestCombo);
  return `x${best.toFixed(1)}`;
}

/** The title card: the name, the rules, and how to begin. */
export function drawTitle(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.66);
  context.save();
  context.textAlign = 'center';

  context.fillStyle = P.playerCore;
  context.font = `800 74px ${FONT}`;
  context.fillText('EMBERWAKE', width / 2, height / 2 - 168);

  context.fillStyle = P.emberMid;
  context.font = `600 22px ${FONT}`;
  context.fillText('Hold the light until dawn.', width / 2, height / 2 - 120);

  const lines = [
    'The embers are drawn to your wick. Gather the light motes,',
    'snuff what drifts in, and keep the flame alive through eight waves.',
    '',
    'WASD / ARROWS   steer the wick',
    'SPACE          core burst — snuffs embers in a ring',
    'SHIFT          shield — burns what touches it',
  ];
  context.fillStyle = P.ink;
  context.font = `500 19px ${FONT}`;
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, height / 2 - 66 + index * 29);
  });

  const pulse = 0.55 + Math.sin(game.time * 3.4) * 0.45;
  context.fillStyle = `rgba(244, 233, 255, ${pulse.toFixed(3)})`;
  context.font = `800 30px ${FONT}`;
  context.fillText('PRESS SPACE TO BEGIN', width / 2, height / 2 + 148);
  context.restore();
}

/** The end of the night, and the score it ended with. */
export function drawGameOver(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.78);
  const panelWidth = 760;
  const panelHeight = 300;
  panel(context, width / 2 - panelWidth / 2, height / 2 - panelHeight / 2 - 20, panelWidth, panelHeight);

  context.save();
  context.textAlign = 'center';

  context.fillStyle = P.danger;
  context.font = `800 60px ${FONT}`;
  context.fillText('THE WICK WENT OUT', width / 2, height / 2 - 108);

  context.fillStyle = P.ink;
  context.font = `700 30px ${FONT}`;
  context.fillText(`SCORE ${game.score}`, width / 2, height / 2 - 42);

  context.fillStyle = P.dim;
  context.font = `500 17px ${FONT}`;
  context.fillText(
    `wave ${game.wave} of ${CONFIG.waves.count}  ·  ${game.stats.embers} embers snuffed  ·  ${game.stats.motes} motes  ·  best combo ${comboText(game)}`,
    width / 2,
    height / 2 - 6,
  );

  const pulse = 0.6 + Math.sin(game.time * 3.4) * 0.4;
  context.fillStyle = `rgba(244, 233, 255, ${pulse.toFixed(3)})`;
  context.font = `800 26px ${FONT}`;
  context.fillText('PRESS R TO PLAY AGAIN', width / 2, height / 2 + 76);
  context.restore();
}

/** Dawn: the night survived, and the score it ended with. */
export function drawVictory(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.72);
  const panelWidth = 800;
  const panelHeight = 300;
  panel(context, width / 2 - panelWidth / 2, height / 2 - panelHeight / 2 - 20, panelWidth, panelHeight);

  context.save();
  context.textAlign = 'center';

  context.fillStyle = P.good;
  context.font = `800 64px ${FONT}`;
  context.fillText('DAWN BREAKS', width / 2, height / 2 - 108);

  context.fillStyle = P.ink;
  context.font = `700 32px ${FONT}`;
  context.fillText(`SCORE ${game.score}`, width / 2, height / 2 - 40);

  context.fillStyle = P.dim;
  context.font = `500 17px ${FONT}`;
  context.fillText(
    `all ${CONFIG.waves.count} waves held  ·  ${game.stats.embers} embers snuffed  ·  ${game.stats.motes} motes  ·  best combo ${comboText(game)}`,
    width / 2,
    height / 2 - 4,
  );

  const pulse = 0.6 + Math.sin(game.time * 3.4) * 0.4;
  context.fillStyle = `rgba(244, 233, 255, ${pulse.toFixed(3)})`;
  context.font = `800 26px ${FONT}`;
  context.fillText('PRESS R FOR ANOTHER NIGHT', width / 2, height / 2 + 76);
  context.restore();
}

/** Draw whichever screen the game is on. */
export function drawScreen(context, game) {
  if (game.state === STATE.TITLE) drawTitle(context, game);
  else if (game.state === STATE.GAMEOVER) drawGameOver(context, game);
  else if (game.state === STATE.VICTORY) drawVictory(context, game);
}
