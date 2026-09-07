# Tests

Golden-file tests over the pure parts of the extension: the `/gmlapi` parser,
the docs extractor, the generated tables, the hand-maintained tables, the three
TextMate grammars, and the completion provider's model.
No VS Code host is involved; the runner is Node's built-in `node:test`.

```
pnpm test
```

`pnpm test` first runs `pnpm build`, which compiles the extension (`tsc -p ./`),
the generator (`tsc -p tools`) and this directory (`tsc -p test`). `test/tsconfig.json` compiles `src/`,
`tools/` and `test/` together into `out/test/` so tests can import both the
parser and the generated tables with full type checking.

## What is covered

| File | Checks |
|---|---|
| `parse-api.test.ts` | `fixtures/parse-api/api.gml` has one line per annotation form from NTGML-SPEC.md section 5. The parser's full output is the golden. Also `default.gml`, `raw-*.gml` tokenising and single `parseArg` forms. |
| `parse-docs.test.ts` | `fixtures/parse-docs/Sample.dmd` covers both DocMark shapes (`#[name(args)]() {}` blocks and `gmblanks`/`ntblanks` fences) and the `$[...]` macros - expanded (`$[manual]`, `$[nonSync]`), stripped (`$[src]`) and left alone (anything unrecognised). |
| `parse-fields.test.ts` | `fixtures/parse-fields/fields.gml` is a hand-written sample with one entry per shape the real `fields.gml` uses - a root, a child, a grandchild, a parent-less entry, `default` written out of order, an entry without `default`, one without `*`, and one whose parent has no entry. The parser's full output is the golden. Also asserts that the flattened lists are *not* de-flattened by the parser, and that six malformed lines each throw. |
| `parse-object-docs.test.ts` | `fixtures/parse-object-docs/Sample.html` is a small page in the shape `api/ntt-docs/objects/*.html` has: a `from <object>` group, a `from scr*` script group, plain / typed / documented variables, an escaped generic type, a method-shaped header, a group lead-in and a trailing `Alarms:` block. Full output is the golden; direct asserts cover group attribution, entity decoding, first-paragraph-only prose, the 300-character truncation, and that a page with no `<!--<doc-->` body throws. |
| `object-fields.test.ts` | Invariants of the merged per-object table rather than a golden, since a refreshed `fields.gml` is expected to move every number: sorted, unique, every entry a real 100.034 object; the 489-of-564 coverage and the five entries whose parent was never dumped; no parent cycles; no field name duplicated within an object or along its chain; no built-in offered as a field; `CustomChest` and `CustomPickup` are the only hand-written `Custom*` objects with no `fields.gml` entry; inheritance and `declaringObject` (`Player.wep` is Player's, `Player.my_health` is `hitme`'s); and the `docs` / `hand` source markers on `UberCont`. |
| `generated.test.ts` | Runs the built generator on the vendored dump into a scratch directory and requires it to be byte-identical to the committed `src/generated/`. Fails on any parser, generator, override or vendored-input change until `pnpm gen` is rerun, and on any loss of determinism. Also asserts no unexpanded DocMark macro (`$[manual]`, `$[src]`) survives into `src/generated/docs.ts`. |
| `dump.test.ts` | Every name in the vendored dump's `raw-*.gml` is in the tables (scope section 5.5); the same for a local dump in `%LOCALAPPDATA%/nuclearthrone/api` when it is the same `game_version` (skipped otherwise); names unique across kinds; tables sorted; GM placeholder assets dropped; spot checks per annotation form; no Rivals-of-Aether identifiers in `src/`, `tools/`, `data/`, `syntaxes/`, `package.json`, `resources/`, `README.md`, `CHANGELOG.md`, `.vscodeignore` and `.vscode/` (text files are scanned line by line; binary files such as `.png` are judged by file name only, and the test carries two short commented allowlists - one for whole lines that name RoA on purpose, one for single tokens in a named generated file, which is what keeps NTT's own `hitbox` and `last_ps_eth_counter` in `src/generated/object-fields.ts` from failing the scan without widening the pattern or allowlisting a 20 KB line) |
| `grammar.test.ts` | The three `syntaxes/*.tmLanguage.json`: the two generated ones are byte-identical to a fresh `generate-grammar` run and the hand-written `ntt-main.tmLanguage.json` is listed as such, so a file in `syntaxes/` that is neither still fails; all three are structurally valid (includes resolve, `begin`/`end` pair up, every repository entry reachable, every scope ends in that grammar's own suffix - `.ntgml` or `.ntt-main` - and no `(?i)`); a line-by-line token dump of `fixtures/grammar/sample.mod.gml`, `sample.mod.ntgml` and `main.txt` as goldens; targeted scope assertions per identifier family, member access after a `.`, preprocessor form, number form, operator and string form, and dialect gating (`$"..."`, `[$`, `function`/`new`/`static`/`constructor`); and for `ntt-main`, only what the `main.txt` golden cannot show - a scope a line must *not* get (`//loadmod` is not a command, `/LoadMod` is not `/loadmod`), input too malformed to ship in a fixture (`/timeout abc`, `/gmlapi now`, `/sideloading yes`), the tier-1/tier-2 boundary at `/load` versus `/loadsprite`, and that a `/gml` line with an unterminated `/*` does not leak into the next line. Also tokenises up to 40 installed mods as a backtracking canary, and every installed `main*.txt` with the `ntt-main` grammar, asserting that none of their commands comes back unknown - that assertion depends on what is in the mods folder on purpose, and a failure means the table needs re-reading from the binary. Skips when the game is absent (override the path with `NT_MODS_DIR`). |
| `provider.test.ts` | `src/provider`, the vscode-free half of the completion / hover / signature-help provider (scope section 5.4). Goldens: a one-line dump of every offered item (name, kind, `sortText`, detail) and of the context-only families (mod events, custom-object fields, six of the 489 generated field sets, buttons, pragmas), rendered documentation for one sample per annotation form, one cursor scenario per context rule (`fixtures/provider/context-cases.txt`), one call per signature scanner case (`fixtures/provider/signature-cases.txt`), and the top of the list per context (where the sort tiers show). Direct asserts: no duplicate item names; every hand-table entry (keywords, built-in constants, soft keywords, preprocessor directives) keeps its kind, tier and documentation through the merge with the dump, and `region`/`endregion` stay unoffered; the NTT-only families land in the NTT tier and plain GameMaker names do not; one snippet placeholder per required argument; dialect gating of `function`/`new`/`static`/`constructor`; the object-argument heuristic (`instance_create`, `instances_matching`, `collision_line`, the `object_*` family, and the `variable_struct_filter` non-match), which refines a kind rather than replacing it; a `with (CustomEnemy)` body offering the object's plain fields as well as its `on_` callbacks, where an `instance_create` receiver offers only the callbacks; the same mechanism over the game's own objects, so `Player.` and a `with (Player)` body offer its 125 own and inherited instance variables while `MultiMenu.` - one of the 75 objects the field dump does not list - offers nothing at all, and how far a `with` receiver reaches (closed block, brace-less on the same line and on the next, nested, and one written in a comment or a string), against the `on_` path, which is unbounded but looks only for `Custom*` objects so a closed `with (Player)` cannot shadow the `CustomEnemy` a callback belongs to; nothing offered in comments, strings or unknown member access, including a block comment or string opened on an earlier line and a `#define` line inside one; a preprocessor word owns its leading `#` and a colour literal does not; no offered list contains two entries a user cannot tell apart; hover resolution per context; every signature parameter range covers its rendered argument; and the layering rule in both directions - nothing reachable from `src/provider` imports `vscode`, and `src/generated` / `src/tables` never import `src/provider`. |
| `packaging.test.ts` | `LICENSE` exists and says MIT; `package.json` declares `license: "MIT"`; every relative prose link in `README.md` and `CHANGELOG.md` resolves (one stripper for both: code spans and fenced blocks removed first), including `docs/NTT Modding Cheat Sheet.md`; `CHANGELOG.md` has a `## [x.y.z]` heading for the version `package.json` declares, and `README.md` hard-codes no `.vsix` file name that has drifted from it; `.gitignore` still ignores `out/` and `*.vsix`; `.github/workflows/ci.yml` still runs `pnpm gen` with a `git diff --exit-code` and still uploads a per-OS `vsix-${{ matrix.os }}` artifact from both runners with no `matrix.os` condition (literal substrings, like the `.vscodeignore` check); every `test/*.test.ts` file has a row in this table; `.vscodeignore` has no line literally excluding `LICENSE`/`README.md`/`CHANGELOG.md`/`package.json`/`syntaxes/`/`data/`/`out/`/`resources/`, and still has the lines excluding `api/`, `src/`, `tools/`, `test/`, `docs/`, `.claude/` and the non-shipped `out/` subtrees; the file named by `package.json` `icon` is a square 8-bit RGBA PNG of at least 128x128 (header bytes and the IHDR chunk, not a full decode) whose inflated scanlines all use filter type 0 and match a fresh `render()` from `tools/render-icon.ts` to within 2 levels per channel - decoding the IDAT rather than comparing file bytes is what makes the check survive zlib changing its output between Node releases, and the 2 levels cover per-channel rounding only, not a changed picture (one flipped supersample would move a pixel by at least about 8 levels in some channel - about 16 on the tile's outer edge, where the alpha itself steps - and fail, as it should; the measured worst difference is 0); and every `contributes.languages[].configuration` and `contributes.grammars[].path` exists *and* parses as JSON, with the grammar and language lists naming the same ids. Literal line matching, not ignore semantics; `pnpm package` in CI is the real check. |
| `tables.test.ts` | `src/tables`: every mod type has `init`/`cleanup`, no duplicate events, keywords disjoint from functions, unique buttons and custom-object fields, `modTypeFromFileName`. |

## Updating goldens

When a parser change is intentional, regenerate the goldens and review the
diff. The golden is the assertion, so the diff is the review.

```
# PowerShell
$env:UPDATE_GOLDENS = '1'; pnpm test; Remove-Item Env:UPDATE_GOLDENS

# bash
UPDATE_GOLDENS=1 pnpm test
```

`generated.test.ts` has no separate golden: `src/generated/` is the golden.
Update it with `pnpm gen` and commit the result.

## Adding a fixture line

Add the line to `fixtures/parse-api/api.gml` under the matching `//{ group`,
run with `UPDATE_GOLDENS=1`, and check the new entry in `api.golden.json`
says what you expect.

## Not covered yet

- Highlighting the modern dialect inside a `.gml` file that opts in with
  `#pragma gml 2`: VS Code picks one grammar per file type, so such a file is
  tokenised as legacy. `grammar.test.ts` asserts the current behaviour.
- The thin VS Code layer in `src/completionProvider.ts` and `src/extension.ts`:
  provider registration and the `vscode.CompletionItem` conversion need an
  extension host. Keep logic out of them - it belongs in `src/provider/`,
  which `provider.test.ts` covers here.
