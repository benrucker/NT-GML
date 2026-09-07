# Nuclear Throne Together GML

VS Code support for NTGML, the GML dialect that Nuclear Throne Together mods are written in. The target is NTT 100.034.

Every phase of the port plan has landed — see the progress table in [NTGML-PORT-SCOPE.md](NTGML-PORT-SCOPE.md#progress) — so the extension works, but it is not on the Marketplace yet.

## Installing

Build a `.vsix` yourself, or download the `vsix` artifact from a CI run on `main`, then:

```
pnpm install && pnpm package
code --install-extension ntgml-0.1.0.vsix
```

## The two dialects

NTT picks the language version by file extension, so the extension contributes two languages. (A third, `ntt-main`, covers `main.txt` command files - see below.)

| Language id    | Extension | What it is                                                                                                                  |
| -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ntgml-legacy` | `.gml`    | GMS1-style. `#define` scripts, backtick template strings, no `[$]` accessor. Nearly all published mods are written in this. |
| `ntgml`        | `.ntgml`  | GM2022-style. Adds `function`, `new`, `constructor`, `static`, structs, `$"..."` strings, and (per the spec) `delete`.       |

`.gml` is claimed globally for `ntgml-legacy`, exactly as the original extension claimed it. VS Code has no way to register a language for only some folders, so while this extension is enabled every `.gml` file gets NTT highlighting and completions — including the `.gml` files of a GameMaker Studio project, whose API this extension does not know. To opt out, either remap the extension in your settings:

```jsonc
// .vscode/settings.json, or your user settings
"files.associations": { "*.gml": "gml" }  // or whichever language id you prefer
```

or disable this extension for that workspace (Extensions view → the extension → **Disable (Workspace)**).

Both dialects share the NTT-specific syntax that no other GML tooling knows about: `wait`, `fork()`, `"name" in inst`, `#macro`, `#pragma`, and `#define` with named arguments. [NTGML-SPEC.md](NTGML-SPEC.md) is the full language description.

### `main.txt` command files

A third language, `ntt-main`, covers the command files that tell NTT what to load. A `main.txt` (or `main.cfg`) is a list of chat commands, one per line - `/loadmod teloader`, `/loadwep Weapons/kirby.wep`, `/timeout 600` - which the game runs when you `/load` the folder that holds it. NTT documents no comment syntax at all; shipped mods disable a line by prefixing it with `//`, and the extension colours any `//` line as a comment. Files chain: a `main.txt` ending in `/load main2` or `/loadtext main2.txt` hands over to the next one.

The language claims `main.txt`, `main.cfg`, and `main<digits>...txt` - the `main[0-9]*.txt` pattern, which picks up the chained `main2.txt` and `main3.txt` without claiming an unrelated `mainframe.txt` or `maintenance.txt` in some other workspace. As with `.gml`, `files.associations` overrides it.

It is highlighting only: no completions, no hovers, and nothing in the extension activates for it. Commands are matched case-sensitively in lower case, which is how every documented and every observed one is written. A command the grammar does not know - `/lodmod`, or a command from a newer NTT - is coloured as invalid, and so is an argument after a command that takes none (`/gmlapi x`) or a non-numeric `/timeout`. The command list is the NTT 100.034 binary's own: 122 names, being every `chat_cmd_<name>` handler in its string pool plus every alias its `/help` table registers, which is a superset of both [NTGML-SPEC.md](NTGML-SPEC.md) section 9 and the NTT FAQ's 49-name chat-command list. 38 of them are the mod, command-file and locale commands - loading, unloading, saving, allowing and silencing, with their aliases - plus `/timeout`, `/gml`, `/gml2`, `/gmlapi` and the sideloading vote, so what follows one is a path, a duration, a line of GML, or nothing at all; the other 84 are the rest of the chat commands - the sprite, image and save-file ones among them - which `/load` will run from a command file just the same. `syntaxes/ntt-main.tmLanguage.json` is hand-maintained and records where each name came from. The argument of `/gml` is marked as embedded GML but is *not* tokenised by the NTGML grammars, so an unterminated `/*` on a `/gml` line cannot swallow the rest of the file.

## Object instance variables

Inside a `with (Player)` body, or after `Player.`, the completion list starts with the instance variables that object actually has - `wep`, `ammo`, `gunangle`, `my_health` - ranked above the whole built-in table, and hovering one says what it is:

```
instance variable of Player (inherited from hitme)
```

Inheritance is followed: `Player` extends `hitme`, so its 125 fields are its own 111 plus `hitme`'s 14, and the hover names whichever object in the chain declares the one you are looking at. `UberCont` is the largest at 184.

The names come from three vendored sources, merged in this order and never guessed at:

1. `api/ntt-fields-2025-07-16/fields.gml`, the game's own dump of per-object variable lists. It covers **489 of the 564 objects** in the 100.034 API dump;
2. the six object pages under `api/ntt-docs/objects/`, which are the only source of *types* and prose, and which also know a few names the dump does not;
3. `api/fields-overrides.gml`, three names added by hand from the documented changelog.

Built-in instance variables (`x`, `sprite_index`, `speed`) are deliberately **not** offered as fields of an object - they are already in the general list, and offering them twice would bury the object's own names.

73 of the 75 objects with no entry get no fields at all, and are not treated as receivers: after `MultiMenu.` the extension offers nothing rather than guessing. The other two, `CustomChest` and `CustomPickup`, are covered by the hand-written `Custom*` table instead. See [api/ntt-fields-2025-07-16/README.md](api/ntt-fields-2025-07-16/README.md) for why, and for how to refresh the dump.

## Known limitations

- **`#pragma gml 2` does not change the highlighting.** VS Code picks one grammar per file extension, so a `.gml` file that opts into the modern dialect is still coloured as legacy: `function`, `new` and `$"..."` will look wrong even though the game accepts them. Completions *do* follow the pragma, but only when it is within the first 40 lines *and* the first ~2 KB (2,048 characters) of the file, which is as far as the scan reads. Save the file as `.ntgml` if you want the modern colours.
- **`.gml` is claimed for every workspace**, which collides with other GameMaker extensions. See [The two dialects](#the-two-dialects) for how to opt out.
- **`main.txt`, `main.cfg` and `main<digits>...txt` are claimed for every workspace too**, for the same reason: language contributions are global, so a `main.txt` that has nothing to do with NTT is coloured as a command file. The opt-out is the same - `"files.associations": { "main*.txt": "plaintext", "main.cfg": "plaintext" }`, or disabling the extension for that workspace.
- **`delete` and `finally` are offered and highlighted in both dialects**, even though the spec lists `delete` as modern-only and leaves `finally`'s gating open. The extension does not gate either: nothing documents what the legacy parser really rejects, and guessing wrong in that direction would hide working code.
- **Single-quoted strings are highlighted as strings in the modern dialect too**, although the modern parser most likely rejects them. The spec only says "likely", so the grammar does not encode the guess.
- **Completions read a ~4 KB window** (4,000 characters) ending at the cursor and snapped back to the enclosing `#define` / `function`. In a very long script the context rules can see a truncated view and offer the wrong list.
- **A name after a `.` is coloured as a member, not as the built-in of the same name**, so `global.frac` is not coloured like the `frac` function. The one exception is the call form: `inst.alarm_set(0, 30)` really is an API call, so it keeps the function colouring. Reading the same field without calling it does not.
- **The "NTT-specific" sort tier comes from a hand-written list** (`src/tables/ntt-names.ts`) of NTT-only function families. The dump carries no flag for this, so functions added by a newer NTT release may sort as generic GameMaker names until that list is updated.
- **Instance variables are missing for 73 of the game's 564 objects.** They come from a `fields.gml` dump that the game no longer regenerates, and 75 of the 564 objects have no entry in it. The file names no game version, and what it does and does not list places the build that wrote it before 100.013 - or before 100.007, on an upstream docs page this repo does not vendor - so each of the 75 is either newer than that build or was skipped by the game's `/gmlapi` command, and nothing in the file says which. Both really happen: `button`, `menubutton` and `loadbutton` were skipped, since the dump itself names them as the parents of entries it did write, while `CustomChest` arrived in 100.025 and is genuinely newer. Two of the 75, `CustomChest` and `CustomPickup`, are covered by the hand-written `Custom*` table; completing after any of the other 73 objects' dot offers nothing at all.
- **A `with` receiver is bounded by braces; an `on_` word is not.** Inside `with (Obj) { ... }` the object's instance variables are offered until the matching `}`, and a brace-less `with (Obj) stmt` counts only as far as the next `;` or the end of that line, so a brace-less `with` whose statement is on the *next* line loses the object. A word starting with `on_` is bounded differently on purpose: a callback is normally assigned *outside* any `with` body (`e.on_step = ...`, a few lines after creating `e`), so that path takes the last `Custom*` object named anywhere in the window - a `with` head or an `instance_create` argument - even when its block has already closed, and falls back to the union of every `Custom*` callback when the window names none. It ignores the game's own objects entirely, because only `Custom*` objects have `on_` names. Neither form is seen at all when its head is above the ~4 KB completion window, and strings and comments are masked out first, so a `with (Player)` written in a comment is not a receiver.
- **Argument types cover about half the API.** Measured against the shipped tables, 476 of the 984 functions have at least one typed argument in hovers and signature help. Most of those types come from the live dump; the older hand-annotated 100.022 reference fills in the rest. The other functions show argument names only.

## What is in the repo

| Path                                            | Contents                                                                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/extension.ts`, `src/completionProvider.ts` | The extension entry point, and the thin VS Code layer that registers the completion, hover and signature-help providers. Logic lives in `src/provider/`. |
| `src/provider/`                                 | What those providers actually do, in five modules that never import `vscode`: `model`, `format`, `items`, `context`, `signature`.                     |
| `src/generated/`                                | Identifier tables generated from the API dump: functions, constants, variables, assets, and per-function docs. Never edit by hand.                   |
| `src/tables/`                                   | Hand-maintained tables: mod events per mod type, `Custom*` object callbacks, button names, keywords, `ntt-names.ts` (the NTT-only families that drive the sort tier), and the shared types. |
| `tools/`                                        | The generators. `parse-api.ts` reads the dump format, `parse-docs.ts` pulls prose out of the docs sources, `generate-api.ts` writes `src/generated/`, `generate-grammar.ts` writes the two NTGML grammars, and `render-icon.ts` draws `resources/icon.png`. |
| `api/ntt-100.034/`                              | The vendored `/gmlapi` dump this build is generated from. Source of truth.                                                                           |
| `api/ntt-100.022-reference/`                    | An older, hand-annotated dump. Fills argument-type gaps the live dump leaves, and supplies `default.gml`'s built-in instance variables.              |
| `api/ntt-docs/`                                 | A copy of the [bits-of-nuclear-throne](https://github.com/YAL-Game-Tools/bits-of-nuclear-throne) docs sources.                                       |
| `api/ntt-fields-2025-07-16/`                    | The game's own per-object instance-variable dump, vendored under its own header date because the game no longer regenerates it. Always read from here, never from `%LOCALAPPDATA%`. |
| `api/ntt-docs/objects/`                         | Six rendered object pages from the same docs repo. The only source of instance-variable types and prose.                                              |
| `api/fields-overrides.gml`                      | Instance variables added by hand from the documented changelog, merged after both of the above.                                                       |
| `api/overrides.gml`                             | Hand-written corrections merged last.                                                                                                                |
| `api/reference/`                                | GMEdit's parser for the dump's annotation format, kept as a reference for `tools/parse-api.ts`. Not compiled.                                        |
| `docs/`                                         | Community reference material. Not shipped in the `.vsix`.                                                                                            |
| `test/`                                         | Golden-file tests. See [test/README.md](test/README.md).                                                                                             |
| `syntaxes/`                                     | Three TextMate grammars. `ntgml.tmLanguage.json` and `ntgml-legacy.tmLanguage.json` come out of `pnpm gen` - never edit those by hand. `ntt-main.tmLanguage.json` is hand-maintained. |
| `data/gml-configuration.json`                   | Bracket pairs, comment tokens, and auto-closing, shared by `ntgml` and `ntgml-legacy`.                                                               |
| `data/ntt-main-configuration.json`              | The `ntt-main` language configuration: a `//` line comment and nothing else.                                                                         |
| `resources/icon.png`                            | The extension icon. Rendered by `tools/render-icon.ts`; `pnpm gen:icon` rewrites it.                                                                 |

## Working on it

```
pnpm install
pnpm build      # extension, generator, and tests
pnpm test       # builds, then runs the golden-file suite
pnpm lint
pnpm gen        # regenerate src/generated and syntaxes/ntgml*.json from the dump
pnpm gen:icon   # re-render resources/icon.png (not part of pnpm gen)
pnpm package    # produces a .vsix
```

### Refreshing the API

You get a fresh dump by typing `/gmlapi` in the game's chat, which writes to `%LOCALAPPDATA%\nuclearthrone\api`. The generator accepts that dump only if its `game_version` is at least 100000 and the folder holds the seven per-kind name lists (`raw-functions.gml`, `raw-constants.gml`, `raw-variables.gml`, `raw-sprites.gml`, `raw-sounds.gml`, `raw-fonts.gml`, `raw-objects.gml`) - the `MIN_LOCAL_VERSION` and `REQUIRED_DUMP_FILES` constants in `tools/generate-api.ts`. Current NTT 100.03x builds write all of them; an older dump such as the vendored 100.022 one has only the combined `raw-assets.gml`. Such a directory is not skipped quietly: its `game_version` clears the minimum, so the generator picks it and then stops with an error naming the missing files and telling you to re-run `/gmlapi` or pass `--vendored` to build from `api/ntt-100.034/` instead.

`pnpm gen` prefers the dump in `%LOCALAPPDATA%\nuclearthrone\api` when one is there and is new enough, and falls back to `api/ntt-100.034/` otherwise. Output is deterministic, and one of the tests fails if the committed tables drift from what the generator produces, so regenerate and commit together.

To move the repo to a newer NTT release, copy that folder into `api/` as a **new** version directory named after the game version (`api/ntt-100.035/`, alongside the existing `api/ntt-100.034/`), give it a `README.md` in the same shape as the current one, point the generator at it, and rerun `pnpm gen`. Old version directories stay; `api/ntt-100.022-reference/` in particular is still needed, because it is the only source of `default.gml`'s 57 built-in instance variables and it fills argument-type gaps that the live dump leaves.

CI runs lint, test, and package on Ubuntu and Windows for every push to `main` and every pull request.

## Other documents

- [NTGML-PORT-SCOPE.md](NTGML-PORT-SCOPE.md) is the port plan and lists what NTT adds and removes relative to the old extension.
- [NTGML-SPEC.md](NTGML-SPEC.md) is the language spec and wins where the two disagree.
- [docs/NTT Modding Cheat Sheet.md](docs/NTT%20Modding%20Cheat%20Sheet.md) is a community reference on event order, depth, and time scale.
- [CHANGELOG.md](CHANGELOG.md) is the release notes.

## License

MIT, © 2026 Ben Rucker. See [LICENSE](LICENSE).

That covers the code written for this extension. It does not cover the vendored third-party material: the NTT documentation sources under `api/ntt-docs/` and `api/ntt-100.022-reference/` are copied from YellowAfterlife's [bits-of-nuclear-throne](https://github.com/YAL-Game-Tools/bits-of-nuclear-throne), which carries no license, and the documentation strings the extension ships - the compiled `out/generated/docs.js` inside the `.vsix`, generated from those sources into `src/generated/docs.ts` - are derived from them; `api/reference/GmlParseAPI.hx` is from [GMEdit](https://github.com/YellowAfterlife/GMEdit) under MIT; the cheat sheet in `docs/` is community-written and unattributed; and the original extension by fudgepop01 that this repository grew out of was published without a license. LICENSE spells each of these out.

## History

Everything before commit `33fd3de` is a Rivals of Aether GML extension, including the RoABox move visualizer. That code was removed in `3006ae3` and `ca12c65`, and lives on in the git history.
