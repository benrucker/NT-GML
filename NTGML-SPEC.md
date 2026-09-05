# NTGML Language Spec

Target: NTT 100.034. Derived from `NTGML-PORT-SCOPE.md`. Items marked `?` are unverified.
Evidence tags: `[bin]` = string tables of `nuclearthrone.exe`/`data.win` (2026-09-02 build); `[wiki]` = archived Bitbucket wiki via Wayback; `[corpus]` = 293 installed mods + NTTE + defpack; `[docs]` = `bits-of-nuclear-throne`.

## 0. Runtime facts `[bin]`
- Parser versions: `14`, `20`, `23` (`Supported versions are 14,20,23`). Legacy = 14; modern = 23; `20` = `?`.
- Chat: `/gml` = GMS1-style snippet, `/gml2` = GMS2-style. Result prefixes `[GML]` / `[GMLv2]`.
- File extensions accepted by loader: `.gml`, `.ntgml`, `.gmlbc` (compiled bytecode), `.txt` (command file), directory.
- Token kinds (32): `adjfix arg_const at_sign bin_op boolean colon comma cstring cub_close cub_open dollar_sign hash header ident in keyword macro_def macro_start null_co null_co_set number par_close par_open period pragma qmark semico set_op sqb_close sqb_open un_op undefined_hx`.
- AST kinds of note: `def_in def_fork def_once def_ternary def_null_co def_construct def_delete_hx def_func_literal def_static_* def_script_static_* def_try_catch def_throw_hx def_if_then def_do_until def_do_while`.
- No optional-chaining token/node/opcode. No raw-string or colour-literal diagnostic.
- Compiler "fast" mode exists (`Cannot function with callType= … in 'fast' mode.`).

## 1. Dialects

| | legacy (GMLv1) | modern (GMLv2) |
|---|---|---|
| File extension | `.gml` | `.ntgml` |
| Switch inside `.gml` | — | `#pragma gml 2` (file-level, top) |
| Script declaration | `#define` | `function` and/or `#define` (mixing tolerated) |
| Function default args | — | `function f(a = 1)` (100.032) |
| Function default return | `0` | `undefined` |
| Instance IDs | numeric | `ref` |
| Template strings | `` `…${e}…$id…` `` | same + `$"…{e}…"` |
| Struct literal `{k: v}` | yes | yes |
| `[$ key]` accessor | disabled (100.011) | yes |
| `new` / constructors / `static` / `method` / `delete` | no | yes |
| `try` / `catch` | yes (100.005) | yes |
| `throw` | yes | yes |
| `finally` | keyword exists `[bin]`; per-dialect gating `?`; 0 uses `[corpus]` | same |
| `real(v)` | never throws | GML semantics (100.023) |
| `is_real(v)` | == `is_number` | GML semantics |
| `double()` / `is_double()` | strict forms | strict forms |
| `[1 2 3]` (no commas) | tolerated (100.007) | not tolerated |
| `self` / `other` | return IDs | GML semantics |
| `#macro` semantics | differ (100.012/100.013, unspecified) | |
| String escapes | no (GMEdit config); `\#` idiom `[corpus]` | parser handles `\x??`, `\ooo`, C escapes `[bin]`; gating `?` |
| Single-quoted strings | yes (533 uses `[corpus]`) | `Single quotes are not allowed for strings` diagnostic exists `[bin]`; likely rejected |
| Raw strings `@"…"` | no | no evidence anywhere |
| Colour literals `#RRGGBB` | no | no evidence; use `$RRGGBB` |
| `??` `??=` | token + opcode exist `[bin]`; gating `?`; 0 uses `[corpus]` | same |
| `?.` | no `[bin]` | no `[bin]` |
| `^^` | 9 uses in 8 files `[corpus]` | same |

Everything not listed is undocumented, not absent.

## 2. Lexical

### 2.1 Identifiers
- `[A-Za-z_]\w*`, case-sensitive (assumed; all real code uses canonical casing).
- `argument`, `argument0`–`argument15`, `argument_count` (read-only).

