# Strategic Game Project — Full Game Plan

## 1. Project Vision

Strategic Game Project is a simple, browser-based, turn-based empire-building strategy game inspired by the clarity and simplicity of classic 90s strategy games, especially Civilization II.

The goal is not to copy Civilization II. The goal is to capture the feeling of:
- a readable world map
- founding settlements
- exploring unknown land
- understanding terrain
- growing cities
- producing units and buildings
- making turn-based strategic decisions
- winning through expansion, economy, or military strength

The game should feel visually rich but mechanically simple.

Core principle:

> Visual quality should stay high. Gameplay complexity should start low.

This means the game may look atmospheric and polished, but the first playable version must remain easy to understand, easy to code, and easy to expand.

---

## 2. Design Direction

### Chosen Direction

The project should move toward a Civilization II-style structure:

- turn-based
- tile-based map
- settlement founding
- terrain yields
- simple city growth
- simple production
- simple combat
- simple AI
- browser playable
- no real-time controls

### What We Are Not Building in Version 0.1

The first version should not include:

- complex diplomacy
- culture borders
- religion
- government systems
- happiness/unrest
- complex trade networks
- naval warfare
- large technology tree
- advanced AI personalities
- dozens of civilizations
- multiplayer
- real-time unit control
- pathfinding-heavy RTS logic

These can come later, but they should not block the first playable version.

---

## 3. Game Identity

### Working Project Name

Strategic Game Project

### Possible Future Game Names

Potential names can be explored later:

- Crown & Timber
- Frontier Crown
- New Realms
- Riverlands
- Stone, Food & Crown
- Old World Frontier

For now, the repo/project should stay neutral:

`strategic-game-project`

---

## 4. Core Gameplay Summary

The player begins with a small group of units on an unexplored map.

Starting units:

- 1 Settler
- 1 Scout
- 1 Warrior

The player must:

1. Find a good location.
2. Found the first city.
3. Explore surrounding terrain.
4. Use terrain yields to grow.
5. Produce units and buildings.
6. Improve land with the Settler.
7. Defend against the enemy.
8. Expand or defeat the enemy city.

The first playable goal:

> Found a city, explore, produce units, improve tiles, fight enemy units, and win by defeating the enemy city.

---

## 5. Main Game Loop

Each turn follows this structure:

1. Player reviews map, cities, units, and resources.
2. Player moves units.
3. Player gives actions to units.
4. Player chooses city production.
5. Player builds terrain improvements if possible.
6. Player attacks enemy units or cities if adjacent.
7. Player clicks End Turn.
8. Game calculates city growth and production.
9. Enemy AI takes its turn.
10. New turn begins.

The loop must be clear and readable.

The player should always understand:

- what each city is producing
- how many turns production will take
- which unit is selected
- what actions are available
- what the map terrain means
- why resources changed after each turn

---

## 6. Map Philosophy

The map is the heart of the game.

The player should feel:

> “Where I settle changes the whole game.”

The map should not be decorative. It should create strategic decisions.

Good settlement locations should depend on nearby:

- grassland
- forest
- hills
- rivers
- lakes
- coast
- fish
- hunting animals
- gold
- stone/ore

Different starts should feel different.

Examples:

- River city: strong food and gold.
- Forest city: strong production.
- Coastal city: fish and future trade potential.
- Hill/mountain city: defensive and production-focused.
- Gold city: strong economy but possibly exposed.
- Lake/river city: balanced growth.

---

## 7. Map Types and Terrain

The map should be a square tile grid.

Version 0.1 should use a simple 2D grid with a visual style that gives an old strategy game feeling.

### Terrain Types

| Terrain | Food | Production | Gold | Movement | Notes |
|---|---:|---:|---:|---|---|
| Grassland | High | Low | Low | Normal | Best early city growth terrain |
| Forest | Medium | High | Low | Slower | Good production, can hide resources |
| Hills / Rocky Land | Low | High | Low | Slower | Production and defence terrain |
| Mountain | Very Low | High | Low | Very hard or impassable | Natural barrier |
| River | Bonus | Low | Bonus | May slow crossing | Valuable city location |
| Lake | Medium/High | Low | Low | Impassable | Can contain fish |
| Coast | Medium | Low | Medium | Land units cannot enter water | Useful later for trade |
| Sea | Low unless fish | Low | Medium | Impassable in v0.1 | Naval systems later |

