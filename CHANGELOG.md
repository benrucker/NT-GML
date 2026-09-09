# Change Log

All notable changes to the Nuclear Throne Together GML extension are recorded
here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This repository previously held a VS Code extension for a different game's GML
dialect, written by fudgepop01 between 2020 and 2023. None of that code
remains; it was removed before any Nuclear Throne Together release, and nothing
below covers it. The LICENSE file carries the attribution.

## [0.1.0] - Unreleased

The first Nuclear Throne Together version. No release date has been chosen and
nothing has been published: the extension is not on the Marketplace, and the
only way to use it is to build a `.vsix` with `pnpm package` or to take one
from a CI run.

### Added

- Two languages, picked by file extension the way NTT picks its parser:
  `ntgml-legacy` for `.gml` (GMS1-style, `#define` scripts) and `ntgml` for
  `.ntgml` (modern, with `function`, `new`, `static`, structs and `$"..."`).
  Both know the NTT-only syntax that no other GML tooling has: `wait`,
  `fork()`, `"name" in inst`, `#macro`, `#pragma`, and `#define` with named
  arguments.
- Syntax highlighting for both dialects, from grammars generated out of the
  identifier tables, so every API name, constant, asset and keyword is scoped
  rather than matched by a prefix heuristic, and the modern-only forms are
  coloured only in the modern dialect.
- Identifier tables built from the NTT 100.034 `/gmlapi` dump: 984 functions,
  413 constants and 3,927 asset names (sprites, masks, shaders, sounds, music,
  ambience, fonts, objects), plus 90 variables — 33 from the dump and 57
  built-in instance variables from the 100.022 reference's `default.gml`,
  which `/gmlapi` does not emit.
- Prose documentation for 558 entries, extracted from the
  [bits-of-nuclear-throne](https://github.com/YAL-Game-Tools/bits-of-nuclear-throne)
  documentation sources rather than from the dump.
- Completions, hover, and signature help for both dialects, with argument
  snippets, argument types on 476 of the 984 functions, deprecation and
  self/other notes, and NTT-specific names sorted ahead of generic GameMaker
  ones.
- Context-aware completions: reserved mod events for the mod type in the file
  name (`.mod`, `.race`, `.skin`, `.wep`, `.area`, `.skill`, `.crown`),
  `Custom*` object callback fields, button names inside `button_check` and
  friends, object names where an object argument is expected, and pragma names
  after `#pragma`. Nothing is offered inside a comment or a string.
- Instance variables of the game's own objects, in a `with (Obj)` body and
  after `Obj.`: 1,493 fields over 489 of the 564 objects, offered with their
  inherited names (`Player` has 125 — its own 111 plus `hitme`'s 14) and
  hovered with whichever object in the chain declares each one. Merged from
  three vendored sources: the game's 2025-07-16 `fields.gml` dump, six object
  pages from the documentation repo (the only source of types and prose), and
  three names added by hand from the documented changelog. The 75 objects the
  dump never listed are not guessed at: two of them are covered by the hand
  written `Custom*` table and the other 73 offer nothing at all.
- A third language, `ntt-main`, for the `main.txt` / `main.cfg` command files
  that tell NTT what to load. Highlighting only — it contributes no
  completions and does not activate the extension. `//` comments; 122 command
  names taken from the 100.034 binary itself, split into the 38 loader-side
  ones (loading, unloading, saving, allowing and silencing, with their aliases,
  plus `/timeout`, `/gml`, `/gml2`, `/gmlapi` and the sideloading vote) and the
  84 other chat commands; a command the list does not know is coloured as
  invalid. It claims `main.txt`, `main.cfg` and `main<digits>...txt`.
- An extension icon, so the Extensions view no longer shows a placeholder:
  the game's own crown icon, extracted from `nuclearthrone.exe` by
  `tools/extract-icon.ps1` and pinned by hash in the packaging tests. It is
  Vlambeer's artwork, not the extension's (see `LICENSE`).
- A regeneration workflow: `pnpm gen` rebuilds the tables and both NTGML
  grammars from a fresh `/gmlapi` dump, so a new NTT release can be picked up
  without hand-editing anything. Output is deterministic, and both the test
  suite and CI fail if the committed tables drift from what the generator
  produces.

### Known limitations

What the extension deliberately does not do — the `#pragma gml 2` highlighting
gap, the global `.gml` claim, the ungated `delete` / `finally`, the bounded
completion window, and the 73 objects with no instance variables — is listed in
[README.md](README.md#known-limitations).
