import { TERRAIN } from "./terrain.js";

const WATER_IDS = new Set([TERRAIN.DEEP_OCEAN.id, TERRAIN.OCEAN.id, TERRAIN.COAST.id]);
const LAND_BLOCKER_IDS = new Set([TERRAIN.MOUNTAIN.id]);

/**
 * Scores a generated map for old-school turn-based strategy readability.
 *
 * This is not game logic. It is a generator QA layer that helps us prefer maps
 * with useful land, readable coastlines, resources, rivers, and a fair start.
 *
 * @param {{ cols: number, rows: number, tiles: Array<object> }} mapData
 * @returns {{
 *   score: number,
 *   rating: string,
 *   metrics: Record<string, number>,
 *   warnings: string[],
 *   start: ReturnType<typeof chooseStartTile>
 * }}
 */
export function analyzeMapQuality(mapData) {
  const total = mapData.tiles.length || 1;
  const landTiles = mapData.tiles.filter(isLand);
  const waterTiles = mapData.tiles.filter((tile) => WATER_IDS.has(tile.terrain.id));
  const coastTiles = mapData.tiles.filter((tile) => tile.terrain.id === TERRAIN.COAST.id);
  const mountainTiles = mapData.tiles.filter((tile) => tile.terrain.id === TERRAIN.MOUNTAIN.id);
  const riverTiles = mapData.tiles.filter((tile) => tile.river);
  const resourceTiles = mapData.tiles.filter((tile) => tile.resource);
  const settleableTiles = mapData.tiles.filter((tile) => tile.terrain.canSettle);
  const largestLandmass = findLargestLandmass(mapData);
  const start = chooseStartTile(mapData);

  const metrics = {
    landPercent: roundPercent(landTiles.length / total),
    waterPercent: roundPercent(waterTiles.length / total),
    coastPercent: roundPercent(coastTiles.length / total),
    mountainPercent: roundPercent(mountainTiles.length / total),
    riverPercent: roundPercent(riverTiles.length / total),
    resourcePercent: roundPercent(resourceTiles.length / total),
    settleablePercent: roundPercent(settleableTiles.length / total),
    largestLandmassPercent: roundPercent(largestLandmass / total),
    startScore: start?.score ?? 0
  };

  const scoreParts = [
    weightedBand(metrics.landPercent, 42, 62, 0.24),
    weightedBand(metrics.largestLandmassPercent, 24, 52, 0.18),
    weightedBand(metrics.coastPercent, 7, 22, 0.13),
    weightedBand(metrics.mountainPercent, 5, 18, 0.1),
    weightedBand(metrics.riverPercent, 1.5, 8, 0.1),
    weightedBand(metrics.resourcePercent, 4, 12, 0.1),
    weightedBand(metrics.settleablePercent, 32, 60, 0.08),
    Math.min(1, (start?.score ?? 0) / 100) * 0.07
  ];

  const score = Math.round(scoreParts.reduce((sum, part) => sum + part, 0) * 100);
  return {
    score,
    rating: getRating(score),
    metrics,
    warnings: buildWarnings(metrics, start),
    start
  };
}

/**
 * Chooses a strong starting tile without placing a unit or changing gameplay.
 *
 * @param {{ cols: number, rows: number, tiles: Array<object> }} mapData
 * @returns {{ col: number, row: number, score: number, reasons: string[] } | null}
 */
export function chooseStartTile(mapData) {
  let best = null;
  for (const tile of mapData.tiles) {
    if (!tile.terrain.canSettle || LAND_BLOCKER_IDS.has(tile.terrain.id)) {
      continue;
    }
    const edgeDistance = Math.min(tile.col, tile.row, mapData.cols - 1 - tile.col, mapData.rows - 1 - tile.row);
    const requiredMargin = mapData.cols >= 24 && mapData.rows >= 20 ? 4 : 2;
    if (mapData.cols > 12 && mapData.rows > 12 && edgeDistance < requiredMargin) {
      continue;
    }

    const radiusOne = tilesInRadius(mapData, tile, 1);
    const radiusTwo = tilesInRadius(mapData, tile, 2);
    const localYield = sumYields(radiusOne);
    const extendedYield = sumYields(radiusTwo);
    const nearbyResources = radiusTwo.filter((nearby) => nearby.resource).length;
    const nearbyRivers = radiusTwo.filter((nearby) => nearby.river).length;
    const nearbyCoast = radiusTwo.filter((nearby) => nearby.terrain.id === TERRAIN.COAST.id).length;
    const nearbyMountains = radiusTwo.filter((nearby) => nearby.terrain.id === TERRAIN.MOUNTAIN.id).length;
    const nearbyWater = radiusTwo.filter((nearby) => WATER_IDS.has(nearby.terrain.id)).length;

    let score = 0;
    score += localYield.food * 8;
    score += localYield.production * 7;
    score += localYield.gold * 4;
    score += extendedYield.food * 1.5;
    score += extendedYield.production * 1.2;
    score += nearbyResources * 10;
    score += Math.min(nearbyRivers, 3) * 6;
    score += Math.min(nearbyCoast, 4) * 3;
    score -= nearbyMountains * 3;
    score -= Math.max(0, nearbyWater - 8) * 2;
    score -= Math.max(0, 4 - edgeDistance) * 6;
    if (localYield.food < 5) score -= 16;
    if (localYield.production < 3) score -= 10;

    const reasons = [];
    if (localYield.food >= 8) reasons.push("food");
    if (localYield.production >= 5) reasons.push("production");
    if (nearbyResources > 0) reasons.push("resource");
    if (nearbyRivers > 0) reasons.push("river");
    if (nearbyCoast > 0) reasons.push("coast");

    const candidate = {
      col: tile.col,
      row: tile.row,
      score: Math.max(0, Math.min(100, Math.round(score))),
      reasons
    };

    if (!best || candidate.score > best.score) {
      best = candidate;
    }
  }
  return best;
}