### Map Resource Types

| Resource | Terrain Placement | Effect |
|---|---|---|
| Fish | Lake, Coast, Sea | Food bonus |
| Hunting Animals | Grassland, Forest | Food bonus |
| Gold Deposit | Hills, Rocky, Mountain edge | Gold bonus |
| Stone/Ore Deposit | Hills, Rocky, Mountain edge | Production bonus |

---

## 8. Terrain Yield System

Version 0.1 should use only three yield types:

- Food
- Production
- Gold

This keeps the game closer to Civilization II simplicity.

We should not use separate Wood and Stone resources in version 0.1.

Instead:

- Forest gives Production.
- Hills/Rocky terrain gives Production.
- Stone/Ore gives Production bonus.
- Fish and hunting animals give Food.
- Gold deposit gives Gold.

This is simpler than Food/Wood/Stone/Gold and better for the first version.

### Why This Matters

Separate Wood and Stone would make the game feel more like Age of Empires.

Food / Production / Gold makes the game feel more like Civilization II.

Since the current direction is Civilization II-style simplicity, Food / Production / Gold is the better starting system.

---

## 9. City System

Cities are the core of the empire.

Each city should have:

- name
- population
- food per turn
- production per turn
- gold per turn
- current production
- turns remaining
- built buildings
- controlled nearby tiles

### Founding Cities

The player starts without a city.

The Settler can found the first city on valid land.

Valid city terrain:

- Grassland
- Forest
- Hills/Rocky
- River-adjacent land
- Coast-adjacent land

Invalid city terrain:

- Sea
- Lake
- River tile itself
- Mountain in v0.1
- Occupied tile

### City Growth

Each city produces Food each turn.

Simple rule:

- Food surplus fills a growth bar.
- When the growth bar is full, population increases by 1.
- Higher population allows more yield from surrounding tiles.

Version 0.1 does not need manual citizen management.

The game can automatically work the best nearby tiles.

### City Production

Each city can produce one thing at a time.

Production accumulates each turn.

When enough Production is stored, the unit or building is completed.

The player should see:

- current production
- turns remaining
- progress bar

---

## 10. Buildings

Version 0.1 buildings should be very limited.

| Building | Effect |
|---|---|
| Granary | Helps city growth |
| Barracks | Allows or improves military unit production |
| Market | Increases Gold output |
| Walls | Improves city defence |

Do not add too many buildings early.

No temple, library, palace, harbour, courthouse, wonder, university, or complex maintenance system in v0.1.

Those can come later.

---

## 11. Units

Version 0.1 should include a small unit list.

| Unit | Role |
|---|---|
| Settler | Founds city, builds road/farm/mine |
| Scout | Explores map quickly |
| Warrior | Basic cheap combat unit |
| Archer | Stronger attack unit |
| Spearman | Defensive unit |
| Horseman | Fast moving unit |

### Unit Stats

Each unit should have simple stats:

- movement
- attack
- defence
- cost
- owner
- current tile
- remaining movement this turn

Example starting values:

| Unit | Move | Attack | Defence | Cost |
|---|---:|---:|---:|---:|
| Settler | 1 | 0 | 1 | 30 |
| Scout | 2 | 0 | 1 | 15 |
| Warrior | 1 | 1 | 1 | 10 |
| Archer | 1 | 2 | 1 | 20 |
| Spearman | 1 | 1 | 2 | 20 |
| Horseman | 2 | 2 | 1 | 30 |

These can be adjusted later.

---

## 12. Settler Actions

In Civilization II style, the Settler can be the main land-improvement unit.

Version 0.1 Settler actions:

