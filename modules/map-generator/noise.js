/**
 * Seeded 2D Perlin noise.
 *
 * The permutation table is shuffled with a deterministic LCG, so the same seed
 * always produces the same noise output.
 */
export default class PerlinNoise {
  /**
   * @param {number} seed Numeric seed used for deterministic permutation shuffle.
   */
  constructor(seed) {
    this.permutation = new Uint8Array(512);
    const values = new Uint8Array(256);
    for (let index = 0; index < 256; index += 1) {
      values[index] = index;
    }

    let state = seed >>> 0;
    const nextRandom = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };

    for (let index = 255; index > 0; index -= 1) {
      const swapIndex = Math.floor(nextRandom() * (index + 1));
      const current = values[index];
      values[index] = values[swapIndex];
      values[swapIndex] = current;
    }

    for (let index = 0; index < 512; index += 1) {
      this.permutation[index] = values[index & 255];
    }
  }

  /**
   * Returns Perlin noise at a 2D point.
   *
   * @param {number} x
   * @param {number} y
   * @returns {number} Noise value in the range -1 to 1.
   */
  noise(x, y) {
    const cellX = Math.floor(x) & 255;
    const cellY = Math.floor(y) & 255;
    const localX = x - Math.floor(x);
    const localY = y - Math.floor(y);
    const u = fade(localX);
    const v = fade(localY);
    const p = this.permutation;
    const a = p[cellX] + cellY;
    const b = p[cellX + 1] + cellY;

    return lerp(
      lerp(gradient(p[a], localX, localY), gradient(p[b], localX - 1, localY), u),
      lerp(gradient(p[a + 1], localX, localY - 1), gradient(p[b + 1], localX - 1, localY - 1), u),
      v
    );
  }

  /**
   * Returns normalized fractal octave noise.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} octaves
   * @param {number} lacunarity
   * @param {number} gain
   * @returns {number} Normalized value in the range 0 to 1.
   */
  octave(x, y, octaves, lacunarity, gain) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let index = 0; index < octaves; index += 1) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    if (maxAmplitude === 0) {
      return 0.5;
    }
    return clamp01((total / maxAmplitude + 1) / 2);
  }
}

function fade(value) {
  return value * value * value * (value * (value * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function gradient(hash, x, y) {
  const variant = hash & 3;
  const u = variant < 2 ? x : y;
  const v = variant < 2 ? y : x;
  return ((variant & 1) ? -u : u) + ((variant & 2) ? -v : v);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
