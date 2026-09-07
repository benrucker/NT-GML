# NTT documentation sources

Copied from `YAL-Game-Tools/bits-of-nuclear-throne` (docs last updated 2025-12-18, NTT 100.023-100.034). Used by `tools/generate-api.ts` to build `src/generated/docs.json`.

- `scripting/*.dmd`: DocMark sources of the online docs (`yal-game-tools.github.io/bits-of-nuclear-throne`). `Syntax.dmd` is the language spec; `API-*.dmd` are per-function prose.
- `ref/*.gml`: callback fields of `Custom*` objects (excerpts of game source).
- `Changelog.md`: version each feature landed in.
- `objects/*.html`: per-object instance-variable reference, the only source of *types* and
  prose for the game's own instance variables (`api/ntt-fields-2025-07-16/fields.gml` gives
  bare names). Rendered pages, not sources: YAL's `object-info-gen` GMEdit plugin extracts
  them from the private game project into the repo's `auto-objects/`, and its `BuildDocs.hx`
  renders those to `docs/objects/`, which is where these were copied from, byte for byte.
  Six of the repo's 19 pages are vendored -- `GameCont`, `GmlMod`, `Player`, `TopCont`,
  `UberCont`, `WepPickup`. The other 13 are the `Custom*` objects, whose callback fields
  `ref/*.gml` already covers. Parsed by `tools/parse-object-docs.ts`; a page's variable may
  be attributed to an ancestor, since each sits under a `from <object>` group.

License: no license file in the source repository as of 2026-09-06; vendored for reference and doc-string generation only. `https://github.com/YAL-Game-Tools/bits-of-nuclear-throne` has no `LICENSE` file and GitHub reports no license for it; its `README.md` says "All rights reserved and such."
