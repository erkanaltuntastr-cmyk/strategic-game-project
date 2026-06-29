/**
 * Terrain definitions for the map generator.
 *
 * The values are intentionally simple and readable for an old-school,
 * turn-based strategy ruleset. Colors are fallback display colors; final
 * rendering can use image assets while keeping these values for tooling.
 */
export const TERRAIN = Object.freeze({
  DEEP_OCEAN: Object.freeze({
    id: 0,
    name: "Deep Ocean",
    color: "#12395a",
    moveCost: 99,
    yields: Object.freeze({ food: 1, production: 0, gold: 0 }),
    canSettle: false,
    canBuild: false,
    defenseBonus: 0.0
  }),
  OCEAN: Object.freeze({
    id: 1,
    name: "Ocean",
    color: "#1f6fa8",
    moveCost: 1,
    yields: Object.freeze({ food: 1, production: 0, gold: 0 }),
    canSettle: false,
    canBuild: false,
    defenseBonus: 0.0
  }),
  COAST: Object.freeze({
    id: 2,
    name: "Coast",
    color: "#49a7c7",
    moveCost: 1,
    yields: Object.freeze({ food: 2, production: 0, gold: 1 }),
    canSettle: false,
    canBuild: false,
    defenseBonus: 0.0
  }),
  GRASSLAND: Object.freeze({
    id: 3,
    name: "Grassland",
    color: "#82b957",
    moveCost: 1,
    yields: Object.freeze({ food: 2, production: 1, gold: 0 }),
    canSettle: true,
    canBuild: true,
    defenseBonus: 0.0
  }),
  PLAINS: Object.freeze({
    id: 4,
    name: "Plains",
    color: "#c7b560",
    moveCost: 1,
    yields: Object.freeze({ food: 1, production: 1, gold: 1 }),
    canSettle: true,
    canBuild: true,
    defenseBonus: 0.0
  }),
  HILLS: Object.freeze({
    id: 5,
    name: "Hills",
    color: "#927252",
    moveCost: 2,
    yields: Object.freeze({ food: 1, production: 2, gold: 0 }),
    canSettle: true,
    canBuild: true,
    defenseBonus: 0.25
  }),
  FOREST: Object.freeze({
    id: 6,
    name: "Forest",
    color: "#2f7435",
    moveCost: 2,
    yields: Object.freeze({ food: 1, production: 2, gold: 0 }),
    canSettle: true,
    canBuild: true,
    defenseBonus: 0.25
  }),
  MOUNTAIN: Object.freeze({
    id: 7,
    name: "Mountain",
    color: "#8e8d86",
    moveCost: 99,
    yields: Object.freeze({ food: 0, production: 1, gold: 1 }),
    canSettle: false,
    canBuild: false,
    defenseBonus: 0.5
  }),
  DESERT: Object.freeze({
    id: 8,
    name: "Desert",
    color: "#dfc37a",
    moveCost: 1,
    yields: Object.freeze({ food: 0, production: 1, gold: 1 }),
    canSettle: true,
    canBuild: true,
    defenseBonus: 0.0
  }),
  TUNDRA: Object.freeze({
    id: 9,
    name: "Tundra",
    color: "#cfe6e2",
    moveCost: 1,
    yields: Object.freeze({ food: 1, production: 0, gold: 0 }),
    canSettle: true,
    canBuild: true,
    defenseBonus: 0.0
  }),
  RIVER: Object.freeze({
    id: 10,
    name: "River",
    color: "#3aa6d6",
    moveCost: 1,
    yields: Object.freeze({ food: 2, production: 0, gold: 1 }),
    canSettle: true,
    canBuild: true,
    defenseBonus: 0.0
  })
});

/**
 * Resource definitions for map placement and yield bonuses.
 *
 * The `terrain` array references TERRAIN entries directly so placement logic
 * can compare by object identity or by each terrain's `id`.
 */
export const RESOURCES = Object.freeze([
  Object.freeze({
    id: "GOLD_DEPOSIT",
    name: "Gold Deposit",
    terrain: Object.freeze([TERRAIN.PLAINS, TERRAIN.HILLS, TERRAIN.DESERT]),
    yields: Object.freeze({ food: 0, production: 0, gold: 3 })
  }),
  Object.freeze({
    id: "IRON_ORE",
    name: "Iron Ore",
    terrain: Object.freeze([TERRAIN.HILLS, TERRAIN.MOUNTAIN]),
    yields: Object.freeze({ food: 0, production: 3, gold: 0 })
  }),
  Object.freeze({
    id: "FISH",
    name: "Fish",
    terrain: Object.freeze([TERRAIN.COAST, TERRAIN.OCEAN]),
    yields: Object.freeze({ food: 3, production: 0, gold: 0 })
  }),
  Object.freeze({
    id: "GAME_ANIMALS",
    name: "Game Animals",
    terrain: Object.freeze([TERRAIN.GRASSLAND, TERRAIN.FOREST]),
    yields: Object.freeze({ food: 2, production: 0, gold: 0 })
  }),
  Object.freeze({
    id: "WHEAT",
    name: "Wheat",
    terrain: Object.freeze([TERRAIN.PLAINS, TERRAIN.GRASSLAND]),
    yields: Object.freeze({ food: 2, production: 0, gold: 0 })
  })
]);
