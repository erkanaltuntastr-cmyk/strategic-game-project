# Strategic Game Project Visual Library

This folder contains original raster assets for the map generator.

These files are not copied from Civilization II, Civilization IV, Civilization V, or any other game.

## Terrain Tiles

- `tiles/grassland.png`
- `tiles/forest.png`
- `tiles/hill.png`
- `tiles/mountain.png`
- `tiles/water.png`

## Resource Icons

- `resources/fish.png`
- `resources/game.png`
- `resources/gold.png`
- `resources/ore.png`

## Map Lab Markers

- `markers/player-start.png`
- `markers/enemy-start.png`

## Import / Generation

The current primary asset library was imported from user-provided ChatGPT-generated images kept outside the repository.

Run this command from the project root to re-import those source images:

```powershell
$env:STRATEGIC_GAME_ASSET_SOURCE="path\to\source-assets"
python scripts\import_generated_assets.py
```

There is also a procedural fallback generator for simple placeholder art:

```powershell
python scripts\generate_visual_assets.py
```

Do not run the fallback generator if you want to preserve the higher-quality imported ChatGPT image assets.

The current pipeline intentionally keeps map visuals as real PNG assets instead of CSS/SVG-like terrain motifs. This gives us a proper visual library that can be improved tile by tile.
