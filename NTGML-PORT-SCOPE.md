# NTGML Port: API Differences, Repo Scope, and Unknowns

Prepared 2026-09-02 against this repo at commit `8b080ff` (extension v2.0.0), the local API dump, the local cheat sheet, the online NTT docs, and the `bits-of-nuclear-throne` reference repo. Nothing in the extension has been changed yet. This document is the plan.

## 0. Summary

- **The local API dump is now current: regenerated 2026-09-02, it reports `game_version = 100034`.** The dump that was on disk before (dated 2025-07-16) was a pre-NTT-100 file with `game_version = 0` and 689 functions. The fresh one has 984 functions, 413 constants, 33 variables and 3,931 assets, and is the source of truth for this port. Against the reference repo's 100.022 `api.gml` it adds 14 functions, removes 2, adds 2 constants, changes 4 variables to per-player arrays, and changes 58 signatures (10 prefixes, 3 argument lists, 45 return/pure flags). The 126 remaining differences are type hints (`:index`, `:number`, `:string`) that the docs author added by hand to the reference file; the game never emits them. Details in §1 and §6.
- **NTGML is two dialects selected by file extension.** `.gml` is the legacy GMS1-style dialect (`#define` scripts only, backtick template strings, `[$]` accessor disabled). `.ntgml` is the modern dialect (`function`, `new`, `static`, `try/catch/throw`, `delete`, `$"..."` strings, structs). Both add `wait`, `fork()`, `in`/`not in`, `#pragma`, `#macro`, named `#define` arguments, `null`, and per-mod isolation. Matching NTGML "exactly" means the extension must model both.
- **API overlap with the current RoA extension is small.** Of 1,139 identifiers the extension knows, 375 exist in NTT and 764 are RoA-only. NTT 100.034 adds 686 functions, 363 constants, and 63 variables the extension does not know, plus 3,931 asset names (sprites, sounds, music, ambience, masks, fonts, shaders, objects).
- **The scope is a rewrite of the data, not of the plumbing.** Keep the extension skeleton (grammar + completion provider). Replace all identifier tables with files generated from `api.gml` / `default.gml` / `raw-assets.gml`, add mod-type event completions, add a second file extension, and delete the RoABox webview, the audio players, and every RoA-specific table.

---

## 1. Sources and their freshness

