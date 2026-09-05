/**
 * Golden test for tools/parse-docs.ts against a small hand-written DocMark
 * sample covering both documentation shapes (`#[name(args)]() { }` blocks
 * and ```gmblanks / ```ntblanks fences).
 */

import * as assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';

import { parseDocs } from '../tools/parse-docs';
import { FIXTURES, expectGolden, read, stableJson } from './helpers';

const FILE = path.join(FIXTURES, 'parse-docs', 'Sample.dmd');

test('parseDocs: sample DocMark matches golden', () => {
	const docs = parseDocs([{ name: 'Sample.dmd', text: read(FILE) }]);
	expectGolden('parse-docs/Sample.golden.json', stableJson(docs));
});

test('parseDocs: blocks and fences both produce entries', () => {
	const docs = parseDocs([{ name: 'Sample.dmd', text: read(FILE) }]);
	assert.ok(docs.string_repeat, 'block entry');
	assert.equal(docs.string_repeat.group, undefined, 'block entries are not group lead-ins');
	assert.ok(docs.chr, 'fence entry');
	assert.equal(docs.chr.group, true, 'fence entries are group lead-ins');
	assert.ok(docs.instance_thing, 'fence entry with : prefix');
	assert.ok(docs.raw_thing, 'fence entry with ${raw} prefix');
	assert.ok(docs.nested_fn, 'nested block entry');
	assert.equal(docs['Section Heading'], undefined, 'heading blocks are not entries');
});
