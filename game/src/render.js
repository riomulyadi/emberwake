// The look of Emberwake: the dark the game happens in, the things that stand on
// it, and the little lights they leave behind. The renderer only reads state.
import { CONFIG } from './config.js';
import { STATE } from './game.js';

const P = CONFIG.palette;

/** A soft glow behind a shape, drawn as a few stacked translucent circles. */
function glow(context, x, y, radius, color, strength = 0.5, layers = 5) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  for (let layer = layers; layer >= 1; layer -= 1) {
    const ratio = layer / layers;
    context.globalAlpha = strength * (1 - ratio) * 0.4;
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius * (1 + ratio * 1.5), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** The dark the game happens in, with a faint arena pattern and drifting dust. */
export function drawBackground(context, game) {
  const { width, height } = CONFIG.world;
  const gradient = context.createRadialGradient(
    width / 2, height / 2, 40,
    width / 2, height / 2, Math.max(width, height) * 0.72,
  );
  gradient.addColorStop(0, CONFIG.palette.haze);
  gradient.addColorStop(0.55, CONFIG.palette.void);
  gradient.addColorStop(1, CONFIG.palette.voidDeep);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // The ward on the floor: a ring of runes the night is held inside of. It
  // gives the field a place to be, and a reason to be a place at all. It is
  // the one shape the player must read at a glance, so it carries enough
  // contrast to survive a thumbnail.
  const cx = width / 2;
  const cy = height / 2;
  context.save();
  context.strokeStyle = 'rgba(143, 111, 214, 0.34)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(cx, cy, 330, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = 'rgba(143, 111, 214, 0.1)';
  context.lineWidth = 18;
  context.beginPath();
  context.arc(cx, cy, 296, 0, Math.PI * 2);
  context.stroke();

  // Runes around the ward, each a mark that brightens as the night deepens.
  const runes = 24;
  for (let index = 0; index < runes; index += 1) {
    const angle = (index / runes) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * 313;
    const y = cy + Math.sin(angle) * 313;
    const lit = 0.35 + 0.65 * Math.max(0, Math.sin(game.time * 0.9 + index * 0.7));
    context.strokeStyle = `rgba(160, 128, 235, ${(0.08 + lit * 0.22).toFixed(3)})`;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x - 5, y);
    context.lineTo(x + 5, y);
    context.moveTo(x, y - 5);
    context.lineTo(x, y + 5);
    context.stroke();
  }

  // The spokes, very faint, to give the eye a grid to land on.
  context.strokeStyle = 'rgba(141, 127, 174, 0.04)';
  context.lineWidth = 1;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + Math.cos(angle) * 900, cy + Math.sin(angle) * 900);
    context.stroke();
  }
  context.restore();

  // Slow drifting motes of dust in the air, from a fixed field.
  context.save();
  context.globalAlpha = 0.18;
  context.fillStyle = P.dim;
  for (let index = 0; index < 120; index += 1) {
    const seed = index * 12.9898;
    const x = ((seed * 37.7) % 1) * width;
    const y = ((seed * 91.3 + game.time * 7) % 1) * height;
    const size = 0.7 + ((seed * 3.3) % 1) * 1.5;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** A cinder: a sharp four-pointed shard of hot glass, the commonest ember. */
function drawCinder(context, ember) {
  const tint = `#${ember.tint.toString(16).padStart(6, '0')}`;
  const fade = Math.min(1, ember.age / CONFIG.ember.spawnFade);
  const pulse = 1 + Math.sin(ember.age * 7 + ember.wobble) * 0.1;
  context.save();
  context.globalAlpha = fade;
  glow(context, ember.x, ember.y, ember.radius * 1.3, tint, 0.4, 3);
  context.fillStyle = tint;
  context.beginPath();
  // Four long points and four short ones: a shard, not a blob.
  const points = 8;
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2 + ember.age * 1.4;
    const long = i % 2 === 0;
    const r = ember.radius * (long ? pulse : pulse * 0.38);
    const px = ember.x + Math.cos(angle) * r;
    const py = ember.y + Math.sin(angle) * r;
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.fillStyle = P.emberCore;
  context.globalAlpha = fade * 0.95;
  context.beginPath();
  context.arc(ember.x, ember.y, ember.radius * 0.3, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/** A coal: a heavy cracked hexagon that takes three hits and breaks in two. */
function drawCoal(context, ember) {
  const tint = `#${ember.tint.toString(16).padStart(6, '0')}`;
  const fade = Math.min(1, ember.age / CONFIG.ember.spawnFade);
  const pulse = 1 + Math.sin(ember.age * 3.1 + ember.wobble) * 0.05;
  context.save();
  context.globalAlpha = fade;
  glow(context, ember.x, ember.y, ember.radius * 1.5, tint, 0.42, 4);
  context.fillStyle = tint;
  context.beginPath();
  const points = 6;
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2 + ember.age * 0.3;
    const r = ember.radius * pulse;
    const px = ember.x + Math.cos(angle) * r;
    const py = ember.y + Math.sin(angle) * r;
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  // Cracks, so the coal reads as a heavy stone, not a smooth shape.
  context.strokeStyle = 'rgba(20, 10, 20, 0.6)';
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(ember.x, ember.y - ember.radius * 0.62);
  context.quadraticCurveTo(ember.x + 5, ember.y, ember.x - 3, ember.y + ember.radius * 0.55);
  context.stroke();
  context.fillStyle = P.emberCore;
  context.globalAlpha = fade * 0.75;
  context.beginPath();
  context.arc(ember.x, ember.y, ember.radius * 0.3, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/** A spark: a thin comet, the fastest and smallest of the three. */
function drawSparkEmber(context, ember) {
  const tint = `#${ember.tint.toString(16).padStart(6, '0')}`;
  const fade = Math.min(1, ember.age / CONFIG.ember.spawnFade);
  const angle = Math.atan2(ember.vy, ember.vx);
  context.save();
  context.globalAlpha = fade;
  glow(context, ember.x, ember.y, ember.radius * 1.2, tint, 0.35, 3);
  context.globalAlpha = fade;
  context.fillStyle = tint;
  context.beginPath();
  context.moveTo(ember.x + Math.cos(angle) * ember.radius * 1.5, ember.y + Math.sin(angle) * ember.radius * 1.5);
  context.lineTo(ember.x - Math.cos(angle) * ember.radius * 1.1, ember.y - Math.sin(angle) * ember.radius * 1.1);
  context.lineTo(ember.x - Math.sin(angle) * ember.radius * 0.9, ember.y + Math.cos(angle) * ember.radius * 0.9);
  context.closePath();
  context.fill();
  context.restore();
}

/** The ember: a hot core inside a ragged shell, shape by kind. */
export function drawEmber(context, ember) {
  // Every ember drags a short tail behind it, so a still frame shows where
  // the night is going rather than a field of frozen shapes.
  const speed = Math.hypot(ember.vx, ember.vy);
  if (speed > 40) {
    const tint = `#${ember.tint.toString(16).padStart(6, '0')}`;
    const angle = Math.atan2(ember.vy, ember.vx);
    context.save();
    context.globalAlpha = 0.28;
    context.strokeStyle = tint;
    context.lineWidth = ember.radius * 0.9;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(ember.x, ember.y);
    context.lineTo(
      ember.x - Math.cos(angle) * ember.radius * 3.2,
      ember.y - Math.sin(angle) * ember.radius * 3.2,
    );
    context.stroke();
    context.restore();
  }
  if (ember.kind === 'coal') drawCoal(context, ember);
  else if (ember.kind === 'spark') drawSparkEmber(context, ember);
  else drawCinder(context, ember);
}

/** A mote of light: a small bright point with a halo. */
export function drawMote(context, mote) {
  const color = mote.beacon ? P.beacon : P.mote;
  const pulse = 1 + Math.sin(mote.bob * 2.4) * 0.16;
  const fade = mote.life === Infinity ? 1 : Math.min(1, (mote.life - mote.age) / 1.5);
  context.save();
  context.globalAlpha = fade;
  glow(context, mote.x, mote.y, mote.radius * 2.6, color, 0.55, 4);
  context.fillStyle = color;
  context.beginPath();
  context.arc(mote.x, mote.y, mote.radius * pulse, 0, Math.PI * 2);
  context.fill();
  if (mote.beacon) {
    context.strokeStyle = P.beacon;
    context.globalAlpha = fade * 0.6;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(mote.x, mote.y, mote.radius * 2.2 * pulse, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

/**
 * The wick: a bright shape with a dark rim, so the eye always finds it
 * first, even when the field is full of light.
 */
export function drawWickGlow(context, x, y, radius) {
  context.save();
  context.globalAlpha = 0.3;
  context.fillStyle = P.playerCore;
  context.beginPath();
  context.arc(x, y, radius * 2.1, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.18;
  context.beginPath();
  context.arc(x, y, radius * 3.1, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/** A spark, cooling as it fades. */
export function drawSpark(context, spark) {
  const color = `#${spark.tint.toString(16).padStart(6, '0')}`;
  const life = spark.life / spark.maxLife;
  const size = spark.radius * (0.35 + life * 0.65);
  const speed = Math.hypot(spark.vx, spark.vy) || 1;
  context.save();
  // The streak the spark is leaving behind it: a fixed length along the way
  // it came from, not a multiple of its speed.
  const trail = Math.min(22, Math.max(7, speed * 0.07));
  context.globalAlpha = life * 0.55;
  context.strokeStyle = color;
  context.lineWidth = size * 0.85;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(spark.x, spark.y);
  context.lineTo(spark.x - (spark.vx / speed) * trail, spark.y - (spark.vy / speed) * trail);
  context.stroke();
  // The spark itself.
  context.globalAlpha = life;
  context.fillStyle = color;
  context.beginPath();
  context.arc(spark.x, spark.y, size, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = life * 0.85;
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(spark.x, spark.y, size * 0.42, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/**
 * The flash an ember leaves when it is snuffed: a bright disc that collapses
 * to nothing, so a kill is something you can see happen.
 */
export function drawFlash(context, flash) {
  const life = flash.life / flash.maxLife;
  const color = `#${flash.tint.toString(16).padStart(6, '0')}`;
  context.save();
  // The disc of light.
  context.globalAlpha = life * 0.8;
  context.fillStyle = color;
  context.beginPath();
  context.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
  context.fill();
  // The white heart of it.
  context.globalAlpha = life;
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(flash.x, flash.y, flash.radius * 0.5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/**
 * The line a coal drags toward the wick: the one thing on the field that
 * says where a threat is going, so the danger reads before it arrives.
 */
export function drawThreatLines(context, game) {
  const player = game.player;
  context.save();
  context.lineCap = 'round';
  for (const ember of game.embers) {
    if (ember.kind !== 'coal') continue;
    const distance = Math.hypot(ember.x - player.x, ember.y - player.y);
    if (distance > 420) continue;
    const color = `#${ember.tint.toString(16).padStart(6, '0')}`;
    context.globalAlpha = 0.34 * (1 - distance / 420);
    context.strokeStyle = color;
    context.lineWidth = 2 + ember.radius * 0.22;
    context.setLineDash([14, 12]);
    context.beginPath();
    context.moveTo(ember.x, ember.y);
    context.lineTo(player.x, player.y);
    context.stroke();
  }
  context.setLineDash([]);
  context.restore();
}

/** The burst ring: a shockwave rolling outward from the wick. */
export function drawBurst(context, burst) {
  const life = burst.life / burst.maxLife;
  context.save();

  // The light the wave carries with it: a soft disc that thins as it
  // spreads, so the wave reads as something expanding rather than as a
  // circle that was always there.
  context.globalAlpha = life * life * 0.35;
  context.fillStyle = P.playerCore;
  context.beginPath();
  context.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
  context.fill();

  // The front of it: a bright edge, thicker as it runs out of strength.
  context.globalAlpha = Math.min(1, life * 1.6);
  context.strokeStyle = '#ffffff';
  context.lineWidth = 2 + life * 9;
  context.beginPath();
  context.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
  context.stroke();

  // The cooler glow trailing just behind the front.
  context.globalAlpha = life * 0.55;
  context.strokeStyle = P.shield;
  context.lineWidth = 5 + life * 18;
  context.beginPath();
  context.arc(burst.x, burst.y, burst.radius * 0.94, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

/** The player's wick: a bright cyan chevron with a hard leading edge. */
export function drawPlayer(context, game) {
  const player = game.player;
  const flicker = 1 + Math.sin(player.bob * 4.5) * 0.07;
  const hurt = player.invuln > 0 && Math.floor(player.invuln * 14) % 2 === 0;
  const radius = player.radius;

  context.save();
  if (hurt) context.globalAlpha = 0.45;

  // A halo of the wick's own light, so the eye finds it first even when the
  // field is full of motes and sparks.
  drawWickGlow(context, player.x, player.y, radius);

  // The wick is drawn as a flat, bright shape, never as a soft blob: the
  // embers are the soft ones, and the eye has to tell them apart at a glance.
  // It is a wedge with a sharp nose and a split tail, so the direction it is
  // travelling reads even in a small frame.
  const heading = player.facing;
  const nose = heading + Math.PI / 2;
  const swing = Math.PI / 4;
  const point = (angle, distance) => [
    player.x + Math.cos(angle) * distance,
    player.y + Math.sin(angle) * distance,
  ];

  // A dark rim, wide enough to hold the wick apart from whatever is behind
  // it, so the protagonist never disappears into its own halo.
  context.fillStyle = 'rgba(4, 2, 9, 0.92)';
  context.beginPath();
  const [nx, ny] = point(nose, radius * 1.95);
  const [ax, ay] = point(nose + swing, radius * 1.45);
  const [bx, by] = point(nose + Math.PI, radius * 1.2);
  const [cx, cy] = point(nose - Math.PI + swing, radius * 1.45);
  context.moveTo(nx, ny);
  context.lineTo(ax, ay);
  context.lineTo(bx, by);
  context.lineTo(cx, cy);
  context.closePath();
  context.fill();

  context.fillStyle = P.playerCore;
  context.beginPath();
  const [nx2, ny2] = point(nose, radius * 1.7);
  const [ax2, ay2] = point(nose + swing, radius * 1.2);
  const [bx2, by2] = point(nose + Math.PI, radius * 0.95);
  const [cx2, cy2] = point(nose - Math.PI + swing, radius * 1.2);
  context.moveTo(nx2, ny2);
  context.lineTo(ax2, ay2);
  context.lineTo(bx2, by2);
  context.lineTo(cx2, cy2);
  context.closePath();
  context.fill();

  // The flame at the heart of it: a warm core, so the wick is the one warm
  // thing on the field and the name on the card means something.
  context.fillStyle = P.emberCore;
  context.beginPath();
  context.arc(player.x, player.y, radius * 0.52 * flicker, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(player.x, player.y, radius * 0.26 * flicker, 0, Math.PI * 2);
  context.fill();

  // The trail of the wick, so its movement reads. It is drawn as two thin
  // streaks, a split tail, so the wick never looks like a solid shape.
  context.strokeStyle = P.playerCore;
  context.globalAlpha = 0.45;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(player.x, player.y);
  context.lineTo(
    player.x - Math.cos(heading + 0.5) * 30,
    player.y - Math.sin(heading + 0.5) * 30,
  );
  context.moveTo(player.x, player.y);
  context.lineTo(
    player.x - Math.cos(heading - 0.5) * 30,
    player.y - Math.sin(heading - 0.5) * 30,
  );
  context.stroke();
  context.globalAlpha = 1;

  if (game.shieldTime > 0) {
    // The shield, raised: a bright dashed ring of its own, so it never reads
    // as one of the ember halos. It is the wick's light turned outward.
    context.strokeStyle = P.shield;
    context.globalAlpha = 1;
    context.lineWidth = 5;
    context.setLineDash([14, 10]);
    context.lineDashOffset = -game.time * 60;
    context.beginPath();
    context.arc(player.x, player.y, CONFIG.shield.radius, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    // The light the shield throws off.
    context.globalAlpha = 0.26;
    context.fillStyle = P.shield;
    context.beginPath();
    context.arc(player.x, player.y, CONFIG.shield.radius, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 0.6;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(player.x, player.y, CONFIG.shield.radius - 4, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
  }
  context.restore();
}

/** Draw the whole night: the field and everything standing on it. */
export function drawScene(context, game, options = {}) {
  context.save();
  if (game.shake > 0.2) {
    const offset = game.shake;
    context.translate(
      Math.sin(game.time * 61) * offset * 0.5,
      Math.cos(game.time * 47) * offset * 0.5,
    );
  }
  drawBackground(context, game);
  drawThreatLines(context, game);
  for (const mote of game.motes) drawMote(context, mote);
  for (const ember of game.embers) drawEmber(context, ember);
  for (const flash of game.flashes) drawFlash(context, flash);
  for (const spark of game.sparks) drawSpark(context, spark);
  for (const burst of game.bursts) drawBurst(context, burst);
  if (options.hidePlayer !== true) drawPlayer(context, game);
  context.restore();

  if (game.flash > 0) {
    context.save();
    context.globalAlpha = Math.min(0.5, game.flash * 0.5);
    context.fillStyle = P.danger;
    context.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
    context.restore();
  }
}
