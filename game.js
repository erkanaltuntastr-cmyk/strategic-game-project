const MAP_WIDTH = StrategicMapGenerator.DEFAULT_WIDTH;
const MAP_HEIGHT = StrategicMapGenerator.DEFAULT_HEIGHT;
const START_ZONES = StrategicMapGenerator.createDefaultStartZones(MAP_WIDTH, MAP_HEIGHT);

const terrainConfig = {
  grassland: { label: "Grassland", read: "fertile open country", food: 2, production: 1, gold: 0, moveCost: 1, symbol: "", defense: 0 },
  forest: { label: "Forest", read: "timber and cover", food: 1, production: 2, gold: 0, moveCost: 1, symbol: "", defense: 1 },
  hill: { label: "Hills", read: "rough production land", food: 0, production: 2, gold: 1, moveCost: 1, symbol: "", defense: 1 },
  mountain: { label: "Mountains", read: "natural barrier", food: 0, production: 1, gold: 0, moveCost: 99, symbol: "", defense: 2 },
  water: { label: "Water", read: "coast, lake, or sea", food: 2, production: 0, gold: 1, moveCost: 99, symbol: "", defense: 0 }
};
const resourceConfig = {
  fish: { label: "Fish", shortLabel: "Fish", terrain: ["water"], food: 1, production: 0, gold: 0, symbol: "Fish" },
  game: { label: "Game", shortLabel: "Game", terrain: ["grassland", "forest"], food: 1, production: 0, gold: 0, symbol: "Game" },
  gold: { label: "Gold", shortLabel: "Gold", terrain: ["hill"], food: 0, production: 0, gold: 2, symbol: "Gold" },
  ore: { label: "Ore", shortLabel: "Ore", terrain: ["hill", "mountain"], food: 0, production: 1, gold: 0, symbol: "Ore" }
};
const unitTypes = {
  Settler: { attack: 0, health: 2, movement: 1, symbol: "St", role: "Found cities and improve nearby land.", order: "Look for food and production before settling." },
  Scout: { attack: 1, health: 2, movement: 2, symbol: "Sc", role: "Reveal land quickly and locate resources.", order: "Push into fog, avoid direct fights." },
  Warrior: { attack: 2, health: 3, movement: 1, symbol: "Wr", role: "Protect settlements and pressure enemies.", order: "Hold chokepoints or escort settlers." }
};
const productionCosts = {
  Warrior: 8,
  Settler: 12
};

const state = {
  turn: 1,
  nextId: 1,
  map: [],
  units: [],
  cities: [],
  selectedUnitId: null,
  inspectedTile: null,
  worldProfile: null,
  debugVisible: false,
  logs: [],
  winner: null
};

const mapEl = document.getElementById("map");
const logEl = document.getElementById("log");
const turnCounterEl = document.getElementById("turn-counter");
const selectionPanelEl = document.getElementById("selection-panel");
const actionPanelEl = document.getElementById("action-panel");
const resourceSummaryEl = document.getElementById("resource-summary");
const legendEl = document.getElementById("legend");
const endTurnBtn = document.getElementById("end-turn-btn");
const nextUnitBtn = document.getElementById("next-unit-btn");
const restartBtn = document.getElementById("restart-btn");
const debugIndicatorEl = document.getElementById("debug-indicator");

function init() {
  renderLegend();
  createGame();
  render();
  bindEvents();
}

function bindEvents() {
  endTurnBtn.addEventListener("click", endTurn);
  nextUnitBtn.addEventListener("click", () => {
    cyclePlayerUnits(true);
    render();
  });
  restartBtn.addEventListener("click", () => {
    createGame();
    render();
  });
  document.addEventListener("keydown", handleKeydown);
}

