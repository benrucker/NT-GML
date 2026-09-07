/**
 * Invariants of the generated per-object instance-variable table
 * (`src/generated/object-fields.ts`) and of the chain walk over it
 * (`src/tables/object-fields.ts`).
 *
 * These are structural assertions, not a golden: the table is 489 objects and
 * regenerating it from a new `fields.gml` is expected to move every number.
 * The counts that are pinned exactly are pinned because a silent change in
 * them would mean the merge went wrong, not that the game changed.
 */

import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import { assets } from '../src/generated/assets';
import { variables } from '../src/generated/variables';
import { customObjects } from '../src/tables/custom-objects';
import {
	declaringObject,
	fieldsFor,
	objectFields,
	objectFieldsByName,
} from '../src/tables/object-fields';
import { duplicates, isSortedByName } from './helpers';

/** Measured with `pnpm gen`; see its `object fields` summary block. */
const OBJECTS_WITH_AN_ENTRY = 489;
const OBJECTS_IN_100_034 = 564;

/** fields.gml entries whose parent is a real object with no entry of its own. */
const MISSING_PARENTS = [
	'BackFromCharSelect', 'CharSelect', 'Loadout', 'LoadoutSkin', 'mutbutton',
];

const objectNames = new Set(assets.objects);
const builtinNames = new Set(variables.map((v) => v.name));

test('object fields: the table is sorted and every object is a 100.034 object', () => {
	assert.equal(objectFields.length, OBJECTS_WITH_AN_ENTRY);
	assert.ok(isSortedByName(objectFields), 'sorted by name');
	assert.deepEqual(duplicates(objectFields.map((o) => o.name)), []);
	const unknown = objectFields.map((o) => o.name).filter((n) => !objectNames.has(n));
	assert.deepEqual(unknown, [], 'every entry is in assets.objects');
});

test('object fields: coverage of the 100.034 object list', () => {
	assert.equal(assets.objects.length, OBJECTS_IN_100_034);
	const without = assets.objects.filter((n) => objectFieldsByName(n) === undefined);
	assert.equal(without.length, OBJECTS_IN_100_034 - OBJECTS_WITH_AN_ENTRY);
	assert.equal(without.length, 75, 'objects the 2025-07-16 fields.gml never saw');
});

test('object fields: parents resolve or are a known gap', () => {
	const missing: string[] = [];
	for (const o of objectFields) {
		if (o.parent === undefined) { continue; }
		if (objectFieldsByName(o.parent) !== undefined) { continue; }
		missing.push(o.name);
		assert.ok(objectNames.has(o.parent),
			o.name + ': a parent with no entry is still a real object (' + o.parent + ')');
	}
	assert.deepEqual(missing.sort(), MISSING_PARENTS.slice().sort());
});

test('object fields: no parent cycles', () => {
	for (const o of objectFields) {
		const walked: { [n: string]: true } = { [o.name]: true };
		let cur = o.parent;
		while (cur !== undefined) {
			assert.equal(walked[cur], undefined, 'cycle through ' + o.name);
			walked[cur] = true;
			cur = objectFieldsByName(cur)?.parent;
		}
	}
});

test('object fields: no duplicate or built-in field names', () => {
	for (const o of objectFields) {
		assert.deepEqual(duplicates(o.fields.map((f) => f.name)), [], o.name + ' declares a name twice');
		for (const f of o.fields) {
			assert.ok(!builtinNames.has(f.name),
				o.name + '.' + f.name + ' is a built-in variable (variables.ts)');
		}
		// A chain must not redeclare an inherited name either: the generator
		// de-flattens, so the chain's own lists concatenated are already unique
		// and `fieldsFor` has nothing left to dedupe.
		const chained: string[] = [];
		let cur = objectFieldsByName(o.name);
		while (cur !== undefined) {
			for (const f of cur.fields) { chained.push(f.name); }
			cur = cur.parent === undefined ? undefined : objectFieldsByName(cur.parent);
		}
		assert.deepEqual(duplicates(chained), [], o.name + ' inherits a name it also declares');
		assert.equal(fieldsFor(o.name).length, chained.length);
	}
});

/**
 * `CustomChest` and `CustomPickup` are real 100.034 objects that the 2025-07-16
 * `fields.gml` does not list. `CustomChest` arrived in 100.025, past the
 * pre-100.013 upper bound the vendored evidence puts on the build that wrote
 * the dump, so it is simply newer than that build. `CustomPickup` arrived in
 * 100.007, which that bound leaves undecided - the repo pins no LOWER bound -
 * though an upstream docs page this repo deliberately does not vendor tightens
 * the bound to pre-100.007 and settles it as newer too; either reading is
 * written out in `api/ntt-fields-2025-07-16/README.md`. Either way the
 * hand-written table is the only source for their fields. Everything else in the
 * hand table has an entry too, and the provider unions the two.
 */
const CUSTOM_WITHOUT_ENTRY = ['CustomChest', 'CustomPickup'];

test('object fields: the hand-written Custom* objects, minus the two with no entry', () => {
	const without = customObjects
		.filter((o) => objectFieldsByName(o.name) === undefined)
		.map((o) => o.name);
	assert.deepEqual(without.sort(), CUSTOM_WITHOUT_ENTRY.slice().sort());
	for (const name of CUSTOM_WITHOUT_ENTRY) {
		assert.ok(objectNames.has(name), name + ' is still a 100.034 object');
	}
});

test('object fields: inheritance and declaring object', () => {
	assert.equal(objectFieldsByName('Player')?.parent, 'hitme');
	const player = fieldsFor('Player').map((f) => f.name);
	assert.ok(player.indexOf('wep') >= 0, 'Player declares wep');
	assert.ok(player.indexOf('my_health') >= 0, 'Player inherits my_health');
	assert.equal(declaringObject('Player', 'wep'), 'Player');
	assert.equal(declaringObject('Player', 'my_health'), 'hitme');
	assert.equal(declaringObject('Player', 'nonsense'), undefined);
	assert.deepEqual(fieldsFor('MultiMenu'), [], 'an object with no entry has no fields');
});

test('object fields: docs and hand sources are marked', () => {
	const uber = objectFieldsByName('UberCont');
	assert.notEqual(uber, undefined);
	const byName: { [n: string]: { source?: string; doc?: string; type?: string } } = {};
	for (const f of uber?.fields ?? []) { byName[f.name] = f; }
	assert.equal(byName.opt_freeze?.source, undefined, 'a fields.gml field is unmarked');
	assert.equal(byName.tips?.source, 'docs', 'a docs-page-only field');
	assert.equal(byName.tips?.type, 'TipsStruct');
	assert.equal(byName.opt?.source, 'hand', 'an api/fields-overrides.gml field');
	assert.ok((byName.opt?.doc ?? '').indexOf('Changelog.md') > 0, 'the hand field cites its source');
	assert.equal(byName.custom?.source, 'hand');
	assert.equal(byName.customMode?.source, 'hand');

	// `sprite_index` is on the WepPickup page but is a built-in; it is dropped.
	const wep = objectFieldsByName('WepPickup');
	assert.ok(!(wep?.fields ?? []).some((f) => f.name === 'sprite_index'));
});
