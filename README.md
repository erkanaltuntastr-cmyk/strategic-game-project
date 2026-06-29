# Strategic Game Project

A small browser-based, turn-based strategy prototype inspired by the readability and pace of classic 90s empire-building games, especially the simplicity of Civilization II.

The goal is not to copy any existing game. The goal is to capture the same clear map-based strategy feeling with a much smaller and simpler ruleset.

Core principle:

> Visual quality should stay high. Gameplay complexity should start low.

## Current prototype

- 12x12 tile map with terrain, resources, and fog of war
- Player starts with Settler, Scout, and Warrior
- Found cities, improve land, grow population, and produce units
- Simple adjacent-tile movement and combat
- Basic enemy AI with a single enemy capital
- Runs directly from `index.html`

## Run locally

Open [`index.html`](./index.html) in a browser.

No install, no backend, no external dependencies.

## Project structure

- `index.html` — main UI shell
- `style.css` — map and panel styling
- `game.js` — game state, rendering, turn logic, and AI
- `docs/GAME_PLAN.md` — source design plan and development direction
- `tools/map-generator.html` — standalone procedural hex map generation lab

## Design plan

Read the full plan here:

[`docs/GAME_PLAN.md`](./docs/GAME_PLAN.md)

## Visual reset

Issue #1 visual direction and the concept image are documented here:

[`docs/VISUAL_RESET_PLAN.md`](./docs/VISUAL_RESET_PLAN.md)

## Tools

The map generator is a separate design/development tool, not the main game screen:

[`tools/map-generator.html`](./tools/map-generator.html)

## Next good steps

1. Make the map visually richer while keeping the rules simple.
2. Improve mobile layout without changing the core game logic.
3. Add clearer unit/city selection feedback.
4. Improve AI city placement and attack decisions.
5. Add health bars and terrain defence bonuses only after the core loop feels good.
