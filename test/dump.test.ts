/**
 * Invariants over the generated tables against the dump they came from
 * (NTGML-PORT-SCOPE.md section 5.5).
 *
 *  - every name in raw-functions / raw-constants / raw-variables is known
 *  - the same for a local dump in %LOCALAPPDATA%, when it is the same version
 *  - names are unique across functions / constants / variables / assets
 *  - tables are sorted (a proxy for determinism)
 *  - placeholder assets are filtered out
 *  - no Rivals-of-Aether identifiers survive in shipped code
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from 'node:test';

import { assets } from '../src/generated/assets';
import { constants } from '../src/generated/constants';
import { functions } from '../src/generated/functions';
import { meta } from '../src/generated/meta';
import { variables } from '../src/generated/variables';
import { parseApi, parseRawNames } from '../tools/parse-api';
import { ROOT, VENDORED_DUMP, duplicates, isSortedByName, read } from './helpers';

const fnNames = functions.map((f) => f.name);
const constNames = constants.map((c) => c.name);
const varNames = variables.map((v) => v.name);
const assetKinds = Object.keys(assets) as (keyof typeof assets)[];
const assetNames = ([] as string[]).concat(...assetKinds.map((k) => assets[k]));

/** GM placeholder slots the generator drops (NTGML-PORT-SCOPE.md section 6). */
const PLACEHOLDERS = ['background7', '__newsprite2113', '__newfont6', '__newfont7'];

function toSet(list: string[]): Set<string> { return new Set(list); }

function missingFrom(dir: string, file: string, known: Set<string>): string[] {
	return parseRawNames(read(path.join(dir, file))).filter((n) => !known.has(n));
}

function checkDump(dir: string): void {
	assert.deepEqual(missingFrom(dir, 'raw-functions.gml', toSet(fnNames)), [], 'unknown functions');
	assert.deepEqual(missingFrom(dir, 'raw-constants.gml', toSet(constNames)), [], 'unknown constants');
	assert.deepEqual(missingFrom(dir, 'raw-variables.gml', toSet(varNames)), [], 'unknown variables');
	const all = toSet(assetNames);
	for (const file of ['raw-sprites.gml', 'raw-sounds.gml', 'raw-fonts.gml', 'raw-objects.gml']) {
		const missing = missingFrom(dir, file, all).filter((n) => PLACEHOLDERS.indexOf(n) < 0);
		assert.deepEqual(missing, [], 'unknown assets from ' + file);
	}
}

test('dump: every raw name in the vendored dump is known', () => {
	checkDump(VENDORED_DUMP);
});

test('dump: meta matches the vendored api.gml header', () => {
	const model = parseApi(read(path.join(VENDORED_DUMP, 'api.gml')));
	assert.equal(meta.gameVersion, model.gameVersion);
	assert.equal(meta.generatedAt, model.generatedAt);
});

test('dump: every raw name in the local dump is known', (t) => {
	const localAppData = process.env.LOCALAPPDATA;
	const dir = localAppData ? path.join(localAppData, 'nuclearthrone', 'api') : '';
	if (!dir || !fs.existsSync(path.join(dir, 'api.gml'))) {
		t.skip('no local dump at %LOCALAPPDATA%/nuclearthrone/api');
		return;
	}
	const model = parseApi(read(path.join(dir, 'api.gml')));
	if (model.gameVersion !== meta.gameVersion) {
		t.skip('local dump is game_version ' + model.gameVersion + ', tables are ' +
			meta.gameVersion + '; vendor it under api/ and run `pnpm gen` to pick it up');
		return;
	}
	checkDump(dir);
});

test('tables: names are unique within and across kinds', () => {
	assert.deepEqual(duplicates(fnNames), [], 'duplicate functions');
	assert.deepEqual(duplicates(constNames), [], 'duplicate constants');
	assert.deepEqual(duplicates(varNames), [], 'duplicate variables');
	assert.deepEqual(duplicates(assetNames), [], 'asset in two namespaces');
	assert.deepEqual(duplicates(fnNames.concat(constNames, varNames, assetNames)), [],
		'name shared across kinds');
});

test('tables: sorted by name and non-empty', () => {
	assert.ok(isSortedByName(functions), 'functions not sorted');
	assert.ok(isSortedByName(constants), 'constants not sorted');
	assert.ok(isSortedByName(variables), 'variables not sorted');
	for (const kind of assetKinds) {
		assert.ok(assets[kind].length > 0, 'empty asset namespace: ' + kind);
		assert.deepEqual(assets[kind], assets[kind].slice().sort(), 'assets not sorted: ' + kind);
	}
	assert.ok(functions.length > 0 && constants.length > 0 && variables.length > 0);
});

test('tables: placeholder assets are dropped', () => {
	const all = toSet(assetNames);
	for (const p of PLACEHOLDERS) { assert.ok(!all.has(p), 'placeholder survived: ' + p); }
});