| Source | Version it describes | What it contributes | Trust |
|---|---|---|---|
| `C:\Users\bruck\AppData\Local\nuclearthrone\api\` (regenerated 2026-09-02 23:13 with `/gmlapi` in the installed build) | NTT 100.034 (`game_version = 100034`) | 984 function signatures, 413 constants, 33 variables; `raw-objects.gml` (564), `raw-sprites.gml` (2,114 incl. 88 masks and 7 shaders), `raw-sounds.gml` (1,245 incl. 39 music and 17 ambience), `raw-fonts.gml` (8). `fields.gml` in the folder is a leftover from the old dump (dated 2025-07-16) and is not regenerated. | Authoritative and current. No type hints (`:index`, `:number`) on arguments; those exist only in the hand-annotated reference file. `raw-assets.gml` has a join bug (see §6.1); use the per-kind `raw-*.gml` files. |
| `bits-of-nuclear-throne/GMEdit/api.gml` + `default.gml` + `raw-assets.gml` + `config.json` | NTT 100.022 (generated 2025-04-27) | 972 function signatures with self/other prefixes, return and type annotations, optional/rest args, pure flags, US/UK spelling flags; 412 constants with values; 33 variables; 57 built-in instance variables; 3,707 asset names; the editor dialect config used by GMEdit | Superseded by the fresh local dump for names and signatures. Still the only source of argument type hints (126 functions) and of `default.gml`, which `/gmlapi` does not emit. |
| Online docs (`yal-game-tools.github.io/bits-of-nuclear-throne`, sources in `scripting/*.dmd`, last updated 2025-12-18) | NTT 100.023 through 100.034 | Language spec (Syntax, Intro, Performance), `/gmlapi` format spec (NTT-API), input, players, sync, time scale, weapons, 17 API-* pages with prose per function | Authoritative for semantics. Not machine-readable; covers only 66 functions in heading form. |
| `Changelog.md` in the same repo | 9885 → 100.034 | Exact version each feature landed in; the only source for several late additions (`weapon_get_pan_factor`, `asset_get_ids`, `char_custom`, `dp_player_count_active`, `#pragma fast_file`) | Authoritative for dates. |
| Old single-page reference `https://yal.cc/r/17/ntt/gml/` (GMEdit's `helpURL`) | 99xx-era | The only complete listing of reserved mod events per mod type (`.mod`, `.race`, `.skin`, `.wep`, `.area`); `.skill` and `.crown` marked WIP | Still accurate for legacy syntax and event names. |
| `ref/*.gml` + `docs/objects/*.html` in the reference repo | 100.02x | Callback fields of `Custom*` objects; per-object instance variables for ~560 objects (replaces `fields.gml`) | Authoritative (excerpts of game source). |
| `NTT Modding Cheat Sheet.md` (local) | community, 100.02x | Event order, depth table, time-scale formulas, nonsync rules, worked examples of `wait`/`fork`/`in`, HUD helpers | Good for prose docs and hover text; not a complete API list. |
| GMEdit source (`github.com/YellowAfterlife/GMEdit`: `src/gml/GmlVersionConfig.hx`, `src/gml/GmlAPI.hx`, `src/ace/AceGmlHighlight.hx`, `src/parsers/linter/*.hx`, wiki page "GML dialects") | current master | The full option list a dialect `config.json` can set, the resolved NTT feature set (§2.3), the base keyword list, the Ace highlighter regexes for `#define`/`#pragma`/`#macro`/template strings/numbers, and the linter's handling of `wait`, `in`, `not in`, `delete`, `throw`, `argument0..15` | Authoritative for what GMEdit does with NTT code. NTT is not a built-in GMEdit dialect; it is loaded from `%APPDATA%\AceGM\GMEdit\api\ntt\config.json`, so this describes the editor, not the game's parser. |
| `github.com/GoldenEpsilon/NTTE-public` (largest known NTT mod, 66 MB) plus `NTT-Lib`, `GuiPack`, `LOMuts`, `NTT-Booster-Packs`, `ntt-globalchat`, `Billiam/1bit-throne` | community, 100.02x | Frequency of each syntax feature in real code (§2.2) and `main.txt` chaining conventions (§3.5) | Empirical. |
| `github.com/GoldenEpsilon/tree-sitter-nttgml`, `github.com/YAL-GMEdit/object-info-gen`, `bits-of-nuclear-throne/bugs/` | 2024–2025 | The only existing NTT grammar is a 136-line tree-sitter stub covering `#define`/`#macro`/blocks only. `object-info-gen` is the GMEdit plugin that produced `docs/objects/*.html` from the private game project. `bugs/ds/ds_test.mod.ntgml` confirms the `.mod.ntgml` double extension. | The stub is not a usable reference. |
| Installed game `D:\Games\Steam\steamapps\common\Nuclear Throne` | exe dated 2025-07-21 (NTT 100.033), `data.ntt` 2025-08-09 | 293 real mods (`112 .wep.gml, 71 .mod.gml, 36 .skin.gml, 31 .skill.gml, 22 .race.gml, 14 .crown.gml, 7 .area.gml`) used below to confirm which reserved event names are actually used, including the undocumented `.skill` and `.crown` ones | Empirical. |

**Freshness ladder** (oldest to newest): repo `api.gml` (100.022, April 2025) → online docs/changelog (prose, through 100.034) → local dump (100.034, machine-readable, regenerated 2026-09-02). Every function the online docs mention is present in the fresh dump.

**What the 100.034 dump changed relative to the 100.022 reference file** (full diff in `new-dump-diff.json` in the session scratchpad):

- Added functions (14): `asset_get_ids(asset_type):`, `dp_player_is_viewed_nonsync(player):`, `:instance_nearest_nonself(x, y, obj):`, `:instance_place_list(x, y, obj, list, ordered):`, `instance_position_list(x, y, obj, list, ordered):`, `is_numeric(val):#`, `move_and_collide(dx,dy,obj,[num_iterations],[xoff],[yoff],[max_x_move],[max_y_move])`, `native_string(value_or_template, ...values):`, `player_count_active():`, `player_count_sources():`, `string_is_real(str):`, `string_to_real(str, ?default_value):`, `:::weapon_get_pan_factor(wep):`, `:::weapon_get_sprite_hud(wep):`. Note the changelog's `dp_player_count_active`/`dp_player_count_sources` are emitted as `player_count_active`/`player_count_sources`.
- Removed functions (2): `math_get_epsilon`, `math_set_epsilon`.
- Constants: added `char_custom = 17`, `wep_electric_guitar = 128`; `object_max` 555 → 564; `native_string` moved from constant to function.
- Variables: `mouse_x_nonsync`, `mouse_y_nonsync`, `view_xview_nonsync`, `view_yview_nonsync` are now per-player arrays (`[player]*`).
- Prefix changes (10): the whole `collision_point/circle/line/rectangle/ellipse` family and their `_list` variants are now `:`-prefixed (use `self`), with `obj` instead of `obj_or_array` as the argument name.
- Argument changes (3): `string_split(str,delim,[remove_empty],[max_splits])` (GM 4-arg form, replacing the NTT 2-arg entry), `string_trim(str, [substrs]):#`, `is_string(val):#` (no template args).
- Flag changes (45): pure `#` and returns `:` markers added to `string_*`, `is_*`, `chr`, `ord`, `ansi_char`, `base64_*`, `int64`, `array_reverse`, `is_builtin`, `is_object`. The dump writes pure as `:#`; the reference file wrote `:##`. Same meaning.
- Assets: +254, −33. New objects: `MiscCont`, `MultiMenu`, `PickupBox`, `CustomChest`, `CustomPickup`, `CorpseActive`, `ReviveChest`, `WepMimic`, `YVBoss`, `YVBullet`, `YungVenuzCouch`, `CuzTearBullet`, `CuzTearExplosion`, `DetectFCS0..2`, `meleeprojectile`, `__PlayerParent`, `objDebugMenu`, `obj_gmlive`. Removed: 30 old menu objects (`OptionSelect`, `MusVolSlider`, `CoopToggle`, `BSkinLoadout`, `MenuOLD`, ...) replaced by u100's `MultiMenu`. New sprites/sounds are u100 content: Cuz (`sprMutant16*`, `sndCuz*`), C-skins (`sprMutant1C*`..`sprMutant16C*`, D-skins for 8 and 10), revive sprites (`sprMutant*Revive`), electric guitar, YV boss, custom mode UI, Steam Deck/Switch button sprites, `fntM1`, `fntM1x`, `bak*` backgrounds.
- Object list is alphabetical (GM 2024.11 assigns indexes alphabetically), so `object_max` and any hard-coded index differ from pre-100.019 builds.

---

## 2. The NTGML language the extension must model

### 2.1 Two dialects, chosen by file extension

| Feature | `.gml` (legacy, "GMLv1") | `.ntgml` (modern, "GMLv2") |
|---|---|---|
| Script declaration | `#define name` / `#define name(a, b)` only | `function name(a, b = 1) {}` (defaults since 100.032) or `#define`; docs say do not mix in one file, but the repo's own `test/define/define.mod.ntgml` interleaves `function`, `#define`, `function`, and `test/weapons/weapon_pan_factor.wep.ntgml` is written entirely in `#define` style. The extension selects the language version, not the declaration format; the parser must tolerate both in one file |
| Switch inside a `.gml` file | `#pragma gml 2` at the top turns on v2 | n/a (default) |
| Template strings | JS style only: `` `hp: ${hp}` `` (`Syntax.dmd` line 81); inside a backtick, bare `$name` is also an interpolation (GMEdit highlights `$ident` without braces) | JS style **and** C#/GM2023 style `$"hp: {hp}"` (`Syntax.dmd` line 65). GMEdit's NTT config omits `hasQuoteTemplateStrings` and so inherits `false`; that is a bug in GMEdit's dialect file, do not copy it |
| Structs | Literal `{ key: value }` works; `[$ key]` accessor **disabled** (100.011) | Full: `new`, constructors, `static`, `method`, `delete`, `[$ key]`, `struct_*`/`variable_struct_*` |
| Exceptions | `try`/`catch` available (100.005); `throw` keyword listed | `try`/`catch`/`throw` |
| Function default return | `0` | `undefined` |
| Instance IDs | numeric | GM `ref` type |
| `real(v)` / `is_real(v)` | GMS1 semantics (`real` never throws; `is_real` == `is_number`) | Normal GML semantics (100.023); `double()`/`is_double()` are the strict forms in both |
| Quirk | `[1 2 3]` (no commas) tolerated (100.007) | not tolerated |
| Numeric literals | `100_000` (100.007); `$FF` hex is standard GML | same; `0x` hex appears in community code but is undocumented |

### 2.2 Syntax shared by both dialects (all NTT-specific, none exist in RoA GML)

- `#define name(a, b)` with **named arguments**; code before the first `#define`/`function` is the mod's implicit `init`.
- `#macro name value` (multi-line and struct-valued macros allowed).
- `#pragma include <path>`, `#pragma using <mod.type[.ext]>`, `#pragma no_using`, `#pragma fast`, `#pragma fast_file`, `#pragma not_fast`, `#pragma preload <asset>`, `#pragma gml 2`. Placement matters for the grammar: `include`, `using`, `fast_file` and `gml 2` are file-level; `fast`, `not_fast` and `no_using` sit **inside a function body** as a statement (`Syntax.dmd` line 161 onward). `preload` is exercised by `test/preload` but is not in `Syntax.dmd`. A grammar that matches pragmas only at file start misses the common case.
- `wait N;` and `wait(N)` (suspends the script N frames; `wait(0)` is one frame; not available under `#pragma fast`).
- `fork()` returns `true` in the copy, `false` in the original.
- `"name" in inst` and `"name" not in inst` (field existence test; `in` is a keyword).
- `with (array)` iterates arrays of instances/structs.
- `null` constant (distinct from `undefined`; game code initialises callbacks to `null`; `instances_matching(obj, "var", null)` is idiomatic).
- Ternary `a ? b : c`, array literals, accessor chaining `a[0][1]`, DS accessors `[| ]`, `[? ]`, `[# ]`, write accessor `[@ ]`.
- `globalvar name = value;` (100.001); `global.name`; per-mod `global` scope, macros, data structures and scripts. Cross-mod access only via `mod_variable_get/set/exists`, `mod_script_call*`, `#pragma using`.
- `argument`, `argument0`–`argument15`, `argument_count` (read-only).
- `self`, `other`, `noone`, `all`, `global`, `undefined`, `null`, `true`, `false`, `pi`, `infinity`, `NaN`.
- `ObjectName.field` (e.g. `GameCont.area`), `inst.method()` calls on Player (`grant_health`, `grant_ammo`, `swap_weps`, `calc_reload_speed`, `calc_pickup_attract_distance`, `calc_rad_attract_distance`).
- Built-in functions are first-class values (`var t = trace;`).

**How often real code uses each feature.** Counts across 22 public NTT mod repos with commits after July 2022 (about 2,300 files, 820k lines), so the corpus post-dates the 100.x language surface:

| Feature | Occurrences | Implication for the port |
|---|---|---|
| `#define` | ~28,000 | named `#define` args are the primary script form; must be first-class |
| `#macro` | ~13,600, never with arguments | plain `#macro name value` only; no `#mfunc`-style args |
| `wait` | ~18,000 | core statement |
| `fork()` | ~1,360 | plain function, not a keyword |
| `"name" in inst` / `not in` | ~1,500 / ~1,120 | `in` is a binary operator returning bool |
| backtick templates | ~1,950 | `${ }` must nest inside expressions |
| `[? ]` | ~1,500 | DS accessors dominate |
| `try` / `catch` | ~90 | present in legacy code |
| `#pragma` | 13, of which 12 are in YAL's own `test/`; the one real-mod use is `#pragma gml 2` | support it for correctness; nearly unused |
| `$"..."`, `[$ ]`, `function` literals, `static`, `new`, constructors | 0 in mod code | the modern surface is nearly unused in practice; only 10 `.ntgml` files exist and most are written in `#define` style |

Prioritise `#define`/`#macro`, `wait`/`fork`, `in`/`not in`, backtick strings, `[?` and `try/catch`. Ship the modern surface for correctness.

### 2.3 Keyword set for the grammar

GMEdit's NTT dialect is a user-installed `config.json` with `parent: "gml1"` and `"additionalKeywords": ["function", "delete", "wait", "in", "try", "catch", "throw"]`. `new` and `static` are not in that list, and `fork` is not a keyword anywhere in GMEdit; `fork()` is an ordinary function. The base GML1 keyword list in `GmlAPI.hx` is `globalvar var if then else begin end for while do until repeat switch case default break continue with exit return self other noone all global local mod div not and or xor enum`, and the flow list adds `try throw catch finally wait static`. The linter treats `wait`, `delete` and `throw` as `keyword <value>` statements and `in` as a binary operator producing `bool`, with `not in` special-cased. `argument0`–`argument15` are recognised by index below 16.

For the modern `.ntgml` grammar add `new`, `static`, `constructor`, `function`, `finally`; the online docs and changelog describe them and GM 2024.11 (NTT's runtime since 100.019) implements them, even though GMEdit's NTT config does not list them.

**Resolved NTT dialect options** (GMEdit `GmlVersionConfig.hx` defaults for `gml1`, overridden by the NTT `config.json`). GMEdit applies this one config to both extensions (`gmlExtensions: ["gml", "ntgml"]`) and does not model the v1/v2 split at all, so the values below are reliable for classic `.gml` only. For `.ntgml`, and for `.gml` files that start with `#pragma gml 2`, the port should flip `hasQuoteTemplateStrings`, `hasLiteralStrings`, `hasStringEscapeCharacters`, `hasJSDoc`, `hasColorLiterals` and `hasScriptDotStatic` to their GM 2022+ values, since the docs define `.ntgml` as "inspired by GM2022 GML". That is a fidelity gap in GMEdit, not evidence about the game. These decide what the legacy grammar must and must not recognise:

| Option | NTT value | Consequence for the grammar |
|---|---|---|
| `hasTemplateStrings` | true | backtick strings with `${expr}` and bare `$ident` |
| `hasQuoteTemplateStrings` | **false** | `$"..."` not highlighted in `.gml` (see §6.10 for `.ntgml`) |
| `hasStringEscapeCharacters` | **false** | no `\n`, `\x41` escapes in either quote style |
| `hasLiteralStrings` | **false** | no `@"raw"` strings |
| `hasSingleQuotedStrings` | true | `'...'` is a string |
| `hasDsAccessors` | true | `[\|`, `[?`, `[#`, `[@`, `[$` (a `$` after `[` is always an accessor in GMEdit) |
| `hasColorLiterals` | **false** | `#RRGGBB` is not a number (GMEdit gates this on a user preference, not the dialect) |
| `hasTernaryOperator` | true | `a ? b : c` |
| `hasDefineArgs` | true | `#define name(a, b)` |
| `hasPragma` | true | `#pragma` |
| `hasRegions` | true (set explicitly by NTT's config; `gml1` defaults false) | `#region` / `#endregion`; absent from `Syntax.dmd`, the changelog and `default.gml`, so treat it as editor-side folding that the game ignores (§6.7) |
| `hasJSDoc` | **false** | GMS1-style `///` doc comments, no `@param` |
| `hasScriptDotStatic` | false | no `script.static` |
| `resetLineCounterOnDefine` | false | line numbers are file-global (matters for error messages) |
| `indexingMode` | `"local"` | per-file symbol scope; definitions re-published on every edit |

GMEdit also recognises `#mfunc`, `#args`, `#lambda`, `#lamdef`, `#import`, `#hyper`, `#event`, `#moment`, `#target`, `#action`, `#gmcr`, `#section`, `#with`; these are GMEdit editor extensions, not NTT language features. Do not add them to the grammar. The genuine NTT preprocessor set is `#define`, `#macro`, `#pragma` (with `gml 2` since 100.000, `using` 100.001, `fast` 100.004, `fast_file`/`not_fast`/`no_using` 100.023, `include`/`preload` per the docs) and possibly `#region`.

**Ace highlighter regexes to port** (`AceGmlHighlight.hx`):

```
#define:   ^(#define[ \t]+)(\w+)                → preproc.define, scriptname
#pragma:   (#pragma\b[ \t]*)(\w*[ \t]*)(.*)     → preproc.pragma, keyword, string
#macro:    #macro <name> | #macro <config>:<name>, body continues with trailing backslash
template:  ` ... `  with (\$)(\{) … (\}) and bare (\$)([a-zA-Z_]\w*)
numbers:   \$[_0-9a-fA-F]+ | 0x[_0-9a-fA-F]* | 0b[_01]* | \d[\d_]*(?:\.[\d_]*)?   (no exponent form)
set ops:   =|+=|-=|*=|/=|%=|&=|\|=|^=|<<=|>>=
operators: !|%|&|@|*|--|-|++|+|~|!=|<=|>=|<>|<|>|&&|\|\|
```

### 2.4 Things that are *not* NTGML (present in the RoA grammar or snippets today)

- RoA file-per-event model (`init.gml`, `update.gml`, `attack_update.gml`, ...). NTT is one file per mod with `#define` sections.
- `argument_relitive` (RoA typo), `is_int32`, `is_int64`, `is_bool`, `bool()`, `gpu_*`, `draw_light_*`, `background_*` layer variables, `view_*port`, `room_*`, `keyboard_*`, `os_*`, `game_id`, `current_year` etc. (see §3.2).
- Every RoA gameplay API: `get_/set_attack_value`, hitbox/window grids, `HG_*`, `AG_*`, `AT_*`, `PS_*`, `SET_*`, `INFO_*`, `UI_*`, `BG_*`, `DIR_*`, `SC_*`, `ease_*`, `can_*`, `has_*`, RoA player variables (`state`, `attack`, `hsp`, `vsp`, `spr_dir`, `free`, ...).
- Single-quoted strings are legal in GML1 (GMEdit keeps them on for NTT); keep them but do not auto-close them as strings inside template literals.

---

## 3. Precise API differences: current extension vs NTT

Identifier inventory, RoA extension (grammar + completions) vs NTT (local `api.gml` 100.034 + reference `default.gml` + local `raw-*.gml`):

| Set | Count |
|---|---|
| RoA extension identifiers (grammar 531 fn / 299 const / 162 local var / 110 global var / 19 argument names, plus completion-only items) | 1,139 |
| Shared with NTT (same name) | 375 |
| RoA-only (must be removed) | 764 |
| NTT-only functions (must be added) | 686 |
| NTT-only constants | 363 |
| NTT-only variables (incl. built-in instance vars) | 63 |
| NTT asset names (sprites 2,009 / masks 88 / shaders 7 / sounds 1,189 / music 39 / ambience 17 / fonts 8 / objects 564, plus 10 unprefixed sprite names such as `shd16`, `background7`, `bak0`) | 3,931 |
| Name collisions between RoA identifiers and NTT asset names | 0 |

Full lists are in `api-diff.json`, `sig-diff.json`, `repo-vs-local.txt` (session scratchpad); the generator in §5.3 makes them obsolete.

### 3.1 Shared names whose signatures or semantics differ

Of 293 functions present in both the extension's snippets and `api.gml`, 226 have identical argument lists and 67 differ. Argument-name-only differences (`string_*`, `color_get_*`, `sin/cos/tan`, `lerp`, `clamp`, `draw_sprite_*`) are harmless but will be replaced anyway. The semantic ones:

| Function | RoA extension | NTT |
|---|---|---|
| `sound_play` | `(soundID, ?looping, ?panning)` | `sound_play(:sound)`; looping is `sound_loop(:sound)`; pitch/volume are `sound_play_pitch`, `sound_play_pitchvol`, `sound_play_gun(:sound, pitch_spread, fade)`, `:sound_play_hit`, `:sound_play_hit_big` |
| `sound_stop`, `sound_volume`, `sound_pitch` | 2–3 args | `sound_stop(:sound)`, `sound_volume(:sound, volume)`, `sound_pitch(:sound, pitch)`; `sound_stop_all()` |
| `instance_create` | `(x, y, obj_or_string)` | `(x, y, object, ?var_struct)` (struct init since 100.023 for v1 too); also `instance_create_depth`, `instance_create_layer` |
| `instance_destroy` | `(...values)` | `${raw}instance_destroy(?inst, ?perform_destroy)`; `instance_delete(inst)` skips Destroy |
| `instance_exists` | `(obj)` | `(obj:index)` – also accepts arrays where documented |
| `instance_position`, `ds_list_clear` | empty arg list | `(x, y, obj)`, `(list)` |
| `is_real` | GM semantics | v1: alias of `is_number`; v2: GM semantics |
| `sprite_get_name` | `(sprite)` | `(:sprite)` (self-context sprite) |
| `motion_add`, `motion_set` | `(direction, speed)` | `:motion_add(direction, speed)` uses self; plus `_raw` and `_ct` (time-scaled) variants |
| `draw_set_font` | `(font)` | `(font)` but only `fntM`, `fntBigName` and sprite fonts exist |
| `string_split` | n/a | 100.034: `string_split(str, delim, [remove_empty], [max_splits])` (GM 4-arg form); `string_split_ext` and `string_split_list` also listed |
| `collision_point/circle/line/rectangle/ellipse` and `_list` variants | plain `(x, y, obj, prec, notme)` | 100.034: `:`-prefixed (use `self` for `notme`); `obj` accepts arrays |
| `mouse_x_nonsync`, `mouse_y_nonsync`, `view_xview_nonsync`, `view_yview_nonsync` | n/a | 100.034: per-player arrays `name[player]*`, no longer scalars |
| `json_decode` / `json_encode` | ds_map based | returns structs/arrays (TJSON); `json_error*` variables |
| `array_length` | n/a | 1-D only; `array_length_1d` is an alias; arrays are **not** copy-on-write |

### 3.2 RoA-only identifiers to remove (764), by family

- **GM functions NTT does not expose (about 180):** `gpu_*` (74), `draw_light_*`/`draw_set_lighting`, `view_*port`/`view_hview`/`view_wview`/`view_angle`/`view_enabled`/`view_visible`, `background_*` layer variables (18), `room`/`room_*`, `keyboard_*`, `os_*`, `game_id`/`game_project_name`/`game_display_name`/`game_save_id`, `gamemaker_*`, `current_year/month/day/hour/minute/second/weekday`, `event_action/number/object/type`, `cmpfunc_*`, `cull_*`, `mip_*`, `tf_*`, `transition_*`, `caption_*`, `show_health/lives/score`, `is_int32`, `is_int64`, `is_bool`, `bool`, `sprite_get`, `sprite_get_bbox_mode`, `sprite_change_offset`, `sprite_change_collision_mask`, `random_func*`, `music_*`.
- **RoA modding API (about 580):** `get_*`/`set_*`/`reset_*` attack, hitbox, window, bg, char-info, color-profile, player, stage, synced-var and setting functions; `HG_*` (53), `AG_*` (31), `AT_*` (37), `PS_*` (37), `SET_*` (20), `INFO_*` (13), `UI_*` (8), `BG_*` (8), `__BG_LAYER_*` (9), `DIR_*` (6), `SC_*` (5); `ease_*` (28); `can_*` (11), `has_*` (5); all RoA player/local variables (`state`, `state_timer`, `attack`, `window`, `hsp`, `vsp`, `spr_dir`, `free`, `walk_speed`, `dash_*`, `djump_*`, `air_*`, `roll_*`, `techroll_*`, `walljump_*`, `wave_*`, `bubble_*`, `old_*`, `max_*`, `jump_*`, `dodge_*`); `argument_relitive`; the four RoABox tool-specific snippets.

### 3.3 NTT-only identifiers to add (686 functions, 363 constants, 63 variables), by family

Functions: `draw_*` (51, incl. `draw_text_nt`, `draw_tooltip`, `draw_text_shadow`, `draw_rect_ext`, `draw_set_projection`/`draw_reset_projection`, `draw_set_visible*`, `draw_healthbar`, `draw_button`, `draw_background*`, `draw_surface*`), `player_*` (29), `weapon_get_*`/`weapon_set_*`/`weapon_post`/`weapon_get_list` (28), `d3d_*` (25), `audio_*` (20), `string_*` (19, incl. `string_sha1`, `string_md5`, `string_lpad`/`rpad`, `string_trim`, `string_split`, `string_save`/`load`, `string_auto`), `sound_*` (17), `file_*` (14), `mod_*` (13), `sprite_*` (13, incl. `sprite_add_weapon`, `sprite_replace`, `sprite_restore`, `sprite_skin`), `surface_*` (13), `object_*` (10), `shader_*` (10), `lq_*` (8), `projectile_*` (8), `skill_*` (8), `script_bind_*`/`script_ref_*` (7), `button_*` (6), `instances_matching*` (6), `point_*` (6), `chat_comp_*` (5), `game_*` (5), `race_*` (5), `random*` (5), `instance_change/copy/delete/is` (4), `matrix_*` (4), `texture_*` (4), `font_*` (3), `motion_add_ct/raw`, `motion_set_raw`, `mouse_lock/unlock/is_locked`, `rectangle_in_*`, `ultra_*`, `alarm_get/set`, `area_get_*`, `asset_get_*`, `crown_get_*`, `json_*`, `loc`/`loc_set`, `trace_color`/`trace_time`, `view_shake_at`/`view_shake_max_at`, plus from the 100.0xx era: `buffer_*`, `struct_*`/`variable_struct_*`, `native_array_*`, `array_pop/delete/filter/map/resize/reverse/shift/get/set/sort_sub/join/slice/find_index*`, `string_split_ext/join/concat/starts_with/ends_with/trim_start/trim_end/foreach`, `gc_*`, `method`, `typeof`, `double`, `is_struct/is_method/is_object/is_builtin`, `instances_in_circle/rectangle`, `instances_matching_range`, `collision_*_list`, `collision_line_point`, `collision_line_width_first`, `instance_create_depth/layer`, `object_has_event`, `event_perform_object`, `zip_unzip`, `alarm_run`, `area_get_name`, `area_can_spawn_portal`, `crown_get_pick/set_pick`, `race_get_avail`, `skill_get_array/icon`, `current_frame_get_repeat/is_active`, `script_execute_ext`, `shader_create/destroy`, `surface_*` formats, `vertex_*`.

Constants: `wep_*` (128), `mut_*` (30), `char_*` (16 + `char_custom`), `crwn_*` (14), `area_*` (16), `ev_*` (full GM event list), `asset_*`, `buffer_*`, `vertex_type_*`/`vertex_usage_*`, `surface_*`, `spritespeed_*`, `matrix_*`, `shader_kind_*`, `json_*`, `c_orange`, `pi`, `infinity`, `NaN`, `maxp`, `object_max`, `game_version`, `mod_current`, `mod_current_type`.

Variables: `current_frame*`, `current_time_scale`, `current_time_scale_squared*`, `current_delay*`, `game_width`, `game_height`, `game_letterbox`, `view_pan_factor[player]`, `view_shake[player]`, `view_xview[player]*`/`view_yview[player]*`, `view_object[player]`, `mouse_x[player]*`/`mouse_y[player]*`, `mouse_delta_x/y[player]*`, `*_nonsync` twins, `crown_current`, `pickup_chance_multiplier*`, `json_true/false/error*`, `json_error_text`, `fntM*`, `fntBigName*`, `background_color`, `room_speed`, `mod_current_path*`, `mod_current_dir*`, and the 57 built-in instance variables from `default.gml` (`x`, `y`, `speed`, `direction`, `image_*`, `sprite_*`, `bbox_*`, `depth`, `id*`, `object_index*`, `mask_index`, ...), plus NTT time-scale twins `speed_raw`, `direction_raw`, `hspeed_raw`, `vspeed_raw`, `gravity_raw`, `friction_raw`, `image_speed_raw`.

### 3.4 Annotation conventions in `api.gml` that the extension must understand

| Annotation | Meaning | Extension use |
|---|---|---|
| `:name(...)` | uses `self` | Hover/detail text "uses self" |
| `::name(...)` | uses `self` and `other` (only `event_perform`) | same |
| `:::name(...)` | uses `self`, may use `other` (the `weapon_get_*` family) | same |
| `${raw}name(...)` | passes calling context raw (`instance_destroy`, `mod_script_call*`, `script_ref_call`) | parse and ignore |
| `name(...):` / `:type` | returns a value / typed return | completion detail |
| `#` suffix | pure (constant-foldable) | optional badge |
| `$` / `£` suffix | US / UK spelling twin | mark the UK twin as an alias, do not duplicate docs |
| `&` suffix | deprecated | show strike-through / lower sort priority (`ds_map_keys`, `ds_map_values`, `surface_exists`; `math_set_epsilon` was removed in 100.030 as never functional) |
| `?arg`, `[arg]`, `arg=default`, `...arg`, `arg:type`, `:arg` (self-relative arg) | optional / optional / default / rest / typed / self-context | snippet placeholders: optional args after `${n:...}` should not be inserted by default |
| `name*`, `name[player]`, `name#`, `name = value`, `name:type` | read-only variable, per-player array, constant, constant with value, typed variable | hover text; suggest `[player]` index snippet |
| `//{ group` ... `//}` | GMEdit fold markers grouping functions by category | use as the category for completion `detail` |

### 3.5 Mod file types and reserved events

The extension must complete these names inside `#define`/`function` at top level, keyed by the middle extension of the file name (`name.<type>.gml` or `name.<type>.ntgml`). Every mod type also has `init()` and `cleanup()`, and code before the first `#define` is `init`.

| File type | Reserved events (documented) | Also seen in real mods, undocumented |
|---|---|---|
| `*.mod.gml` | `game_start`, `step`, `draw`, `draw_shadows`, `draw_bloom`, `draw_dark`, `draw_dark_begin`, `draw_dark_end`, `draw_gui`, `draw_gui_end`, `draw_pause` | `chat_command`, `chat_message`, `level_start`, `save_options`, `load_options` |
| `*.wep.gml` / `*.weapon.gml` | `weapon_name(wep)`, `weapon_text`, `weapon_type` (0–5), `weapon_auto`, `weapon_load`, `weapon_cost`, `weapon_rads`, `weapon_swap`, `weapon_melee`, `weapon_area`, `weapon_sprt`, `weapon_sprt_hud`, `weapon_loadout`, `weapon_laser_sight`, `weapon_gold`, `weapon_fire(wep)`, `weapon_reloaded(primary)`, `step(primary)`, `weapon_pan_factor` (100.025) | `weapon_avail`, `weapon_extra`, `weapon_chrg`, `weapon_canspec`, `weapon_cost_base`, `weapon_shrine`, `weapon_maxchrg`, `weapon_chrg_cost`, `weapon_fireOnRelease`, `weapon_burst`, `weapon_burst_time`, `weapon_red`, `weapon_reload`, `weapon_load_full`, `weapon_fire_charged`, `weapon_fire_uncharged`; `weapon_ntte_*` are NTTE-mod conventions |
| `*.race.gml` | `race_name`, `race_text`, `race_swep`, `race_mapicon(player_index, skin)`, `race_portrait(player_index, skin)`, `race_ttip`, `race_menu_button`, `race_soundbank`, `race_menu_select`, `race_menu_confirm`, `game_start`, `create`, `step`, `draw_begin`, `draw`, `draw_end`, `race_avail`, `race_lock`, `race_skins`, `race_skin_avail(skin)`, `race_skin_name(skin)`, `race_skin_button(skin)`, `race_tb_text`, `race_tb_take(value)`, `race_ultra_name(index)`, `race_ultra_text(index)`, `race_ultra_button(index)`, `race_ultra_icon(index)`, `race_ultra_take(index, value)`, `race_ultra_lose(index)`, `race_gets_chilly`, `race_makes_air_bubbles` (100.007) | `race_skin_lock`, `race_skin_unlock`, `race_unlock`, `race_sprite`, `race_sprite_raw`, `race_sound`, `level_start` |
| `*.skin.gml` | `skin_race`, `game_start`, `skin_avail`, `skin_name(locked)`, `skin_button`, `skin_portrait(player_index)`, `skin_mapicon(player_index)`, `skin_race_name`, `skin_race_text`, `skin_race_tb_text`, `create`, `step`, `draw_begin`, `draw`, `draw_end`, `skin_sound`, `skin_sprite` (100.025) | `skin_ttip`, `skin_lock`, `skin_unlock`, `skin_weapon_sprite`, `skin_weapon_sprite_hud`, `skin_weapon_swap` |
| `*.skill.gml` | (docs: "WIP") | `skill_name`, `skill_text`, `skill_tip`, `skill_icon`, `skill_avail`, `skill_button`, `skill_take`, `skill_lose`, `skill_sound`, `skill_rat`, `skill_wepspec`, `step`, `game_start` |
| `*.crown.gml` | (docs: "WIP") | `crown_name`, `crown_text`, `crown_tip`, `crown_loadout`, `crown_button`, `crown_avail`, `crown_menu_avail`, `crown_menu_button`, `crown_locked_text`, `crown_object`, `crown_take`, `crown_lose`, `crown_impact`, `crown_sound`, `crown_unlock`, `step`, `game_start` |
| `*.area.gml` | `area_name(subarea, loops)`, `area_secret`, `area_sprite(sprite)`, `area_mapdata(lastx, lasty, lastarea, lastsubarea, subarea, loops)`, `area_setup`, `area_make_floor`, `area_pop_enemies`, `area_pop_props`, `area_pop_chests`, `area_pop_extras`, `area_start`, `area_finish`, `area_transit`, `area_set_music` (100.007) | `area_text`, `area_subarea`, `area_next`, `area_goal`, `area_music`, `area_music_boss`, `area_music_boss_intro`, `area_ambient`, `area_effect`, `area_darkness`, `area_fog`, `area_underwater`, `area_shadow_color`, `area_background_color`, `area_setup_floor`, `area_setup_spiral` |
| `main.txt` or `main.cfg` (the FAQ: `/load <dir>` runs a `main.txt` or `main.cfg` in it; `/loadtext` and `/loadconf` are aliases. A `main.txt`, even blank, marks a folder as an NTT project for GMEdit. Sixty-plus `main.txt` files exist in public mods, zero `main.cfg`) | chat commands, one per line, chainable: `/loadmod teloader` (extension optional) then `/load main2`; `main2.txt` holding `/allowmod teloader.mod`; `main3.txt` holding `/unloadmod teloader.mod`. Also `/loadwep`, `/loadrace`, `/loadskin`, `/loadcrown`, `/loadlive`, `/silencemod`, `/ignoremod`, `/timeout`, `/sideloading`, `/gml`, `/gmlapi` (the GMEdit README's `/api` is the outlier) | no comment syntax observed; `/allowmod` is absent from the FAQ command list. Distinct from `NuclearThroneTogether.ini`, the game's INI settings file |

Custom object callback fields (complete via `ref/*.gml`): `CustomObject` (`on_destroy on_step on_begin_step on_end_step on_draw on_cleanup sprite_visible`), `CustomHitme` (+ `on_hurt my_health maxhealth spr_idle spr_walk spr_hurt spr_dead spr_shadow snd_hurt snd_dead team size raddrop`), `CustomEnemy` (+ `on_death candie meleedamage hitid`), `CustomProp` (`on_step on_death on_draw size maxhealth spr_* snd_hurt`), `CustomProjectile` (`on_wall on_hit on_anim on_draw on_step on_begin_step on_end_step on_destroy on_cleanup`), `CustomSlash` (+ `typ candeflect on_grenade on_projectile`), `CustomChest` (`on_anim on_draw on_step on_begin_step on_end_step on_destroy on_cleanup on_open can_hatred can_shine`), `CustomPickup` (`blink spr_fade spr_pickup snd_pickup snd_disappear attract_speed on_pickup on_step on_draw on_disappear on_find_target on_attract`), `CustomBeginStep`/`CustomStep`/`CustomEndStep`/`CustomDraw` (`script`, created by `script_bind_*`).

Input button names (string arguments to `button_check/pressed/released`): `nort sout west east fire spec swap prev next pick paus okay exit horn talk key1 … key9 key0`.

---

## 4. Current repo inventory and verdict per file

| Path | Today | Verdict |
|---|---|---|
| `package.json` | name `rivals-of-aether-gml-support`, language `gml-ntt-roa` for `.gml`, three `roa-helper.*` commands, explorer menus for RoABox | Rename, re-key, drop commands |
| `syntaxes/main/NTTRoA.json` | single hand-written TextMate grammar, case-insensitive alternations (531/299/162/110 ids), `#define`/`#macro` as a one-line preprocessor match, `$hex`, backtick template strings, `[#`/`[?`/`[@` operators, `(obj\|scr\|spr\|rm)*` heuristic variable scope | Regenerate; add NTT keywords, `#pragma`, `wait`, `fork`, `in`, `null`, `$"..."`, asset-prefix scopes |
| `data/gml-configuration.json` | comments, brackets (incl. `<>`), auto-closing pairs | Keep; add `#region` folding markers, remove `<>` bracket pair |
| `src/extension.ts`, `src/completionProvider.ts` | registers one static `CompletionItem[]` provider | Keep shape; make provider dialect- and file-type-aware |
| `src/completion_items/roaFunctions.ts`, `snippets/Builtins.ts`, `snippets/functions/*.ts`, `snippets/variables/*.ts`, `snippets/toolSpecific.ts` | 2,100 lines of hand-typed RoA tables | Delete; replace with generated `src/generated/*.ts` |
| `src/roaboxController.ts`, `webview/` (Svelte app, ~1,870 lines), `audio/*.exe`, `src/play-sound.d.ts` | RoABox hitbox visualiser and sound players | Delete (RoA workshop layout only) |
| `README.md`, `Script for Extension Vid.md`, `CHANGELOG.md`, `.vscodeignore`, icons | RoA branding | Rewrite / remove |
| `NTT Modding Cheat Sheet.md` (untracked) | community reference | Keep as `docs/`, mine for hover text |

---

## 5. Scoped changes to reach exact NTGML support

Ordered so each step leaves the extension working.

### 5.1 Identity and file association (small)

1. `package.json`: `name` → e.g. `ntgml`, `displayName` "Nuclear Throne Together GML", new `publisher`, reset `version` to 0.1.0, new `icon`.
2. Two language contributions sharing one configuration:
   - `ntgml-legacy`: extensions `.gml`, aliases "NTGML (legacy .gml)". This claims `.gml` globally, exactly as the RoA extension does today; document that in the README.
   - `ntgml`: extensions `.ntgml`, aliases "NTGML".
   - Optionally `ntt-main`: filenames `main.txt`, `main.cfg` (and `main2.txt`-style chained files) for chat-command lists (comment-free, highlight `/command` tokens).
3. `activationEvents`: `onLanguage:ntgml`, `onLanguage:ntgml-legacy`. Remove `onCommand:roa-helper.*`, all `contributes.commands` and `contributes.menus`.
4. Delete `src/roaboxController.ts`, `webview/`, `audio/`, `src/play-sound.d.ts`; remove their `dependencies` and `.vscodeignore` entries; simplify `src/extension.ts` to provider registration only.

### 5.2 Grammar (medium)

Two grammar files generated from one template, differing only in the "modern" pattern block:

- `syntaxes/ntgml-legacy.tmLanguage.json`, scope `source.ntgml.legacy`.
- `syntaxes/ntgml.tmLanguage.json`, scope `source.ntgml`, adds: `function` declarations with default args, `new`, `static`, `constructor`, `delete`, `$"..."` template strings with `{expr}` interpolation, `[$ key]` accessor.

Shared pattern changes vs the RoA grammar:
- Keywords: add `wait`, `fork` (as keyword-like function), `in`, `not in`, `try`, `catch`, `throw`, `finally`, `globalvar`, `enum`, `div`, `mod`, `then`, `begin`, `end`; constants `null`, `self`, `other`, `noone`, `all`, `global`, `undefined`, `true`, `false`, `pi`, `infinity`, `NaN`.
- Preprocessor: `#define name(args)` with args captured as `variable.parameter`; `#macro name` with multi-line body; `#pragma (include|using|no_using|fast|fast_file|not_fast|preload|gml)` with argument; `#region`/`#endregion`.
- Strings: `"..."`, `'...'` (GML1 legal), backtick with `${ }` and bare `$ident` (both dialects), `$"..."` with `{ }` (modern only, see §6.10). No escape sequences, no `@"raw"` strings, no `#RRGGBB` literals in legacy: GMEdit's resolved NTT config sets all three to false (§2.3).
- Port the Ace regexes listed in §2.3 for `#define`, `#pragma`, `#macro`, template strings, numbers and operators; they are the only YAL-authored GML grammar that exists. No TextMate, Sublime or VS Code grammar by YAL exists, and the one third-party NTT grammar (`tree-sitter-nttgml`) is a stub.
- Numbers: `$FF` hex (keep), `0x` hex (add, undocumented), `100_000` separators, `.5` reals.
- Identifier scopes generated from `api.gml`: `support.function.ntgml` (972+), `support.function.self.ntgml` for `:`-prefixed functions, `support.variable.builtin.ntgml`, `support.constant.ntgml`, `support.constant.weapon/mutation/character/crown/area.ntgml` per prefix.
- Asset scopes generated from `raw-assets.gml`: `entity.name.sprite.ntgml` (spr*/msk*/shd*), `entity.name.sound.ntgml` (snd*/mus*/amb*), `entity.name.font.ntgml`, `entity.name.shader.ntgml`, `entity.name.object.ntgml` (582 object names, e.g. `Player`, `GameCont`, `CustomEnemy`). Prefer an explicit alternation over the RoA `(obj|scr|spr|rm)\w+` heuristic; NTT object names have no prefix.
- Reserved mod events: `entity.name.function.event.ntgml` for the §3.5 names when they follow `#define` or `function`.
- Case sensitivity: NTGML identifiers are case-sensitive (standard GML; `Player` vs `player`). Drop the `(?i)` flags the RoA grammar uses everywhere.
- Keep `[|`, `[?`, `[#`, `[@` operators; add `[$`.

