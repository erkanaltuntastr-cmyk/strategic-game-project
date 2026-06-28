# Strategic Game Project

A small browser-based strategy prototype inspired by the readability and pace of classic 90s empire games.

## Current prototype

- 12x12 tile map with terrain, resources, and fog of war
- Player starts with Settler, Scout, and Warrior
- Found cities, improve land, grow population, and produce units
- Simple adjacent-tile movement and combat
- Basic enemy AI with a single enemy capital
- Runs directly from `index.html`

## Run locally

Open [index.html](C:/Users/erkan/Documents/GitHub/strategic-game-project/index.html) in a browser.

## Project structure

- `index.html` - main UI shell
- `style.css` - map and panel styling
- `game.js` - game state, rendering, turn logic, and AI
- `docs/GAME_PLAN.md` - source design plan

## Next good steps

1. Add keyboard controls and a unit action queue.
2. Improve AI pathing and city placement logic.
3. Add a start screen and procedural map presets.
4. Expand combat with health bars and terrain defence bonuses.