### 2.2 Numbers
```
\$[_0-9a-fA-F]+            hex (GML)
0x[_0-9a-fA-F]*            hex (undocumented, in use)
0b[_01]*                   binary
\d[\d_]*(?:\.[\d_]*)?      decimal; `_` separators (100.007); `.5` allowed
```
No exponent form. Hex max 8 digits; `Empty hex literal` is an error `[bin]`. `[ $hex` vs `[$ key` is ambiguous; parser demands the space `[bin]`.

### 2.3 Strings
| Form | Legacy | Modern | Interpolation |
|---|---|---|---|
| `"…"` | yes | yes | none |
| `'…'` | yes | likely rejected `[bin]` | none |
| `` `…` `` | yes | yes | `${expr}` (nests), bare `$ident` |
| `$"…"` | no | yes | `{expr}` |
| `@"…"` | no | `?` | none |

Escapes: no C-style escapes in legacy. `\#` = literal `#` (GM8 idiom; bare `#` is a newline in `draw_text`). Modern `?` (0 uses in corpus).
Colour literals: `$RRGGBB` (docs and mods). `#RRGGBB`: 0 evidence anywhere.

### 2.4 Comments
- `//` line, `/* */` block.
- `///` doc comment, GMS1 style, no `@param`.

### 2.5 Keywords
Base (GML1):
```
var globalvar if then else begin end for while do until repeat switch case default
break continue with exit return self other noone all global local mod div not and or xor enum
```
Full keyword map `[bin]`: base + `wait in try catch throw finally new delete function static constructor null`.
Documented split: `function new static constructor` modern only; `wait in try catch throw` both. `finally delete` gating `?`.
Not keywords: `fork`, `once` (AST nodes / functions), `not in` (parsed as `not` + `in`).

### 2.6 Constants
`self other noone all global undefined null true false pi infinity NaN`
`null` ≠ `undefined`.

