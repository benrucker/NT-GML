/**
 * Golden test for tools/parse-object-docs.ts against a small hand-written
 * excerpt in the shape the real pages have: a `from <object>` group, a
 * `from scr*` script group, empty and documented variables, a type with
 * escaped generics, a method-shaped header, a group lead-in and a trailing
 * `Alarms:` block (the last two are what `notes` collects).
 */

import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';

import { DOC_LIMIT, parseObjectDocs } from '../tools/parse-object-docs';
import { FIXTURES, expectGolden, read, stableJson } from './helpers';

const FILE = path.join(FIXTURES, 'parse-object-docs', 'Sample.html');

test('parseObjectDocs: sample page matches golden', () => {
	expectGolden('parse-object-docs/Sample.golden.json',
		stableJson(parseObjectDocs(read(FILE))));
});

test('parseObjectDocs: groups, types and prose', () => {
	const page = parseObjectDocs(read(FILE));
	assert.equal(page.name, 'Sample');
	assert.deepEqual(page.chain, ['GameObject', 'Parent', 'Sample']);
	assert.deepEqual(page.groups, ['Parent', 'Sample', 'scrSample']);

	const byName: { [n: string]: (typeof page.variables)[number] } = {};
	for (const v of page.variables) { byName[v.name] = v; }

	assert.equal(byName.plain.group, 'Parent', 'a `from <object>` group names the declarer');
	assert.equal(byName.plain.type, undefined);
	assert.equal(byName.plain.doc, undefined);
	assert.equal(byName.typed.type, 'number');
	assert.equal(byName.documented.doc, 'Whether the thing is a thing',
		'only the first paragraph');
	assert.equal(byName.generic.type, 'ds_map<path:string, contents:buffer>',
		'entities are decoded');
	assert.equal(byName.grant_health.type, 'grant_health(amount, source)',
		'a method header keeps its signature as the type');
	assert.equal(byName.from_script.group, 'scrSample');
	const long = byName.from_script.doc ?? '';
	assert.ok(long.length <= DOC_LIMIT, 'prose is truncated to the bound');
	assert.ok(long.endsWith('…'), 'truncated prose is marked');

	assert.deepEqual(page.notes.length, 2, 'the lead-in and the Alarms tail');
	assert.ok(page.notes.some((n) => n.indexOf('Sample lead-in:') === 0));
	assert.ok(page.notes.some((n) => n.indexOf('tail:') === 0));
});

test('parseObjectDocs: a page without a doc body throws', () => {
	assert.throws(() => parseObjectDocs('<title>X</title><p>nothing</p>'), /doc/);
});
