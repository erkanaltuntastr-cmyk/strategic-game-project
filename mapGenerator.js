(function exposeMapGenerator(global) {
  const DEFAULT_WIDTH = 16;
  const DEFAULT_HEIGHT = 12;

  function createWorldMap(options = {}) {
    const width = options.width ?? DEFAULT_WIDTH;
    const height = options.height ?? DEFAULT_HEIGHT;
    const startZones = options.startZones ?? createDefaultStartZones(width, height);
    const rng = options.rng ?? Math.random;
    const map = createBaseMap(width, height);

    shapeContinents(map, { width, height, startZones, rng });
    buildMountainRanges(map, { width, height, startZones, rng });
    growTerrainClusters(map, "forest", 15, 3, { width, height, startZones, rng });
    growTerrainClusters(map, "hill", 9, 2, { width, height, startZones, rng });
    protectStartZones(map, startZones);
    addMapResources(map, { width, height, startZones, rng });

    return {
      width,
      height,
      startZones,
      tiles: map,
      profile: summarizeWorld(map, { width, height })
    };
  }

  function createShowcaseWorldMap(options = {}) {
    const width = options.width ?? DEFAULT_WIDTH;
    const height = options.height ?? DEFAULT_HEIGHT;
    if (width !== DEFAULT_WIDTH || height !== DEFAULT_HEIGHT) {
      return createLargeShowcaseWorldMap(width, height);
    }
    const startZones = createDefaultStartZones(width, height);
    const terrainRows = [
      "wwwwwwwggghhhwww",
      "wggffgggghmhhggw",
      "wgffgggghmmhgggw",
      "wggggffghmhhffgw",
      "wggghhgggghfffgw",
      "wggghmhwggggffgw",
      "wfffhmhwwggghhgw",
      "wgffhhhggggghmgw",
      "wgggggffggghhmgw",
      "wghhggffgghhgggw",
      "wgggggggggffgggw",
      "wwwwgggwwwwwwwww"
    ];
    const resourcePlacements = [
      [1, 1, "fish"],
      [6, 0, "fish"],
      [11, 0, "ore"],
      [2, 2, "game"],
      [4, 4, "gold"],
      [8, 5, "fish"],
      [3, 6, "game"],
      [12, 7, "ore"],
      [14, 8, "gold"],
      [6, 9, "game"],
      [10, 10, "game"],
      [7, 11, "fish"]
    ];
    const map = terrainRows.map((row, y) => row.split("").map((code, x) => ({
      x,
      y,
      terrain: {
        g: "grassland",
        f: "forest",
        h: "hill",
        m: "mountain",
        w: "water"
      }[code],
      resource: null,
      improvement: null,
      exploredByPlayer: false,
      visibleToPlayer: false,
      showcase: true
    })));

    for (const [x, y, resource] of resourcePlacements) {
      const tile = getMapTile(map, x, y);
      if (tile) {
        tile.resource = resource;
      }
    }

    return {
      width,
      height,
      startZones,
      tiles: map,
      profile: {
        ...summarizeWorld(map, { width, height }),
        name: "Showcase Frontier",
        summary: "Hand-shaped benchmark map with fertile starts, readable coast, a central lake, forest belts, hill country, and a mountain barrier.",
        resourceText: "Balanced reference: fish, game, gold, and ore are placed to create visible settlement choices."
      }
    };
  }

  function createLargeShowcaseWorldMap(width, height) {
    const startZones = {
      player: { x: Math.max(3, Math.floor(width * 0.12)), y: Math.floor(height * 0.48) },
      enemy: { x: Math.min(width - 4, Math.floor(width * 0.86)), y: Math.floor(height * 0.5) }
    };
    const map = createBaseMap(width, height);

    for (const row of map) {
      for (const tile of row) {
        const nx = tile.x / Math.max(1, width - 1);
        const ny = tile.y / Math.max(1, height - 1);
        const northCoast = ny < 0.08 + 0.035 * Math.sin(nx * Math.PI * 8);
        const southCoast = ny > 0.92 + 0.035 * Math.sin(nx * Math.PI * 7 + 1.4);
        const westBay = nx < 0.055 + 0.04 * Math.sin(ny * Math.PI * 5);
        const eastSea = nx > 0.94 + 0.03 * Math.sin(ny * Math.PI * 6);
        const lakeA = ellipse(nx, ny, 0.36, 0.48, 0.055, 0.11);
        const lakeB = ellipse(nx, ny, 0.69, 0.28, 0.04, 0.085);
        const inlet = ellipse(nx, ny, 0.77, 0.78, 0.11, 0.055);

        if (northCoast || southCoast || westBay || eastSea || lakeA || lakeB || inlet) {
          tile.terrain = "water";
          tile.showcase = true;
          continue;
        }

        const mountainBand = Math.abs(ny - (0.5 + 0.11 * Math.sin(nx * Math.PI * 5.4))) < 0.035;
        const highlands = ellipse(nx, ny, 0.56, 0.5, 0.14, 0.18);
        const easternRidge = Math.abs(nx - 0.78) < 0.028 && ny > 0.2 && ny < 0.82;
        const forestNorth = ny < 0.28 + 0.08 * Math.sin(nx * Math.PI * 3);
        const forestSouth = ny > 0.72 + 0.06 * Math.cos(nx * Math.PI * 4);
        const forestPocket = ellipse(nx, ny, 0.22, 0.62, 0.12, 0.18) || ellipse(nx, ny, 0.84, 0.34, 0.08, 0.14);

        if ((mountainBand && tile.x % 5 !== 0) || (highlands && tile.x % 7 === 0) || easternRidge) {
          tile.terrain = "mountain";
        } else if (highlands || mountainBand || Math.abs(ny - 0.58) < 0.06 && nx > 0.18 && nx < 0.86) {
          tile.terrain = "hill";
        } else if (forestNorth || forestSouth || forestPocket) {
          tile.terrain = "forest";
        } else {
          tile.terrain = "grassland";
        }
        tile.showcase = true;
      }
    }

    protectStartZones(map, startZones);
    placeLargeShowcaseResources(map, width, height);

    return {
      width,
      height,
      startZones,
      tiles: map,
      profile: {
        ...summarizeWorld(map, { width, height }),
        name: "Long Frontier",
        summary: `${width}x${height} wide benchmark map with coasts, inland lakes, mountain corridors, forest belts, and long-distance settlement pressure.`,
        resourceText: "Large-map benchmark: resources are spread as regional settlement targets instead of tiny board markers."
      }
    };
  }

  function ellipse(nx, ny, cx, cy, rx, ry) {
    return ((nx - cx) ** 2) / (rx ** 2) + ((ny - cy) ** 2) / (ry ** 2) < 1;
  }

  function placeLargeShowcaseResources(map, width, height) {
    const placements = [
      [0.1, 0.16, "fish"],
      [0.34, 0.48, "fish"],
      [0.69, 0.28, "fish"],
      [0.78, 0.78, "fish"],
      [0.15, 0.52, "game"],
      [0.24, 0.72, "game"],
      [0.47, 0.18, "game"],
      [0.83, 0.33, "game"],
      [0.31, 0.55, "gold"],
      [0.57, 0.46, "gold"],
      [0.76, 0.62, "gold"],
      [0.44, 0.51, "ore"],
      [0.62, 0.56, "ore"],
      [0.79, 0.45, "ore"]
    ];
    for (const [px, py, resource] of placements) {
      const x = Math.max(0, Math.min(width - 1, Math.round(px * (width - 1))));
      const y = Math.max(0, Math.min(height - 1, Math.round(py * (height - 1))));
      const tile = findNearbyResourceTile(map, x, y, resource);
      if (tile) {
        tile.resource = resource;
      }
    }
  }

  function findNearbyResourceTile(map, originX, originY, resource) {
    const allowed = {
      fish: ["water"],
      game: ["grassland", "forest"],
      gold: ["hill", "mountain"],
      ore: ["hill", "mountain"]
    }[resource];
    for (let radius = 0; radius <= 5; radius += 1) {
      for (let y = originY - radius; y <= originY + radius; y += 1) {
        for (let x = originX - radius; x <= originX + radius; x += 1) {
          const tile = getMapTile(map, x, y);
          if (tile && allowed.includes(tile.terrain) && !tile.resource) {
            return tile;
          }
        }
      }
    }
    return null;
  }

  function createDefaultStartZones(width, height) {
    return {
      player: { x: 2, y: 2 },
      enemy: { x: width - 3, y: height - 3 }
    };
  }

  function createBaseMap(width, height) {
    const map = [];
    for (let y = 0; y < height; y += 1) {
      const row = [];
      for (let x = 0; x < width; x += 1) {
        row.push({
          x,
          y,
          terrain: "grassland",
          resource: null,
          improvement: null,
          exploredByPlayer: false,
          visibleToPlayer: false
        });
      }
      map.push(row);
    }
    return map;
  }

  function shapeContinents(map, context) {
    const { width, height, rng } = context;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
        const coastChance = edgeDistance === 0 ? 0.68 : edgeDistance === 1 ? 0.26 : 0.04;
        if (rng() < coastChance) {
          setTerrain(map, x, y, "water");
        }
      }
    }

    const inletCount = randomInt(3, 5, rng);
    for (let i = 0; i < inletCount; i += 1) {
      const side = randomInt(0, 3, rng);
      const cx = side < 2 ? randomInt(1, width - 2, rng) : (side === 2 ? 1 : width - 2);
      const cy = side < 2 ? (side === 0 ? 1 : height - 2) : randomInt(1, height - 2, rng);
      paintCluster(map, cx, cy, "water", randomInt(1, 2, rng), 0.74, context);
    }

    const lakeCount = randomInt(1, 3, rng);
    for (let i = 0; i < lakeCount; i += 1) {
      const cx = randomInt(4, width - 5, rng);
      const cy = randomInt(3, height - 4, rng);
      paintCluster(map, cx, cy, "water", randomInt(1, 2, rng), 0.68, context);
    }
  }

  function buildMountainRanges(map, context) {
    const { width, height, startZones, rng } = context;
    const rangeCount = randomInt(1, 3, rng);
    for (let range = 0; range < rangeCount; range += 1) {
      let x = randomInt(4, width - 5, rng);
      let y = randomInt(2, height - 4, rng);
      const length = randomInt(6, 11, rng);
      for (let step = 0; step < length; step += 1) {
        if (isStartArea(x, y, startZones)) {
          x += 1;
          y += 1;
          continue;
        }
        setTerrain(map, x, y, rng() < 0.72 ? "mountain" : "hill");
        for (const [nx, ny] of neighbors(x, y, width, height)) {
          if (!isStartArea(nx, ny, startZones) && getMapTile(map, nx, ny)?.terrain === "grassland" && rng() < 0.42) {
            setTerrain(map, nx, ny, "hill");
          }
        }
        x = clamp(x + randomInt(-1, 1, rng), 1, width - 2);
        y = clamp(y + randomInt(0, 1, rng), 1, height - 2);
      }
    }
  }

  function growTerrainClusters(map, terrain, clusterCount, radius, context) {
    const { width, height, startZones, rng } = context;
    for (let i = 0; i < clusterCount; i += 1) {
      const x = randomInt(1, width - 2, rng);
      const y = randomInt(1, height - 2, rng);
      if (isStartArea(x, y, startZones) || getMapTile(map, x, y)?.terrain === "water") {
        continue;
      }
      paintCluster(map, x, y, terrain, radius, terrain === "forest" ? 0.58 : 0.42, context);
    }
  }

  function protectStartZones(map, startZones) {
    const player = startZones.player;
    const enemy = startZones.enemy;
    const playerStart = [
      [player.x, player.y, "grassland"],
      [player.x + 1, player.y, "forest"],
      [player.x, player.y + 1, "grassland"],
      [player.x + 1, player.y + 1, "grassland"],
      [player.x + 2, player.y, "hill"],
      [player.x, player.y + 2, "forest"]
    ];
    const enemyStart = [
      [enemy.x, enemy.y, "grassland"],
      [enemy.x, enemy.y - 1, "hill"],
      [enemy.x - 1, enemy.y, "forest"],
      [enemy.x - 1, enemy.y - 1, "grassland"],
      [enemy.x - 2, enemy.y, "hill"],
      [enemy.x, enemy.y - 2, "forest"]
    ];

    for (const [x, y, terrain] of [...playerStart, ...enemyStart]) {
      setTerrain(map, x, y, terrain);
    }
  }

  function addMapResources(map, context) {
    const { startZones, rng } = context;
    const candidates = [];
    for (const row of map) {
      for (const tile of row) {
        tile.resource = null;
        if (tile.terrain === "water" && hasAdjacentLand(map, tile.x, tile.y, context)) {
          candidates.push([tile, "fish", 0.24]);
        }
        if (tile.terrain === "forest" || tile.terrain === "grassland") {
          candidates.push([tile, "game", tile.terrain === "forest" ? 0.18 : 0.1]);
        }
        if (tile.terrain === "hill") {
          candidates.push([tile, rng() < 0.45 ? "gold" : "ore", 0.22]);
        }
        if (tile.terrain === "mountain" && hasAdjacentTerrain(map, tile.x, tile.y, "hill", context)) {
          candidates.push([tile, "ore", 0.12]);
        }
      }
    }

    for (const [tile, resource, chance] of candidates) {
      if (!tile.resource && rng() < chance) {
        tile.resource = resource;
      }
    }

    ensureResourceNear(map, startZones.player.x, startZones.player.y, "game", ["grassland", "forest"], rng);
    ensureResourceNear(map, startZones.enemy.x, startZones.enemy.y, "ore", ["hill"], rng);
  }

  function summarizeWorld(map, options = {}) {
    const width = options.width ?? map[0]?.length ?? DEFAULT_WIDTH;
    const height = options.height ?? map.length ?? DEFAULT_HEIGHT;
    const terrainCounts = {};
    const resourceCounts = {};
    for (const row of map) {
      for (const tile of row) {
        terrainCounts[tile.terrain] = (terrainCounts[tile.terrain] ?? 0) + 1;
        if (tile.resource) {
          resourceCounts[tile.resource] = (resourceCounts[tile.resource] ?? 0) + 1;
        }
      }
    }

    const totalTiles = width * height;
    const waterShare = (terrainCounts.water ?? 0) / totalTiles;
    const forestShare = (terrainCounts.forest ?? 0) / totalTiles;
    const roughShare = ((terrainCounts.hill ?? 0) + (terrainCounts.mountain ?? 0)) / totalTiles;
    const name = waterShare > 0.28 ? "Broken Coast" : roughShare > 0.28 ? "Highland March" : forestShare > 0.24 ? "Green Frontier" : "Open Frontier";
    const resourceList = Object.entries(resourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([resource, count]) => `${labelResource(resource)} x${count}`)
      .slice(0, 3);

    return {
      name,
      terrainCounts,
      resourceCounts,
      summary: `${width}x${height} map with ${terrainCounts.water ?? 0} water, ${terrainCounts.forest ?? 0} forest, and ${roughShare > 0.2 ? "strong" : "light"} rough-land pressure.`,
      resourceText: resourceList.length ? resourceList.join(", ") : "No visible resource clusters yet."
    };
  }

  function ensureResourceNear(map, originX, originY, resource, terrains, rng) {
    const nearby = [];
    for (let y = originY - 2; y <= originY + 2; y += 1) {
      for (let x = originX - 2; x <= originX + 2; x += 1) {
        const tile = getMapTile(map, x, y);
        if (tile && terrains.includes(tile.terrain)) {
          nearby.push(tile);
        }
      }
    }
    if (nearby.length) {
      nearby[Math.floor(rng() * nearby.length)].resource = resource;
    }
  }

  function paintCluster(map, cx, cy, terrain, radius, chance, context) {
    const { startZones, rng } = context;
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        const tile = getMapTile(map, x, y);
        if (!tile || isStartArea(x, y, startZones)) {
          continue;
        }
        const distance = Math.abs(cx - x) + Math.abs(cy - y);
        if (distance <= radius && rng() < chance - distance * 0.1) {
          setTerrain(map, x, y, terrain);
        }
      }
    }
  }

  function hasAdjacentLand(map, x, y, context) {
    return neighbors(x, y, context.width, context.height).some(([nx, ny]) => {
      const tile = getMapTile(map, nx, ny);
      return tile && tile.terrain !== "water";
    });
  }

  function hasAdjacentTerrain(map, x, y, terrain, context) {
    return neighbors(x, y, context.width, context.height).some(([nx, ny]) => getMapTile(map, nx, ny)?.terrain === terrain);
  }

  function isStartArea(x, y, startZones) {
    const nearPlayer = Math.abs(x - startZones.player.x) <= 2 && Math.abs(y - startZones.player.y) <= 2;
    const nearEnemy = Math.abs(x - startZones.enemy.x) <= 2 && Math.abs(y - startZones.enemy.y) <= 2;
    return nearPlayer || nearEnemy;
  }

  function neighbors(x, y, width, height) {
    return [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height);
  }

  function setTerrain(map, x, y, terrain) {
    const tile = getMapTile(map, x, y);
    if (tile) {
      tile.terrain = terrain;
    }
  }

  function getMapTile(map, x, y) {
    return map[y]?.[x] ?? null;
  }

  function randomInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function labelResource(resource) {
    return {
      fish: "Fish",
      game: "Game",
      gold: "Gold",
      ore: "Ore"
    }[resource] ?? resource;
  }

  global.StrategicMapGenerator = {
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    createDefaultStartZones,
    createShowcaseWorldMap,
    createWorldMap,
    summarizeWorld
  };
})(window);
