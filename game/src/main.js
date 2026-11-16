// The entry point of the game: the canvas, the loop, and the wiring between
// the keyboard, the rules and the drawing. Everything else is imported.
import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Rng } from './rng.js';
import { Game, STATE } from './game.js';
import { Sound } from './audio.js';
import { drawScene } from './render.js';
import { drawHud } from './hud.js';
import { drawScreen } from './screens.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const status = document.getElementById('status');

/** Fit the world into the window, keeping its aspect ratio. */
function resize() {
  const { width, height } = CONFIG.world;
  const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${Math.floor(width * scale)}px`;
  canvas.style.height = `${Math.floor(height * scale)}px`;
  context.imageSmoothingEnabled = true;
}
window.addEventListener('resize', resize);
resize();

const input = new Input();
input.attach(window);

const sound = new Sound();
// The night's seed, chosen so the first frames a player sees are a good night.
const game = new Game(new Rng(31337));

/** Announce the state of the night to a screen reader. */
function announce() {
  if (!status) return;
  if (game.state === STATE.TITLE) status.textContent = 'Emberwake title screen. Press space to begin the night.';
  else if (game.state === STATE.GAMEOVER) status.textContent = `The wick went out. Score ${game.score}. Press R to play again.`;
  else if (game.state === STATE.VICTORY) status.textContent = `Dawn breaks. Score ${game.score}. Press R for another night.`;
  else status.textContent = `Wave ${game.wave} of ${CONFIG.waves.count}. Score ${game.score}. ${game.player.health} lives left.`;
}

/** Draw one frame of the night. */
function render() {
  drawScene(context, game);
  // The HUD belongs to a night in progress; the end screens speak for themselves.
  if (game.state === STATE.PLAYING || game.state === STATE.WAVE_BREAK || game.state === STATE.TITLE) {
    drawHud(context, game);
  }
  drawScreen(context, game);
}

const shot = new URLSearchParams(window.location.search).get('shot');
// The game object, so a tool can read the state behind a staged frame.
window.emberwakeGame = game;
if (shot) {
  // A staged frame for a screenshot: play the night forward, then hold it.
  stageShot(shot, game);
  render();
  window.emberwakeReady = true;
} else {
  let last = performance.now();
  let previousBurstCooldown = game.burstCooldown;
  let previousHealth = game.player.health;
  let previousScore = game.score;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const before = game.state;
    game.step(dt, input);
    if (game.state !== before) sound.end(game.state === STATE.VICTORY);
    if (game.burstCooldown > previousBurstCooldown) sound.burst();
    if (game.player.health < previousHealth) sound.hurt();
    if (game.score > previousScore && game.burstCooldown === previousBurstCooldown) sound.snuff();
    previousBurstCooldown = game.burstCooldown;
    previousHealth = game.player.health;
    previousScore = game.score;
    render();
    announce();
    input.endFrame();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