function handleKeydown(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }
  const key = event.key.toLowerCase();
  if (key === "d") {
    event.preventDefault();
    state.debugVisible = !state.debugVisible;
    render();
    return;
  }
  if (key === "tab") {
    event.preventDefault();
    cyclePlayerUnits(true);
    render();
    return;
  }
  if (key === "enter") {
    event.preventDefault();
    endTurn();
    return;
  }
  if (key === "r") {
    event.preventDefault();
    createGame();
    render();
    return;
  }

  const directionMap = {
    arrowup: [0, -1],
    arrowdown: [0, 1],
    arrowleft: [-1, 0],
    arrowright: [1, 0]
  };
  const direction = directionMap[key];
  if (!direction) {
    return;
  }
  event.preventDefault();
  moveSelectedUnitBy(direction[0], direction[1]);
}

function createGame() {
  state.turn = 1;
  state.nextId = 1;
  state.logs = [];
  state.winner = null;
  state.selectedUnitId = null;
  state.inspectedTile = { ...START_ZONES.player };
  const world = StrategicMapGenerator.createWorldMap({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    startZones: START_ZONES
  });
  state.map = world.tiles;
  state.worldProfile = world.profile;
  state.units = [];
  state.cities = [];

  addUnit("player", "Settler", START_ZONES.player.x, START_ZONES.player.y);
  addUnit("player", "Scout", START_ZONES.player.x + 1, START_ZONES.player.y);
  addUnit("player", "Warrior", START_ZONES.player.x, START_ZONES.player.y + 1);
  addUnit("enemy", "Warrior", START_ZONES.enemy.x, START_ZONES.enemy.y - 1);
  addCity("enemy", "Red Keep", START_ZONES.enemy.x, START_ZONES.enemy.y);

  revealAroundPlayer();
  cyclePlayerUnits(false);
  log("A new frontier opens. Found your first city.");
  log(`${state.worldProfile.name}: ${state.worldProfile.summary}`);
}

function addUnit(owner, type, x, y) {
  const unit = {
    id: `unit_${state.nextId++}`,
    owner,
    type,
    x,
    y,
    attack: unitTypes[type].attack,
    health: unitTypes[type].health,
    maxHealth: unitTypes[type].health,
    movementRemaining: unitTypes[type].movement,
    maxMovement: unitTypes[type].movement
  };
  state.units.push(unit);
  return unit;
}

function addCity(owner, name, x, y) {
  const city = {
    id: `city_${state.nextId++}`,
    owner,
    name,
    x,
    y,
    population: 1,
    foodStored: 0,
    productionStored: 0,
    currentProduction: "Warrior",
    health: 8,
    maxHealth: 8
  };
  state.cities.push(city);
  return city;
}

function getTile(x, y) {
  return state.map[y]?.[x] ?? null;
}

function getUnitAt(x, y) {
  return state.units.find((unit) => unit.x === x && unit.y === y);
}

function getCityAt(x, y) {
  return state.cities.find((city) => city.x === x && city.y === y);
}

function getSelectedUnit() {
  return state.units.find((unit) => unit.id === state.selectedUnitId) ?? null;
}

function getPlayerUnits(onlyReady = false) {
  return state.units.filter((unit) => (
    unit.owner === "player" && (!onlyReady || unit.movementRemaining > 0)
  ));
}

function selectUnit(unit) {
  state.selectedUnitId = unit?.id ?? null;
  if (unit) {
    state.inspectedTile = { x: unit.x, y: unit.y };
  }
}

function cyclePlayerUnits(onlyReady = false) {
  const units = getPlayerUnits(onlyReady);
  if (!units.length) {
    if (!onlyReady) {
      state.selectedUnitId = null;
    }
    return;
  }
  const currentIndex = units.findIndex((unit) => unit.id === state.selectedUnitId);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % units.length;
  selectUnit(units[nextIndex]);
}

