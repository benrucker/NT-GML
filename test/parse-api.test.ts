/**
 * Golden tests for tools/parse-api.ts.
 *
 * The fixture `fixtures/parse-api/api.gml` has one line per annotation form.
 * The golden is the parser's full output for it, so any change to how a form
 * is read shows up as a diff in the golden rather than a silent table change.
 */

import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';

import { parseApi, parseArg, parseDefaults, parseRawNames } from '../tools/parse-api';
import { FIXTURES, expectGolden, read, stableJson } from './helpers';

const DIR = path.join(FIXTURES, 'parse-api');

test('parseApi: annotation forms match golden', () => {
	const model = parseApi(read(path.join(DIR, 'api.gml')));
	expectGolden('parse-api/api.golden.json', stableJson(model));
});

test('parseApi: header and game_version are picked up', () => {
	const model = parseApi(read(path.join(DIR, 'api.gml')));
	assert.equal(model.generatedAt, 'Generated at 1/1/2026 12:00:00 AM');
	assert.equal(model.gameVersion, 100034);
});

test('parseApi: every declaration line lands in exactly one table', () => {
	const model = parseApi(read(path.join(DIR, 'api.gml')));
	const names = ([] as string[])
		.concat(model.functions.map((f) => f.name))
		.concat(model.constants.map((c) => c.name))
		.concat(model.variables.map((v) => v.name));
	const seen: { [n: string]: number } = {};
	for (const n of names) { seen[n] = (seen[n] || 0) + 1; }
	const dupes = Object.keys(seen).filter((n) => seen[n] > 1);
	assert.deepEqual(dupes, []);
	// Skipped-line forms must not sneak in.
	for (const bad of ['indented_line_is_skipped', 'indented_is_skipped']) {
		assert.equal(seen[bad], undefined, bad + ' should have been skipped');
	}
});

test('parseDefaults: default.gml matches golden', () => {
	const vars = parseDefaults(read(path.join(DIR, 'default.gml')));
	expectGolden('parse-api/default.golden.json', stableJson(vars));
	for (const v of vars) { assert.equal(v.builtin, true); }
});

test('parseRawNames: tokenises on word characters across spaces, tabs and newlines', () => {
	assert.deepEqual(parseRawNames(read(path.join(DIR, 'raw-names.gml'))),
		['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta_1', '__eta']);
});

test('parseArg: single-token forms', () => {
	assert.deepEqual(parseArg('a'), { name: 'a', optional: false, rest: false });
	assert.deepEqual(parseArg('?a'), { name: 'a', optional: true, rest: false });
	assert.deepEqual(parseArg('[a]'), { name: 'a', optional: true, rest: false });
	assert.deepEqual(parseArg('a=1'), { name: 'a', optional: true, rest: false, default: '1' });
	// Named rest args are not flagged optional today; only a bare `...` is.
	assert.deepEqual(parseArg('...a'), { name: 'a', optional: false, rest: true });
	assert.deepEqual(parseArg('...'), { name: '...', optional: true, rest: true });
	assert.deepEqual(parseArg('a:number'), { name: 'a', optional: false, rest: false, type: 'number' });
	assert.deepEqual(parseArg(':a'), { name: '', optional: false, rest: false, type: 'a' });
});
