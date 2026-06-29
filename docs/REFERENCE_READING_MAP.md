# Reference Reading Map

## Purpose

This document defines how we will study the Civilization Games Wiki and related classic strategy references without copying protected assets, text, exact UI, or exact rule tables.

The goal is design extraction:

- identify solved strategy-game structure problems
- understand map, terrain, resource, city, and unit relationships
- translate useful principles into our own original Strategic Game Project systems
- keep our code, visuals, names, values, and product identity original

## Boundary

Use wiki pages only as structural and historical reference.

Do not copy:

- original game assets
- exact terrain art
- exact unit art
- exact UI layouts
- exact text
- exact data tables
- exact rules when they are distinctive to a specific game

Allowed:

- broad genre patterns
- map-generation concepts
- terminology for internal research notes
- comparative analysis
- high-level design lessons

## Primary Reading Order

### 1. Civilization II

Why:
Civilization II is the closest structural reference for the first version: simple, tile-based, turn-based, city-focused, readable.

Read for:

- map settings
- terrain categories
- movement constraints
- city founding
- production loop
- terrain improvements
- resource placement
- fog / exploration behavior
- UI screen discipline

Convert into our project as:

- map generator knobs
- terrain/yield logic
- city placement rules
- simple production loop
- map-first interface principles

Do not take:

- asset sheets
- exact UI
- exact rules or numbers
- exact names unless they are generic genre words

### 2. Colonization / FreeCol

Why:
Our game should feel like a frontier settlement game, not only an empire abstraction.

Read for:

- settlement pressure
- resource-location value
- exploration feeling
- early economy clarity
- terrain/resource relationship

Convert into our project as:

- stronger resource clusters
- more meaningful starting locations
- frontier-style settlement decisions
- map generation that creates local stories

Do not add yet:

- trade routes
- complex professions
- Europe/colonial metagame
- advanced economy chains

### 3. Freeciv

Why:
Freeciv is useful as an open-source 4X reference for general system structure.

Read for:

- data-driven terrain/unit/building organization
- map generation vocabulary
- simple AI concepts
- ruleset separation

Convert into our project as:

- cleaner local data model
- eventual ruleset files
- generator presets
- testable map validation

### 4. Civilization IV / Civilization V

Why:
Later Civilization games refined terrain, resources, improvements, and map readability.

Read for:

- resource placement logic
- terrain improvement logic
- visible strategic value
- terrain variety without overwhelming early play

Convert into our project as:

- better terrain-resource placement
- clearer resource rarity
- better map-lab quality scoring
- improved visual library targets

Do not add yet:

- complex happiness systems
- large tech tree
- policy trees
- many unit eras

### 5. Civilization VI / Civilization VII

Why:
Modern Civ games are most useful for adjacency, districts, and readability lessons, not for our v0.1 gameplay.

Read for:

- adjacency logic
- map readability at modern resolution
- district/resource/terrain spatial pressure
- UI clarity

Convert into our project as:

- future map-quality scoring
- stronger settlement-site evaluation
- visual hierarchy ideas

Do not add yet:

- districts
- governors
- religion
- complex diplomacy
- large civic/tech systems

## Map Generator Research Questions

The generator should answer these questions before we expand gameplay:

- Is each start location playable?
- Is there enough food near each start?
- Is there enough production near each start?
- Is the enemy far enough away?
- Are water, forest, hills, and mountains visually and strategically distinct?
- Does the map have at least one memorable geographic feature?
- Are resources clustered enough to create decisions?
- Are resources not so clustered that one start is obviously superior?
- Are natural barriers useful without trapping the player?
- Does the map create settlement choices within the first 5 turns?

## Generator Knobs To Build

Inspired by classic strategy map setup screens, but implemented as our own system:

```js
{
  width: 16,
  height: 12,
  landMass: "normal",
  landForm: "continents",
  climate: "temperate",
  rainfall: "normal",
  temperature: "temperate",
  worldAge: "mature",
  resourceDensity: "normal",
  startBalance: "fair"
}
```

Initial preset ideas:

- `Showcase Frontier`
- `Balanced Frontier`
- `Broken Coast`
- `Highland March`
- `Green Frontier`
- `Island Chain`

## Visual Library Research Questions

For each terrain asset:

- Is it readable at 64x64?
- Is it readable at 96x96?
- Does it still read when repeated many times?
- Does it feel original?
- Does it avoid copyrighted visual resemblance?
- Does it support map-first gameplay?

For each resource icon:

- Does it read instantly?
- Is it visible on every terrain where it can appear?
- Is it smaller than a city/unit would be?
- Does it create interest without clutter?

## Current Local Outputs

Current map-related files:

- `mapGenerator.js`
- `mapLab.js`
- `map-lab.html`
- `assets/tiles/`
- `assets/resources/`
- `assets/markers/`
- `scripts/generate_visual_assets.py`

Current principle:

Build the map generator and visual library first. The gameplay module comes later.
