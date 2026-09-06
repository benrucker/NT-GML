/**
 * Sanity checks over the hand-maintained tables in src/tables.
 */

import * as assert from 'node:assert/strict';
import { test } from 'node:test';

import { functions } from '../src/generated/functions';
import { buttonNames } from '../src/tables/buttons';
import { customObjectFields, customObjects } from '../src/tables/custom-objects';
import { eventsFor, modTypeFromFileName, modTypes } from '../src/tables/events';
import {
	builtinConstants,
	keywordNames,
	keywords,
	pragmaNames,
	preprocessorDirectives,
	softKeywords,
} from '../src/tables/keywords';
import { duplicates } from './helpers';

test('events: every mod type has init and cleanup and no duplicate events', () => {
	for (const type of modTypes) {
		const names = eventsFor(type).map((e) => e.name);
		assert.ok(names.indexOf('init') >= 0, type + ' lacks init');
		assert.ok(names.indexOf('cleanup') >= 0, type + ' lacks cleanup');
		assert.deepEqual(duplicates(names), [], type + ' has duplicate events');
	}
});

test('events: modTypeFromFileName', () => {
	assert.equal(modTypeFromFileName('foo.mod.gml'), 'mod');
	assert.equal(modTypeFromFileName('foo.wep.ntgml'), 'wep');
	// `.weapon` is not an accepted spelling; the loader wants `.wep`.
	assert.equal(modTypeFromFileName('foo.weapon.gml'), null);
	assert.equal(modTypeFromFileName('Foo.RACE.gmlbc'), 'race');
	assert.equal(modTypeFromFileName('foo.gml'), null);
	assert.equal(modTypeFromFileName('foo.unknown.gml'), null);
});

test('keywords: unique and disjoint from generated functions', () => {
	const all = keywords.concat(builtinConstants, softKeywords, preprocessorDirectives).map((k) => k.name);
	assert.deepEqual(duplicates(all), []);
	assert.deepEqual(duplicates(pragmaNames), []);
	const fnSet = new Set(functions.map((f) => f.name));
	assert.deepEqual(keywordNames.filter((k) => fnSet.has(k)), [], 'keyword collides with a function');
});

test('buttons and custom objects: unique names', () => {
	assert.deepEqual(duplicates(buttonNames), []);
	assert.deepEqual(duplicates(customObjects.map((o) => o.name)), []);
	assert.deepEqual(duplicates(customObjectFields), []);
	for (const o of customObjects) {
		assert.deepEqual(duplicates(o.fields.map((f) => f.name)), [], o.name + ' has duplicate fields');
	}
});
