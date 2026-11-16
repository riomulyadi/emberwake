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
  veil(context, 0.76);
  context.save();
  context.textAlign = 'center';

  context.fillStyle = P.playerCore;
  context.font = `800 86px ${FONT}`;
  context.fillText('EMBERWAKE', width / 2, height / 2 - 176);

  context.fillStyle = P.emberMid;
  context.font = `700 28px ${FONT}`;
  context.fillText('Hold the light until dawn.', width / 2, height / 2 - 124);

  // Two lines, big enough to read when the sheet shrinks them: the premise
  // and the goal, and nothing else.
  context.fillStyle = P.ink;
  context.font = `600 24px ${FONT}`;
  context.fillText('Embers are drawn to your wick.', width / 2, height / 2 - 62);
  context.fillText('Snuff them. Gather the light. Outlast eight waves.', width / 2, height / 2 - 28);

  // The controls, in two columns with a fixed gutter, so the labels never
  // crowd the descriptions. The whole block is centred on the same axis as
  // the rest of the card, and the key is the part that is brightest.
  const controls = [
    ['WASD / ARROWS', 'steer the wick'],
    ['SPACE', 'core burst — snuffs embers'],
    ['SHIFT', 'shield — burns what touches it'],
  ];
  context.font = `800 24px ${FONT}`;
  const labelWidth = Math.max(...controls.map(([key]) => context.measureText(key).width));
  context.font = `600 24px ${FONT}`;
  const descriptionWidth = Math.max(...controls.map(([, text]) => context.measureText(text).width));
  const gutter = 46;
  const blockWidth = labelWidth + gutter + descriptionWidth;
  const labelRight = width / 2 - blockWidth / 2 + labelWidth;
  const descriptionLeft = labelRight + gutter;
  controls.forEach(([key, description], index) => {
    const y = height / 2 + 34 + index * 38;
    context.textAlign = 'right';
    context.fillStyle = P.playerCore;
    context.font = `800 24px ${FONT}`;
    context.fillText(key, labelRight, y);
    context.textAlign = 'left';
    context.fillStyle = P.ink;
    context.font = `600 24px ${FONT}`;
    context.fillText(description, descriptionLeft, y);
  });

  const pulse = 0.7 + Math.sin(game.time * 3.4) * 0.3;
  context.textAlign = 'center';
  context.fillStyle = `rgba(255, 255, 255, ${pulse.toFixed(3)})`;
  context.font = `800 40px ${FONT}`;
  context.fillText('PRESS SPACE TO BEGIN', width / 2, height / 2 + 168);
  context.restore();
}

/**
 * The wave pips: one mark for each wave of the night, filled for the ones
 * that were held. They are the same mark on every screen, so a reader can
 * see at a glance how far a run got.
 */
function wavePips(context, game, x, y, radius, gap) {
  const held = game.state === STATE.VICTORY ? CONFIG.waves.count : game.wave;
  context.save();
  for (let index = 0; index < CONFIG.waves.count; index += 1) {
    const cx = x + index * gap;
    context.beginPath();
    context.arc(cx, y, radius, 0, Math.PI * 2);
    if (index < held) {
      context.fillStyle = P.ink;
      context.fill();
    } else {
      context.strokeStyle = 'rgba(141, 127, 174, 0.6)';
      context.lineWidth = 1.5;
      context.stroke();
    }
  }
  context.restore();
}

/**
 * A small label in the corner of an end card, so the two endings read as
 * two separate nights rather than one night with two outcomes.
 */
function nightLabel(context, text) {
  const { width, height } = CONFIG.world;
  context.save();
  context.textAlign = 'right';
  context.fillStyle = 'rgba(141, 127, 174, 0.9)';
  context.font = `700 18px ${FONT}`;
  context.fillText(text, width - 44, height - 42);
  context.restore();
}

/** The end of the night, and the score it ended with. */
export function drawGameOver(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.84);
  const panelWidth = 900;
  const panelHeight = 420;
  panel(context, width / 2 - panelWidth / 2, height / 2 - panelHeight / 2 - 10, panelWidth, panelHeight);
  nightLabel(context, 'NIGHT ONE');

  context.save();
  context.textAlign = 'center';

  context.fillStyle = P.danger;
  context.font = `800 56px ${FONT}`;
  context.fillText('THE WICK WENT OUT', width / 2, height / 2 - 118);

  // How far the night got, in the biggest numbers on the card: this screen
  // is read at a quarter of its size.
  context.fillStyle = P.ink;
  context.font = `800 92px ${FONT}`;
  context.fillText(`${game.wave} / ${CONFIG.waves.count}`, width / 2, height / 2 - 36);

  context.fillStyle = P.dim;
  context.font = `700 20px ${FONT}`;
  context.fillText('WAVES HELD', width / 2, height / 2 - 2);

  wavePips(context, game, width / 2 - (CONFIG.waves.count * 30) / 2 + 15, height / 2 + 26, 9, 30);

  context.fillStyle = P.emberMid;
  context.font = `800 40px ${FONT}`;
  context.fillText(`SCORE ${game.score}`, width / 2, height / 2 + 92);

  const pulse = 0.7 + Math.sin(game.time * 3.4) * 0.3;
  context.fillStyle = `rgba(255, 255, 255, ${pulse.toFixed(3)})`;
  context.font = `800 32px ${FONT}`;
  context.fillText('PRESS R TO PLAY AGAIN', width / 2, height / 2 + 154);
  context.restore();
}

