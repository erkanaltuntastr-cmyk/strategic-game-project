import PerlinNoise from "./noise.js";
import { RESOURCES, TERRAIN } from "./terrain.js";
import { analyzeMapQuality } from "./quality.js";

const DEFAULT_CONFIG = Object.freeze({
  cols: 48,
  rows: 32,
  seed: "DEFAULT",
  seaLevel: 0.42,
  mountainLevel: 0.18,
  forestLevel: 0.22,
  noiseScale: 3.2
});

/**
 * Generates deterministic map data from a strategy-map configuration.
 *
 * @param {{
 *   cols: number,
 *   rows: number,
 *   seed: string,
 *   seaLevel: number,
 *   mountainLevel: number,
 *   forestLevel: number,
 *   noiseScale: number
 * }} config
 * @returns {{
 *   cols: number,
 *   rows: number,
 *   seed: string,
 *   tiles: Array<{ col: number, row: number, terrain: object, resource: object|null, river: boolean, height: number }>,
 *   quality: object
 * }}
 */
export function generateMap(config = {}) {
  const resolved = normalizeConfig(config);
  const numericSeed = hashSeed(resolved.seed);
  const heightNoise = new PerlinNoise(numericSeed);
  const landNoise = new PerlinNoise(numericSeed ^ 0x9E3779B9);
  const rng = createSeededRandom(numericSeed ^ 0xA5A5A5A5);
  const heightMap = buildHeightMap(resolved, heightNoise);

  const tiles = [];
  for (let row = 0; row < resolved.rows; row += 1) {
    for (let col = 0; col < resolved.cols; col += 1) {
      const height = heightMap[row][col];
      const latitude = Math.abs(row / resolved.rows - 0.5) * 2;
      const landValue = landNoise.octave(
        (col / resolved.cols) * resolved.noiseScale * 1.35,
        (row / resolved.rows) * resolved.noiseScale * 1.35,
        4,
        2,
        0.5
      );

      tiles.push({
        col,
        row,
        terrain: classifyTerrain(height, latitude, landValue, resolved),
        resource: null,
        river: false,
        height
      });
    }
  }

  placeResources(tiles, rng);
  generateRivers(tiles, resolved, rng);

  const mapData = {
    cols: resolved.cols,
    rows: resolved.rows,
    seed: resolved.seed,
    tiles
  };

  mapData.quality = analyzeMapQuality(mapData);
  return mapData;
}

/**
 * Generates several deterministic candidates and returns the highest-scoring map.
 *
 * The base seed is preserved in metadata while each candidate receives a stable
 * variant seed. This keeps rerolls repeatable without hiding which candidate won.
 *
 * @param {object} config
 * @param {number} attempts
 * @returns {ReturnType<typeof generateMap>}
 */
export function generateBestMap(config = {}, attempts = 6) {
  const baseSeed = String(config.seed ?? DEFAULT_CONFIG.seed);
  const candidateCount = Math.max(1, Math.min(24, Math.floor(Number(attempts) || 1)));
  let bestMap = null;

  for (let attempt = 1; attempt <= candidateCount; attempt += 1) {
    const variantSeed = candidateCount === 1 ? baseSeed : `${baseSeed}::candidate-${attempt}`;
    const candidate = generateMap({
      ...config,
      seed: variantSeed
    });
    candidate.baseSeed = baseSeed;
    candidate.generationAttempt = attempt;
    candidate.generationAttempts = candidateCount;

    if (!bestMap || candidate.quality.score > bestMap.quality.score) {
      bestMap = candidate;
    }
  }

  bestMap.seed = baseSeed;
  bestMap.variantSeed = candidateCount === 1 ? baseSeed : `${baseSeed}::candidate-${bestMap.generationAttempt}`;
  return bestMap;
}

function normalizeConfig(config) {
  return {
    cols: clampInteger(config.cols ?? DEFAULT_CONFIG.cols, 1, 512),
    rows: clampInteger(config.rows ?? DEFAULT_CONFIG.rows, 1, 512),
    seed: String(config.seed ?? DEFAULT_CONFIG.seed),
    seaLevel: clamp01(config.seaLevel ?? DEFAULT_CONFIG.seaLevel),
    mountainLevel: clamp01(config.mountainLevel ?? DEFAULT_CONFIG.mountainLevel),
    forestLevel: clamp01(config.forestLevel ?? DEFAULT_CONFIG.forestLevel),
    noiseScale: clamp(config.noiseScale ?? DEFAULT_CONFIG.noiseScale, 1, 8)
  };
}

