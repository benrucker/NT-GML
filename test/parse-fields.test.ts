/**
 * Golden test for tools/parse-fields.ts against a small hand-written sample
 * covering every entry shape the real `fields.gml` uses: a root, a child, a
 * grandchild, a parent-less entry, `default` written out of order, an entry
 * without `default`, one without `*`, and one whose parent has no entry.
 *
 * The parser deliberately does NOT de-flatten - `fields` is what the line
 * says. De-flattening is the generator's job and is covered by
 * `object-fields.test.ts`.
 */

import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';

import { parseFields } from '../tools/parse-fields';
import { FIXTURES, expectGolden, read, stableJson } from './helpers';

const FILE = path.join(FIXTURES, 'parse-fields', 'fields.gml');

test('parseFields: sample fields.gml matches golden', () => {
	expectGolden('parse-fields/fields.golden.json', stableJson(parseFields(read(FILE))));
});

test('parseFields: markers, parents and order', () => {
	const model = parseFields(read(FILE));
	assert.equal(model.generatedAt, 'Generated at 1/2/2003 4:05:06 AM');
	const byName: { [n: string]: (typeof model.entries)[number] } = {};
	for (const e of model.entries) { byName[e.name] = e; }

	assert.equal(byName.Root.parent, undefined, 'a root has no parent');
	assert.equal(byName.Child.parent, 'Root');
	assert.equal(byName.Orphan.parent, 'NotHere', 'a missing parent is kept as written');
	assert.equal(byName.NoDefault.builtin, false);
	assert.equal(byName.NoDefault.modFields, true);
	assert.equal(byName.NoStar.builtin, true);
	assert.equal(byName.NoStar.modFields, false);
	assert.equal(byName.Odd.builtin, true, '`default` need not come first');
	assert.deepEqual(byName.Odd.fields, ['alpha', 'beta', 'epsilon'],
		'markers are lifted out, the rest keeps its order');
	assert.deepEqual(byName.Grandchild.fields, ['alpha', 'beta', 'gamma', 'delta'],
		'inherited names are repeated by the format, not by the parser');
});

test('parseFields: malformed lines throw', () => {
	const bad = [
		'Root { alpha, beta',
		'Root : { alpha }',
		'Root { alpha, alpha }',
		'Root { alpha, 9beta }',
		'Root { alpha, , beta }',
		'just some prose',
	];
	for (const line of bad) {
		assert.throws(() => parseFields('// Generated at now\n' + line + '\n'), /fields\.gml/,
			'expected a throw for: ' + line);
	}
});
