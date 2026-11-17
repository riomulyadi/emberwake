// The screens that sit between the nights: the title, the end of a night that
// ended badly, and the one that ended at dawn. Each draws over the field.
import { CONFIG } from './config.js';
import { STATE } from './game.js';

const P = CONFIG.palette;
const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

/**
 * A dimming veil so the text reads over the field. The night keeps its
 * own texture underneath: a menu screen that is flat black reads as a
 * different, unfinished game.
 */
function veil(context, alpha) {
  const { width, height } = CONFIG.world;
  context.save();
  // The same ground the field has: a warm dark, a cooler dark, and the
  // haze the night always sits in.
  const ground = context.createRadialGradient(
    width / 2, height / 2, 40,
    width / 2, height / 2, Math.max(width, height) * 0.72,
  );
  ground.addColorStop(0, '#171033');
  ground.addColorStop(0.55, '#0a0713');
  ground.addColorStop(1, '#05030a');
  context.fillStyle = ground;
  context.fillRect(0, 0, width, height);

  // A scatter of dust, so the night is the same night everywhere.
  context.globalAlpha = 0.16;
  context.fillStyle = P.dim;
  for (let index = 0; index < 120; index += 1) {
    const seed = index * 12.9898;
    const x = ((seed * 37.7) % 1) * width;
    const y = ((seed * 91.3) % 1) * height;
    const size = 0.7 + ((seed * 3.3) % 1) * 1.5;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  context.fillStyle = `rgba(5, 3, 10, ${alpha})`;
  context.fillRect(0, 0, width, height);
  context.restore();
}

/** A panel behind the centred column, so the text never fights the field. */
function panel(context, x, y, width, height) {
  context.save();
  context.fillStyle = 'rgba(10, 7, 19, 0.82)';
  context.fillRect(x, y, width, height);
  // A gold hairline, the colour the arena ring is drawn in, so the menus
  // belong to the same game as the field.
  context.strokeStyle = 'rgba(255, 216, 138, 0.4)';
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

/** The end of the night, and the score it ended with. */
export function drawGameOver(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.84);
  const panelWidth = 900;
  const panelHeight = 430;
  panel(context, width / 2 - panelWidth / 2, height / 2 - panelHeight / 2 - 34, panelWidth, panelHeight);

  context.save();
  context.textAlign = 'center';

  // The night this was, as a kicker inside the card: at a quarter size a
  // corner label is the first thing to vanish.
  context.fillStyle = 'rgba(141, 127, 174, 0.9)';
  context.font = `700 24px ${FONT}`;
  context.fillText(`NIGHT ${game.night === 2 ? 'TWO' : 'ONE'}`, width / 2, height / 2 - 130);

  context.fillStyle = '#ff6b7f';
  context.font = `800 56px ${FONT}`;
  context.fillText('THE WICK WENT OUT', width / 2, height / 2 - 82);

  // How far the night got, in the biggest numbers on the card: this screen
  // is read at a quarter of its size. The unit rides along with the number
  // so the two can never be separated by the scaling.
  context.fillStyle = P.ink;
  context.font = `800 92px ${FONT}`;
  context.fillText(`${game.wave} / ${CONFIG.waves.count}`, width / 2, height / 2 - 8);
  context.fillStyle = 'rgba(244, 233, 255, 0.85)';
  context.font = `800 34px ${FONT}`;
  context.fillText('WAVES HELD', width / 2, height / 2 + 34);

  wavePips(context, game, width / 2 - (CONFIG.waves.count * 30) / 2 + 15, height / 2 + 66, 9, 30);

  context.fillStyle = P.emberMid;
  context.font = `800 46px ${FONT}`;
  context.fillText(`SCORE ${String(game.score).padStart(5, '0')}`, width / 2, height / 2 + 126);

  // The restart, in a solid button, so the affordance survives being scaled
  // down to a thumbnail and so it is the loudest thing on a screen whose
  // only job is to send the player back into the night. The label is dark
  // on the gold: white on pale gold is a contrast failure.
  const buttonWidth = 470;
  const buttonHeight = 64;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height / 2 + 158;
  context.fillStyle = P.playerCore;
  context.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  context.fillStyle = '#221703';
  context.font = `800 32px ${FONT}`;
  context.fillText('PRESS R TO PLAY AGAIN', width / 2, buttonY + 42);
  context.restore();
}

/** Dawn: the night survived, and the score it ended with. */
export function drawVictory(context, game) {
  const { width, height } = CONFIG.world;
  veil(context, 0.76);
  const panelWidth = 900;
  const panelHeight = 420;
  panel(context, width / 2 - panelWidth / 2, height / 2 - panelHeight / 2 - 10, panelWidth, panelHeight);

  context.save();
  context.textAlign = 'center';

  context.fillStyle = 'rgba(141, 127, 174, 0.9)';
  context.font = `700 24px ${FONT}`;
  context.fillText(`NIGHT ${game.night === 2 ? 'TWO' : 'ONE'}`, width / 2, height / 2 - 130);

  context.fillStyle = P.good;
  context.font = `800 62px ${FONT}`;
  context.fillText('DAWN BREAKS', width / 2, height / 2 - 104);

  // The same shape of information as the loss card, so the two read as one
  // story told twice.
  context.fillStyle = P.ink;
  context.font = `800 92px ${FONT}`;
  context.fillText(`${CONFIG.waves.count} / ${CONFIG.waves.count}`, width / 2, height / 2 - 30);
  context.fillStyle = 'rgba(244, 233, 255, 0.85)';
  context.font = `800 34px ${FONT}`;
  context.fillText('WAVES HELD', width / 2, height / 2 + 34);

  wavePips(context, game, width / 2 - (CONFIG.waves.count * 30) / 2 + 15, height / 2 + 66, 9, 30);

  context.fillStyle = P.emberMid;
  context.font = `800 46px ${FONT}`;
  context.fillText(`SCORE ${String(game.score).padStart(5, '0')}`, width / 2, height / 2 + 126);

  const pulse = 0.88 + Math.sin(game.time * 3.4) * 0.12;
  const buttonWidth = 500;
  const buttonHeight = 64;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height / 2 + 158;
  context.fillStyle = P.good;
  context.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
  context.fillStyle = '#05271a';
  context.font = `800 32px ${FONT}`;
  context.fillText('PRESS R FOR ANOTHER NIGHT', width / 2, buttonY + 42);
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
    context.font = `800 34px ${FONT}`;
    context.fillText(boon.name, x + cardWidth / 2, y + 58);

    context.fillStyle = P.emberMid;
    context.font = `600 22px ${FONT}`;
    context.fillText(boon.blurb, x + cardWidth / 2, y + 98);

    // The detail is not printed on the card. A card read at a quarter size
    // has to be named, not explained, and the name and the one line beside
    // it are what carry the choice.
    context.fillStyle = index === 0 ? P.playerCore : P.dim;
    context.font = `800 34px ${FONT}`;
    context.fillText(`${index + 1}`, x + cardWidth / 2, y + cardHeight - 26);
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
