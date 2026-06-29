# Structural Rebuild Notes

## Direction

Use Civilization II only as a structural reference for a classic turn-based strategy skeleton:

- map-first screen discipline
- tile-based terrain and yield decisions
- small readable unit roles
- city founding and production as the core loop
- clear end-turn flow
- compact framed information panels

Do not copy Civilization II assets, text, data tables, UI layout pixel-for-pixel, or original rule values.

## Our Product Layer

Strategic Game Project should become its own frontier strategy game:

- procedural maps should make settlement location matter
- terrain readability should be modern and original
- units and cities should have stronger custom identity
- resources should create pressure without adding early complexity
- the code should stay plain HTML, CSS, and JavaScript

## First Rebuild Slice

The first local rebuild slice focuses on the foundation:

- separate map width and height instead of a single test-board size
- protected player and enemy start zones
- continent/coast shaping
- mountain ranges as natural barriers
- forest and hill clusters as settlement context
- cleaner map-first rendering with less always-on debug clutter

Gameplay systems stay the same for this slice.