function isAdjacent(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

function handleTileClick(x, y) {
  if (state.winner) {
    return;
  }
  state.inspectedTile = { x, y };
  const unit = getUnitAt(x, y);
  if (unit?.owner === "player") {
    selectUnit(unit);
    render();
    return;
  }

  const selectedUnit = getSelectedUnit();
  if (!selectedUnit) {
    render();
    return;
  }

  if (!isAdjacent(selectedUnit.x, selectedUnit.y, x, y)) {
    render();
    return;
  }

  attemptMoveOrAttack(selectedUnit, x, y);
  render();
}

function moveSelectedUnitBy(dx, dy) {
  const unit = getSelectedUnit();
  if (!unit || state.winner) {
    return;
  }
  const targetX = unit.x + dx;
  const targetY = unit.y + dy;
  if (!getTile(targetX, targetY)) {
    return;
  }
  state.inspectedTile = { x: targetX, y: targetY };
  attemptMoveOrAttack(unit, targetX, targetY);
  render();
}

function canEnterTile(unit, tile) {
  return tile && terrainConfig[tile.terrain].moveCost <= unit.movementRemaining;
}

function getDefenseBonus(x, y) {
  const tile = getTile(x, y);
  const city = getCityAt(x, y);
  return (tile ? terrainConfig[tile.terrain].defense : 0) + (city ? 1 : 0);
}

function attemptMoveOrAttack(unit, targetX, targetY) {
  if (unit.movementRemaining < 1) {
    log(`${unit.type} has no movement left this turn.`);
    return;
  }

  const tile = getTile(targetX, targetY);
  if (!canEnterTile(unit, tile)) {
    log("That tile cannot be entered.");
    return;
  }

  const defender = getUnitAt(targetX, targetY);
  const city = getCityAt(targetX, targetY);

  if (defender && defender.owner !== unit.owner) {
    resolveCombat(unit, defender);
    unit.movementRemaining = 0;
    return;
  }

  if (city && city.owner !== unit.owner) {
    attackCity(unit, city);
    unit.movementRemaining = 0;
    return;
  }

  if (defender || city) {
    log("A friendly piece already occupies that tile.");
    return;
  }

  unit.x = targetX;
  unit.y = targetY;
  unit.movementRemaining -= terrainConfig[tile.terrain].moveCost;
  state.inspectedTile = { x: unit.x, y: unit.y };
  revealAroundPlayer();
}

function resolveCombat(attacker, defender) {
  const attackPower = Math.max(1, attacker.attack);
  const defenderReduction = getDefenseBonus(defender.x, defender.y);
  const defenderDamage = Math.max(1, attackPower - defenderReduction);
  defender.health -= defenderDamage;
  log(`${attacker.type} attacks an enemy ${defender.type} for ${defenderDamage}.`);

  if (defender.health <= 0) {
    state.units = state.units.filter((unit) => unit.id !== defender.id);
    attacker.x = defender.x;
    attacker.y = defender.y;
    state.inspectedTile = { x: attacker.x, y: attacker.y };
    log("Enemy unit defeated.");
    revealAroundPlayer();
    return;
  }

  const retaliation = Math.max(1, defender.attack + getDefenseBonus(defender.x, defender.y) - (attacker.type === "Warrior" ? 1 : 0));
  attacker.health -= retaliation;
  log(`${defender.type} retaliates for ${retaliation}.`);
  if (attacker.health <= 0) {
    state.units = state.units.filter((unit) => unit.id !== attacker.id);
    state.selectedUnitId = null;
    log(`${attacker.type} was lost in battle.`);
  }
}

function attackCity(attacker, city) {
  const damage = Math.max(1, attacker.attack - getDefenseBonus(city.x, city.y));
  city.health -= damage;
  log(`${attacker.type} attacks ${city.name} for ${damage}.`);
  if (city.health <= 0) {
    state.cities = state.cities.filter((entry) => entry.id !== city.id);
    attacker.x = city.x;
    attacker.y = city.y;
    state.inspectedTile = { x: attacker.x, y: attacker.y };
    log(`${city.name} has fallen.`);
    if (city.owner === "enemy") {
      state.winner = "player";
      log("Victory. The enemy capital is conquered.");
    }
    revealAroundPlayer();
    return;
  }
  const retaliation = 1 + getDefenseBonus(city.x, city.y);
  attacker.health -= retaliation;
  log(`${city.name} resists for ${retaliation}.`);
  if (attacker.health <= 0) {
    state.units = state.units.filter((unit) => unit.id !== attacker.id);
    state.selectedUnitId = null;
    log(`${attacker.type} fell attacking the city.`);
  }
}

function revealAroundPlayer() {
  for (const row of state.map) {
    for (const tile of row) {
      tile.visibleToPlayer = false;
    }
  }

  for (const unit of state.units.filter((entry) => entry.owner === "player")) {
    revealRadius(unit.x, unit.y, unit.type === "Scout" ? 2 : 1);
  }
  for (const city of state.cities.filter((entry) => entry.owner === "player")) {
    revealRadius(city.x, city.y, 2);
  }
}

function revealRadius(cx, cy, radius) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const tile = getTile(x, y);
      if (!tile) continue;
      const distance = Math.abs(cx - x) + Math.abs(cy - y);
      if (distance <= radius) {
        tile.visibleToPlayer = true;
        tile.exploredByPlayer = true;
      }
    }
  }
}

