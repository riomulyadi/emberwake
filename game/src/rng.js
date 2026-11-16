// A tiny deterministic random source. Every game run and every staged screenshot
// draws from a seeded stream, so the same seed always yields the same night.
export class Rng {
  constructor(seed = 1) {
    this.state = (seed >>> 0) || 1;
  }

  /** The next float in [0, 1). */
  next() {
    // xorshift32: small, fast and stable across engines.
    let x = this.state;
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    this.state = x;
    return x / 4294967296;
  }

  /** The next float in [low, high). */
  range(low, high) {
    return low + this.next() * (high - low);
  }

  /** The next whole number in [low, high]. */
  int(low, high) {
    return Math.floor(this.range(low, high + 1));
  }

  /** A random element of `items`. */
  pick(items) {
    return items[this.int(0, items.length - 1)];
  }

  /** A sign of -1 or 1. */
  sign() {
    return this.next() < 0.5 ? -1 : 1;
  }
}
