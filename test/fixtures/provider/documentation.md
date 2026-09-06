=== function abs ===
detail: abs(x):#
insert: abs(${1:x})$0  [snippet]

```ntgml
abs(x) -> value
```

- Category: Numbers
- Returns a value.
- Pure: the result depends only on the arguments.

_Section lead-in from `API-Numbers.dmd`, not written for `abs` specifically:_

These come from
[math](https://manual.gamemaker.io/monthly/en/GameMaker_Language/GML_Reference/Maths_And_Numbers/Number_Functions/Number_Functions.htm)
and
[trigonometry](https://manual.gamemaker.io/monthly/en/GameMaker_Language/GML_Reference/Maths_And_Numbers/Angles_And_Distance/Angles_And_Distance.htm)
pages

=== function alarm_set ===
detail: :alarm_set(index, value)
insert: alarm_set(${1:index}, ${2:value})$0  [snippet]

```ntgml
alarm_set(index: index, value: number)
```

- Uses `self`.

=== function weapon_get_name ===
detail: :::weapon_get_name(wep):
insert: weapon_get_name(${1:wep})$0  [snippet]

```ntgml
weapon_get_name(wep) -> value
```

- Category: Weapon API
- Uses `self`, and may use `other`.
- Returns a value.

Returns display name of a weapon.

=== function instance_create ===
detail: instance_create(x, y, obj, ?var_struct):
insert: instance_create(${1:x}, ${2:y}, ${3:obj})$0  [snippet]

```ntgml
instance_create(x, y, obj, ?var_struct) -> value
```

- Category: Instances
- Returns a value.

GMS1-style, picks depth based on `object_get_depth` with depths set in project.

=== function instance_destroy ===
detail: ${raw}instance_destroy(?inst, ?perform_destroy)
insert: instance_destroy($0)  [snippet]

```ntgml
instance_destroy(?inst, ?perform_destroy)
```

- Category: Instances
- Receives the raw calling context (`${raw}`).

=== function instances_matching ===
detail: instances_matching(object_or_array, varname:string, ...values):
insert: instances_matching(${1:object_or_array}, ${2:varname})$0  [snippet]

```ntgml
instances_matching(object_or_array, varname: string, ...values) -> value
```

- Category: Instance API
- Returns a value.

Returns an array of instances that have varname equal to any of values.

=== function array_filter ===
detail: array_filter(arr:array, fn, copy:bool=true):
insert: array_filter(${1:arr}, ${2:fn})$0  [snippet]

```ntgml
array_filter(arr: array, fn, ?copy: bool = true) -> value
```

- Category: Arrays
- Returns a value.

Filters an array by passing each item to the filter function
and keeping only the ones that it returned `true` for.

If `copy` is `true`, filtered items will be added to a new array.\
Otherwise the array is modified in place.

Returns the array (either new or the input one) in both cases.

On terms of modern GML, the function is a mix of
`array_filter` (GameMaker manual) and `array_filter_ext` (GameMaker manual).

=== function string_length ===
detail: string_length(str):#
insert: string_length(${1:str})$0  [snippet]

```ntgml
string_length(str: string) -> value
```

- Category: String
- Returns a value.
- Pure: the result depends only on the arguments.

_Section lead-in from `API-Strings.dmd`, not written for `string_length` specifically:_

The following are [built-in](https://manual.gamemaker.io/monthly/en/GameMaker_Language/GML_Reference/Strings/Strings.htm)

=== function event_perform ===
detail: ::event_perform(etype, enumb)
insert: event_perform(${1:etype}, ${2:enumb})$0  [snippet]

```ntgml
event_perform(etype: int, enumb: int)
```

- Category: event_
- Uses `self` and `other`.

Be careful!

See the GameMaker manual.

=== function vertex_format_add_color ===
detail: vertex_format_add_color()$
insert: vertex_format_add_color($0)  [snippet]

```ntgml
vertex_format_add_color()
```

- Category: Vertex buffers
- US spelling; the UK-spelled twin is `vertex_format_add_colour`.

_Section lead-in from `API-Vertex-Buffers.dmd`, not written for `vertex_format_add_color` specifically:_

All the usual stuff (with addition of `_valid`).

=== function vertex_format_add_colour ===
detail: vertex_format_add_colour()£
insert: vertex_format_add_colour($0)  [snippet]

```ntgml
vertex_format_add_colour()
```

- Category: Vertex buffers
- UK spelling; the US-spelled twin is `vertex_format_add_color`.

_Section lead-in from `API-Vertex-Buffers.dmd`, not written for `vertex_format_add_colour` specifically:_

All the usual stuff (with addition of `_valid`).

=== constant wep_assault_rifle ===
detail: wep_assault_rifle = 17
insert: wep_assault_rifle

```ntgml
wep_assault_rifle = 17
```

=== constant maxp ===
detail: maxp = 4 (Player API)
insert: maxp

```ntgml
maxp = 4
```

- Category: Player API

=== constant c_orange ===
detail: c_orange = 4235519 (Color constants)
insert: c_orange

```ntgml
c_orange = 4235519
```

- Category: Color constants

=== variable mouse_x ===
detail: mouse_x[player]* (Player API)
insert: mouse_x[${1:player}]$0  [snippet]

```ntgml
mouse_x[player]*
```

- Category: Player API
- Per-player array: index it with a player slot, `mouse_x[player]`.
- Read-only (`*`).

=== variable argument_count ===
detail: argument_count* (Built-in instance variables)
insert: argument_count

```ntgml
argument_count*
```

- Category: Built-in instance variables
- Built-in instance variable.
- Read-only (`*`).

=== variable x ===
detail: x (Built-in instance variables)
insert: x

```ntgml
x
```

- Category: Built-in instance variables
- Built-in instance variable.

=== variable current_frame ===
detail: current_frame*
insert: current_frame

```ntgml
current_frame*
```

- Read-only (`*`).

=== sprite sprMutant1Idle ===
detail: sprite
insert: sprMutant1Idle

```ntgml
sprMutant1Idle
```

- Built-in NTT sprite.

=== mask mskAlly ===
detail: mask
insert: mskAlly

```ntgml
mskAlly
```

- Built-in NTT mask.

=== sound sndAllyDead ===
detail: sound
insert: sndAllyDead

```ntgml
sndAllyDead
```

- Built-in NTT sound.

=== music mus1 ===
detail: music track
insert: mus1

```ntgml
mus1
```

- Built-in NTT music track.

=== font fntChat ===
detail: font
insert: fntChat

```ntgml
fntChat
```

- Built-in NTT font.

=== shader shd16 ===
detail: shader
insert: shd16

```ntgml
shd16
```

- Built-in NTT shader.

=== object Player ===
detail: object
insert: Player

```ntgml
Player
```

- Built-in NTT object.

=== keyword wait ===
detail: keyword
insert: wait

```ntgml
wait
```

- keyword

Suspends the script for N frames. Disabled by `#pragma fast`.

=== soft-keyword fork ===
detail: soft keyword
insert: fork($0)  [snippet]

```ntgml
fork
```

- soft keyword

Splits execution into a background copy. Disabled by `#pragma fast`.

---

```ntgml
fork() -> value
```

- Returns a value.

=== builtin-constant null ===
detail: built-in constant
insert: null

```ntgml
null
```

- built-in constant

Distinct from `undefined`.

---

```ntgml
null#
```

- Category: Built-in instance variables
- Built-in instance variable.
- Constant (`#`).

=== keyword function ===
detail: keyword (modern dialect)
insert: function

```ntgml
function
```

- keyword
- Modern dialect only (`.ntgml`, or `#pragma gml 2`).

Declares a function or a method value.

=== preprocessor #pragma ===
detail: preprocessor directive
insert: #pragma

```ntgml
#pragma
```

- preprocessor directive

Compiler / loader directive.

=== function sound_play ===
detail: sound_play(:sound):
insert: sound_play(${1:sound})$0  [snippet]

```ntgml
sound_play(sound) -> value
```

- Category: Audio API
- Returns a value.

_Section lead-in from `API-Audio.dmd`, not written for `sound_play` specifically:_

The naming scheme of these sort of mimics GM8.

=== function array_insert ===
detail: array_insert(array,index,val,...)
insert: array_insert(${1:array}, ${2:index}, ${3:val})$0  [snippet]

```ntgml
array_insert(array, index, val, ...)
```

- Category: Arrays

=== event chat_command ===
detail: chat_command(command, parameter, player) (.mod event)
insert: chat_command(command, parameter, player)

```ntgml
#define chat_command(command, parameter, player)
```

- Reserved `.mod` event.
- Dispatched by the engine.

Handles a chat command. Return `true` if the command was handled.

=== event area_name ===
detail: area_name(subarea, loops) (.area event)
insert: area_name(subarea, loops)

```ntgml
#define area_name(subarea, loops)
```

- Reserved `.area` event.
- Dispatched by the engine.

Display name of the area.

=== field on_hurt ===
detail: available on CustomHitme, CustomEnemy
insert: on_hurt

```ntgml
on_hurt
```

- Available on `CustomHitme`, `CustomEnemy`.

Event callback.

=== pragma using ===
detail: #pragma using <mod.type[.ext]> (file level)
insert: using ${1:mod.type[.ext]}  [snippet]

```ntgml
#pragma using <mod.type[.ext]>
```

- File-level directive: write it outside any function body.
- Takes one argument, `mod.type[.ext]`.

Imports another mod's scripts (100.001).

=== button nort ===
detail: Move up.
insert: "nort"

```ntgml
"nort"
```

- Input button name accepted by `button_check` and friends.

Move up.

(synthetic entry: the dump has no deprecated function)

=== function not_a_real_function ===
detail: not_a_real_function(map):&
insert: not_a_real_function(${1:map})$0  [snippet]

```ntgml
not_a_real_function(map) -> value
```

- Category: Maps
- Returns a value.
- **Deprecated.**