function foundCity() {
  const unit = getSelectedUnit();
  if (!unit || unit.type !== "Settler") {
    return;
  }
  if (getCityAt(unit.x, unit.y)) {
    log("A city already exists here.");
    return;
  }
  addCity("player", `New Haven ${state.cities.filter((city) => city.owner === "player").length + 1}`, unit.x, unit.y);
  state.units = state.units.filter((entry) => entry.id !== unit.id);
  state.selectedUnitId = null;
  revealAroundPlayer();
  cyclePlayerUnits(true);
  log("A new city is founded.");
  render();
}

function improveTile() {
  const unit = getSelectedUnit();
  if (!unit || unit.type !== "Settler") {
    return;
  }
  const tile = getTile(unit.x, unit.y);
  if (!tile || tile.improvement) {
    log("This tile already has an improvement.");
    return;
  }
  if (tile.terrain === "water" || tile.terrain === "mountain") {
    log("This terrain cannot be improved in version 0.1.");
    return;
  }
  tile.improvement = tile.terrain === "grassland" ? "farm" : "mine";
  unit.movementRemaining = 0;
  log(`${unit.type} builds a ${tile.improvement}.`);
  render();
}

function changeCityProduction(cityId, production) {
  const city = state.cities.find((entry) => entry.id === cityId);
  if (!city) {
    return;
  }
  city.currentProduction = production;
  log(`${city.name} switches to ${production}.`);
  render();
}

function calculateTileYield(tile) {
  const base = terrainConfig[tile.terrain];
  const resource = tile.resource ? resourceConfig[tile.resource] : null;
  const yieldData = {
    food: base.food + (resource?.food ?? 0),
    production: base.production + (resource?.production ?? 0),
    gold: base.gold + (resource?.gold ?? 0)
  };
  if (tile.improvement === "farm") yieldData.food += 1;
  if (tile.improvement === "mine") yieldData.production += 1;
  return yieldData;
}

function formatYield(yieldData) {
  return `Food ${yieldData.food} / Production ${yieldData.production} / Gold ${yieldData.gold}`;
}

function getWorkedTiles(city) {
  const tiles = [];
  for (let y = city.y - 1; y <= city.y + 1; y += 1) {
    for (let x = city.x - 1; x <= city.x + 1; x += 1) {
      const tile = getTile(x, y);
      if (!tile || tile.terrain === "mountain" || tile.terrain === "water") continue;
      tiles.push(tile);
    }
  }
  tiles.sort((a, b) => {
    const yieldA = calculateTileYield(a);
    const yieldB = calculateTileYield(b);
    return (yieldB.food + yieldB.production + yieldB.gold) - (yieldA.food + yieldA.production + yieldA.gold);
  });
  return tiles.slice(0, city.population + 1);
}

