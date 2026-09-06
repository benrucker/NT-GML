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
- `pnpm gen` regenerates the tables and grammars from a fresh dump, so a new
  NTT release can be picked up without hand-editing anything.