test('tables: spot checks for each annotation form', () => {
	const fn = (name: string) => {
		const f = functions.find((x) => x.name === name);
		assert.ok(f, 'missing function ' + name);
		return f;
	};
	assert.equal(fn('weapon_get_name').selfCtx, 3);
	assert.equal(fn('event_perform').selfCtx, 2);
	assert.equal(fn('instance_destroy').raw, true);
	assert.deepEqual(fn('string_split').args.map((a) => a.name), ['str', 'delim', 'remove_empty', 'max_splits']);
	assert.deepEqual(fn('string_split').args.map((a) => a.optional), [false, false, true, true]);
	assert.ok(fn('instance_exists').args[0].type, 'positional type hint from the 100.022 reference');
	assert.equal(fn('vertex_colour').spelling, 'uk');
	assert.equal(fn('abs').pure, true);
	const v = variables.find((x) => x.name === 'mouse_x_nonsync');
	assert.ok(v && v.perPlayer, 'mouse_x_nonsync is per-player in 100.034');
	const gv = constants.find((c) => c.name === 'game_version');
	assert.ok(gv);
	assert.equal(gv.value, meta.gameVersion);
});

test('cleanup: no Rivals-of-Aether identifiers in shipped code', () => {
	// Scanned roots; a root that does not exist is skipped, so `resources/`
	// may be absent. Deliberately NOT scanned, because they name RoA on purpose:
	//   NTGML-PORT-SCOPE.md and NTGML-SPEC.md - reference documents about the port;
	//   docs/ - `NTT Modding Cheat Sheet.md`, a community reference;
	//   LICENSE - its third-party notices attribute the original extension;
	//   api/ - vendored third-party sources;
	//   test/ - this file and test/README.md spell out the patterns.
	// CHANGELOG.md IS scanned, so its paragraph about the pre-NTGML history
	// names fudgepop01 and "a different game's GML dialect" rather than the
	// game, and leaves the name to LICENSE. That euphemism is deliberate.
	const roots = ['src', 'tools', 'data', 'syntaxes', 'package.json', 'resources', 'README.md',
		'CHANGELOG.md', '.vscodeignore', '.vscode'].filter((r) => fs.existsSync(path.join(ROOT, r)));

	// RoA branding, the RoA gameplay vocabulary, and the RoA API prefixes listed
	// in NTGML-PORT-SCOPE.md section 2.4. None of these are NTGML: NTT has no
	// hitbox/hurtbox grids and no HG_/AG_/AT_/PS_/ease_ identifiers. The
	// boundaries are "not a letter or digit" rather than \b so that `_` joins
	// do not hide a match: `roabox_hitbox.png` must fail, and so must `NTTRoA`.
	const rx = /(?<![a-z0-9])(?:roa|roabox|nttroa|rivals(?: of aether)?)(?![a-z0-9])|(?<![a-z0-9])h(?:it|urt)box|(?<![a-z0-9])(?:HG_|AG_|AT_|PS_|ease_)|play-sound|vscode-languageserver/i;

	// Lines that name RoA on purpose, keyed by '<path>:<trimmed line>'. Keep the
	// list exact and short; never weaken `rx` to make room for a new entry.
	const allowed = [
		// README "History": records that this repo used to be the RoA extension.
		'README.md:Everything before commit `33fd3de` is a Rivals of Aether GML extension,' +
			' including the RoABox move visualizer. That code was removed in `3006ae3` and' +
			' `ca12c65`, and lives on in the git history.',
	];

	// Read as text; everything else counts as binary. Dotfiles such as
	// `.vscodeignore` are text; any other extensionless file (a LICENSE dropped
	// into resources/, say) is judged by name like a binary rather than read.
	// `.svg` is XML so it is text too.
	const isText = (p: string) => /\.(?:ts|js|mjs|json|md|gml|yml|yaml|svg)$/i.test(p) ||
		path.basename(p).startsWith('.');

	const hits: string[] = [];
	const walk = (p: string) => {
		const st = fs.statSync(p);
		if (st.isDirectory()) {
			for (const f of fs.readdirSync(p)) { walk(path.join(p, f)); }
			return;
		}
		const rel = path.relative(ROOT, p).split(path.sep).join('/');
		if (!isText(p)) {
			// Binary (.png, .jpg, .gif, ...): judged by file name, bytes are never read.
			if (rx.test(path.basename(p))) { hits.push(rel + ': binary file name'); }
			return;
		}
		read(p).split(/\r?\n/).forEach((line, i) => {
			if (!rx.test(line) || allowed.indexOf(rel + ':' + line.trim()) >= 0) { return; }
			hits.push(rel + ':' + (i + 1) + ': ' + line.trim());
		});
	};
	for (const r of roots) { walk(path.join(ROOT, r)); }
	assert.deepEqual(hits, []);
});