function processCityTurn(city) {
  const workedTiles = getWorkedTiles(city);
  const totals = workedTiles.reduce((sum, tile) => {
    const yields = calculateTileYield(tile);
    sum.food += yields.food;
    sum.production += yields.production;
    sum.gold += yields.gold;
    return sum;
  }, { food: 0, production: 0, gold: 0 });

  city.foodStored += totals.food;
  city.productionStored += totals.production;
  city.health = Math.min(city.maxHealth, city.health + 1);

  const foodNeeded = city.population * 6;
  if (city.foodStored >= foodNeeded) {
    city.foodStored -= foodNeeded;
    city.population += 1;
    log(`${city.name} grows to population ${city.population}.`);
  }

  const cost = productionCosts[city.currentProduction];
  if (city.productionStored >= cost) {
    city.productionStored -= cost;
    spawnProducedUnit(city, city.currentProduction);
  }

  return totals;
}

function spawnProducedUnit(city, type) {
  const spawnSpots = [
    [city.x + 1, city.y],
    [city.x - 1, city.y],
    [city.x, city.y + 1],
    [city.x, city.y - 1]
  ];
  for (const [x, y] of spawnSpots) {
    const tile = getTile(x, y);
    if (!tile || terrainConfig[tile.terrain].moveCost > 1 || getUnitAt(x, y) || getCityAt(x, y)) {
      continue;
    }
    addUnit(city.owner, type, x, y);
    log(`${city.name} produces a ${type}.`);
    return;
  }
  log(`${city.name} completes ${type}, but no adjacent tile is free.`);
}

function enemyTurn() {
  for (const unit of state.units.filter((entry) => entry.owner === "enemy")) {
    unit.movementRemaining = unit.maxMovement;
    const targetCity = state.cities.find((city) => city.owner === "player");
    if (!targetCity) {
      state.winner = "enemy";
      log("Defeat. No player cities remain.");
      return;
    }

    const possibleSteps = [
      [unit.x + 1, unit.y],
      [unit.x - 1, unit.y],
      [unit.x, unit.y + 1],
      [unit.x, unit.y - 1]
    ].filter(([x, y]) => {
      const tile = getTile(x, y);
      return tile && terrainConfig[tile.terrain].moveCost <= 1;
    });

    const adjacentTarget = possibleSteps.find(([x, y]) => x === targetCity.x && y === targetCity.y);
    if (adjacentTarget) {
      attackCity(unit, targetCity);
      continue;
    }

    const adjacentPlayer = possibleSteps
      .map(([x, y]) => getUnitAt(x, y))
      .find((entry) => entry?.owner === "player");
    if (adjacentPlayer) {
      resolveCombat(unit, adjacentPlayer);
      continue;
    }

    possibleSteps.sort((a, b) => {
      const distA = Math.abs(a[0] - targetCity.x) + Math.abs(a[1] - targetCity.y);
      const distB = Math.abs(b[0] - targetCity.x) + Math.abs(b[1] - targetCity.y);
      return distA - distB;
    });

    const [bestX, bestY] = possibleSteps.find(([x, y]) => !getUnitAt(x, y) && !getCityAt(x, y)) ?? [];
    if (bestX !== undefined) {
      unit.x = bestX;
      unit.y = bestY;
    }
  }

  for (const city of state.cities.filter((entry) => entry.owner === "enemy")) {
    processCityTurn(city);
  }
}

