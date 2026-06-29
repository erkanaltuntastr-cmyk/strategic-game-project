# Strategic Game Project — Asset Production Brief

## Purpose

This document defines the visual asset production direction for Strategic Game Project.

The project direction is:

> Hex-based strategy map, 2026 visual quality, old-school turn-based strategy flow.

The game should not look like a 1990s game. It should feel like a modern remake of the readable 1990s strategy-game interface.

The rule is:

> Go backwards in gameplay complexity, not backwards in visual quality.

---

## Division of Work

### Codex Should Handle

- hex grid logic
- map generation
- JSON schema
- render pipeline
- asset loading
- hover/select/highlight systems
- game integration
- export/import flow

### Human / Image Production Should Handle

- terrain visuals
- resource icons
- city visuals
- unit sprites/icons
- UI frames and panels
- buttons, badges, labels
- overall art direction

Codex should not be expected to invent polished visual assets from CSS alone.

---

## Visual Direction

The visual style should be:

- hex map based
- high readability
- painterly but clear
- strategic world-map feeling
- realistic enough to feel rich
- stylised enough to remain readable at small size
- original, not copied from Civilization II or any other game

The map should feel like a living strategic world, not a debug grid.

---

## Copyright / Reference Boundary

Civilization II and other classic strategy games may be studied only for:

- screen discipline
- readability
- map-first design
- unit/city contrast
- terrain clarity
- old-school turn flow

Do not copy, crop, trace, recolor, recreate, or import original game assets.

All assets must be original.

---

## Asset Families

## A. Terrain Hex Tile Set

The most important first asset group.

Required starter terrain:

- grassland
- plains
- forest
- hills
- mountain
- coast
- sea
- deep sea
- lake
- desert
- tundra

Each tile should be readable as a hex map tile.

Preferred qualities:

- painted strategic map feel
- subtle lighting
- enough internal texture to avoid flat color
- no text baked into assets
- no UI border baked into base terrain unless needed
- works at small size

Terrain should communicate gameplay meaning:

- grassland = fertile food land
- plains = open dry land
- forest = wood/cover/production
- hills = rough production/defence
- mountain = strong barrier
- coast = land-water transition
- sea = navigable water later
- deep sea = deeper, darker water
- lake = inland water/food
- desert = low food harsh terrain
- tundra = cold low-growth terrain

---

## B. Feature Overlay Set

Feature overlays sit above base terrain.

Needed overlays:

- river straight segment
- river bend segment
- river fork / junction
- coast foam / shoreline accent
- forest density accent
- mountain peak accent
- road segment later
- farm improvement later
- mine improvement later

These should be transparent PNG-style assets when implemented.

---

## C. Resource Icons

Resources must be small, readable, and visually attractive.

Starter resource icons:

- fish
- deer / hunting animals
- wheat
- horses
- gold
- stone / ore

Resource icons should:

- be readable on terrain
- not overpower the hex
- have slight shadow/outline for contrast
- be original
- avoid text labels

---

## D. City Set

Cities must be more visually important than units.

Starter city assets:

- player city small
- player city medium
- player city large
- enemy city small
- enemy city medium
- enemy city large

Early implementation may use one city design with player/enemy colour accents.

City should feel like the founded centre of the player’s empire.

---

## E. Unit Set

Starter units:

- settler
- scout
- warrior
- archer
- spearman
- horseman

Each unit needs at least:

- player version
- enemy version

For early versions, static map sprites are enough.

Units should be distinguishable by silhouette, not only colour.

---

## F. UI Kit

The UI should support the map, not dominate it.

Needed UI assets:

- top resource bar frame
- side panel frame
- city panel frame
- unit card frame
- next turn button
- action button frame
- city label plaque
- selected unit badge
- minimap frame
- icons for food, production, gold, science/research

UI direction:

- dark parchment / metal / navy-gold strategy interface
- readable
- not sci-fi
- not debug dashboard
- not copied from any existing game

---

## Recommended Asset Folder Structure

```text
assets/
  terrain/
    grassland_01.png
    grassland_02.png
    plains_01.png
    forest_01.png
    hills_01.png
    mountain_01.png
    coast_01.png
    sea_01.png
    deep_sea_01.png
    lake_01.png
    desert_01.png
    tundra_01.png

  overlays/
    river_straight.png
    river_bend.png
    river_fork.png
    coast_foam.png
    road_straight.png
    farm_overlay.png
    mine_overlay.png

  resources/
    fish.png
    deer.png
    wheat.png
    horses.png
    gold.png
    ore.png

  cities/
    player_city_small.png
    player_city_medium.png
    player_city_large.png
    enemy_city_small.png
    enemy_city_medium.png
    enemy_city_large.png

  units/
    player_settler.png
    player_scout.png
    player_warrior.png
    player_archer.png
    player_spearman.png
    player_horseman.png
    enemy_settler.png
    enemy_scout.png
    enemy_warrior.png
    enemy_archer.png
    enemy_spearman.png
    enemy_horseman.png

  ui/
    topbar_frame.png
    panel_frame.png
    next_turn_button.png
    city_label.png
    food_icon.png
    production_icon.png
    gold_icon.png
    research_icon.png
```

---

## Production Phases

## Phase 1 — Hex Terrain Starter Pack

Goal: make the generated map look like a real strategy-game world.

Produce:

- grassland
- plains
- forest
- hills
- mountain
- coast
- sea
- lake
- river overlay set
- fish
- deer
- wheat
- gold
- ore

This phase is the highest priority because the map is the heart of the game.

---

## Phase 2 — World Identity Pack

Produce:

- player city small/medium/large
- enemy city small/medium/large
- settler
- scout
- warrior
- archer
- spearman
- horseman

---

## Phase 3 — UI Identity Pack

Produce:

- top bar
- side panels
- turn button
- action buttons
- minimap frame
- city label
- unit card
- resource icons for UI

---

## Technical Notes for Integration

Codex should integrate assets only after the first asset pack exists.

Asset integration tasks:

1. Load terrain images.
2. Map terrain IDs to image assets.
3. Render base hex tile first.
4. Render feature overlays.
5. Render resource icons.
6. Render cities.
7. Render units.
8. Render selection/highlight as code overlays.
9. Keep generated map data separate from visual assets.

Do not bake selection, movement highlight, fog of war, or labels into the base assets.

---

## First Asset Pack Target

Name:

**Hex Terrain Starter Pack v1**

Contents:

- 8–10 terrain hexes
- 5–6 resource icons
- river overlay starter set

Style:

- original
- readable
- modern quality
- painterly map feel
- strategy-game usable
- no copyrighted assets

---

## Final Reminder

The map is the product.

Before adding complex gameplay, the player must want to look at the world and explore it.