function buildHeightMap(config, noise) {
  const values = [];
  let min = Infinity;
  let max = -Infinity;

  for (let row = 0; row < config.rows; row += 1) {
    values[row] = [];
    for (let col = 0; col < config.cols; col += 1) {
      const x = (col / config.cols) * config.noiseScale;
      const y = (row / config.rows) * config.noiseScale;
      const value = noise.octave(x, y, 6, 2, 0.5);
      values[row][col] = value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  const span = max - min || 1;
  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      values[row][col] = (values[row][col] - min) / span;
    }
  }
  return values;
}

function classifyTerrain(height, latitude, landNoise, config) {
  if (height < config.seaLevel - 0.15) return TERRAIN.DEEP_OCEAN;
  if (height < config.seaLevel) return TERRAIN.OCEAN;
  if (height < config.seaLevel + 0.06) return TERRAIN.COAST;
  if (height > 1 - config.mountainLevel) return TERRAIN.MOUNTAIN;
  if (height > 1 - config.mountainLevel - 0.1) return TERRAIN.HILLS;
  if (latitude > 0.8) return TERRAIN.TUNDRA;
  if (latitude > 0.65) return TERRAIN.PLAINS;
  if (latitude < 0.3 && landNoise < 0.35) return TERRAIN.DESERT;
  if (landNoise < config.forestLevel) return TERRAIN.FOREST;
  if (landNoise < config.forestLevel + 0.2) return TERRAIN.GRASSLAND;
  return TERRAIN.PLAINS;
}

function placeResources(tiles, rng) {
  for (const tile of tiles) {
    if (!tile.terrain.canSettle && tile.terrain !== TERRAIN.COAST && tile.terrain !== TERRAIN.OCEAN && tile.terrain !== TERRAIN.MOUNTAIN) {
      continue;
    }
    if (rng() >= 0.08) {
      continue;
    }

    const validResources = RESOURCES.filter((resource) => (
      resource.terrain.some((terrain) => terrain.id === tile.terrain.id)
    ));
    if (validResources.length) {
      tile.resource = validResources[Math.floor(rng() * validResources.length)];
    }
  }
}

function generateRivers(tiles, config, rng) {
  const riverCount = randomInt(3, 5, rng);
  const highTiles = tiles
    .filter((tile) => tile.terrain !== TERRAIN.DEEP_OCEAN && tile.terrain !== TERRAIN.OCEAN && tile.terrain !== TERRAIN.COAST && tile.height > 0.62)
    .sort((a, b) => b.height - a.height);

  for (let index = 0; index < riverCount && highTiles.length; index += 1) {
    const startIndex = Math.min(highTiles.length - 1, Math.floor(rng() * Math.min(40, highTiles.length)));
    traceRiver(highTiles[startIndex], tiles, config, rng);
  }
}

function traceRiver(startTile, tiles, config, rng) {
  let current = startTile;
  const visited = new Set();
  const maxSteps = config.cols + config.rows;

  for (let step = 0; step < maxSteps; step += 1) {
    const key = `${current.col},${current.row}`;
    if (visited.has(key)) {
      return;
    }
    visited.add(key);

    if (current.terrain !== TERRAIN.DEEP_OCEAN && current.terrain !== TERRAIN.OCEAN) {
      current.river = true;
    }
    if (current.terrain === TERRAIN.COAST || current.terrain === TERRAIN.OCEAN || current.terrain === TERRAIN.DEEP_OCEAN) {
      return;
    }

    const candidates = getNeighbors(current, tiles, config)
      .filter((tile) => !visited.has(`${tile.col},${tile.row}`))
      .sort((a, b) => {
        const heightDelta = a.height - b.height;
        if (heightDelta !== 0) return heightDelta;
        return rng() - 0.5;
      });

    if (!candidates.length) {
      return;
    }

    const downhill = candidates.find((tile) => tile.height <= current.height + 0.025);
    current = downhill ?? candidates[0];
  }
}

function getNeighbors(tile, tiles, config) {
  const evenRow = tile.row % 2 === 0;
  const offsets = evenRow
    ? [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]]
    : [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]];

  return offsets
    .map(([dc, dr]) => getTile(tiles, config, tile.col + dc, tile.row + dr))
    .filter(Boolean);
}

function getTile(tiles, config, col, row) {
  if (col < 0 || row < 0 || col >= config.cols || row >= config.rows) {
    return null;
  }
  return tiles[row * config.cols + col] ?? null;
}

function hashSeed(seed) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randomInt(min, max, rng) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, Math.floor(Number(value) || min)));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}