function endTurn() {
  if (state.winner) {
    return;
  }

  let totalFood = 0;
  let totalProduction = 0;
  let totalGold = 0;

  for (const city of state.cities.filter((entry) => entry.owner === "player")) {
    const yields = processCityTurn(city);
    totalFood += yields.food;
    totalProduction += yields.production;
    totalGold += yields.gold;
  }

  enemyTurn();

  for (const unit of state.units.filter((entry) => entry.owner === "player")) {
    unit.movementRemaining = unit.maxMovement;
    unit.health = Math.min(unit.maxHealth, unit.health + 1);
  }

  state.turn += 1;
  revealAroundPlayer();
  cyclePlayerUnits(true);
  log(`Turn summary: +${totalFood} food, +${totalProduction} production, +${totalGold} gold.`);

  if (!state.cities.some((city) => city.owner === "player")) {
    state.winner = "enemy";
    log("Defeat. Your last city is gone.");
  }

  render();
}

function log(message) {
  state.logs.unshift({ turn: state.turn, message });
  state.logs = state.logs.slice(0, 14);
}

function renderLegend() {
  const items = ["grassland", "forest", "hill", "water", "mountain"];
  legendEl.innerHTML = items.map((cls) => (
    `<span class="legend-item"><span class="swatch ${cls}" style="background: var(--${cls === "water" ? "water" : cls});"></span>${terrainConfig[cls].label}</span>`
  )).join("");
}

function getTileBadge(tile) {
  if (tile.improvement) {
    return tile.improvement === "farm" ? "Farm" : "Mine";
  }
  if (tile.resource) {
    return resourceConfig[tile.resource].shortLabel;
  }
  return "";
}

function render() {
  document.body.classList.toggle("debug-visible", state.debugVisible);
  debugIndicatorEl.textContent = state.debugVisible ? "Debug On" : "Debug Off";
  turnCounterEl.textContent = String(state.turn);
  renderMap();
  renderSelection();
  renderActions();
  renderResources();
  renderLogs();
}

function renderMap() {
  mapEl.style.setProperty("--map-columns", String(MAP_WIDTH));
  const selectedUnit = getSelectedUnit();
  const validMoves = new Set();
  const attackableTiles = new Set();

  if (selectedUnit) {
    [
      [selectedUnit.x + 1, selectedUnit.y],
      [selectedUnit.x - 1, selectedUnit.y],
      [selectedUnit.x, selectedUnit.y + 1],
      [selectedUnit.x, selectedUnit.y - 1]
    ].forEach(([x, y]) => {
      const tile = getTile(x, y);
      const defender = getUnitAt(x, y);
      const city = getCityAt(x, y);
      if (!tile || !tile.visibleToPlayer) {
        return;
      }
      if ((defender && defender.owner !== selectedUnit.owner) || (city && city.owner !== selectedUnit.owner)) {
        attackableTiles.add(`${x},${y}`);
      } else if (canEnterTile(selectedUnit, tile)) {
        validMoves.add(`${x},${y}`);
      }
    });
  }

  mapEl.innerHTML = state.map.flat().map((tile) => {
    const unit = getUnitAt(tile.x, tile.y);
    const city = getCityAt(tile.x, tile.y);
    const hidden = !tile.exploredByPlayer;
    const revealed = tile.exploredByPlayer && !tile.visibleToPlayer;
    const selected = selectedUnit?.x === tile.x && selectedUnit?.y === tile.y;
    const canMove = validMoves.has(`${tile.x},${tile.y}`);
    const attackable = attackableTiles.has(`${tile.x},${tile.y}`);
    const yields = calculateTileYield(tile);
    const pieceMarkup = hidden ? "" : city
      ? `<span class="piece city ${city.owner === "player" ? "player" : "enemy"}"><span class="content">${city.owner === "player" ? "C" : "!"}</span></span>`
      : unit
        ? `<span class="piece unit ${unit.owner === "player" ? "player" : "enemy"} ${unit.type.toLowerCase()}"><span class="content">${unit.owner === "player" ? unitTypes[unit.type].symbol : unitTypes[unit.type].symbol}</span></span>`
        : "";
    const terrainSymbol = hidden || pieceMarkup ? "" : terrainConfig[tile.terrain].symbol;
    const badge = hidden ? "" : getTileBadge(tile);
    const health = city ? `${city.health}/${city.maxHealth}` : unit ? `${unit.health}/${unit.maxHealth}` : "";
    const showHealth = !hidden && health && (state.debugVisible || selected || attackable || city);
    return `
      <button
        class="tile ${tile.terrain} ${tile.resource ? `has-resource resource-${tile.resource}` : ""} ${hidden ? "hidden" : ""} ${revealed ? "revealed" : ""} ${selected ? "selected" : ""} ${canMove ? "valid-move" : ""} ${attackable ? "attackable" : ""}"
        data-x="${tile.x}"
        data-y="${tile.y}"
        type="button"
      >
        <span class="coords">${tile.x},${tile.y}</span>
        ${pieceMarkup || `<span class="content">${terrainSymbol}</span>`}
        <span class="yield">${hidden ? "" : `F${yields.food} P${yields.production} G${yields.gold}`}</span>
        ${badge ? `<span class="badge">${badge}</span>` : ""}
        ${showHealth ? `<span class="health">${health}</span>` : ""}
        ${city && !hidden ? `<span class="city-label ${city.owner === "enemy" ? "enemy" : ""}">${city.name}</span>` : ""}
      </button>
    `;
  }).join("");

  mapEl.querySelectorAll(".tile").forEach((button) => {
    button.addEventListener("click", () => {
      handleTileClick(Number(button.dataset.x), Number(button.dataset.y));
    });
  });
}

