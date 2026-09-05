# Tests

Golden-file tests over the pure parts of the extension: the `/gmlapi` parser,
the docs extractor, the generated tables, and the hand-maintained tables.
No VS Code host is involved; the runner is Node's built-in `node:test`.

```
npm test
```

`pretest` compiles the extension (`tsc -p ./`), the generator (`tsc -p tools`)
and this directory (`tsc -p test`). `test/tsconfig.json` compiles `src/`,
`tools/` and `test/` together into `out/test/` so tests can import both the
parser and the generated tables with full type checking.

## What is covered

| File | Checks |
|---|---|
| `parse-api.test.ts` | `fixtures/parse-api/api.gml` has one line per annotation form from NTGML-SPEC.md section 5. The parser's full output is the golden. Also `default.gml`, `raw-*.gml` tokenising and single `parseArg` forms. |
| `parse-docs.test.ts` | `fixtures/parse-docs/Sample.dmd` covers both DocMark shapes (`#[name(args)]() {}` blocks and `gmblanks`/`ntblanks` fences). |
| `generated.test.ts` | Runs the built generator on the vendored dump into a scratch directory and requires it to be byte-identical to the committed `src/generated/`. Fails on any parser, generator, override or vendored-input change until `npm run gen` is rerun, and on any loss of determinism. |
| `dump.test.ts` | Every name in the vendored dump's `raw-*.gml` is in the tables (scope section 5.5); the same for a local dump in `%LOCALAPPDATA%/nuclearthrone/api` when it is the same `game_version` (skipped otherwise); names unique across kinds; tables sorted; GM placeholder assets dropped; spot checks per annotation form; no Rivals-of-Aether identifiers in `src/`, `tools/`, `data/`, `package.json`. |
| `tables.test.ts` | `src/tables`: every mod type has `init`/`cleanup`, no duplicate events, keywords disjoint from functions, unique buttons and custom-object fields, `modTypeFromFileName`. |

## Updating goldens

When a parser change is intentional, regenerate the goldens and review the
diff. The golden is the assertion, so the diff is the review.

```
# PowerShell
$env:UPDATE_GOLDENS = '1'; npm test; Remove-Item Env:UPDATE_GOLDENS

# bash
UPDATE_GOLDENS=1 npm test
```

`generated.test.ts` has no separate golden: `src/generated/` is the golden.
Update it with `npm run gen` and commit the result.

## Adding a fixture line

Add the line to `fixtures/parse-api/api.gml` under the matching `//{ group`,
run with `UPDATE_GOLDENS=1`, and check the new entry in `api.golden.json`
says what you expect.

## Not covered yet

- Grammar tokenisation snapshots for the two tmLanguage files (scope section
  5.2). When they land, add `syntaxes/` to the Rivals-of-Aether scan in
  `dump.test.ts` and add a snapshot test per grammar.
- The completion / hover / signature-help provider (scope section 5.4). Keep
  its item-building logic free of `vscode` imports so it can be tested here.