| Action | Effect |
|---|---|
| Found City | Creates a city on valid land |
| Build Road | Improves movement and may add Gold |
| Build Farm | Adds Food to suitable land |
| Build Mine | Adds Production to hills/rocky land |
| Wait | Skip action |
| Sleep | Unit remains inactive until selected again |

### Important Scope Rule

Do not create a separate Worker unit in version 0.1.

Using Settler for both city founding and tile improvements keeps the system simpler and closer to the older Civilization feel.

Worker can be added later if needed.

---

## 13. Combat System

Combat should be simple.

Version 0.1 combat rule:

- Units can attack adjacent enemy units.
- Combat compares attacker attack value and defender defence value.
- Add small random factor.
- Losing unit is removed.
- Winner may take damage if health is implemented.

Simplest possible implementation:

- Each unit has 1 hit point.
- One unit wins and the other is removed.

Slightly better implementation:

- Each unit has 3 health.
- Combat reduces health.
- Unit dies at 0 health.

For version 0.1, the 1-hit model is acceptable if faster to implement.

### City Combat

If an enemy unit attacks a city:

- City uses defence value based on population and buildings.
- Walls improve defence.
- If city loses, it is captured or destroyed.

Version 0.1 win condition:

> Capture or destroy the enemy's first city.

---

## 14. Fog of War and Exploration

Version 0.1 should include simple fog of war if not too difficult.

Minimum acceptable version:

- Entire map visible, but unexplored tiles are darkened.
- Scout reveals nearby tiles.

Better version:

- Unexplored tiles are hidden.
- Explored but not currently visible tiles are dimmed.
- Current visibility updates each turn.

If fog of war delays the prototype, it can be simplified.

The game is still valid if map exploration is represented visually in a basic way.

---

## 15. Enemy AI

The enemy AI must be simple.

AI starts with:

- 1 Settler
- 1 Scout
- 1 Warrior

AI behaviour version 0.1:

1. Found first city near starting position.
2. Explore randomly with Scout.
3. Produce Warrior or Archer.
4. If it has enough units, move toward player city.
5. Attack adjacent player units/city.
6. Build simple improvements if implemented.

AI does not need advanced strategy.

AI does not need diplomacy.

AI does not need long-term planning.

It only needs to create pressure.

---

## 16. Win and Lose Conditions

Version 0.1 should have one clear win condition:

> Player wins by capturing or destroying the enemy city.

Optional lose condition:

> Player loses if their only city is captured or destroyed.

Later versions can add:

- Expansion victory
- Economic victory
- Technology victory
- Score victory
- Multiple enemy civilizations

---

## 17. User Interface Direction

The UI should be simple, readable, and retro-inspired.

Important design rule:

> We go backwards in complexity, not backwards in visual quality.

### PC Layout

PC screen should have:

- large central map
- top resource bar
- left selected city/unit panel
- bottom action bar
- End Turn button
- mini map in bottom right if simple
- readable icons and labels

Top bar:

- Food
- Production
- Gold
- Turn number
- Year/date

Left panel:

When a city is selected:

- city name
- population
- growth progress
- current production
- turns remaining
- buildings

When a unit is selected:

- unit name
- movement remaining
- attack
- defence
- available actions

Bottom action bar:

- Move
- Build
- Found City
- Explore
- Fortify
- Sleep
- End Turn

### Mobile Layout

Mobile should not be a separate game.

It should use the same logic with a responsive UI.

Mobile screen should have:

- map taking most of the screen
- compact top resource bar
- collapsible city/unit panel
- right-side vertical action buttons
- large End Turn button
- menu button for secondary panels

The mobile UI can show less information at once.

---

## 18. Visual Style

The game should feel like a modern, polished version of an old 90s strategy game.

Visual style:

- readable terrain
- painted or illustrated map feel
- parchment/stone UI panels
- simple unit icons or sprites
- clear city labels
- clear borders
- no overly modern sci-fi UI
- no dark cyber style

Visual quality should remain high.

Gameplay simplicity should remain old-school.

### Reference Feel

The visual target is:

- classic strategy map clarity
- Civilization II-style simplicity
- modern illustration quality
- readable on both PC and mobile