function renderSelection() {
  const selectedUnit = getSelectedUnit();
  const playerCities = state.cities.filter((city) => city.owner === "player");
  const selectionCards = [];

  if (selectedUnit) {
    const tile = getTile(selectedUnit.x, selectedUnit.y);
    const unitType = unitTypes[selectedUnit.type];
    selectionCards.push(`
      <div class="selection-card primary-card">
        <span class="card-kicker">Active Unit</span>
        <strong>${selectedUnit.type}</strong>
        <p>${unitType.role}</p>
        <p>Health ${selectedUnit.health}/${selectedUnit.maxHealth} | Movement ${selectedUnit.movementRemaining}/${selectedUnit.maxMovement}</p>
        <p class="subtle">${unitType.order}</p>
        <p class="subtle">Standing on ${terrainConfig[tile.terrain].label}${tile.improvement ? ` with a ${tile.improvement}` : ""}.</p>
      </div>
    `);
  } else {
    selectionCards.push(`
      <div class="selection-card">
        <strong>No unit selected</strong>
        <p>Choose a player unit to see its actions.</p>
      </div>
    `);
  }

  if (state.inspectedTile) {
    const tile = getTile(state.inspectedTile.x, state.inspectedTile.y);
    const unit = getUnitAt(state.inspectedTile.x, state.inspectedTile.y);
    const city = getCityAt(state.inspectedTile.x, state.inspectedTile.y);
    if (tile) {
      const yields = calculateTileYield(tile);
      const terrain = terrainConfig[tile.terrain];
      const resourceText = tile.resource ? `${resourceConfig[tile.resource].label} resource` : "No special resource";
      selectionCards.push(`
        <div class="selection-card">
          <span class="card-kicker">Inspected Land${state.debugVisible ? ` ${tile.x},${tile.y}` : ""}</span>
          <strong>${terrain.label}</strong>
          <p>${terrain.read}. ${resourceText}${tile.improvement ? `, improved with ${tile.improvement}` : ""}.</p>
          <p>${formatYield(yields)} | Defense ${terrain.defense}</p>
          <p class="subtle">${city ? `${city.name} is here.` : unit ? `${unit.owner === "player" ? "Friendly" : "Enemy"} ${unit.type} is here.` : "Empty frontier tile."}</p>
        </div>
      `);
    }
  }

  if (!playerCities.length) {
    selectionCards.push(`
      <div class="selection-card objective-card">
        <span class="card-kicker">${state.worldProfile?.name ?? "New Frontier"}</span>
        <strong>Objective</strong>
        <p>Found your first city, then build enough force to take Red Keep.</p>
        <p class="subtle">${state.worldProfile?.resourceText ?? ""}</p>
      </div>
    `);
  }

  for (const city of playerCities) {
    const workedTiles = getWorkedTiles(city);
    const cityYield = workedTiles.reduce((sum, tile) => {
      const yields = calculateTileYield(tile);
      sum.food += yields.food;
      sum.production += yields.production;
      sum.gold += yields.gold;
      return sum;
    }, { food: 0, production: 0, gold: 0 });
    const turnsLeft = Math.max(1, Math.ceil((productionCosts[city.currentProduction] - city.productionStored) / Math.max(1, cityYield.production)));
    selectionCards.push(`
      <div class="selection-card city-card">
        <span class="card-kicker">Settlement</span>
        <strong>${city.name}</strong>
        <p>Population ${city.population} | Health ${city.health}/${city.maxHealth}</p>
        <p>${formatYield(cityYield)} per turn</p>
        <p>Food store ${city.foodStored}/${city.population * 6} | Production ${city.productionStored}/${productionCosts[city.currentProduction]}</p>
        <p>Building ${city.currentProduction} | ETA ${turnsLeft} turn${turnsLeft === 1 ? "" : "s"}</p>
        <div class="action-panel">
          <button class="action-btn" data-city="${city.id}" data-production="Warrior" type="button">Train Warrior</button>
          <button class="action-btn" data-city="${city.id}" data-production="Settler" type="button">Train Settler</button>
        </div>
      </div>
    `);
  }

  selectionPanelEl.innerHTML = selectionCards.join("");
  selectionPanelEl.querySelectorAll("[data-city]").forEach((button) => {
    button.addEventListener("click", () => changeCityProduction(button.dataset.city, button.dataset.production));
  });
}

