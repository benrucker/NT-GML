# Nuclear Throne Together GML

VS Code support for NTGML, the GML dialect that Nuclear Throne Together mods are written in. The target is NTT 100.034.

**WIP.** The extension is not ready to use. The progress is captured in [NTGML-PORT-SCOPE.md](NTGML-PORT-SCOPE.md#progress).

## The two dialects

NTT picks the language version by file extension, so the extension contributes two languages.

| Language id    | Extension | What it is                                                                                                                  |
| -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ntgml-legacy` | `.gml`    | GMS1-style. `#define` scripts, backtick template strings, no `[$]` accessor. Nearly all published mods are written in this. |
| `ntgml`        | `.ntgml`  | GM2022-style. Adds `function`, `new`, `static`, `try`/`catch`/`throw`, `delete`, structs, and `$"..."` strings.             |

`.gml` is claimed globally for `ntgml-legacy`, exactly as the original extension claimed it. VS Code has no way to register a language for only some folders, so while this extension is enabled every `.gml` file gets NTT highlighting and completions — including the `.gml` files of a GameMaker Studio project, whose API this extension does not know. To opt out, either remap the extension in your settings:

```jsonc
// .vscode/settings.json, or your user settings
"files.associations": { "*.gml": "gml" }  // or whichever language id you prefer
```

or disable this extension for that workspace (Extensions view → the extension → **Disable (Workspace)**).

Both dialects share the NTT-specific syntax that no other GML tooling knows about: `wait`, `fork()`, `"name" in inst`, `#macro`, `#pragma`, and `#define` with named arguments. [NTGML-SPEC.md](NTGML-SPEC.md) is the full language description.

## What is in the repo

| Path                                            | Contents                                                                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/extension.ts`, `src/completionProvider.ts` | The extension entry point and the completion provider.                                                                                               |
| `src/generated/`                                | Identifier tables generated from the API dump: functions, constants, variables, assets, and per-function docs. Never edit by hand.                   |
| `src/tables/`                                   | Hand-maintained tables: mod events per mod type, `Custom*` object callbacks, button names, keywords, and the shared types.                           |
| `tools/`                                        | The generator. `parse-api.ts` reads the dump format, `parse-docs.ts` pulls prose out of the docs sources, `generate-api.ts` writes `src/generated/`. |
| `api/ntt-100.034/`                              | The vendored `/gmlapi` dump this build is generated from. Source of truth.                                                                           |
| `api/ntt-100.022-reference/`                    | An older, hand-annotated dump. Used only for the argument type hints the live dump does not emit.                                                    |
| `api/ntt-docs/`                                 | A copy of the [bits-of-nuclear-throne](https://github.com/YAL-Game-Tools/bits-of-nuclear-throne) docs sources.                                       |
| `api/overrides.gml`                             | Hand-written corrections merged last.                                                                                                                |
| `test/`                                         | Golden-file tests. See [test/README.md](test/README.md).                                                                                             |
| `data/gml-configuration.json`                   | Bracket pairs, comment tokens, and auto-closing for both languages.                                                                                  |

## Working on it

```
pnpm install
pnpm build      # extension, generator, and tests
pnpm test       # builds, then runs the golden-file suite
pnpm lint
pnpm gen        # regenerate src/generated from the dump
pnpm package    # produces a .vsix
```

`pnpm gen` prefers a dump in `%LOCALAPPDATA%\nuclearthrone\api` when one is there and is new enough, and falls back to `api/ntt-100.034/` otherwise. You get a fresh dump by typing `/gmlapi` in the game's chat. Output is deterministic, and one of the tests fails if the committed tables drift from what the generator produces, so regenerate and commit together.

CI runs lint, test, and package on Ubuntu and Windows for every push to `main` and every pull request.

## Other documents

- [NTGML-PORT-SCOPE.md](NTGML-PORT-SCOPE.md) is the port plan and lists what NTT adds and removes relative to the old extension.
- [NTGML-SPEC.md](NTGML-SPEC.md) is the language spec and wins where the two disagree.
- [NTT Modding Cheat Sheet.md](NTT%20Modding%20Cheat%20Sheet.md) is a community reference on event order, depth, and time scale.

## History

Everything before commit `33fd3de` is a Rivals of Aether GML extension, including the RoABox move visualizer. That code was removed in `3006ae3` and lives on in the git history.
