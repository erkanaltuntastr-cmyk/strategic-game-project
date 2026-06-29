const mapLabGridEl = document.getElementById("map-lab-grid");
const mapLabProfileEl = document.getElementById("map-lab-profile");
const generateMapBtn = document.getElementById("generate-map-btn");
const showcaseMapBtn = document.getElementById("showcase-map-btn");
const LAB_MAP_WIDTH = 160;
const LAB_MAP_HEIGHT = 40;

function renderMapLab(world = StrategicMapGenerator.createShowcaseWorldMap({ width: LAB_MAP_WIDTH, height: LAB_MAP_HEIGHT })) {
  mapLabGridEl.style.setProperty("--map-columns", String(world.width));
  mapLabGridEl.style.setProperty("--tile-size", world.width > 80 ? "34px" : "56px");
  mapLabProfileEl.innerHTML = `
    <div class="selection-card primary-card">
      <span class="card-kicker">World Profile</span>
      <strong>${world.profile.name}</strong>
      <p>${world.profile.summary}</p>
      <p class="subtle">${world.profile.resourceText}</p>
    </div>
  `;

  mapLabGridEl.innerHTML = world.tiles.flat().map((tile) => {
    const resourceIcon = tile.resource
      ? `<span class="resource-icon resource-${tile.resource}" aria-label="${labelResource(tile.resource)}"></span>`
      : "";
    const adjacencyClass = getAdjacencyClass(world, tile);
    const markerClass = getStartMarkerClass(world, tile);
    return `
      <button
        class="tile ${tile.terrain} ${adjacencyClass} ${markerClass} ${tile.showcase ? "showcase-tile" : ""} ${tile.resource ? `has-resource resource-${tile.resource}` : ""}"
        type="button"
        title="${labelTerrain(tile.terrain)}${tile.resource ? ` / ${labelResource(tile.resource)}` : ""}"
      >
        ${resourceIcon}
        ${renderStartMarker(markerClass)}
      </button>
    `;
  }).join("");
}

function renderRandomMapLab() {
  renderMapLab(StrategicMapGenerator.createWorldMap({
    width: LAB_MAP_WIDTH,
    height: LAB_MAP_HEIGHT,
    startZones: StrategicMapGenerator.createDefaultStartZones(LAB_MAP_WIDTH, LAB_MAP_HEIGHT)
  }));
}

function labelResource(resource) {
  return {
    fish: "Fish",
    game: "Game",
    gold: "Gold",
    ore: "Ore"
  }[resource] ?? resource;
}

function labelTerrain(terrain) {
  return {
    grassland: "Grassland",
    forest: "Forest",
    hill: "Hills",
    mountain: "Mountains",
    water: "Water"
  }[terrain] ?? terrain;
}

function getAdjacencyClass(world, tile) {
  const adjacentTerrain = getAdjacentTiles(world, tile).map((entry) => entry.terrain);
  const classes = [];
  if (tile.terrain === "water" && adjacentTerrain.some((terrain) => terrain !== "water")) {
    classes.push("shore-water");
  }
  if (tile.terrain !== "water" && adjacentTerrain.includes("water")) {
    classes.push("shore-land");
  }
  if (tile.terrain !== "mountain" && adjacentTerrain.includes("mountain")) {
    classes.push("near-mountain");
  }
  return classes.join(" ");
}

function getAdjacentTiles(world, tile) {
  return [
    [tile.x + 1, tile.y],
    [tile.x - 1, tile.y],
    [tile.x, tile.y + 1],
    [tile.x, tile.y - 1]
  ]
    .filter(([x, y]) => x >= 0 && y >= 0 && x < world.width && y < world.height)
    .map(([x, y]) => world.tiles[y][x]);
}

function getStartMarkerClass(world, tile) {
  if (tile.x === world.startZones.player.x && tile.y === world.startZones.player.y) {
    return "player-start";
  }
  if (tile.x === world.startZones.enemy.x && tile.y === world.startZones.enemy.y) {
    return "enemy-start";
  }
  return "";
}

function renderStartMarker(markerClass) {
  if (markerClass === "player-start") {
    return '<span class="start-marker player-marker" aria-label="Player start"></span>';
  }
  if (markerClass === "enemy-start") {
    return '<span class="start-marker enemy-marker" aria-label="Enemy start"></span>';
  }
  return "";
}

generateMapBtn.addEventListener("click", renderRandomMapLab);
showcaseMapBtn.addEventListener("click", () => renderMapLab());
renderMapLab();