function findLargestLandmass(mapData) {
  const visited = new Set();
  let largest = 0;

  for (const tile of mapData.tiles) {
    const key = getKey(tile);
    if (!isLand(tile) || visited.has(key)) {
      continue;
    }

    let size = 0;
    const stack = [tile];
    visited.add(key);
    while (stack.length) {
      const current = stack.pop();
      size += 1;
      for (const neighbor of getNeighbors(mapData, current)) {
        const neighborKey = getKey(neighbor);
        if (isLand(neighbor) && !visited.has(neighborKey)) {
          visited.add(neighborKey);
          stack.push(neighbor);
        }
      }
    }
    largest = Math.max(largest, size);
  }
  return largest;
}

function tilesInRadius(mapData, center, radius) {
  const result = [];
  const visited = new Set([getKey(center)]);
  let frontier = [center];

  for (let distance = 0; distance <= radius; distance += 1) {
    const nextFrontier = [];
    for (const tile of frontier) {
      result.push(tile);
      if (distance === radius) {
        continue;
      }
      for (const neighbor of getNeighbors(mapData, tile)) {
        const key = getKey(neighbor);
        if (!visited.has(key)) {
          visited.add(key);
          nextFrontier.push(neighbor);
        }
      }
    }
    frontier = nextFrontier;
  }

  return result;
}

function getNeighbors(mapData, tile) {
  const offsets = tile.row % 2 === 0
    ? [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]]
    : [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]];

  return offsets
    .map(([dc, dr]) => {
      const col = tile.col + dc;
      const row = tile.row + dr;
      if (col < 0 || row < 0 || col >= mapData.cols || row >= mapData.rows) return null;
      return mapData.tiles[row * mapData.cols + col] ?? null;
    })
    .filter(Boolean);
}

function sumYields(tiles) {
  return tiles.reduce((sum, tile) => {
    sum.food += tile.terrain.yields.food + (tile.resource?.yields.food ?? 0);
    sum.production += tile.terrain.yields.production + (tile.resource?.yields.production ?? 0);
    sum.gold += tile.terrain.yields.gold + (tile.resource?.yields.gold ?? 0);
    return sum;
  }, { food: 0, production: 0, gold: 0 });
}

function isLand(tile) {
  return !WATER_IDS.has(tile.terrain.id);
}

function getKey(tile) {
  return `${tile.col},${tile.row}`;
}

function roundPercent(value) {
  return Math.round(value * 1000) / 10;
}

function weightedBand(value, min, max, weight) {
  if (value >= min && value <= max) {
    return weight;
  }
  const distance = value < min ? min - value : value - max;
  const tolerance = Math.max(1, (max - min) * 0.75);
  return Math.max(0, 1 - distance / tolerance) * weight;
}

function getRating(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Playable";
  return "Weak";
}

function buildWarnings(metrics, start) {
  const warnings = [];
  if (metrics.landPercent < 35) warnings.push("Too much water");
  if (metrics.landPercent > 70) warnings.push("Too much land");
  if (metrics.largestLandmassPercent < 18) warnings.push("Land is too fragmented");
  if (metrics.coastPercent < 5) warnings.push("Coastline is thin");
  if (metrics.riverPercent < 1) warnings.push("Few rivers");
  if (metrics.resourcePercent < 3) warnings.push("Sparse resources");
  if (!start || start.score < 45) warnings.push("Weak starting area");
  return warnings;
}