### 5.3 Generator script (medium, the core of "exact")

`tools/generate-api.ts` (run with `pnpm gen`), inputs in priority order:

1. `%LOCALAPPDATA%\nuclearthrone\api\` if present **and** `api.gml` contains `game_version = 100000` or higher (guards against a stale pre-100 dump like the one that was on this machine before 2026-09-02). Read `raw-sprites.gml`, `raw-sounds.gml`, `raw-fonts.gml`, `raw-objects.gml` individually; do not read `raw-assets.gml` (join bug, §6.1).
2. Else the vendored copy `api/ntt-100.034/{api.gml,raw-sprites.gml,raw-sounds.gml,raw-fonts.gml,raw-objects.gml}` copied from the fresh dump into the repo.
3. In both cases, merge argument type hints (`arg:type`, `:type` returns) from the vendored reference `api/ntt-100.022-annotated/api.gml` by function name, since `/gmlapi` never emits them. Always read `default.gml` (built-in instance variables) from the vendored copy; `/gmlapi` does not produce it.

The `api/overrides.gml` file is no longer needed for post-100.022 additions; keep it as an empty hook for hand corrections.

Parser: port the relevant part of GMEdit's `GmlParseAPI.hx` (already saved as `gmlparseapi.hx` in the session scratchpad):
- function line regex: prefix `(\$\{\w+\}|:+)?`, name, `(args)`, tail flags `[ ~\$#*@&£!:]*`, optional `:type`, optional `^feature`;
- variable line: name, optional `[index]`, flags `[~\*\$£#@&]*`, optional `:type`;
- constant with value: `name = value`;
- `//{ group` / `//}` → category;
- `raw-assets.gml` → tokenise on `\w+`, classify by prefix (`spr`, `snd`, `mus`, `amb`, `msk`, `shd`, `fnt`, `sh`), everything else is an object.

Outputs (checked into git so the extension builds without the game installed):
- `src/generated/functions.ts`: `{ name, args: [{name, type?, optional, rest, default?}], returns, returnType?, selfCtx: 0|1|2|3, pure, deprecated, spelling: 'us'|'uk'|null, category }[]`.
- `src/generated/constants.ts`, `variables.ts` (with `readOnly`, `perPlayer`, `type`), `assets.ts` (by kind), `events.ts` (hand-maintained §3.5 tables with doc strings), `custom-objects.ts` (hand-maintained callback fields), `keywords.ts`.
- `syntaxes/*.tmLanguage.json` from the template.
- Doc strings: merge `scripting/*.dmd` prose by function name (the 66 documented headings, plus paragraphs under group headings) and the cheat sheet's per-function notes into `src/generated/docs.json` for `CompletionItem.documentation` (Markdown).

### 5.4 Completion provider (medium)

- Build `CompletionItem`s from the generated tables at activation; snippet insert text with `${n:arg}` placeholders for required args only, optional args listed in `detail` as `?arg`.
- `detail` shows the raw `api.gml` line (e.g. `:::weapon_get_name(wep):`), `documentation` shows category, self/other note, return type, US/UK alias, deprecation, and the docs paragraph.
- Kinds: Function, Constant, Variable, Class (objects), Value (sprites/sounds/fonts), Event (mod events), Keyword (`wait`, `fork`, `in`, pragmas).
- Context rules:
  - Dialect from `document.languageId` (hide `new/static/delete/$""` items in legacy; hide nothing else).
  - Mod type from the file name's middle extension → offer that type's reserved events (and `init`/`cleanup`) when the cursor is on a line starting with `#define ` or `function `.
  - After `on_` inside a `CustomX` struct literal or `with`, offer that object's callback fields (best effort; text-based).
  - After `button_check(`, `button_pressed(`, `button_released(` second argument: offer the button name strings.
  - After `instances_matching(`, `instance_create(` etc. first `obj` arg: rank object names first.
  - After `#pragma `: offer the pragma names.
- Sort: exact-name > NTT-specific > GM generic > assets, deprecated last.
- Provide `HoverProvider` and `SignatureHelpProvider` from the same tables (both are cheap once the tables exist and are the main "language server affordances" users notice).

### 5.5 Docs, packaging, housekeeping (small)

- `README.md`: what NTGML is, the two dialects, how to refresh the API (`/gmlapi` in NTT 100.033+, then `pnpm gen`), known limitations.
- `CHANGELOG.md` entry; `LICENSE` attribution to the RoA extension author (fudgepops) and YellowAfterlife's docs.
- `.vscodeignore`: drop `webview/**`, `audio/**`; add `tools/**`, `api/**` sources as needed.
- Move `NTT Modding Cheat Sheet.md` to `docs/` and reference it.
- Tests: snapshot test that every name in `raw-functions.gml`/`raw-constants.gml`/`raw-variables.gml` from a fresh dump is known to the extension, and that no RoA identifier survives.

### 5.6 Effort

| Step | Size |
|---|---|
| 5.1 identity, deletions | ~1 hour |
| 5.3 generator + parser + vendored API + overrides | 1 day |
| 5.2 grammar template ×2 | half a day |
| 5.4 provider (completion, hover, signature help, context rules) | 1–2 days |
| 5.5 docs/tests | half a day |

---

## 6. Unknowns and open decisions

**Data freshness** (items 1–4 of the first draft are resolved by the 2026-09-02 dump; what remains:)
1. `raw-assets.gml` in the fresh dump concatenates its sections without a separator, producing the bogus tokens `__newsprite2113amb0` (last sprite + first ambience), `sndYVUltraBfntChat` (last sound + first font) and `__newfont7__PlayerParent` (last font + first object), and losing `amb0`, `fntChat` and `__PlayerParent` from that file. The per-kind `raw-*.gml` files are clean. This is an NTT `/gmlapi` bug worth reporting upstream; the generator must read the per-kind files.
2. The dump emits no argument type hints. The 126 typed signatures in the reference `api.gml` were added by hand by the docs author. The generator merges them by name, so a renamed argument (`obj_or_array` → `obj` in `collision_*`) loses its hint; those hints must be re-attached by position, not by argument name.
3. The changelog names `dp_player_count_active` / `dp_player_count_sources`; the dump emits `player_count_active()` / `player_count_sources()`. Trust the dump.
4. u100 game-side additions visible only as assets, not as API: `MultiMenu`, `MiscCont`, `ReviveChest`, `WepMimic`, `YVBoss`, `CuzTear*`, `DetectFCS*`, `objDebugMenu`, `obj_gmlive`, the `sprMutant16*`/`sndCuz*` Cuz content, C/D-skin sprites, `bak*` backgrounds, `fntM1`/`fntM1x`. `UberCont.opt` (a struct; the old `UberCont.opt_*` fields are kept for compatibility and both belong in completions), `UberCont.custom`, `UberCont.customMode` and `UberCont.tips` are instance fields and appear in no dump; the per-object field tables in `docs/objects/*.html` (100.02x) predate them. The changelog documents the u100 API under `100r1`–`100r7` headings, which are base-game release numbers that break its own `99r#`/`100.###` legend; 100.034 ships no API list at all.
5. Two unprefixed sprite names in `raw-sprites.gml` (`background7`, `__newsprite2113`) and two unprefixed fonts (`__newfont6`, `__newfont7`) are GM placeholders and should be filtered out of completions.

**Language spec**
6. The legacy keyword set is now settled by GMEdit's NTT `config.json` (§2.3). The modern set (`static`, `new`, `constructor`, `finally`) is still inferred from the docs, the changelog and the GM 2024.11 runtime; GMEdit's NTT config does not list `new` or `static`, so either GMEdit lags the game or the game accepts them only in `.ntgml`. Ship them in the modern grammar only.
7. GMEdit's NTT config says no string escapes, no `@"raw"` strings and no `#RRGGBB` literals, but that config is shared by both extensions and inherits `gml1`, so it is evidence for classic `.gml` only. `0x`/`0b` and `$FF` are in its number regex and `<>` in its operator list. Whether `.ntgml` accepts escapes, raw strings and colour literals is untested; GM 2024.11 does. `#region` appears in NTT's GMEdit config but nowhere in `Syntax.dmd`, the changelog or `default.gml`; treat it as editor-side folding the game ignores. `??`/`??=`, `^^` and the word operators `and/or/not/xor` are undocumented for NTT; keep them.
8. Whether `#define` and `function` may be mixed in one `.ntgml` file (docs say no, the docs repo's own test mixes them).
9. Case sensitivity of identifiers and reserved event names is not stated anywhere; standard GML is case-sensitive and every real mod uses the canonical casing. The plan assumes case-sensitive.
10. The exact v1/v2 feature delta. Documented differences are exactly these: `[$ key]` disabled in v1 (100.011), `$"..."` strings v2 only (`Syntax.dmd`), `new`/`function` v2 (100.000), `#macro` semantics differ (100.012/100.013, how is never said), `real`/`is_real` (100.023), `[1 2 3]` tolerated in v1 (100.007), `self`/`other` return IDs in v1 (100.007), `try`/`catch` in both (100.005). Everything else (`??`, `?.`, `??=`, `finally`, `static` split, `@"..."`, escapes, `#RRGGBB`, JSDoc) is undocumented, not absent; do not encode a guess as a rule. In-game tests for `.ntgml`: `trace("a\nb")`, `trace(@"a\nb")`, `trace(#FF0000)`, `trace(a ?? b)`. The old Bitbucket wiki is private rather than deleted, and archive.org holds 2017/2019/2022 snapshots including `wiki/Scripting/Overview`, which may cover pre-100 semantics the modern site dropped. `main.txt` syntax, previously listed here, is resolved in §3.5.

**Mod events**
11. `.skill` and `.crown` reserved events are undocumented upstream (both `NTT-Scripting.dmd` sections are literally "WIP", and that file also has a typo saying skins use `.race.gml`); the §3.5 lists come from 31 skill mods and 14 crown mods on disk and from `skill_get_*`/`crown_get_*` API names, and some are LOMuts-framework conventions. Names used in only one or two mods (`skill_rat`, `skill_wepspec`, `crown_impact`, `crown_object`) may be mod-local helpers rather than engine callbacks. Not reachable by fetch or search; the NTT Discord is the remaining avenue.
12. Undocumented `.wep` events seen in many mods (`weapon_avail`, `weapon_extra`, `weapon_chrg`, `weapon_canspec`, `weapon_shrine`, `weapon_cost_base`, `weapon_burst*`) are plausibly engine callbacks (they mirror weapon table columns) but are unconfirmed.
13. The `.weapon` vs `.wep` middle extension: docs use `.weapon.gml`, every mod on disk and the repo's own test use `.wep`; `/loadwep` appends `.weapon`. Support both.
14. `chat_command`/`chat_message` mod callbacks appear in real mods but not in the docs.

**Editor design**
15. Claiming `.gml` globally conflicts with any other GML extension the user has installed (same as today with the RoA extension). An opt-in setting (`ntgml.claimGmlExtension`) is possible but VS Code cannot register a language conditionally, so the realistic choice is "claim it and document it".
16. Whether to ship object instance-variable completions for all ~560 objects (from `docs/objects/*.html`, replacing the retired `fields.gml`). Data exists; it is a scraping task and a sizeable table. Recommended as a follow-up after the core port.
17. Whether the extension should read the user's `%LOCALAPPDATA%\nuclearthrone\api` at runtime instead of only at build time. Runtime reading gives per-user freshness for free, at the cost of a file-parsing step on activation; the generator design above supports either.