function renderActions() {
  const selectedUnit = getSelectedUnit();
  const buttons = ['<button class="secondary-btn" data-action="next-unit" type="button">Cycle Unit</button>'];
  if (selectedUnit?.type === "Settler") {
    buttons.push('<button class="action-btn" data-action="found-city" type="button">Found City</button>');
    buttons.push('<button class="action-btn" data-action="improve" type="button">Improve Tile</button>');
  }
  actionPanelEl.innerHTML = buttons.join("");

  actionPanelEl.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.action === "found-city") foundCity();
      if (button.dataset.action === "improve") improveTile();
      if (button.dataset.action === "next-unit") {
        cyclePlayerUnits(true);
        render();
      }
    });
  });
}

function renderResources() {
  const playerCities = state.cities.filter((city) => city.owner === "player");
  const totals = playerCities.reduce((sum, city) => {
    const yields = getWorkedTiles(city).reduce((citySum, tile) => {
      const yieldData = calculateTileYield(tile);
      citySum.food += yieldData.food;
      citySum.production += yieldData.production;
      citySum.gold += yieldData.gold;
      return citySum;
    }, { food: 0, production: 0, gold: 0 });
    sum.food += yields.food;
    sum.production += yields.production;
    sum.gold += yields.gold;
    return sum;
  }, { food: 0, production: 0, gold: 0 });

  const readyUnits = getPlayerUnits(true).length;
  const cards = [
    ["Cities", playerCities.length],
    ["Ready Units", readyUnits],
    ["Food", totals.food],
    ["Production", totals.production],
    ["Gold", totals.gold]
  ];
  if (state.winner) {
    cards.push(["Result", state.winner === "player" ? "Victory" : "Defeat"]);
  }

  resourceSummaryEl.innerHTML = cards.map(([label, value]) => `
    <div class="resource-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function renderLogs() {
  logEl.innerHTML = state.logs.map((entry) => `
    <div class="log-entry">
      <strong>Turn ${entry.turn}</strong>
      <p>${entry.message}</p>
    </div>
  `).join("");
}

init();
