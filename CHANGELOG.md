# Change Log

All notable changes to the Nuclear Throne Together GML extension are recorded
here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This repository previously held a VS Code extension for a different game's GML
dialect, written by fudgepop01 between 2020 and 2023. None of that code
remains; it was removed before any Nuclear Throne Together release, and nothing
below covers it. The LICENSE file carries the attribution.

## [Unreleased]

The first Nuclear Throne Together version. Nothing has been released yet; build
a `.vsix` with `pnpm package` to use it.

### Added

- Two languages, picked by file extension the way NTT picks its parser:
  `ntgml-legacy` for `.gml` (GMS1-style, `#define` scripts) and `ntgml` for
  `.ntgml` (modern, with `function`, `new`, `static`, structs and `$"..."`).
  Both know the NTT-only syntax: `wait`, `fork()`, `in`, `#macro`, `#pragma`,
  and `#define` with named arguments.
- Syntax highlighting for both dialects, generated from the identifier tables
  so that every API name, constant, asset and keyword is scoped.
- Identifier tables generated from the NTT 100.034 `/gmlapi` dump: 984
  functions, 413 constants and 3,927 asset names (sprites, masks, shaders,
  sounds, music, ambience, fonts, objects), plus 90 variables — 33 from the
  dump and 57 built-in instance variables from the 100.022 reference's
  `default.gml`, which `/gmlapi` does not emit.
- Prose documentation for 558 entries, extracted from the
  [bits-of-nuclear-throne](https://github.com/YAL-Game-Tools/bits-of-nuclear-throne)
  documentation sources rather than from the dump.
- Completions, hover, and signature help for both dialects, with argument
  snippets, deprecation and self/other notes, and NTT-specific names sorted
  ahead of generic GameMaker ones.
- Context-aware completions: reserved mod events for the mod type in the file
  name (`.mod`, `.race`, `.skin`, `.wep`, `.area`, `.skill`, `.crown`),
  `Custom*` object callback fields, button names inside `button_check` and
  friends, object names where an object argument is expected, and pragma names
  after `#pragma`.
- Instance variables of the game's own objects, in `with (Obj)` bodies and
  after `Obj.`: 1,493 fields over 489 of the 564 objects, offered with their
  inherited names (`Player` has 125 - its own 111 plus `hitme`'s 14) and
  hovering with the object in the chain that declares each one. Merged from
  three vendored sources: the game's 2025-07-16 `fields.gml` dump, which is
  bare names; six object pages from the documentation repo, the only source of
  types and prose; and three names added by hand from the documented
  changelog. Built-in instance variables are excluded, since the general list
  already has them. The 75 objects with no entry in the dump get no fields from
  it; two of them, `CustomChest` and `CustomPickup`, are covered by the hand
  table, and the other 73 are not treated as receivers at all. A `with` body is
  bounded by its braces - or, brace-less, by the end of its statement - so the
  object goes back out of scope at the closing `}`. A word starting with `on_`
  is deliberately not bounded that way: it takes the last `Custom*` object
  named anywhere in the window, since callbacks are assigned outside the body
  and no other object has `on_` names.
- A third language, `ntt-main`, for the `main.txt` / `main.cfg` command files
  that tell NTT what to load: `//` comments; 38 loader-side names, being the
  32 mod, command-file and locale commands (loading, unloading, saving,
  allowing and silencing, with their aliases) together with `/timeout`,
  `/gml`, `/gml2`, `/gmlapi` and the sideloading vote; the other 84 chat
  commands (the sprite, image and save-file ones among them); and an invalid
  scope for a command name the grammar does not know. The 122 names are the
  100.034 binary's own - every `chat_cmd_<name>` handler plus every alias its
  `/help` table registers - which covers both the spec's list and the FAQ's.
  Highlighting only: it contributes no completions and does not activate the
  extension. It claims `main.txt`, `main.cfg` and `main<digits>...txt`.
- An extension icon, so the Extensions view no longer shows a placeholder.
  `tools/render-icon.ts` draws it from analytic shapes with no dependencies;
  `pnpm gen:icon` re-renders it. The committed PNG is checked by decoding it
  and comparing pixels with a fresh render, not by comparing file bytes, so
  zlib changing its output between Node releases cannot fail the build; the
  small per-channel tolerance covers rounding, not a changed picture.
- `pnpm gen` regenerates the tables and grammars from a fresh dump, so a new
  NTT release can be picked up without hand-editing anything.
