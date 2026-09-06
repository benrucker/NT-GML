# NTT 100.034 API dump

Generated 2026-09-02 23:13 by running `/gmlapi` in Nuclear Throne Together 100.034 (`game_version = 100034`). Copied verbatim from `%LOCALAPPDATA%\nuclearthrone\api\`.

| File | Contents |
|---|---|
| `api.gml` | 984 functions, 413 constants, 33 variables, GMEdit annotation format (see `NTGML-SPEC.md` §5) |
| `raw-functions.gml` | function names only |
| `raw-constants.gml` | constant names only |
| `raw-variables.gml` | variable names only |
| `raw-sprites.gml` | sprites, masks, shaders |
| `raw-sounds.gml` | sounds, music, ambience |
| `raw-fonts.gml` | fonts |
| `raw-objects.gml` | objects (alphabetical; 564) |
| `raw-assets.gml` | all assets in one file. **Do not use**: sections are concatenated without a separator, producing `__newsprite2113amb0`, `sndYVUltraBfntChat`, `__newfont7__PlayerParent`. Kept for reference only. |

Not included: `fields.gml` (stale, from a 2025-07-16 pre-100 dump; `/gmlapi` no longer regenerates it) and `default.gml` (built-in instance variables; `/gmlapi` never emits it, take it from the `bits-of-nuclear-throne` repo).

The dump does carry argument type hints (`array_slice(arr:array, start:int, length:int)`, `sound_play(:sound)`), but not on every function: 341 of its 984 functions have at least one typed argument. The 100.022 reference `api.gml` in `bits-of-nuclear-throne/GMEdit/` supplies 252 more argument types on 138 functions, 135 of which this dump leaves untyped entirely (the generator prints the figure as `hints merged`); merge them in by argument position, never overwriting a type the dump already gives.

Placeholder names to filter: `background7`, `__newsprite2113`, `__newfont6`, `__newfont7`.

Refresh: run `/gmlapi` in-game, copy the folder here under a new version directory.
