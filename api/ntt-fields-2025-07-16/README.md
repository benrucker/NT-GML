# NTT `fields.gml` dump (2025-07-16)

Per-object instance-variable lists, written by Nuclear Throne Together itself. Copied verbatim from `%LOCALAPPDATA%\nuclearthrone\api\fields.gml`: 493 lines, 64,474 bytes on disk, where the game writes CRLF. `.gitattributes` normalises the repo with `* text=auto eol=lf`, so git stores the same content as 63,981 bytes with LF endings and checks it out with LF — exactly as it does for `api/ntt-100.034/api.gml`. The folder is named for the file's own header stamp, `// Generated at 7/16/2025 10:37:04 PM`.

## Which build wrote it

The stamp dates the `/gmlapi` **run**, not the build that ran it, and the file
carries no `game_version` line to name that build. What it does carry is three
absences, each of which puts an upper bound on it:

- `CustomObject` (line 480) lists six of the seven fields the create event of
  `api/ntt-docs/ref/CustomObject.gml:7-13` assigns. The missing one is
  `sprite_visible`, added in 100.013 (`api/ntt-docs/Changelog.md:618`); it does
  not appear anywhere in the file;
- `UberCont` (line 21) lists four variables - `default` there is a marker, not
  a name - and `tips` is not among them; it was added in 100.016
  (`Changelog.md:576`);
- `CustomProp` (line 482) has `on_death` and `on_step` but no `on_draw`, added
  in 100.030 (`Changelog.md:303`).

The tightest of those is the first, so on the vendored evidence alone the
build behind this dump is older than 100.013, whose changelog entry is
undated - the next release, 100.014, is November 2023 (`Changelog.md:587`).
That is the bound anyone can re-measure from this repo, and it is the one the
rest of this README leads with. The stamp is line 1 of this same file, so one
run wrote both: a build older than 100.013 ran `/gmlapi` on 2025-07-16 and
wrote the file then. It is a 2025 file describing a much older game, not an
old file that later acquired a 2025 stamp.

A second line of evidence points the same way, and the repo only holds it
second-hand. `NTGML-PORT-SCOPE.md:7` records that the `api.gml` written by
that same 2025-07-16 run reported `game_version = 0` and 689 functions, where
the 100.034 dump has 984. That `api.gml` was overwritten by the 9/2/2026 run,
so the scope note is the only surviving record of it and nothing here can
re-measure it; and a `game_version` of 0 names no version anyway. Read it as
agreeing with the bound above, not as a bound of its own.

### A tighter bound, from a page this repo does not vendor

The vendored evidence stops at 100.013. One more source tightens it, and it is
**not** in this repo: the `docs/objects/CustomProjectile.html` page of
YellowAfterlife's `bits-of-nuclear-throne`, the same upstream that
`api/ntt-docs/objects/` is a six-page excerpt of. Its `from projectile` group
lists ten variables; the `projectile` entry at line 238 of this dump
(`projectile { default, deflected, damage, creator, hitid, force, team, typ,
* }`) lists seven. Two of the three it lacks are dated: `creator_projectile`
(`Changelog.md:706`) and `portal_immunity` (`:714`), both under
`# 100.007 (december 2022)` at `:688`. Neither string occurs anywhere in
`fields.gml`. (The third, `nopopo`, appears in no changelog entry at all, so it
dates nothing.) By exactly the argument used for `CustomObject.sprite_visible`
above, that puts the build older than **100.007**.

Two honest caveats. That page is deliberately not vendored: the generator's
docs merge reads every file in `api/ntt-docs/objects/`, and the `Custom*`
objects are the hand table's territory, so adding it would change what the
extension ships rather than only what this README claims. And no
`ref/projectile.gml` create event is vendored either, so nothing here shows
those two names are create-assigned rather than set later - the same gap the
`UberCont.tips` bullet above already lives with.

So: the vendored evidence does not date the build more precisely than
"older than 100.013"; the upstream `CustomProjectile` page does, at "older
than 100.007". Both readings are carried below rather than one being picked.

The 100.034 build does **not** regenerate it either: the `/gmlapi` run that
produced `api/ntt-100.034/api.gml` is stamped 9/2/2026 and left this file
untouched at 2025-07-16. That is why `api/ntt-100.034/` has no copy of its own
and why this one is vendored under its own header date rather than under a
game version.

## Format

The file documents itself in its first four lines:

```gml
// Generated at 7/16/2025 10:37:04 PM
// Format is `ObjectName : ParentName { ... variables }
// `default` means support for built-in variables (x, y, sprite_index, etc.)
// `*` means support for mod-defined variables.
Player : hitme { default, footstep, chickencorpse, ..., index, * }
GammaBlast { default, creator, team, * }
GmlMod { * }
```

Two things the header does not say:

- the lists are **flattened** — a child repeats every name its parent lists, so of the 116 names `Player` lists, 14 are `hitme`'s and 102 are its own. `tools/generate-api.ts` de-flattens by subtracting the names every ancestor *that has an entry of its own* lists;
- `default` and `*` are markers, not variables. They can appear anywhere in the list, and `default` is not always first.

`tools/parse-fields.ts` parses this format. `api/fields-overrides.gml` uses the same syntax and the same parser.

## Staleness, as measured by `pnpm gen`

| Measure | Value |
|---|---|
| Objects with an entry | 489 |
| Entries naming a parent | 376 |
| Objects in the 100.034 dump with **no** entry | 75 of 564 |
| Entries whose parent is a real object with no entry | 5 (`BackFromCharSelect`, `CharSelect`, `Loadout`, `LoadoutSkin`, `mutbutton`), naming 3 such parents (`button`, `menubutton`, `loadbutton`) |
| Field names listed | 5188 |
| Own field names after de-flattening | 1264 (423 distinct) |

Each of those 75 is either newer than the build measured above or was simply
skipped by the dump, and the file does not say which. Three are settled as
skipped whichever bound you take: `button`, `menubutton` and `loadbutton`. The
proof is in the file itself, which names all three as the parents of five of
its own entries, so the build could see them and wrote no entry for them.

The rest depends on which bound of `## Which build wrote it` you are reading
with, and only one object moves between the two:

| | Skipped | Newer than the build | Undecided |
|---|---|---|---|
| Vendored evidence only (older than 100.013) | 3 | 1 | 71 |
| With the upstream `CustomProjectile` page (older than 100.007) | 3 | 2 | 70 |

The one that is newer under both readings is `CustomChest`, added in 100.025
(`api/ntt-docs/Changelog.md:337`, June 2025), past either bound. The one that
moves is `CustomPickup`, added in 100.007 (`Changelog.md:703`, December 2022):
an upper bound of 100.013 leaves it undecided, because nothing in this repo
pins a LOWER bound and a build older than 100.007 would make it newer rather
than skipped; an upper bound of 100.007 settles it as newer. Everything else - 71 objects, or 70
once `CustomPickup` moves - is undecided, and why `/gmlapi` skips an object it
can see is not recorded anywhere.

So this README does not guess, and neither does the extension: 73 of the 75
are offered no instance variables at all. The other two are `CustomChest` and
`CustomPickup`, whose fields (10 and 12) come from the hand-written `Custom*`
table in `src/tables/custom-objects.ts` instead.

The 3 parents named but never dumped — `button`, `menubutton` and `loadbutton` — are the same case, not a different one: they are three of those 75. Their 5 children therefore have no ancestor entry to subtract, so the names they inherit stay attributed to the child.

Names that the docs pages under `api/ntt-docs/objects/` know about but this file does not are merged in and marked `source: 'docs'`; names from `api/fields-overrides.gml` are marked `source: 'hand'`. After both merges the table holds 1493 own fields (634 distinct names). Built-in instance variables (`x`, `sprite_index`, ...) are dropped from every source — they belong to `src/generated/variables.ts`.

## Refresh

`tools/generate-api.ts` **always reads this vendored file**, never `%LOCALAPPDATA%`, even when a local dump is present: the local `fields.gml` is byte-for-byte this same file, and it carries no `game_version` line to gate on, so reading it from the game directory would only make the build depend on which machine it ran on.

To refresh, if a future NTT build starts regenerating it:

1. run `/gmlapi` in-game and check whether `%LOCALAPPDATA%\nuclearthrone\api\fields.gml` has a newer `// Generated at` stamp than this copy. Compare content with `diff --strip-trailing-cr api/ntt-fields-2025-07-16/fields.gml "$LOCALAPPDATA/nuclearthrone/api/fields.gml"` (or `git diff --no-index --ignore-cr-at-eol` between the same two paths). Plain `cmp` is no use after a checkout: the game writes CRLF and git checks this file out as LF, so `cmp` reports a difference at line 1 even when the content is identical;
2. if the content really has changed, copy the live file into a new `api/ntt-fields-<date>/` folder alongside this one, unchanged apart from the line endings `.gitattributes` normalises;
3. point `FIELDS_FILE` in `tools/generate-api.ts` at the new folder and run `pnpm gen`;
4. re-measure this README's table from the generator's `object fields` summary block, and update the counts pinned in `test/object-fields.test.ts` — they are pinned so that a silent change in the merge is a test failure, not so that the game can never change.

## License

Machine-generated output of the game's own `/gmlapi` command, vendored for reference. Same footing as `api/ntt-100.034/`.
