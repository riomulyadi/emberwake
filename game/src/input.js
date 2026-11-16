// Keyboard and pointer state. The game reads held keys and the keys pressed since
// the last frame; nothing else in the game touches the DOM events directly.
const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
]);

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.pointer = { x: 0, y: 0, inside: false };
    this.anyKeySinceLoad = false;
  }

  /** Attach to the window. Safe to call once per page. */
  attach(target = window) {
    target.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.held.add(event.code);
      this.pressed.add(event.code);
      this.anyKeySinceLoad = true;
      if (MOVE_KEYS.has(event.code) || event.code === 'Space') event.preventDefault();
    });
    target.addEventListener('keyup', (event) => {
      this.held.delete(event.code);
    });
    target.addEventListener('blur', () => {
      this.held.clear();
    });
    target.addEventListener('pointermove', (event) => {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.inside = true;
    });
  }

  /** Clear the "pressed since last frame" set. Call at the end of a frame. */
  endFrame() {
    this.pressed.clear();
  }

  /** Is this key held down right now? */
  down(code) {
    return this.held.has(code);
  }

  /** Was this key pressed during this frame? */
  hit(code) {
    return this.pressed.has(code);
  }

  /**
   * The movement vector the player should follow: x and y each in -1, 0 or 1,
   * normalised so a diagonal is not faster than a straight line.
   */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const scale = Math.SQRT1_2;
      x *= scale;
      y *= scale;
    }
    return { x, y };
  }
}
