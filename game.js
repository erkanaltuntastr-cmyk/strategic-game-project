const MAP_SIZE = 12;
const terrainTypes = ["grassland", "forest", "hill", "water", "mountain"];
const terrainConfig = {
  grassland: { food: 2, production: 1, gold: 0, moveCost: 1, symbol: "" },
  forest: { food: 1, production: 2, gold: 0, moveCost: 1, symbol: "🌲" },
  hill: { food: 0, production: 2, gold: 1, moveCost: 1, symbol: "⛰" },
  mountain: { food: 0, production: 1, gold: 0, moveCost: 99, symbol: "▲" },
  water: { food: 2, production: 0, gold: 1, moveCost: 99, symbol: "≈" }
};
const resourceConfig = {
  fish: { terrain: ["water"], food: 1, production: 0, gold: 0, symbol: "🐟" },
  game: { terrain: ["grassland", "forest"], food: 1, production: 0, gold: 0, symbol: "🦌" },
  gold: { terrain: ["hill"], food: 0, production: 0, gold: 2, symbol: "✦" },
  ore: { terrain: ["hill", "mountain"], food: 0, production: 1, gold: 0, symbol: "⬢" }
};
const unitTypes = {
  Settler: { attack: 0, health: 2, movement: 1, symbol: "S" },
  Scout: { attack: 1, health: 2, movement: 2, symbol: "C" },
  Warrior: { attack: 2, health: 3, movement: 1, symbol: "W" }
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

function init() {
  renderLegend();
  createGame();
  render();
  endTurnBtn.addEventListener("click", endTurn);
}

function createGame() {
  state.turn = 1;
  state.nextId = 1;
  state.logs = [];
  state.winner = null;
  state.selectedUnitId = null;
  state.map = generateMap();
  state.units = [];
  state.cities = [];

  addUnit("player", "Settler", 1, 1);
  addUnit("player", "Scout", 2, 1);
  addUnit("player", "Warrior", 1, 2);
  addUnit("enemy", "Warrior", MAP_SIZE - 2, MAP_SIZE - 3);
  addCity("enemy", "Red Keep", MAP_SIZE - 2, MAP_SIZE - 2);

  revealAroundPlayer();
  log("A new frontier opens. Found your first city.");
}

function generateMap() {
  const map = [];
  for (let y = 0; y < MAP_SIZE; y += 1) {
    const row = [];
    for (let x = 0; x < MAP_SIZE; x += 1) {
      let terrain = randomTerrain();
      if ((x < 3 && y < 3) || (x > MAP_SIZE - 4 && y > MAP_SIZE - 4)) {
        terrain = Math.random() > 0.2 ? "grassland" : "forest";
      }
      const tile = {
        x,
        y,
        terrain,
        resource: pickResource(terrain),
        improvement: null,
        exploredByPlayer: false,
        visibleToPlayer: false
      };
      row.push(tile);
    }
    map.push(row);
  }
  return map;
}

function randomTerrain() {
  const roll = Math.random();
  if (roll < 0.44) return "grassland";
  if (roll < 0.66) return "forest";
  if (roll < 0.84) return "hill";
  if (roll < 0.94) return "water";
  return "mountain";
}

function pickResource(terrain) {
  const options = Object.entries(resourceConfig)
    .filter(([, config]) => config.terrain.includes(terrain))
    .map(([key]) => key);
  if (!options.length || Math.random() < 0.72) return null;
  return options[Math.floor(Math.random() * options.length)];
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
    health: 8
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

function isAdjacent(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

function handleTileClick(x, y) {
  if (state.winner) {
    return;
  }
  const unit = getUnitAt(x, y);
  if (unit?.owner === "player") {
    state.selectedUnitId = unit.id;
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

function attemptMoveOrAttack(unit, targetX, targetY) {
  if (unit.movementRemaining < 1) {
    log(`${unit.type} has no movement left this turn.`);
    return;
  }

  const tile = getTile(targetX, targetY);
  if (!tile || terrainConfig[tile.terrain].moveCost > unit.movementRemaining) {
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
  revealAroundPlayer();
}

function resolveCombat(attacker, defender) {
  defender.health -= Math.max(1, attacker.attack);
  log(`${attacker.type} attacks an enemy ${defender.type}.`);
  if (defender.health <= 0) {
    state.units = state.units.filter((unit) => unit.id !== defender.id);
    attacker.x = defender.x;
    attacker.y = defender.y;
    log("Enemy unit defeated.");
    revealAroundPlayer();
    return;
  }

  attacker.health -= 1;
  if (attacker.health <= 0) {
    state.units = state.units.filter((unit) => unit.id !== attacker.id);
    state.selectedUnitId = null;
    log(`${attacker.type} was lost in battle.`);
  }
}

function attackCity(attacker, city) {
  city.health -= Math.max(1, attacker.attack);
  log(`${attacker.type} attacks ${city.name}.`);
  if (city.health <= 0) {
    state.cities = state.cities.filter((entry) => entry.id !== city.id);
    attacker.x = city.x;
    attacker.y = city.y;
    log(`${city.name} has fallen.`);
    if (city.owner === "enemy") {
      state.winner = "player";
      log("Victory. The enemy capital is conquered.");
    }
    revealAroundPlayer();
    return;
  }
  attacker.health -= 1;
  if (attacker.health <= 0) {
    state.units = state.units.filter((unit) => unit.id !== attacker.id);
    state.selectedUnitId = null;
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
  }

  state.turn += 1;
  revealAroundPlayer();
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
  const items = [
    ["grassland", "Grassland"],
    ["forest", "Forest"],
    ["hill", "Hill"],
    ["water", "Water"],
    ["mountain", "Mountain"]
  ];
  legendEl.innerHTML = items.map(([cls, label]) => (
    `<span class="legend-item"><span class="swatch ${cls}" style="background: var(--${cls === "water" ? "water" : cls});"></span>${label}</span>`
  )).join("");
}

function render() {
  turnCounterEl.textContent = String(state.turn);
  renderMap();
  renderSelection();
  renderActions();
  renderResources();
  renderLogs();
}

function renderMap() {
  const selectedUnit = getSelectedUnit();
  const validMoves = new Set();
  if (selectedUnit) {
    [
      [selectedUnit.x + 1, selectedUnit.y],
      [selectedUnit.x - 1, selectedUnit.y],
      [selectedUnit.x, selectedUnit.y + 1],
      [selectedUnit.x, selectedUnit.y - 1]
    ].forEach(([x, y]) => validMoves.add(`${x},${y}`));
  }

  mapEl.innerHTML = state.map.flat().map((tile) => {
    const unit = getUnitAt(tile.x, tile.y);
    const city = getCityAt(tile.x, tile.y);
    const hidden = !tile.exploredByPlayer;
    const revealed = tile.exploredByPlayer && !tile.visibleToPlayer;
    const selected = selectedUnit?.x === tile.x && selectedUnit?.y === tile.y;
    const canMove = validMoves.has(`${tile.x},${tile.y}`) && tile.visibleToPlayer;
    const yields = calculateTileYield(tile);
    const symbol = hidden ? "" : city ? (city.owner === "player" ? "🏛" : "🏰") : unit ? (unit.owner === "player" ? unitTypes[unit.type].symbol : `⚔`) : tile.resource ? resourceConfig[tile.resource].symbol : terrainConfig[tile.terrain].symbol;
    return `
      <button
        class="tile ${tile.terrain} ${hidden ? "hidden" : ""} ${revealed ? "revealed" : ""} ${selected ? "selected" : ""} ${canMove ? "valid-move" : ""}"
        data-x="${tile.x}"
        data-y="${tile.y}"
        type="button"
      >
        <span class="coords">${tile.x},${tile.y}</span>
        <span class="content">${symbol}</span>
        <span class="yield">${hidden ? "" : `F${yields.food} P${yields.production} G${yields.gold}`}</span>
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
    selectionCards.push(`
      <div class="selection-card">
        <strong>${selectedUnit.type}</strong>
        <p>Position ${selectedUnit.x},${selectedUnit.y}</p>
        <p>Health ${selectedUnit.health}/${selectedUnit.maxHealth} | Movement ${selectedUnit.movementRemaining}/${selectedUnit.maxMovement}</p>
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

  for (const city of playerCities) {
    selectionCards.push(`
      <div class="selection-card">
        <strong>${city.name}</strong>
        <p>Population ${city.population} | Health ${city.health}</p>
        <p>Food ${city.foodStored}/${city.population * 6} | Production ${city.productionStored}/${productionCosts[city.currentProduction]}</p>
        <p>Building ${city.currentProduction}</p>
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
  if (!selectedUnit) {
    actionPanelEl.innerHTML = "";
    return;
  }

  const buttons = [];
  if (selectedUnit.type === "Settler") {
    buttons.push('<button class="action-btn" data-action="found-city" type="button">Found City</button>');
    buttons.push('<button class="action-btn" data-action="improve" type="button">Improve Tile</button>');
  }
  actionPanelEl.innerHTML = buttons.join("");

  actionPanelEl.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.action === "found-city") foundCity();
      if (button.dataset.action === "improve") improveTile();
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

  const cards = [
    ["Cities", playerCities.length],
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