---

## 19. Technical Direction

### Version 0.1 Tech Stack

Use:

- HTML
- CSS
- JavaScript

Do not use:

- React
- Vue
- Angular
- backend
- database
- external libraries
- build tools
- npm dependencies

The game must run locally from:

`index.html`

### Initial Files

The first implementation should include:

- `index.html`
- `style.css`
- `game.js`
- `README.md`
- `docs/GAME_PLAN.md`

Optional later:

- `assets/`
- `docs/DESIGN_NOTES.md`
- `docs/ROADMAP.md`

---

## 20. Suggested Data Model

The code should stay simple and readable.

### Tile

Each tile can have:

```js
{
  x: 0,
  y: 0,
  terrain: "grassland",
  resource: null,
  improvement: null,
  cityId: null,
  unitId: null,
  exploredByPlayer: false,
  visibleToPlayer: false
}
```

### City

```js
{
  id: "city_1",
  owner: "player",
  name: "New Haven",
  x: 5,
  y: 5,
  population: 1,
  foodStored: 0,
  currentProduction: "Warrior",
  productionStored: 0,
  buildings: []
}
```

### Unit

```js
{
  id: "unit_1",
  owner: "player",
  type: "Settler",
  x: 4,
  y: 5,
  movementRemaining: 1,
  health: 1,
  asleep: false
}
```

### Player State

```js
{
  id: "player",
  gold: 0,
  knownTechs: [],
  cities: [],
  units: []
}
```

### Game State

```js
{
  turn: 1,
  year: "4000 BC",
  currentPlayer: "player",
  selectedTile: null,
  selectedUnitId: null,
  selectedCityId: null,
  map: [],
  players: {}
}
```

---

## 21. Map Generation Rules

Version 0.1 can use a fixed handcrafted map if procedural generation slows development.

Preferred first approach:

- Create one fixed test map.
- Make it visually interesting.
- Include sea, lake, river, forest, hills, mountains, fish, hunting animals, gold, and stone/ore.
- Put player and enemy far enough apart.

After the game loop works, add random generation.

### Fixed Map Requirements

The first map should include:

- island or continent shape
- coast/sea edge
- at least one river
- at least one lake
- several forest clusters
- rocky/hill areas
- mountain barrier
- fish in water
- hunting animals near forest/grassland
- gold deposit away from start
- stone/ore deposit near hills

---

## 22. Version 0.1 Milestone

The first milestone is not a complete game.

It is a playable prototype.

Version 0.1 must allow the player to:

- open `index.html`
- see the game map
- select a Settler
- found a city
- select the city
- see city growth and production
- produce a Warrior
- move Scout and Warrior
- improve a tile with Settler
- end turn
- see AI take a simple turn
- attack enemy units
- capture or destroy enemy city
- receive win/loss message

If this works, version 0.1 is successful.

---

## 23. Version Roadmap

### Version 0.1 — Playable Core

- fixed map
- tile display
- unit selection
- movement
- city founding
- city production
- basic yields
- basic combat
- simple enemy AI
- win/loss condition

### Version 0.2 — Better Map and UI

- improved terrain graphics
- better fog of war
- mini map
- better city panel
- better action buttons
- simple responsive mobile layout

### Version 0.3 — Terrain Improvements

- roads
- farms
- mines
- visible improvement graphics
- improved production calculations

### Version 0.4 — Technology

- small tech tree
- unlock Archer, Horseman, Market, Walls
- research selection
- gold/science split if needed

### Version 0.5 — Multiple Cities and Expansion

- stronger settler logic
- multiple cities
- city list panel
- expansion victory option

### Version 0.6 — Better AI

- AI expansion
- AI military grouping
- AI city production choices
- AI terrain improvement

### Version 0.7 — Naval and Coastal Features

- boats
- embarkation
- fishing boats
- coastal trade
- island expansion

### Version 1.0 — Small Complete Game

- 1 map type
- 1 enemy AI
- multiple cities
- basic technology
- 3 victory types
- polished UI
- save/load if simple

---

