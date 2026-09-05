/**
 * Shared test helpers.
 *
 * Golden files: a test computes some text, and `expectGolden` compares it to
 * the committed copy under `test/fixtures/`. Set `UPDATE_GOLDENS=1` to
 * rewrite the committed copies instead of comparing:
 *
 *   PowerShell:  $env:UPDATE_GOLDENS=1; pnpm test; Remove-Item env:UPDATE_GOLDENS
 *   bash:        UPDATE_GOLDENS=1 pnpm test
 *
 * Review the resulting diff before committing; the golden IS the assertion.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Repository root (this file compiles to out/test/test/helpers.js). */
export const ROOT = path.resolve(__dirname, '..', '..', '..');
export const FIXTURES = path.join(ROOT, 'test', 'fixtures');
export const VENDORED_DUMP = path.join(ROOT, 'api', 'ntt-100.034');
export const GENERATED_DIR = path.join(ROOT, 'src', 'generated');

export const UPDATE_GOLDENS = process.env.UPDATE_GOLDENS === '1';

export function read(file: string): string {
	return fs.readFileSync(file, 'utf8');
}

/** Normalise line endings so goldens compare the same on every platform. */
export function lf(text: string): string {
	return text.replace(/\r\n/g, '\n');
}

/** Deterministic JSON for goldens: sorted keys, tab indent, trailing newline. */
export function stableJson(value: unknown): string {
	return JSON.stringify(value, sortKeys, '\t') + '\n';
}

function sortKeys(_key: string, value: unknown): unknown {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) { return value; }
	const src = value as { [k: string]: unknown };
	const out: { [k: string]: unknown } = {};
	for (const k of Object.keys(src).sort()) { out[k] = src[k]; }
	return out;
}

/**
 * Compare `actual` with the golden at `test/fixtures/<relPath>`, or rewrite
 * the golden when `UPDATE_GOLDENS=1`.
 */
export function expectGolden(relPath: string, actual: string): void {
	const file = path.join(FIXTURES, relPath);
	const normalised = lf(actual);
	if (UPDATE_GOLDENS) {
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, normalised, 'utf8');
		return;
	}
	assert.ok(fs.existsSync(file),
		'missing golden ' + relPath + ' (run with UPDATE_GOLDENS=1 to create it)');
	const expected = lf(read(file));
	assert.equal(normalised, expected,
		'golden mismatch: ' + relPath + ' (run with UPDATE_GOLDENS=1 to accept the new output)');
}

/** Names that appear more than once in `list`. */
export function duplicates(list: string[]): string[] {
	const seen: { [n: string]: number } = {};
	for (const n of list) { seen[n] = (seen[n] || 0) + 1; }
	return Object.keys(seen).filter((n) => seen[n] > 1).sort();
}

/** True when `list` is sorted by plain string comparison (the generator's order). */
export function isSortedByName(list: { name: string }[]): boolean {
	for (let i = 1; i < list.length; i++) {
		if (list[i - 1].name > list[i].name) { return false; }
	}
	return true;
}
