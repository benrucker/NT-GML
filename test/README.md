# Tests

Golden-file tests over the pure parts of the extension: the `/gmlapi` parser,
the docs extractor, the generated tables, the hand-maintained tables, and the
completion provider's model.
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
| `generated.test.ts` | Runs the built generator on the vendored dump into a scratch directory and requires it to be byte-identical to the committed `src/generated/`. Fails on any parser, generator, override or vendored-input change until `pnpm gen` is rerun, and on any loss of determinism. Also asserts no unexpanded DocMark macro (`$[manual]`, `$[src]`) survives into `src/generated/docs.ts`. |
| `dump.test.ts` | Every name in the vendored dump's `raw-*.gml` is in the tables (scope section 5.5); the same for a local dump in `%LOCALAPPDATA%/nuclearthrone/api` when it is the same `game_version` (skipped otherwise); names unique across kinds; tables sorted; GM placeholder assets dropped; spot checks per annotation form; no Rivals-of-Aether identifiers in `src/`, `tools/`, `data/`, `syntaxes/`, `package.json`, `resources/`, `README.md`, `.vscodeignore` and `.vscode/` (text files are scanned line by line; binary files such as `.png` are judged by file name only, and the test carries a short commented allowlist for lines that name RoA on purpose) |
| `grammar.test.ts` | The two `syntaxes/*.tmLanguage.json`: byte-identical to a fresh `generate-grammar` run, structurally valid (includes resolve, `begin`/`end` pair up, every repository entry reachable, every scope ends in `.ntgml`, no `(?i)`), a line-by-line token dump of `fixtures/grammar/sample.mod.gml` and `sample.mod.ntgml` as goldens, targeted scope assertions per identifier family, member access after a `.`, preprocessor form, number form, operator and string form, and dialect gating (`$"..."`, `[$`, `function`/`new`/`static`/`constructor`). Also tokenises up to 40 installed mods as a backtracking canary; it skips when the game is absent (override the path with `NT_MODS_DIR`). |
| `provider.test.ts` | `src/provider`, the vscode-free half of the completion / hover / signature-help provider (scope section 5.4). Goldens: a one-line dump of every offered item (name, kind, `sortText`, detail) and of the context-only families (mod events, custom-object fields, buttons, pragmas), rendered documentation for one sample per annotation form, one cursor scenario per context rule (`fixtures/provider/context-cases.txt`), one call per signature scanner case (`fixtures/provider/signature-cases.txt`), and the top of the list per context (where the sort tiers show). Direct asserts: no duplicate item names; every hand-table entry (keywords, built-in constants, soft keywords, preprocessor directives) keeps its kind, tier and documentation through the merge with the dump, and `region`/`endregion` stay unoffered; the NTT-only families land in the NTT tier and plain GameMaker names do not; one snippet placeholder per required argument; dialect gating of `function`/`new`/`static`/`constructor`; the object-argument heuristic (`instance_create`, `instances_matching`, `collision_line`, the `object_*` family, and the `variable_struct_filter` non-match), which refines a kind rather than replacing it; a `with (CustomEnemy)` body offering the object's plain fields as well as its `on_` callbacks, where an `instance_create` receiver offers only the callbacks; nothing offered in comments, strings or unknown member access, including a block comment or string opened on an earlier line and a `#define` line inside one; a preprocessor word owns its leading `#` and a colour literal does not; no offered list contains two entries a user cannot tell apart; hover resolution per context; every signature parameter range covers its rendered argument; and the layering rule in both directions - nothing reachable from `src/provider` imports `vscode`, and `src/generated` / `src/tables` never import `src/provider`. |
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