## 24. Codex Implementation Prompt

Use the following prompt for Codex:

```text
Project name: Strategic Game Project

Build a simple browser-based turn-based strategy game inspired by the clarity and simplicity of Civilization II.

Important:
- Do not copy Civilization II assets, names, exact rules, UI, or text.
- Use it only as a design reference for simple 90s turn-based empire-building.
- Visual quality should be good, but gameplay complexity should stay low.
- We want to go backwards in simplicity, not backwards in visual quality.

Tech:
- Plain HTML, CSS, JavaScript
- No framework
- No backend
- No external dependencies
- Runs locally from index.html

Core direction:
- Civilization II-style simplicity
- Tile-based 2D map
- Turn-based gameplay
- Map exploration
- Founding settlements
- Terrain-based yields
- City growth
- Simple production
- Basic combat
- End Turn flow

Resources / yields:
- Food
- Production
- Gold

Terrain:
- grassland
- forest
- hills / rocky land
- mountain
- river
- lake
- coast
- sea

Map resources:
- fish
- hunting animals
- gold deposit
- stone/ore deposit

Terrain rules:
- Grassland gives good food.
- Forest gives production and slows movement.
- Hills/rocky land give production and defence bonus.
- Mountains are hard to cross or impassable in v0.1.
- Rivers give food/gold bonus and affect movement.
- Lakes/coast/sea can contain fish.
- Fish gives food bonus.
- Hunting animals give food bonus.
- Gold deposit gives gold bonus.
- Stone/ore deposit gives production bonus.

Starting setup:
- Player starts with:
  - 1 Settler
  - 1 Scout
  - 1 Warrior
- Enemy AI starts similarly on another part of the map.
- The player must found the first city.

Units:
- Settler
- Scout
- Warrior
- Archer
- Spearman
- Horseman

Settler actions:
- Found city
- Build road
- Build farm
- Build mine

City system:
- Each city has population.
- Each city generates food, production, and gold each turn based on nearby terrain.
- City can produce units and buildings.
- Show current production and turns remaining.
- In v0.1, city tile working can be automatic.

Buildings:
- Granary
- Barracks
- Market
- Walls

Combat:
- Simple attack and defence values.
- Unit attacks adjacent enemy.
- If enemy city is captured or destroyed, player wins v0.1.

UI:
- Large readable map
- Top bar: Food, Production, Gold, Turn
- Left panel: selected city or selected unit
- Bottom action bar: unit/city actions
- End Turn button
- Simple retro visual style
- Mobile responsive layout with compact top bar and vertical action buttons

Version 0.1 goal:
- A small playable prototype.
- The player can found a city, explore, improve terrain, produce units, fight enemy units, and win by defeating the enemy city.

Design rule:
Keep it simple and playable. Do not over-engineer.
```

---

## 25. Development Rules for Codex

Codex should follow these rules:

1. Build the smallest playable version first.
2. Do not introduce frameworks.
3. Do not over-abstract the code.
4. Keep `game.js` readable.
5. Use simple objects and arrays.
6. Avoid premature architecture.
7. Use clear comments where helpful.
8. Make the game run by opening `index.html`.
9. Prioritise playability over perfect visuals.
10. Prioritise readable UI over complex systems.

---

## 26. Acceptance Criteria for Version 0.1

The prototype is acceptable when:

- The game opens locally.
- The map is visible.
- Terrain types are visually distinct.
- Player can select and move units.
- Settler can found a city.
- City panel displays population and production.
- City can produce at least Warrior and Scout.
- Turns advance correctly.
- Food / Production / Gold update each turn.
- AI performs a basic turn.
- Units can fight.
- Enemy city can be defeated.
- Win/loss state appears.
- PC layout is usable.
- Mobile layout is at least playable.

---

## 27. Final Design Statement

Strategic Game Project should become a small, readable, turn-based empire-building game.

It should feel like an old strategy game in its rules and flow, but not in its visual quality.

The first version must be simple enough to finish.

The map must matter.

The player must care where they settle.

The game must be playable before it becomes deep.