### 2.7 Operators
```
assignment  = += -= *= /= %= &= |= ^= <<= >>=
binary      + - * / % & | ^ ^^ << >> && || == != <> < <= > >= mod div and or xor
unary       ! ~ - ++ -- not
ternary     a ? b : c
membership  "name" in inst      "name" not in inst      → bool
nullish     a ?? b   a ??= b     [bin]; gating ?
accessor    [ ]  [| ]  [? ]  [# ]  [@ ]  [$ ]  (last: modern only; write `[$ key` with space)
member      a.b   ObjectName.field   inst.method()
chaining    a[0][1]
```
A `$` after `[` is always an accessor.

### 2.8 Preprocessor
| Directive | Scope | Since | Notes |
|---|---|---|---|
| `#define name` / `#define name(a, b)` | file-level | — | named args; body until next directive |
| `#macro name value` | file-level | — | multi-line via trailing `\`; struct-valued ok; never with args |
| `#pragma gml 2` | file-level | 100.000 | binary accepts `gml <14\|20\|23>` `[bin]` |
| `#pragma init` | `?` | undocumented `[bin]` | loader-side, next to `include`/`preload`/`using` |
| `#pragma include <path>` | file-level | docs | |
| `#pragma using <mod.type[.ext]>` | file-level | 100.001 | |
| `#pragma fast_file` | file-level | 100.023 | |
| `#pragma fast` | statement in function body | 100.004 | disables `wait`/`fork` |
| `#pragma not_fast` | statement in function body | 100.023 | |
| `#pragma no_using` | statement in function body | 100.023 | |
| `#pragma preload <file>` | file-level, incl. inside `#pragma include`d files | undocumented | path relative to containing file; only use: `test/preload/assets/sprites/sprites.gml` |
| `#region` / `#endregion` | lexer keywords `[bin]` | — | parsed and ignored; mods usually write `//#region` |

Complete pragma set `[bin]`: `init include preload using no_using fast not_fast fast_file gml`. Anything else: `"#pragma %" is not supported.`
Not NTT (GMEdit-only, do not support): `#mfunc #args #lambda #lamdef #import #hyper #event #moment #target #action #gmcr #section #with`.

Ace regexes:
```
#define:   ^(#define[ \t]+)(\w+)
#pragma:   (#pragma\b[ \t]*)(\w*[ \t]*)(.*)
#macro:    #macro <name> | #macro <config>:<name>
```

## 3. Statements

```
wait N;            wait(N);         suspend N frames; wait(0) = 1 frame
fork()             → true in copy, false in original
throw expr;
delete expr;
try { } catch (e) { }   [finally { } ?]
with (expr) { }    expr may be instance, object, or array of instances/structs
globalvar name = value;      (100.001)
global.name
var a, b = 1;
```

## 4. Semantics

- Code before first `#define`/`function` = implicit `init`.
- Every mod type has `init()` and `cleanup()`.
- Per-mod isolation: `global`, macros, DS, scripts. Cross-mod: `mod_variable_get/set/exists`, `mod_script_call*`, `#pragma using`.
- Built-in functions are first-class values.
- Arrays: 1-D `array_length`; not copy-on-write.
- `json_decode`/`json_encode`: structs/arrays, not ds_map.
- `instance_create(x, y, obj, ?struct)`: struct init both dialects (100.023).
- Line numbers file-global (no reset on `#define`).

## 5. API annotation format (`api.gml`, from `/gmlapi`)

### 5.1 Functions
```
[prefix]name(args)[flags][:type]
```
| Prefix | Meaning |
|---|---|
| `:` | uses `self` |
| `::` | uses `self` + `other` |
| `:::` | uses `self`, may use `other` |
| `${raw}` | raw calling context |

| Flag | Meaning |
|---|---|
| `:` | returns a value |
| `:type` | typed return |
| `#` | pure |
| `$` | US spelling |
| `£` | UK spelling twin |
| `&` | deprecated |

Args: `arg` required · `?arg` / `[arg]` optional · `arg=default` · `...arg` rest · `arg:type` · `:arg` self-relative.
Dump emits `:#` for pure returning; reference wrote `:##`. Equivalent.

### 5.2 Variables
```
name[index][flags][:type]
```
`*` read-only · `[player]` per-player array · `#` constant · `name = value` constant with value.

### 5.3 Grouping
`//{ group` … `//}` = category.

### 5.4 Dump caveats
- No arg type hints emitted; 126 hand-added in reference 100.022 `api.gml` (merge by position).
- `default.gml` (57 built-in instance vars) not emitted; vendor.
- `raw-assets.gml` joins sections without separator; use `raw-sprites/sounds/fonts/objects.gml`.
- Filter placeholders: `background7 __newsprite2113 __newfont6 __newfont7`.
- Changelog `dp_player_count_*` = dump `player_count_*`.

## 6. Asset namespaces (100.034)

| Prefix | Kind | Count |
|---|---|---|
| `spr` | sprite | 2,009 |
| `msk` | mask | 88 |
| `shd` | shader | 7 |
| `snd` | sound | 1,189 |
| `mus` | music | 39 |
| `amb` | ambience | 17 |
| `fnt` | font | 8 |
| (none) | object | 564 |

Object names have no prefix (`Player`, `GameCont`, `CustomEnemy`).

## 7. API surface (100.034)

| | Count |
|---|---|
| Functions | 984 |
| Constants | 413 |
| Variables | 33 (+57 instance vars from `default.gml`) |
| Assets | 3,931 |

Constant families: `wep_*` (128) `mut_*` (30) `char_*` (17) `crwn_*` (14) `area_*` (16) `ev_*` `asset_*` `buffer_*` `vertex_*` `surface_*` `spritespeed_*` `matrix_*` `shader_kind_*` `json_*` `maxp object_max game_version mod_current mod_current_type`.

Per-player variables (`[player]`): `view_pan_factor view_shake view_xview* view_yview* view_object mouse_x* mouse_y* mouse_delta_x* mouse_delta_y*` and `*_nonsync` twins.

Time-scale twins: `speed_raw direction_raw hspeed_raw vspeed_raw gravity_raw friction_raw image_speed_raw`; `motion_add_raw/_ct`, `motion_set_raw`.

Removed 100.030: `math_get_epsilon math_set_epsilon`.

## 8. Mod file types

Pattern: `name.<type>.gml` | `name.<type>.ntgml` | `name.<type>.gmlbc`. Double extension required. Docs line `NTT-Scripting.dmd:1161` saying skins use `.race.gml` is a typo.

| Type | Command | Aliases `[bin]` |
|---|---|---|
| `.mod` (`.gml`) | `/loadmod` | |
| `.wep` (`.weapon` not accepted) | `/loadwep` | `wep loadweapon` |
| `.race` | `/loadrace` | `race` |
| `.skin` | `/loadskin` | `skin` |
| `.skill` | `/loadskill` | `skill mutation mut loadmutation loadmut` |
| `.crown` | `/loadcrown` | |
| `.area` | `/loadarea` | `area` |
| dir / `.txt` | `/load` | `loadtxt loadcfg loadconf loaddir` |
| live reload | `/loadlive` | `livecode` |

### 8.1 Reserved events

All types: `init cleanup`.

**`.mod`**: `game_start step draw draw_shadows draw_bloom draw_dark draw_dark_begin draw_dark_end draw_gui draw_gui_end draw_pause chat_command(command, parameter, player) chat_message(message, player)`
(`chat_*` `[wiki]`; `chat_command` returns true if handled)
`[bin]` also: `game_end mod_load mod_unload`
mod-local, absent from binary: `level_start save_options load_options`

**`.wep`**: `weapon_name(wep) weapon_text weapon_type weapon_auto weapon_load weapon_cost weapon_rads weapon_swap weapon_melee weapon_area weapon_sprt weapon_sprt_hud weapon_loadout weapon_laser_sight weapon_gold weapon_fire(wep) weapon_reloaded(primary) step(primary) weapon_pan_factor`
`[bin]` confirms all of the above incl. `weapon_pan_factor weapon_sprt_hud`.
mod-local, absent from binary: `weapon_avail weapon_extra weapon_chrg weapon_canspec weapon_cost_base weapon_shrine weapon_maxchrg weapon_chrg_cost weapon_fireOnRelease weapon_burst weapon_burst_time weapon_red`
(`weapon_avail weapon_chrg weapon_shrine` dispatched by NTTE via `mod_script_call`)
mod-local helpers, not events: `weapon_reload weapon_load_full weapon_fire_charged weapon_fire_uncharged`

**`.race`**: `race_name race_text race_swep race_mapicon(player_index, skin) race_portrait(player_index, skin) race_ttip race_menu_button race_soundbank race_menu_select race_menu_confirm game_start create step draw_begin draw draw_end race_avail race_lock race_skins race_skin_avail(skin) race_skin_name(skin) race_skin_button(skin) race_tb_text race_tb_take(value) race_ultra_name(i) race_ultra_text(i) race_ultra_button(i) race_ultra_icon(i) race_ultra_take(i, value) race_ultra_lose(i) race_gets_chilly race_makes_air_bubbles`
`[bin]` also: `race_sprite race_sound race_revive_sprite`
mod-local, absent from binary: `race_skin_lock race_skin_unlock race_unlock race_sprite_raw level_start`

**`.skin`**: `skin_race game_start skin_avail skin_name(locked) skin_button skin_portrait(player_index) skin_mapicon(player_index) skin_race_name skin_race_text skin_race_tb_text create step draw_begin draw draw_end skin_sound skin_sprite`
`[bin]` also: `skin_ttip skin_revive_sprite`
mod-local, absent from binary: `skin_lock skin_unlock skin_weapon_sprite skin_weapon_sprite_hud skin_weapon_swap`

**`.skill`** (archived Bitbucket wiki `Scripting/Mods/skill.gml`): `game_start step skill_name skill_text skill_tip skill_icon skill_button skill_avail skill_take skill_lose skill_wepspec`
mod-local, not engine: `skill_sound skill_rat`

**`.crown`** (archived wiki `Scripting/Mods/crown.gml`): `game_start step crown_name crown_text crown_tip crown_avail crown_button crown_take crown_lose crown_object`
mod-local, not engine: `crown_loadout crown_menu_avail crown_menu_button crown_locked_text crown_impact crown_sound crown_unlock`

**`.area`**: `area_name(subarea, loops) area_secret area_sprite(sprite) area_mapdata(lastx, lasty, lastarea, lastsubarea, subarea, loops) area_setup area_make_floor area_pop_enemies area_pop_props area_pop_chests area_pop_extras area_start area_finish area_transit area_set_music`
`[bin]` also: `area_text`
mod-local (NTTE conventions), absent from binary: `area_subarea area_next area_goal area_music area_music_boss area_music_boss_intro area_ambient area_effect area_darkness area_fog area_underwater area_shadow_color area_background_color area_setup_floor area_setup_spiral`

### 8.2 Custom object callback fields
| Object | Fields |
|---|---|
| `CustomObject` | `on_destroy on_step on_begin_step on_end_step on_draw on_cleanup sprite_visible` |
| `CustomHitme` | + `on_hurt my_health maxhealth spr_idle spr_walk spr_hurt spr_dead spr_shadow snd_hurt snd_dead team size raddrop` |
| `CustomEnemy` | + `on_death candie meleedamage hitid` |
| `CustomProp` | `on_step on_death on_draw size maxhealth spr_* snd_hurt` |
| `CustomProjectile` | `on_wall on_hit on_anim on_draw on_step on_begin_step on_end_step on_destroy on_cleanup` |
| `CustomSlash` | + `typ candeflect on_grenade on_projectile` |
| `CustomChest` | `on_anim on_draw on_step on_begin_step on_end_step on_destroy on_cleanup on_open can_hatred can_shine` |
| `CustomPickup` | `blink spr_fade spr_pickup snd_pickup snd_disappear attract_speed on_pickup on_step on_draw on_disappear on_find_target on_attract` |
| `CustomBeginStep/Step/EndStep/Draw` | `script` (via `script_bind_*`) |

### 8.3 Button names
`nort sout west east fire spec swap prev next pick paus okay exit horn talk key1 … key9 key0`

## 9. `main.txt` / `main.cfg`
- One chat command per line. `//` comment lines (also used to disable a line: `//loadmod x`).
- Run by `/load <dir>` (`[wiki]`: "loads the main.txt/main.cfg in the folder"). Aliases `[bin]`: `loadtxt loadcfg loadconf loaddir`. `loadtext` is not in the alias table but appears in shipped `main.txt` files.
- Chainable: `/load main2`, `/loadtext main2.txt`.
- Commands: `/load /loadmod /loadwep /loadrace /loadskin /loadskill /loadcrown /loadarea /loadlive /allowmod /unloadmod /silencemod /ignoremod /loadloc /sideload /timeout /gml /gml2 /gmlapi`.
- Extension on mod name optional (`/loadmod baldi.race`, `/loadmod x.mod.gml` both seen).
- Zero `main.cfg` in the wild; 24 `main*.txt` in the local corpus.
- Blank `main.txt` marks a folder as an NTT project (GMEdit).
- Distinct from `NuclearThroneTogether.ini`.

## 10. Not NTGML
- Per-event files (`init.gml`, `update.gml`).
- GM: `gpu_* draw_light_* view_*port background_* room* keyboard_* os_* game_id current_year… event_* cmpfunc_* cull_* mip_* tf_* transition_* caption_* show_health/lives/score is_int32 is_int64 is_bool bool() music_* random_func*`.
- JSDoc `@param`, `script.static`, `<>` as bracket pair.