/** Dawn: the night survived, and the score it ended with. */
export function drawVictory(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.76);
  const panelWidth = 900;
  const panelHeight = 420;
  panel(context, width / 2 - panelWidth / 2, height / 2 - panelHeight / 2 - 10, panelWidth, panelHeight);
  nightLabel(context, 'NIGHT TWO');

  context.save();
  context.textAlign = 'center';

  context.fillStyle = P.good;
  context.font = `800 62px ${FONT}`;
  context.fillText('DAWN BREAKS', width / 2, height / 2 - 118);

  // The same shape of information as the loss card, so the two read as one
  // story told twice.
  context.fillStyle = P.ink;
  context.font = `800 92px ${FONT}`;
  context.fillText(`${CONFIG.waves.count} / ${CONFIG.waves.count}`, width / 2, height / 2 - 36);

  context.fillStyle = P.dim;
  context.font = `700 20px ${FONT}`;
  context.fillText('WAVES HELD', width / 2, height / 2 - 2);

  wavePips(context, game, width / 2 - (CONFIG.waves.count * 30) / 2 + 15, height / 2 + 26, 9, 30);

  context.fillStyle = P.emberMid;
  context.font = `800 40px ${FONT}`;
  context.fillText(`SCORE ${game.score}`, width / 2, height / 2 + 92);

  const pulse = 0.7 + Math.sin(game.time * 3.4) * 0.3;
  context.fillStyle = `rgba(255, 255, 255, ${pulse.toFixed(3)})`;
  context.font = `800 32px ${FONT}`;
  context.fillText('PRESS R FOR ANOTHER NIGHT', width / 2, height / 2 + 154);
  context.restore();
}

/** The choice between waves: three boons, one of which is taken. */
export function drawChoice(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.86);
  context.save();
  context.textAlign = 'center';

  context.fillStyle = P.playerCore;
  context.font = `800 56px ${FONT}`;
  context.fillText('THE NIGHT GIVES YOU A CHOICE', width / 2, height / 2 - 150);

  context.fillStyle = P.dim;
  context.font = `700 22px ${FONT}`;
  context.fillText('Take one. The next wave waits.', width / 2, height / 2 - 104);

  const cardWidth = 300;
  const cardHeight = 250;
  const gap = 26;
  const total = game.offers.length * cardWidth + (game.offers.length - 1) * gap;
  const startX = width / 2 - total / 2;
  game.offers.forEach((boon, index) => {
    const x = startX + index * (cardWidth + gap);
    const y = height / 2 - 60;
    context.fillStyle = 'rgba(10, 7, 19, 0.9)';
    context.fillRect(x, y, cardWidth, cardHeight);
    context.strokeStyle = index === 0 ? P.playerCore : 'rgba(141, 127, 174, 0.45)';
    context.lineWidth = index === 0 ? 2.5 : 1.5;
    context.strokeRect(x + 0.5, y + 0.5, cardWidth, cardHeight);

    context.fillStyle = index === 0 ? P.playerCore : P.ink;
    context.font = `800 28px ${FONT}`;
    context.fillText(boon.name, x + cardWidth / 2, y + 52);

    context.fillStyle = P.emberMid;
    context.font = `600 20px ${FONT}`;
    context.fillText(boon.blurb, x + cardWidth / 2, y + 92);

    // The detail, wrapped to the card.
    context.fillStyle = P.dim;
    context.font = `500 17px ${FONT}`;
    const words = boon.detail.split(' ');
    let line = '';
    let lineY = y + 132;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > cardWidth - 40) {
        context.fillText(line, x + cardWidth / 2, lineY);
        line = word;
        lineY += 24;
      } else {
        line = candidate;
      }
    }
    context.fillText(line, x + cardWidth / 2, lineY);

    context.fillStyle = index === 0 ? P.playerCore : P.dim;
    context.font = `800 20px ${FONT}`;
    context.fillText(`${index + 1}`, x + cardWidth / 2, y + cardHeight - 24);
  });

  const pulse = 0.7 + Math.sin(game.time * 3.4) * 0.3;
  context.fillStyle = `rgba(255, 255, 255, ${pulse.toFixed(3)})`;
  context.font = `800 26px ${FONT}`;
  context.fillText('PRESS 1, 2 OR 3', width / 2, height / 2 + 236);
  context.restore();
}

/** Draw whichever screen the game is on. */
export function drawScreen(context, game) {
  if (game.state === STATE.TITLE) drawTitle(context, game);
  else if (game.state === STATE.CHOOSING) drawChoice(context, game);
  else if (game.state === STATE.GAMEOVER) drawGameOver(context, game);
  else if (game.state === STATE.VICTORY) drawVictory(context, game);
}
