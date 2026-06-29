/**
 * Canvas renderer for pointy-top odd-r offset hex maps.
 *
 * This module is intentionally rendering-only: it does not generate terrain,
 * mutate map data, or depend on any framework.
 */
export class HexRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   hexSize?: number,
   *   textures?: Record<string|number, HTMLImageElement>,
   *   resourceTextures?: Record<string, HTMLImageElement>,
   *   markerTextures?: Record<string, HTMLImageElement>,
   *   showGrid?: boolean,
   *   showCoords?: boolean
   * }} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.hexSize = options.hexSize ?? 32;
    this.textures = options.textures ?? {};
    this.resourceTextures = options.resourceTextures ?? {};
    this.markerTextures = options.markerTextures ?? {};
    this.showGrid = options.showGrid ?? true;
    this.showCoords = options.showCoords ?? false;
    this.lastMapData = null;
  }

  /**
   * Loads terrain textures keyed by terrain id.
   *
   * @param {Record<string|number, string>} textureMap
   * @returns {Promise<Record<string|number, HTMLImageElement>>}
   */
  async loadTextures(textureMap) {
    this.textures = await loadImages(textureMap);
    return this.textures;
  }

  /**
   * Loads resource icon textures keyed by resource id.
   *
   * @param {Record<string, string>} textureMap
   * @returns {Promise<Record<string, HTMLImageElement>>}
   */
  async loadResourceTextures(textureMap) {
    this.resourceTextures = await loadImages(textureMap);
    return this.resourceTextures;
  }

  /**
   * Loads marker textures keyed by marker id.
   *
   * @param {Record<string, string>} textureMap
   * @returns {Promise<Record<string, HTMLImageElement>>}
   */
  async loadMarkerTextures(textureMap) {
    this.markerTextures = await loadImages(textureMap);
    return this.markerTextures;
  }

  /**
   * Clears the canvas and draws all map hexes.
   *
   * @param {{ cols: number, rows: number, tiles: Array<object> }} mapData
   * @param {number} panX
   * @param {number} panY
   */
  render(mapData, panX = 0, panY = 0) {
    this.lastMapData = mapData;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const tile of mapData.tiles) {
      const center = this.hexToPixel(tile.col, tile.row, this.hexSize);
      const cx = center.x + panX;
      const cy = center.y + panY;
      const terrainId = getTerrainId(tile);
      const texture = this.textures[terrainId] ?? this.textures[String(terrainId)];
      const fallbackColor = tile.terrain?.color ?? "#777777";

      this.drawHex(ctx, cx, cy, this.hexSize, texture ?? fallbackColor);

      if (this.showGrid) {
        strokeHex(ctx, cx, cy, this.hexSize, "rgba(0, 0, 0, 0.28)", 1);
      }

      if (this.showCoords) {
        drawCenteredText(ctx, `${tile.col},${tile.row}`, cx, cy, "rgba(255,255,255,0.82)", 10);
      }
    }
  }

  /**
   * Renders optional map overlays.
   *
   * @param {{ cols: number, rows: number, tiles: Array<object> }} mapData
   * @param {number} panX
   * @param {number} panY
   * @param {{ showRivers?: boolean, showResources?: boolean, showFog?: boolean, showStarts?: boolean, start?: object }} options
   */
  renderOverlays(mapData, panX = 0, panY = 0, options = {}) {
    if (options.showRivers) {
      this.drawRivers(mapData, panX, panY);
    }
    if (options.showResources) {
      this.drawResources(mapData, panX, panY);
    }
    if (options.showStarts && options.start) {
      this.drawStartMarker(options.start, panX, panY);
    }
    if (options.showFog) {
      this.drawFog(mapData, panX, panY);
    }
  }

  /**
   * Converts odd-r offset hex coordinates to pixel center coordinates.
   *
   * @param {number} col
   * @param {number} row
   * @param {number} size
   * @returns {{ x: number, y: number }}
   */
  hexToPixel(col, row, size = this.hexSize) {
    const width = Math.sqrt(3) * size;
    return {
      x: width * col + (row % 2 === 1 ? width / 2 : 0) + size,
      y: size * 1.5 * row + size
    };
  }

  /**
   * Clips to a hex shape and draws either an image texture or a fallback color.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx
   * @param {number} cy
   * @param {number} size
   * @param {HTMLImageElement|string} fill
   */
  drawHex(ctx, cx, cy, size, fill) {
    ctx.save();
    beginHexPath(ctx, cx, cy, size);
    ctx.clip();

    if (isDrawableImage(fill)) {
      const bounds = getHexBounds(cx, cy, size);
      ctx.drawImage(fill, bounds.x, bounds.y, bounds.width, bounds.height);
    } else {
      ctx.fillStyle = fill;
      ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
    }

    ctx.restore();
  }

  /**
   * Converts a canvas pixel position to the nearest hex coordinate.
   *
   * @param {number} px
   * @param {number} py
   * @param {number} panX
   * @param {number} panY
   * @returns {{ col: number, row: number } | null}
   */
  hexAtPixel(px, py, panX = 0, panY = 0) {
    const mapData = this.lastMapData;
    if (!mapData) {
      return null;
    }

    const localX = px - panX;
    const localY = py - panY;
    const size = this.hexSize;
    const width = Math.sqrt(3) * size;
    const approxRow = Math.round((localY - size) / (size * 1.5));
    const clampedRow = clampInteger(approxRow, 0, mapData.rows - 1);
    const rowOffset = clampedRow % 2 === 1 ? width / 2 : 0;
    const approxCol = Math.round((localX - size - rowOffset) / width);
    const clampedCol = clampInteger(approxCol, 0, mapData.cols - 1);

    const candidates = [
      [clampedCol, clampedRow],
      ...getNeighborCoords(clampedCol, clampedRow)
    ].filter(([col, row]) => col >= 0 && row >= 0 && col < mapData.cols && row < mapData.rows);

    let best = null;
    let bestDistance = Infinity;
    for (const [col, row] of candidates) {
      const center = this.hexToPixel(col, row, size);
      const distance = (center.x - localX) ** 2 + (center.y - localY) ** 2;
      if (distance < bestDistance && pointInHex(localX, localY, center.x, center.y, size)) {
        best = { col, row };
        bestDistance = distance;
      }
    }

    return best;
  }

  drawRivers(mapData, panX, panY) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(58, 166, 214, 0.88)";
    ctx.lineWidth = Math.max(2, this.hexSize * 0.12);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const tile of mapData.tiles) {
      if (!tile.river) continue;
      const center = this.hexToPixel(tile.col, tile.row, this.hexSize);
      const cx = center.x + panX;
      const cy = center.y + panY;
      const riverNeighbors = getNeighborTiles(tile, mapData).filter((neighbor) => neighbor.river);

      if (!riverNeighbors.length) {
        drawRiverDot(ctx, cx, cy, this.hexSize);
        continue;
      }

      for (const neighbor of riverNeighbors) {
        if (neighbor.row < tile.row || (neighbor.row === tile.row && neighbor.col < tile.col)) {
          continue;
        }
        const next = this.hexToPixel(neighbor.col, neighbor.row, this.hexSize);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(next.x + panX, next.y + panY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawResources(mapData, panX, panY) {
    const ctx = this.ctx;
    for (const tile of mapData.tiles) {
      if (!tile.resource) continue;
      const center = this.hexToPixel(tile.col, tile.row, this.hexSize);
      const resourceId = tile.resource.id ?? tile.resource;
      const texture = this.resourceTextures[resourceId];
      const x = center.x + panX;
      const y = center.y + panY;

      ctx.save();
      if (isDrawableImage(texture)) {
        const size = Math.max(12, this.hexSize * 0.72);
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = Math.max(2, this.hexSize * 0.12);
        ctx.drawImage(texture, x - size / 2, y - size / 2, size, size);
      } else {
        const radius = Math.max(3, this.hexSize * 0.18);
        ctx.fillStyle = getResourceColor(tile.resource);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawStartMarker(start, panX, panY) {
    const ctx = this.ctx;
    const center = this.hexToPixel(start.col, start.row, this.hexSize);
    const x = center.x + panX;
    const y = center.y + panY;
    const marker = this.markerTextures.playerStart;

    ctx.save();
    if (isDrawableImage(marker)) {
      const size = Math.max(18, this.hexSize * 1.15);
      ctx.shadowColor = "rgba(88, 166, 255, 0.55)";
      ctx.shadowBlur = Math.max(6, this.hexSize * 0.35);
      ctx.drawImage(marker, x - size / 2, y - size / 2, size, size);
    } else {
      strokeHex(ctx, x, y, this.hexSize * 0.92, "rgba(88, 166, 255, 0.95)", Math.max(2, this.hexSize * 0.12));
      ctx.fillStyle = "rgba(88, 166, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(x, y, Math.max(4, this.hexSize * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawFog(mapData, panX, panY) {
    const ctx = this.ctx;
    for (const tile of mapData.tiles) {
      const explored = tile.explored ?? tile.exploredByPlayer ?? true;
      if (explored) continue;
      const center = this.hexToPixel(tile.col, tile.row, this.hexSize);
      ctx.save();
      beginHexPath(ctx, center.x + panX, center.y + panY, this.hexSize);
      ctx.fillStyle = "rgba(3, 6, 8, 0.72)";
      ctx.fill();
      ctx.restore();
    }
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
    image.src = url;
  });
}

async function loadImages(textureMap) {
  const entries = await Promise.all(
    Object.entries(textureMap).map(async ([key, url]) => {
      const image = await loadImage(url);
      return [key, image];
    })
  );
  return Object.fromEntries(entries);
}

function beginHexPath(ctx, cx, cy, size) {
  ctx.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function strokeHex(ctx, cx, cy, size, color, lineWidth) {
  ctx.save();
  beginHexPath(ctx, cx, cy, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function getHexBounds(cx, cy, size) {
  const width = Math.sqrt(3) * size;
  return {
    x: cx - width / 2,
    y: cy - size,
    width,
    height: size * 2
  };
}

function pointInHex(px, py, cx, cy, size) {
  const points = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 180) * (60 * index - 30);
    points.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
  }

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawCenteredText(ctx, text, x, y, color, size) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawRiverDot(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = "rgba(58, 166, 214, 0.88)";
  ctx.beginPath();
  ctx.arc(x, y, Math.max(2, size * 0.1), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getNeighborTiles(tile, mapData) {
  return getNeighborCoords(tile.col, tile.row)
    .map(([col, row]) => {
      if (col < 0 || row < 0 || col >= mapData.cols || row >= mapData.rows) return null;
      return mapData.tiles[row * mapData.cols + col] ?? null;
    })
    .filter(Boolean);
}

function getNeighborCoords(col, row) {
  const offsets = row % 2 === 0
    ? [[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]]
    : [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]];
  return offsets.map(([dc, dr]) => [col + dc, row + dr]);
}

function getTerrainId(tile) {
  return tile.terrain?.id ?? tile.terrainId ?? tile.terrain;
}

function getResourceColor(resource) {
  const id = resource.id ?? resource;
  return {
    GOLD_DEPOSIT: "#f1c84b",
    IRON_ORE: "#b7b2a4",
    FISH: "#7bd8e8",
    GAME_ANIMALS: "#c78f52",
    WHEAT: "#e4c75b"
  }[id] ?? "#ffffff";
}

function isDrawableImage(value) {
  return value && typeof value === "object" && typeof value.width === "number" && typeof value.height === "number";
}

function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export default HexRenderer;
